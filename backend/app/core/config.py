import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SNOWFLAKE_USER: str
    SNOWFLAKE_PASSWORD: str
    SNOWFLAKE_ACCOUNT: str
    SNOWFLAKE_WAREHOUSE: str
    SNOWFLAKE_DATABASE: str
    SNOWFLAKE_SCHEMA: str
    SNOWFLAKE_ROLE: Optional[str] = None
    GEMINI_API_KEY: str
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
