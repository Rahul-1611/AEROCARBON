from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import uvicorn

from app.core.db import init_db
from app.api.routes import router as api_router

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SCOPE3WH API", version="1.0.0")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Event
@app.on_event("startup")
async def startup_event():
    init_db()

# Include Routes
app.include_router(api_router)

if __name__ == "__main__":
    # For debugging directly with python app/main.py
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
