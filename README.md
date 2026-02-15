# AEROCARBON  
### Intelligent Scope 3 Invoice Processing 🌍📊🌱

AEROCARBON is a Scope 3 emissions intelligence platform that converts supplier invoices into traceable, real-time carbon insights.

It transforms procurement activity into measurable climate impact using AI-powered extraction, structured emissions mapping, and auditable CO₂e calculations. Instead of relying on delayed sustainability reports or generalized industry averages, AEROCARBON embeds carbon visibility directly into operational workflows. Every uploaded invoice becomes a measurable climate data point, turning everyday procurement decisions into actionable environmental intelligence.

---

# Overview

Organizations already generate high-fidelity Scope 3 data every day inside invoices. These documents contain granular information about goods, materials, suppliers, quantities, and transaction values, all of which represent real economic activity and embedded emissions.

Traditional Scope 3 accounting relies on:
- Industry averages  
- Annual reporting cycles  
- Opaque aggregation models  
- Sector-based estimations  

These approaches often introduce estimation error, delayed insight, and limited transparency.

AEROCARBON replaces estimation fog with invoice-level activity data. By grounding emissions in real procurement behavior, the platform improves specificity, traceability, and trust. Each carbon value is derived from actual transaction data rather than broad sector multipliers.

**Core Pipeline**

Invoice → Unstructured Procurement Data → Emission Mapping → CO₂e → Climate Insight  

Offset translation:

Trees Required = CO₂e (kg) / 21.77 🌳  

A static PDF becomes a live carbon signal in seconds. What was once a passive financial document becomes a measurable environmental metric.

---

# System Architecture

**Backend**  
FastAPI API, AI agents, Snowflake integration  

**Frontend**  
React + TypeScript dashboard  

The architecture is intentionally modular. The backend handles extraction, mapping, calculation, and auditing, while the frontend presents emissions insights in an intuitive, responsive dashboard. Snowflake acts as structured memory for raw documents, extracted data, emissions outputs, and audit lineage.

### High-Level Flow

Upload → OCR → Mapping → Carbon Calculation → Audit Logging → Dashboard  

The orchestrator is a lightweight helper function responsible for coordinating the sequence of operations and handling retries safely. It ensures each invoice flows through extraction, mapping, and auditing in a consistent and idempotent manner.

---

# Tech Stack

## Frontend
- React (Vite + TypeScript)
- Tailwind CSS
- Axios

The frontend provides a clean interface for invoice uploads and emissions exploration. Users can inspect processed invoices, review calculated emissions, and trace how results were derived.

## Backend
- FastAPI (Async architecture)
- Pydantic (Strict validation)
- Helper-based orchestration
- Idempotent processing safeguards
- Exponential backoff retry logic

The backend is built for reliability and scalability. Async processing ensures responsiveness, while strict validation guarantees schema consistency across the pipeline.

## AI Layer
- Gemini 2.5 Flash (OCR and semantic normalization)

Gemini is used selectively for complex invoice layouts and ambiguous product descriptions. Deterministic parsing handles structured invoices, while AI augments interpretation when variability exceeds rule-based systems.

## Database
- Snowflake (Structured storage and auditability)

Snowflake stores raw invoices, extracted fields, emission results, and audit logs. This ensures all emissions calculations remain reproducible and queryable.

## Deployment
- DigitalOcean

DigitalOcean provides scalable hosting for backend services and secure environment isolation.

---

# Processing Pipeline

### 1️⃣ Upload
- User uploads invoice (PDF or image)
- Stored in Snowflake
- Unique document ID generated
- Duplicate protection enforced

The upload stage ensures document-level traceability from the first interaction.

### 2️⃣ OCR Processing
- Deterministic parsing for structured invoices
- Gemini 2.5 Flash used for:
  - Complex layouts
  - Unstructured line items
  - Semantic field interpretation

Outputs:
- Vendor details
- Line items
- Quantities
- Units
- Prices
- Descriptions
- Confidence scores

This stage converts unstructured documents into structured procurement data ready for emissions analysis.

### 3️⃣ Mapping
- Line items mapped to emission categories
- Emission factors retrieved from Snowflake
- Unit normalization applied
- CO₂e calculated:

CO₂e = Activity Data × Emission Factor

Mapping ensures that every procurement activity is aligned with an appropriate emission factor. Regional adjustments and unit normalization ensure consistency and accuracy.

### 4️⃣ Audit Logging
- All transformations recorded
- Emission factor source logged
- Confidence scores stored
- Calculation outputs persisted

Ensures full traceability of every emission result. Every carbon value can be traced back to its originating invoice, line item, and emission factor.

---

# Database Schema (Snowflake)

