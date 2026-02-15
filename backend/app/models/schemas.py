from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class InvoiceUploadResponse(BaseModel):
    doc_id: str
    status: str
    message: str

class LineItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    total: float
    unit: Optional[str] = None

class ShippingDetails(BaseModel):
    origin_address: Optional[str] = None
    destination_address: Optional[str] = None
    shipping_method: Optional[str] = None
    weight_kg: Optional[float] = None

class ExtractionResult(BaseModel):
    vendor_name: str
    vendor_address: Optional[str] = None
    receiver_name: Optional[str] = None
    receiver_address: Optional[str] = None
    invoice_number: str
    invoice_date: str
    currency: str
    line_items: List[LineItem]
    shipping_details: Optional[ShippingDetails] = None
    subtotal: float
    tax: float
    grand_total: float
    extraction_confidence: float
    is_standard_invoice: bool = True

class MappingResult(BaseModel):
    vendor_canonical: str
    standardized_line_items: List[Dict[str, Any]]
    scope_category: str
    naics_code: Optional[str] = None
    mapping_confidence: float
    rule_version: str

class CarbonResult(BaseModel):
    total_kg_co2e: float
    spend_based_kg_co2e: float
    logistics_kg_co2e: float = 0.0
    distance_km: Optional[float] = None
    scope: str
    category: str
    naics_code: Optional[str] = None
    is_verified_match: bool = False
    line_level_breakdown: List[Dict[str, Any]]

class AuditResult(BaseModel):
    is_valid: bool
    audit_flags: List[str]
    confidence_score: float

class FinalResult(BaseModel):
    doc_id: str
    extraction: ExtractionResult
    mapping: MappingResult
    carbon: CarbonResult
    audit: AuditResult
    finalized_ts: datetime

class MetricsResponse(BaseModel):
    total_processed: int
    average_carbon: float
    failure_rate: float
    top_categories: List[str]
    top_naics: List[str]

class MoodResponse(BaseModel):
    score: int
    label: str
    explanation: str
    emoji: str

class StatusResponse(BaseModel):
    doc_id: str
    status: str
    processed_at: Optional[datetime] = None
