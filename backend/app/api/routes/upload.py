"""
Upload Router
=============
POST /api/upload  — accepts CSV or JSON, runs the ETL pipeline,
                    stores results in PostgreSQL, returns import stats.
GET  /api/upload/history — returns paginated upload log
"""

import json
import logging
import time
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.models import UploadHistory
from app.pipeline.etl import DataPipeline
from app.pipeline.loader import PipelineLoader
from app.schemas.schemas import Page, UploadHistoryOut, UploadResult

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/upload", tags=["Upload"])

ALLOWED_EXTENSIONS = {".csv", ".json"}
MAX_FILE_SIZE_MB = 50


@router.post("", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> UploadResult:
    """
    Upload a CSV or JSON sales dataset.

    The file is immediately passed through the ETL pipeline:
      1. Extract  — parse bytes into DataFrame
      2. Transform — clean, validate, and enrich data
      3. Load      — upsert into PostgreSQL

    Returns import statistics including processed/failed row counts.
    """
    # --- Validate filename ------------------------------------------------
    filename = file.filename or "upload"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{ext}'. Only .csv and .json are accepted.",
        )

    # --- Read file content -------------------------------------------------
    content = await file.read()
    size_kb = round(len(content) / 1024, 2)

    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    if size_kb > MAX_FILE_SIZE_MB * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {MAX_FILE_SIZE_MB} MB limit.",
        )

    # --- Create upload record (pending) ------------------------------------
    upload_record = UploadHistory(
        filename=filename,
        file_size_kb=size_kb,
        status="processing",
    )
    db.add(upload_record)
    db.commit()
    db.refresh(upload_record)

    start_time = time.perf_counter()

    try:
        # ── ETL Pipeline ────────────────────────────────────────────────
        pipeline = DataPipeline()
        clean_df, failed_df = pipeline.run(content, filename)
        pipeline_stats = pipeline.get_stats()

        loader = PipelineLoader(db)
        load_stats = loader.load(clean_df)

        elapsed = round(time.perf_counter() - start_time, 2)

        # ── Update upload record ─────────────────────────────────────────
        status_label = (
            "success" if len(failed_df) == 0
            else "partial" if len(clean_df) > 0
            else "failed"
        )

        upload_record.total_rows = pipeline_stats["total_rows"]
        upload_record.processed_rows = pipeline_stats["processed_rows"]
        upload_record.failed_rows = pipeline_stats["failed_rows"]
        upload_record.orders_inserted = load_stats["orders_inserted"]
        upload_record.customers_upserted = load_stats["customers_upserted"]
        upload_record.products_upserted = load_stats["products_upserted"]
        upload_record.processing_time_sec = elapsed
        upload_record.status = status_label
        upload_record.error_log = (
            json.dumps(load_stats["errors"][:20]) if load_stats["errors"] else None
        )

        db.commit()

        logger.info(
            f"Upload '{filename}' complete — "
            f"{upload_record.orders_inserted} orders inserted in {elapsed}s"
        )

        return UploadResult(
            message=f"Dataset processed successfully ({status_label})",
            upload_id=upload_record.id,
            filename=filename,
            stats={
                "total_rows": pipeline_stats["total_rows"],
                "processed_rows": pipeline_stats["processed_rows"],
                "failed_rows": pipeline_stats["failed_rows"],
                "orders_inserted": load_stats["orders_inserted"],
                "customers_upserted": load_stats["customers_upserted"],
                "products_upserted": load_stats["products_upserted"],
                "processing_time_sec": elapsed,
                "status": status_label,
                "duplicates_removed": pipeline_stats["duplicates_removed"],
                "outliers_capped": pipeline_stats["outliers_capped"],
            },
        )

    except Exception as exc:
        upload_record.status = "failed"
        upload_record.error_log = str(exc)[:2000]
        upload_record.processing_time_sec = round(time.perf_counter() - start_time, 2)
        db.commit()

        logger.error(f"Upload '{filename}' failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline failed: {str(exc)}",
        )


@router.get("/history", response_model=Page)
def list_upload_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> Page:
    """Return paginated upload history, newest first."""
    query = db.query(UploadHistory).order_by(UploadHistory.uploaded_at.desc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return Page(
        items=[UploadHistoryOut.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, -(-total // page_size)),
    )