Warehouse: `SCOPE3_WH`  
Database: `SCOPE3_DB`  
Schema: `APP`

The schema is structured to separate raw inputs, extracted data, emissions outputs, and audit metadata.

---

## RAW_DOCUMENTS

Stores the original uploaded invoice and tracks processing state across all pipeline stages.

Fields:
- DOC_ID  
- COMPANY_ID  
- SOURCE_SYSTEM  
- FILE_NAME  
- FILE_TYPE  
- RAW_BINARY  
- FILE_SIZE_BYTES  
- FILE_HASH  
- UPLOAD_TS  
- PROCESSING_STATUS  
- OCR_STATUS  
- MAPPING_STATUS  
- AUDIT_STATUS  
- LAST_UPDATED_TS  

This table acts as the control center for document lifecycle management.

---

## EXTRACTED_FIELDS

Stores structured OCR output generated from invoices.

Fields:
- ID  
- DOC_ID  
- EXTRACTED_JSON  
- EXTRACTION_CONF  
- EXTRACTION_MODEL  
- VERSION  
- EXTRACTED_TS  

`EXTRACTED_JSON` preserves structured invoice interpretation in semi-structured format, allowing flexible downstream mapping.

---

## FINAL_AUDIT_RESULTS

Stores finalized, standardized emissions results after mapping and audit validation.

Fields:
- ID  
- DOC_ID  
- STANDARDIZED_JSON  
- CARBON_KG_CO2E  
- CONFIDENCE_SCORE  
- AUDIT_FLAGS  
- RULE_VERSION  
- FACTOR_VERSION  
- FINALIZED_TS  

This table represents the authoritative carbon output for each processed document.

---

## PIPELINE_METRICS

Stores observability and performance metrics for each stage of the pipeline.

Fields:
- METRIC_ID  
- DOC_ID  
- STAGE  
- DURATION_MS  
- STATUS  
- CREATED_TS  

Enables latency tracking, reliability monitoring, and performance optimization.

---

## ERROR_LOG

Stores structured error information for debugging and retry management.

Fields:
- ERROR_ID  
- DOC_ID  
- STAGE  
- ERROR_CODE  
- ERROR_MESSAGE  
- STACK_TRACE  
- RETRY_COUNT  
- CREATED_TS  

Supports resilience, retry logic, and operational transparency.

---

## EMISSIONS_DATA

Stores emission factor reference data mapped to NAICS classifications.

Fields:
- 2017 NAICS Code  
- 2017 NAICS Title  
- Supply Chain Emission Factors with Margins  

This table powers activity-to-emission factor mapping within the Mapping Agent.

---

# Agent Architecture

AEROCARBON uses three core agents.

## OCR Agent
Responsible for:
- Extracting structured invoice data  
- Handling layout variations  
- Using Gemini when deterministic parsing fails  
- Producing confidence scores  

The OCR Agent bridges the gap between unstructured documents and structured datasets.

## Mapping Agent
Responsible for:
- Mapping line items to emission categories
- Retrieving emission factors  
- Applying regional and unit normalization  
- Calculating CO₂e  

The Mapping Agent ensures each procurement activity is grounded in appropriate emission data.

## Auditing Agent
Responsible for:
- Logging every processing step  
- Recording factor provenance  
- Storing AI confidence scores  
- Ensuring reproducible carbon calculations  

The Auditing Agent guarantees transparency and compliance readiness.

The orchestrator is a simple coordination helper that triggers these agents in sequence.

---

# Security & Reliability

- Strict schema validation (Pydantic)  
- Idempotent processing  
- Retry-safe AI calls  
- Full audit lineage  
- Deterministic + AI hybrid pipeline  
- No opaque aggregation  

These safeguards ensure both operational reliability and sustainability reporting integrity.

---

# Infrastructure & Integrations

## Gemini API
Used for:
- Invoice semantic interpretation  
- Complex layout extraction  
- Field normalization  
- Confidence scoring  

Gemini is selectively invoked, ensuring efficiency while preserving flexibility.

## Snowflake
Used for:
- Document storage  
- Emission factor storage  
- Emission results  
- Audit tracking  
- Structured analytics  

Snowflake enables scalable analytics and ensures every carbon metric remains reproducible.

## DigitalOcean
Used for:
- Backend hosting  
- Scalable deployment  
- Environment isolation  

---

# Key Differentiators

- Invoice-level Scope 3 estimation  
- Supplier-level attribution  
- Near real-time emissions  
- Full audit lineage  
- Product-level emission mapping  
- Production-grade async backend  

AEROCARBON turns procurement into climate intelligence, embedding sustainability directly into everyday business decisions.