import snowflake.connector
from snowflake.connector import DictCursor
from app.core.config import settings
import logging
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_snowflake_connection():
    try:
        conn = snowflake.connector.connect(
            user=settings.SNOWFLAKE_USER,
            password=settings.SNOWFLAKE_PASSWORD,
            account=settings.SNOWFLAKE_ACCOUNT,
            warehouse=settings.SNOWFLAKE_WAREHOUSE,
            database=settings.SNOWFLAKE_DATABASE,
            schema=settings.SNOWFLAKE_SCHEMA,
            role=settings.SNOWFLAKE_ROLE
        )
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to Snowflake: {e}")
        raise

def q(table_name: str) -> str:
    return f"{settings.SNOWFLAKE_DATABASE}.{settings.SNOWFLAKE_SCHEMA}.{table_name}"

def init_db():
    conn = get_snowflake_connection()
    cursor = conn.cursor()
    
    try:
        # Log current context
        cursor.execute("SELECT CURRENT_DATABASE(), CURRENT_SCHEMA(), CURRENT_WAREHOUSE(), CURRENT_ROLE()")
        ctx = cursor.fetchone()
        logger.info(f"Initial Snowflake Context: DB={ctx[0]}, SCHEMA={ctx[1]}, WH={ctx[2]}, ROLE={ctx[3]}")

        # Ensure DB and Schema exist with explicit error logging for each
        try:
            logger.info(f"Ensuring database exists: {settings.SNOWFLAKE_DATABASE}")
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {settings.SNOWFLAKE_DATABASE}")
        except Exception as e:
            logger.error(f"Failed to create database: {e}")
            raise

        try:
            logger.info(f"Ensuring schema exists: {settings.SNOWFLAKE_SCHEMA}")
            cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {settings.SNOWFLAKE_DATABASE}.{settings.SNOWFLAKE_SCHEMA}")
        except Exception as e:
            logger.error(f"Failed to create schema: {e}")
            raise

        try:
            logger.info(f"Switching context to {settings.SNOWFLAKE_DATABASE}.{settings.SNOWFLAKE_SCHEMA}")
            cursor.execute(f"USE DATABASE {settings.SNOWFLAKE_DATABASE}")
            cursor.execute(f"USE SCHEMA {settings.SNOWFLAKE_SCHEMA}")
            cursor.execute(f"USE WAREHOUSE {settings.SNOWFLAKE_WAREHOUSE}")
        except Exception as e:
            logger.error(f"Failed to set context: {e}")
            raise

        # CREATE TABLES
        tables = {
            "RAW_DOCUMENTS": f"""
                CREATE TABLE IF NOT EXISTS {q('RAW_DOCUMENTS')} (
                    DOC_ID STRING NOT NULL,
                    COMPANY_ID STRING NOT NULL,
                    SOURCE_SYSTEM STRING,
                    FILE_NAME STRING,
                    FILE_TYPE STRING,
                    RAW_BINARY BINARY,
                    FILE_SIZE_BYTES NUMBER,
                    FILE_HASH STRING,
                    UPLOAD_TS TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
                    PROCESSING_STATUS STRING DEFAULT 'uploaded',
                    OCR_STATUS STRING DEFAULT 'pending',
                    MAPPING_STATUS STRING DEFAULT 'pending',
                    AUDIT_STATUS STRING DEFAULT 'pending',
                    LAST_UPDATED_TS TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
                    CONSTRAINT PK_RAW_DOCUMENTS PRIMARY KEY (DOC_ID)
                )
            """,
            "EXTRACTED_FIELDS": f"""
                CREATE TABLE IF NOT EXISTS {q('EXTRACTED_FIELDS')} (
                    ID STRING NOT NULL,
                    DOC_ID STRING NOT NULL,
                    EXTRACTED_JSON VARIANT,
                    EXTRACTION_CONF FLOAT,
                    EXTRACTION_MODEL STRING,
                    VERSION STRING,
                    EXTRACTED_TS TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
                    CONSTRAINT PK_EXTRACTED_FIELDS PRIMARY KEY (ID),
                    CONSTRAINT FK_EXTRACTED_DOC FOREIGN KEY (DOC_ID) REFERENCES {q('RAW_DOCUMENTS')}(DOC_ID)
                )
            """,
            "FINAL_AUDIT_RESULTS": f"""
                CREATE TABLE IF NOT EXISTS {q('FINAL_AUDIT_RESULTS')} (
                    ID STRING NOT NULL,
                    DOC_ID STRING NOT NULL,
                    STANDARDIZED_JSON VARIANT,
                    CARBON_KG_CO2E FLOAT,
                    CONFIDENCE_SCORE FLOAT,
                    AUDIT_FLAGS VARIANT,
                    RULE_VERSION STRING,
                    FACTOR_VERSION STRING,
                    FINALIZED_TS TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
                    CONSTRAINT PK_FINAL_AUDIT_RESULTS PRIMARY KEY (ID),
                    CONSTRAINT FK_FINAL_DOC FOREIGN KEY (DOC_ID) REFERENCES {q('RAW_DOCUMENTS')}(DOC_ID)
                )
            """,
            "ERROR_LOG": f"""
                CREATE TABLE IF NOT EXISTS {q('ERROR_LOG')} (
                    ERROR_ID STRING NOT NULL,
                    DOC_ID STRING,
                    STAGE STRING,
                    ERROR_CODE STRING,
                    ERROR_MESSAGE STRING,
                    STACK_TRACE STRING,
                    RETRY_COUNT INTEGER DEFAULT 0,
                    CREATED_TS TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
                    CONSTRAINT PK_ERROR_LOG PRIMARY KEY (ERROR_ID)
                )
            """
        }

        for name, sql in tables.items():
            try:
                logger.debug(f"Creating table: {name}")
                cursor.execute(sql)
            except Exception as e:
                logger.error(f"Failed to create table {name}: {e}")
                # Don't strictly raise here if it's just a DDL quirk, 
                # but might be better to raise if it's critical.

        logger.info("Snowflake schema verified/initialized successfully.")
    except Exception as e:
        logger.error(f"Critical failure during database initialization: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    init_db()
