import asyncio
import logging
import json
from datetime import datetime
from app.core.db import get_snowflake_connection, q
from app.models.schemas import InvoiceUploadResponse, FinalResult
from app.services.ocr import ocr_agent
from app.services.mapping import mapping_agent
from app.services.carbon import carbon_engine
from app.services.audit import audit_layer
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Orchestrator:
    def __init__(self):
        pass

    async def process_invoice(self, doc_id: str):
        conn = get_snowflake_connection()
        cursor = conn.cursor()
        
        try:
            logger.info(f"Starting processing for DOC_ID: {doc_id}")
            
            # Ensure context
            cursor.execute(f"USE DATABASE {settings.SNOWFLAKE_DATABASE}")
            cursor.execute(f"USE SCHEMA {settings.SNOWFLAKE_SCHEMA}")
            cursor.execute(f"USE WAREHOUSE {settings.SNOWFLAKE_WAREHOUSE}")

            # Fetch Raw Document
            cursor.execute(f"SELECT RAW_BINARY, FILE_TYPE FROM {q('RAW_DOCUMENTS')} WHERE DOC_ID = '{doc_id}'")
            row = cursor.fetchone()
            if not row:
                raise ValueError(f"Document {doc_id} not found")
            
            raw_binary, file_type = row
            
            # Update Status: Processing
            self._update_status(cursor, doc_id, "ocr_processing")

            # 1. OCR Stage
            extraction = await ocr_agent.extract(raw_binary, file_type)
            
            # 2. Store Extracted Data 
            # Note: Using INSERT ... SELECT because Snowflake doesn't allow PARSE_JSON in VALUES clause
            cursor.execute(f"""
                INSERT INTO {q('EXTRACTED_FIELDS')} (ID, DOC_ID, EXTRACTED_JSON, EXTRACTION_CONF, EXTRACTION_MODEL, VERSION)
                SELECT %s, %s, PARSE_JSON(%s), %s, %s, %s
            """, (f"{doc_id}_ext", doc_id, extraction.model_dump_json(), extraction.extraction_confidence, 'gemini-2.0-flash', '1.0'))
            
            self._update_status(cursor, doc_id, "ocr_complete")
            await asyncio.sleep(1) # Safety delay for API rate limits

            if not extraction.is_standard_invoice:
                # Bypass stages for non-standard documents
                from app.models.schemas import MappingResult, CarbonResult
                mapping = MappingResult(
                    vendor_canonical="Unknown",
                    standardized_line_items=[],
                    scope_category="Miscellaneous",
                    mapping_confidence=0.0,
                    rule_version="N/A"
                )
                carbon = CarbonResult(
                    total_kg_co2e=0.0,
                    spend_based_kg_co2e=0.0,
                    scope="N/A",
                    category="N/A",
                    line_level_breakdown=[]
                )
            else:
                # 3. Mapping Stage
                mapping = await mapping_agent.map_invoice(extraction)
                self._update_status(cursor, doc_id, "mapped")

                # 4. Carbon Calculation Stage
                carbon = await carbon_engine.calculate(mapping, extraction)

            # 5. Audit Stage
            audit = await audit_layer.audit(extraction, carbon)
            self._update_status(cursor, doc_id, "audited")

            # 6. Finalize
            final_result = FinalResult(
                doc_id=doc_id,
                extraction=extraction,
                mapping=mapping,
                carbon=carbon,
                audit=audit,
                finalized_ts=datetime.now()
            )
            
            # Note: Using INSERT ... SELECT for Final Results
            cursor.execute(f"""
                INSERT INTO {q('FINAL_AUDIT_RESULTS')} (ID, DOC_ID, STANDARDIZED_JSON, CARBON_KG_CO2E, CONFIDENCE_SCORE, AUDIT_FLAGS, RULE_VERSION, FACTOR_VERSION)
                SELECT %s, %s, PARSE_JSON(%s), %s, %s, PARSE_JSON(%s), %s, %s
            """, (
                f'{doc_id}_fin', 
                doc_id, 
                final_result.model_dump_json(), 
                carbon.total_kg_co2e, 
                audit.confidence_score, 
                json.dumps(audit.audit_flags), 
                mapping.rule_version, 
                'v1.0'
            ))

            self._update_status(cursor, doc_id, "finalized")
            logger.info(f"Processing complete for DOC_ID: {doc_id}")

        except Exception as e:
            logger.error(f"Pipeline failed for {doc_id}: {e}")
            self._log_error(cursor, doc_id, str(e))
            self._update_status(cursor, doc_id, "failed")
        finally:
            cursor.close()
            conn.close()

    def _update_status(self, cursor, doc_id, status):
        cursor.execute(f"UPDATE {q('RAW_DOCUMENTS')} SET PROCESSING_STATUS = %s, LAST_UPDATED_TS = CURRENT_TIMESTAMP() WHERE DOC_ID = %s", (status, doc_id))

    def _log_error(self, cursor, doc_id, error_msg):
        import uuid
        error_id = str(uuid.uuid4())
        cursor.execute(f"""
            INSERT INTO {q('ERROR_LOG')} (ERROR_ID, DOC_ID, STAGE, ERROR_MESSAGE)
            VALUES (%s, %s, %s, %s)
        """, (error_id, doc_id, 'pipeline', error_msg))

orchestrator = Orchestrator()
