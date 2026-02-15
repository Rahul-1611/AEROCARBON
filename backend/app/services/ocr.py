import google.generativeai as genai
from app.core.config import settings
from app.models.schemas import ExtractionResult
import json
import logging
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

# Generation config for strict JSON
generation_config = {
    "temperature": 0.1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json",
}

class OCRAgent:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config=generation_config,
            system_instruction="""
            You are a specialized Invoice OCR Agent.
            Your task is to extract structured data from invoice images or PDF content.
            Return STRICT JSON only. No markdown formatting, no comments.
            
            Required JSON Structure:
            {
                "vendor_name": "string",
                "vendor_address": "string (optional)",
                "receiver_name": "string (the company receiving the invoice)",
                "receiver_address": "string (optional)",
                "invoice_number": "string",
                "invoice_date": "YYYY-MM-DD",
                "currency": "ISO 4217 code",
                "line_items": [
                    {
                        "description": "string",
                        "quantity": float,
                        "unit_price": float,
                        "total": float,
                        "unit": "string (optional)"
                    }
                ],
                "shipping_details": {
                    "origin_address": "string (optional - where the goods are shipped from)",
                    "destination_address": "string (optional - where the goods are delivered)",
                    "shipping_method": "string (e.g., Ground, Air, Sea)",
                    "weight_kg": float
                },
                "subtotal": float,
                "tax": float,
                "grand_total": float,
                "extraction_confidence": float (0.0 to 1.0),
                "is_standard_invoice": boolean (true if the document is a valid invoice, false otherwise)
            }
            
            Guidelines:
            1. If the provided document is NOT an invoice (e.g., it is a general document, a photo, or an unreadable file), set "is_standard_invoice" to false and fill other fields with null or 0.
            2. Normalize dates to YYYY-MM-DD.
            3. If a field is missing, use null or 0.0 for numbers.
            """
        )

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def extract(self, file_content: bytes, file_type: str) -> ExtractionResult:
        try:
            # Snowflake returns bytearray for BINARY fields, but Gemini/Pydantic often expect bytes
            if isinstance(file_content, bytearray):
                file_content = bytes(file_content)
            # Prepare content parts
            # Note: For PDF/Image handling, we assume file_content is bytes.
            # In a real scenario, we might need to upload to File API or encode appropriately.
            # For this simplified version, we'll try to pass it directly if supported or assume text if extracted beforehand.
            # Gemini 1.5/2.5 accepts parts.
            
            parts = []
            if file_type == "application/pdf":
                 parts.append({"mime_type": "application/pdf", "data": file_content})
            elif file_type.startswith("image/"):
                parts.append({"mime_type": file_type, "data": file_content})
            else:
                 # Fallback for text/other (handle potential binary decoding errors)
                 try:
                     parts.append(file_content.decode("utf-8"))
                 except UnicodeDecodeError:
                     parts.append("[Unreadable Binary Content]")

            prompt = "Extract invoice data from the provided file."

            response = await self.model.generate_content_async([prompt, *parts])
            
            # Parse JSON
            try:
                json_str = response.text
                if "```json" in json_str:
                    json_str = json_str.split("```json")[-1].split("```")[0].strip()
                elif "```" in json_str:
                    json_str = json_str.split("```")[-1].split("```")[0].strip()
                
                data = json.loads(json_str)
                # Validate with Pydantic
                result = ExtractionResult(**data)
                return result
            except (json.JSONDecodeError, Exception) as parse_err:
                logger.error(f"Failed to parse AI response: {parse_err}")
                return ExtractionResult(
                    vendor_name="Unknown",
                    invoice_number="N/A",
                    invoice_date="1970-01-01",
                    currency="USD",
                    line_items=[],
                    subtotal=0,
                    tax=0,
                    grand_total=0,
                    extraction_confidence=0.0,
                    is_standard_invoice=False
                )

        except Exception as e:
            logger.error(f"OCR Extraction failed: {e}")
            raise

ocr_agent = OCRAgent()
