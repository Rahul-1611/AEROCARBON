export interface Invoice {
    doc_id: string;
    file_name: string;
    status: string;
    upload_ts: string;
}

export interface LineItem {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    unit?: string;
}

export interface ShippingDetails {
    origin_address?: string;
    destination_address?: string;
    shipping_method?: string;
    weight_kg?: number;
}

export interface ExtractionResult {
    vendor_name: string;
    vendor_address?: string;
    receiver_name?: string;
    receiver_address?: string;
    invoice_number: string;
    invoice_date: string;
    currency: string;
    line_items: LineItem[];
    shipping_details?: ShippingDetails;
    subtotal: number;
    tax: number;
    grand_total: number;
    extraction_confidence: number;
}

export interface MappingResult {
    vendor_canonical: string;
    standardized_line_items: any[];
    scope_category: string;
    naics_code?: string;
    mapping_confidence: number;
    rule_version: string;
}

export interface CarbonResult {
    total_kg_co2e: number;
    spend_based_kg_co2e: number;
    logistics_kg_co2e: number;
    distance_km?: number;
    scope: string;
    category: string;
    naics_code?: string;
    is_verified_match: boolean;
    line_level_breakdown: any[];
}

export interface AuditResult {
    is_valid: boolean;
    audit_flags: string[];
    confidence_score: number;
}

export interface FinalResult {
    doc_id: string;
    extraction: ExtractionResult;
    mapping: MappingResult;
    carbon: CarbonResult;
    audit: AuditResult;
    finalized_ts: string;
}

export interface MetricsResponse {
    total_processed: number;
    average_carbon: number;
    failure_rate: number;
    top_categories: string[];
    top_naics: string[];
}

