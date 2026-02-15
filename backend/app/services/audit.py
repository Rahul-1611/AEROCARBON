from app.models.schemas import AuditResult, ExtractionResult, CarbonResult
from typing import List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AuditLayer:
    def __init__(self):
        self.confidence_threshold = 0.8

    async def audit(self, extraction: ExtractionResult, carbon: CarbonResult) -> AuditResult:
        flags = []
        is_valid = True

        try:
            # 0. High-level Invoice Validation
            if not extraction.is_standard_invoice:
                flags.append("Not an industry standard Invoice")
                return AuditResult(
                    is_valid=False,
                    audit_flags=flags,
                    confidence_score=0.0
                )
            # 1. Check Extraction Confidence
            if extraction.extraction_confidence < self.confidence_threshold:
                flags.append(f"Low OCR Confidence: {extraction.extraction_confidence}")
                # We might not fail validation, but flag it
            
            # 2. Check Math (Subtotal + Tax = Grand Total)
            calculated_total = extraction.subtotal + extraction.tax
            if abs(calculated_total - extraction.grand_total) > 0.05: # Allow small float error
                flags.append(f"Math Mismatch: Subtotal+Tax ({calculated_total}) != Total ({extraction.grand_total})")
                is_valid = False

            # 3. Check for Anomalies (e.g. extremely high emissions)
            if carbon.total_kg_co2e > 10000: # Arbitrary threshold for this example
                flags.append(f"High Emissions Alert: {carbon.total_kg_co2e} kgCO2e")

            # 4. Check for Missing Critical Fields
            if not extraction.vendor_name:
                flags.append("Missing Vendor Name")
                is_valid = False
            
            if not extraction.invoice_number:
                flags.append("Missing Invoice Number")
                is_valid = False

            return AuditResult(
                is_valid=is_valid,
                audit_flags=flags,
                confidence_score=extraction.extraction_confidence
            )

        except Exception as e:
            logger.error(f"Audit failed: {e}")
            raise

audit_layer = AuditLayer()
