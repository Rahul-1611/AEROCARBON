from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
import uuid
import logging
import json
from datetime import datetime
from typing import List

from app.core.config import settings
from app.core.db import get_snowflake_connection, q
from app.models.schemas import InvoiceUploadResponse, FinalResult, MetricsResponse, StatusResponse
from app.services.orchestrator import orchestrator

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload", response_model=InvoiceUploadResponse)
async def upload_invoice(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    try:
        doc_id = str(uuid.uuid4())
        file_content = await file.read()
        file_type = file.content_type or "application/octet-stream"
        file_size = len(file_content)
        
        conn = get_snowflake_connection()
        cursor = conn.cursor()
        try:
            # Explicitly USE context just in case session lost it
            cursor.execute(f"USE DATABASE {settings.SNOWFLAKE_DATABASE}")
            cursor.execute(f"USE SCHEMA {settings.SNOWFLAKE_SCHEMA}")
            cursor.execute(f"USE WAREHOUSE {settings.SNOWFLAKE_WAREHOUSE}")

            cursor.execute(
                f"INSERT INTO {q('RAW_DOCUMENTS')} (DOC_ID, COMPANY_ID, SOURCE_SYSTEM, FILE_NAME, FILE_TYPE, RAW_BINARY, FILE_SIZE_BYTES, PROCESSING_STATUS) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (doc_id, "DEFAULT_COMPANY", "WEB_UPLOAD", file.filename, file_type, file_content, file_size, "uploaded")
            )
        finally:
            cursor.close()
            conn.close()

        background_tasks.add_task(orchestrator.process_invoice, doc_id)

        return InvoiceUploadResponse(
            doc_id=doc_id,
            status="uploaded",
            message="Invoice received and processing started."
        )

    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/invoice/{doc_id}", response_model=FinalResult)
async def get_invoice(doc_id: str):
    conn = get_snowflake_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT STANDARDIZED_JSON, CARBON_KG_CO2E, CONFIDENCE_SCORE, AUDIT_FLAGS, RULE_VERSION, FINALIZED_TS FROM {q('FINAL_AUDIT_RESULTS')} WHERE DOC_ID = '{doc_id}'")
        row = cursor.fetchone()
        
        if not row:
            cursor.execute(f"SELECT PROCESSING_STATUS FROM {q('RAW_DOCUMENTS')} WHERE DOC_ID = '{doc_id}'")
            status_row = cursor.fetchone()
            if status_row:
                raise HTTPException(status_code=404, detail=f"Invoice is processing or failed. Status: {status_row[0]}")
            raise HTTPException(status_code=404, detail="Invoice not found")
            
        standardized_data = json.loads(row[0])
        
        return FinalResult(
            doc_id=doc_id,
            extraction=standardized_data.get("extraction"),
            mapping=standardized_data.get("mapping"),
            carbon=standardized_data.get("carbon"),
            audit=standardized_data.get("audit"),
            finalized_ts=row[5]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get Invoice failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/invoices")
async def list_invoices():
    conn = get_snowflake_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT DOC_ID, FILE_NAME, PROCESSING_STATUS, UPLOAD_TS FROM {q('RAW_DOCUMENTS')} ORDER BY UPLOAD_TS DESC LIMIT 50")
        rows = cursor.fetchall()
        
        invoices = []
        for r in rows:
            invoices.append({
                "doc_id": r[0],
                "file_name": r[1],
                "status": r[2],
                "upload_ts": r[3]
            })
        return invoices
    finally:
        cursor.close()
        conn.close()

@router.get("/status/{doc_id}", response_model=StatusResponse)
async def get_status(doc_id: str):
    conn = get_snowflake_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT PROCESSING_STATUS, UPLOAD_TS FROM {q('RAW_DOCUMENTS')} WHERE DOC_ID = '{doc_id}'")
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return StatusResponse(
            doc_id=doc_id,
            status=row[0],
            processed_at=row[1]
        )
    finally:
        cursor.close()
        conn.close()

@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    conn = get_snowflake_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {q('RAW_DOCUMENTS')}")
        total = cursor.fetchone()[0]
        
        cursor.execute(f"SELECT AVG(CARBON_KG_CO2E) FROM {q('FINAL_AUDIT_RESULTS')}")
        avg_carbon = cursor.fetchone()[0] or 0.0
        
        cursor.execute(f"SELECT COUNT(*) FROM {q('ERROR_LOG')}")
        errors = cursor.fetchone()[0]
        
        failure_rate = (errors / total * 100) if total > 0 else 0.0
        
        # Get top 3 categories and NAICS codes
        cursor.execute(f"""
            SELECT 
                STANDARDIZED_JSON:carbon.category::string as cat, 
                STANDARDIZED_JSON:carbon.naics_code::string as naics,
                COUNT(*) as cnt 
            FROM {q('FINAL_AUDIT_RESULTS')} 
            GROUP BY 1, 2
            ORDER BY cnt DESC 
            LIMIT 3
        """)
        rows = cursor.fetchall()
        top_categories = [row[0] for row in rows if row[0]]
        top_naics = [row[1] for row in rows if row[1]]
        
        return MetricsResponse(
            total_processed=total,
            average_carbon=avg_carbon,
            failure_rate=failure_rate,
            top_categories=top_categories,
            top_naics=top_naics
        )
    finally:
        cursor.close()
        conn.close()
