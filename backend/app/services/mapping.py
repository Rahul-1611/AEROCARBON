import google.generativeai as genai
from app.core.config import settings
from app.models.schemas import MappingResult, ExtractionResult, LineItem
from typing import List, Dict, Any
import json
import logging
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
    "max_output_tokens": 1024,
    "response_mime_type": "application/json",
}

class MappingAgent:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash", 
            generation_config=generation_config,
            system_instruction="""
            You are a specialized Sustainability Data Scientist.
            Your task is to map invoice data (vendor name and line items) to the 2017 NAICS (North American Industry Classification System) taxonomy.
            
            Return STRICT JSON only.
            
            JSON Structure:
            {
                "naics_code": "6-digit string",
                "naics_title": "string",
                "vendor_canonical": "string (the standardized brand name of the vendor)",
                "mapping_confidence": float (0.0 to 1.0)
            }
            
            Guidelines:
            1. Analyze the vendor name carefully.
            2. Analyze line items to understand the primary industry of the transaction.
            3. Pick the 6-digit NAICS code that most accurately fits the transaction.
            """
        )
        self.rule_version = "2.0.0 (Semantic)"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def map_invoice(self, extraction: ExtractionResult) -> MappingResult:
        response_text = ""
        try:
            # Prepare extraction data for Gemini
            extraction_data = {
                "vendor_name": extraction.vendor_name,
                "line_items": [item.model_dump() for item in extraction.line_items],
                "grand_total": extraction.grand_total
            }

            prompt = f"Identify the NAICS code for this invoice data: {json.dumps(extraction_data)}"

            response = await self.model.generate_content_async(prompt)
            response_text = response.text
            
            # Robust extraction of JSON from response (handling potential backticks)
            clean_json = response_text
            if "```json" in clean_json:
                clean_json = clean_json.split("```json")[-1].split("```")[0].strip()
            elif "```" in clean_json:
                clean_json = clean_json.split("```")[-1].split("```")[0].strip()
            
            mapping_data = json.loads(clean_json)
            
            naics_code = mapping_data.get("naics_code")
            naics_title = mapping_data.get("naics_title")
            canonical_vendor = mapping_data.get("vendor_canonical", extraction.vendor_name)
            confidence = mapping_data.get("mapping_confidence", 0.7)

            # Standardize Line Items (Add emission factor keys placeholders)
            standardized_items = []
            for item in extraction.line_items:
                std_item = item.model_dump()
                std_item["mapped_category"] = naics_title
                std_item["naics_code"] = naics_code
                standardized_items.append(std_item)

            return MappingResult(
                vendor_canonical=canonical_vendor,
                standardized_line_items=standardized_items,
                scope_category=naics_title,
                naics_code=naics_code,
                mapping_confidence=confidence,
                rule_version=self.rule_version
            )

        except Exception as e:
            logger.error(f"Semantic mapping failed: {e}. Raw Response: {response_text}")
            raise

mapping_agent = MappingAgent()
