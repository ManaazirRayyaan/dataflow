"""
DataFlow — FastAPI Application
==============================
Entry point. Configures CORS, registers routers, and creates DB tables on startup.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.analytics import router as analytics_router
from app.api.routes.data import router as data_router
from app.api.routes.upload import router as upload_router
from app.database.connection import create_tables

# ------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("dataflow")


# ------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("DataFlow API starting up…")
    create_tables()
    logger.info("Database tables verified ✓")
    yield
    logger.info("DataFlow API shutting down")


# ------------------------------------------------------------------
# App definition
# ------------------------------------------------------------------

app = FastAPI(
    title="DataFlow Analytics API",
    description=(
        "Production-grade REST API for the DataFlow sales analytics platform. "
        "Ingests CSV/JSON datasets through a Pandas ETL pipeline and serves "
        "analytics insights from a normalized PostgreSQL database."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ------------------------------------------------------------------
# CORS (allow Vite dev server + production domain)
# ------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev
        "http://localhost:3000",   # alternative dev port
        "http://frontend:80",      # Docker service
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------
# Routers
# ------------------------------------------------------------------

app.include_router(upload_router)
app.include_router(analytics_router)
app.include_router(data_router)


# ------------------------------------------------------------------
# Health check
# ------------------------------------------------------------------

@app.get("/health", tags=["System"])
def health_check() -> dict:
    return {"status": "ok", "service": "dataflow-api", "version": "1.0.0"}


# ------------------------------------------------------------------
# __init__ files
# ------------------------------------------------------------------
