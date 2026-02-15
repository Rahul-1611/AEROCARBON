from app.models.schemas import CarbonResult, MappingResult, ExtractionResult
from typing import List, Dict, Any, Optional
import logging
from app.core.db import get_snowflake_connection, q
from app.core.config import settings
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CarbonEngine:
    def __init__(self):
        # Fallback factors if database lookup fails
        self.fallback_factors = {
            "Cloud Services": 0.045,
            "Business Travel": 1.2,
            "Software & Services": 0.01,
            "General Procurement": 0.03
        }
        self.geocoder = Nominatim(user_agent="scope3wh_carbon_engine")

    async def calculate(self, mapping: MappingResult, extraction: ExtractionResult) -> CarbonResult:
        conn = None
        cursor = None
        factor = 0.03 # Default fallback
        naics_code = mapping.naics_code
        category = mapping.scope_category
        is_verified = False
        grand_total = extraction.grand_total
        
        try:
            # 1. High-fidelity lookup via NAICS Code
            if naics_code:
                try:
                    conn = get_snowflake_connection()
                    cursor = conn.cursor()
                    
                    query = f"""
                        SELECT "Supply Chain Emission Factors with Margins", "2017 NAICS Title"
                        FROM {q('EMISSIONS_DATA')} 
                        WHERE "2017 NAICS Code" = %s 
                        LIMIT 1
                    """
                    cursor.execute(query, (naics_code,))
                    row = cursor.fetchone()
                    if row:
                        factor = float(row[0])
                        category = row[1]
                        is_verified = True
                        logger.info(f"Verified high-fidelity factor for NAICS {naics_code}: {factor}")
                    else:
                        # Fuzzy search backup
                        query_title = f"""
                            SELECT "Supply Chain Emission Factors with Margins", "2017 NAICS Code", "2017 NAICS Title"
                            FROM {q('EMISSIONS_DATA')} 
                            WHERE "2017 NAICS Title" ILIKE %s 
                            LIMIT 1
                        """
                        cursor.execute(query_title, (f"%{mapping.scope_category}%",))
                        row_t = cursor.fetchone()
                        if row_t:
                            factor = float(row_t[0])
                            naics_code = str(row_t[1])
                            category = row_t[2]
                            is_verified = True

                except Exception as db_e:
                    logger.error(f"Database lookup failed: {db_e}")
                finally:
                    if cursor: cursor.close()
                    if conn: conn.close()

            spend_based_emissions = grand_total * factor
            
            # 2. Logistics/Shipping Calculation via Geocoding
            logistics_emissions = 0.0
            distance_km = None
            
            origin = None
            destination = None
            
            if extraction.shipping_details:
                origin = extraction.shipping_details.origin_address
                destination = extraction.shipping_details.destination_address
            
            # Fallback to vendor address -> receiver address if shipping details are missing
            if not origin: origin = extraction.vendor_address
            if not destination: destination = extraction.receiver_address
            
            if origin and destination:
                try:
                    # Geocoding is slow, so we do it in a thread if possible or just await it
                    # Note: Nominatim is sync, but we'll wrap it
                    loop = asyncio.get_event_loop()
                    loc_origin = await loop.run_in_executor(None, lambda: self.geocoder.geocode(origin))
                    loc_dest = await loop.run_in_executor(None, lambda: self.geocoder.geocode(destination))
                    
                    if loc_origin and loc_dest:
                        distance_km = geodesic((loc_origin.latitude, loc_origin.longitude), 
                                               (loc_dest.latitude, loc_dest.longitude)).kilometers
                        
                        # Calculate emissions based on distance and weight
                        # Logistics Factor: ~0.15 kg CO2e per tonne-km (Road)
                        weight_kg = (extraction.shipping_details.weight_kg if extraction.shipping_details else None) or 10.0 # Default 10kg
                        tonne_km = (weight_kg / 1000.0) * distance_km
                        
                        # Adjust factor by method
                        method_factor = 0.15 # Road default
                        method = (extraction.shipping_details.shipping_method or "Ground").lower() if extraction.shipping_details else "ground"
                        if "air" in method: method_factor = 0.8
                        elif "sea" in method or "ocean" in method: method_factor = 0.02
                        
                        logistics_emissions = tonne_km * method_factor
                        logger.info(f"Logistics calculation: {distance_km:.2f}km, {weight_kg}kg, {method} -> {logistics_emissions:.4f}kg CO2e")
                except Exception as geo_e:
                    logger.warning(f"Geocoding/Logistics calculation failed: {geo_e}")

            total_kg_co2e = spend_based_emissions + logistics_emissions
            
            line_breakdowns = []
            for item in mapping.standardized_line_items:
                item_total = item.get("total", 0)
                item_emissions = item_total * factor
                line_breakdowns.append({
                    "description": item.get("description"),
                    "item_emissions": item_emissions,
                    "factor_used": factor
                })

            return CarbonResult(
                total_kg_co2e=total_kg_co2e,
                spend_based_kg_co2e=spend_based_emissions,
                logistics_kg_co2e=logistics_emissions,
                distance_km=distance_km,
                scope="Scope 3",
                category=category,
                naics_code=naics_code,
                is_verified_match=is_verified,
                line_level_breakdown=line_breakdowns
            )
            
        except Exception as e:
            logger.error(f"Carbon calculation failed: {e}")
            raise

carbon_engine = CarbonEngine()
