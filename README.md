# SCOPE3WH: Intelligent Scope 3 Invoice Processing

A production-grade, agent-driven invoice processing system using Python, React, Snowflake, and Gemini 2.5 Flash.

## Architecture

- **Backend**: FastAPI (Python), Async implementation
- **Frontend**: React (Vite + TypeScript), Tailwind CSS
- **AI Agent**: Gemini 2.5 Flash (for OCR and Intelligence)
- **Database**: Snowflake (for storage and audit logs)
- **Orchestration**: Custom State Machine

## Folder Structure

```
/backend    # Python API and Core Logic
/frontend   # React UI
```

## Setup Instructions

### 1. Backend Setup

Prerequisites: Python 3.9+

1. Navigate to backend:
   ```bash
   cd backend
   ```
2. Create virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment:
   - Copy `.env.example` to `.env`
   - Fill in your **Snowflake** credentials and **Gemini API Key**.

5. Run the Server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

Prerequisites: Node.js 18+

1. Navigate to frontend:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Development Server:
   ```bash
   npm run dev
   ```
   The UI will be available at `http://localhost:5173`.

## Usage

1. Open the Dashboard.
2. Go to **Upload Invoice** and select a PDF or Image invoice.
3. The system will:
   - Upload to Snowflake (`RAW_DOCUMENTS`)
   - Trigger the **Orchestrator**
   - Use **Gemini 2.5 Flash** to extract data
   - Map vendors and calculate **Carbon Emissions**
   - Audit the results
4. View the processed invoice in the **Dashboard** or click for **Details**.

## Key Features

- **Idempotency**: Processing handles duplicates safely.
- **Auditability**: Every step is logged to Snowflake.
- **Resilience**: Retry logic with exponential backoff for AI calls.
- **Security**: Strict Pydantic validation and secure storage.
