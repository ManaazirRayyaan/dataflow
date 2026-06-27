"""
DataFlow ETL Pipeline
=====================
Production-grade Extract → Transform → Load pipeline for sales analytics data.
Handles CSV/JSON ingestion, comprehensive data cleaning, and PostgreSQL loading.
"""

import io
import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class DataPipeline:
    """
    End-to-end ETL pipeline demonstrating real-world data engineering workflows.

    Stages:
        1. Extract  — parse CSV or JSON from raw bytes
        2. Transform — 9-step cleaning & feature engineering
        3. Load      — batch insert into PostgreSQL via SQLAlchemy
    """

    # Columns the pipeline considers critical (rows missing these are rejected)
    CRITICAL_COLUMNS = ["order_id", "customer_name", "product_name", "quantity", "unit_price"]

    # Map of messy incoming column names → canonical snake_case names
    COLUMN_ALIASES: Dict[str, str] = {
        "row id": "row_id",
        "order id": "order_id",
        "orderid": "order_id",
        "customer name": "customer_name",
        "customer": "customer_name",
        "customer id": "customer_id",
        "product name": "product_name",
        "product": "product_name",
        "product id": "product_id",
        "sub-category": "sub_category",
        "subcategory": "sub_category",
        "sub category": "sub_category",
        "sales": "revenue",
        "price": "unit_price",
        "unit price": "unit_price",
        "qty": "quantity",
        "ship date": "ship_date",
        "shipdate": "ship_date",
        "order date": "order_date",
        "orderdate": "order_date",
        "profit margin": "profit_margin",
        "payment": "payment_method",
        "postal code": "postal_code",
        "ship mode": "ship_mode",
    }

    # IQR multiplier for outlier detection (3 = very conservative — only extreme values)
    OUTLIER_IQR_MULTIPLIER = 3.0

    def __init__(self) -> None:
        self._transformation_log: List[Dict[str, str]] = []
        self.stats: Dict[str, Any] = {
            "total_rows": 0,
            "processed_rows": 0,
            "failed_rows": 0,
            "duplicates_removed": 0,
            "missing_values_handled": 0,
            "outliers_capped": 0,
            "derived_columns_added": [],
        }
        self._start_time: float = 0.0

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(self, content: bytes, filename: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Full pipeline entry point.

        Args:
            content:  Raw file bytes (CSV or JSON)
            filename: Original filename (used to detect format)

        Returns:
            (clean_df, failed_df) — processed rows and rejected rows
        """
        self._start_time = time.perf_counter()
        self._log("PIPELINE", f"Starting pipeline for '{filename}'")

        raw_df = self.extract(content, filename)
        clean_df, failed_df = self.transform(raw_df)

        elapsed = round(time.perf_counter() - self._start_time, 2)
        self._log("PIPELINE", f"Completed in {elapsed}s — {len(clean_df)} clean / {len(failed_df)} failed")
        return clean_df, failed_df

    # ------------------------------------------------------------------
    # Stage 1: Extract
    # ------------------------------------------------------------------

    def extract(self, content: bytes, filename: str) -> pd.DataFrame:
        """Parse raw bytes into a DataFrame."""
        self._log("EXTRACT", f"Reading '{filename}'")

        ext = filename.rsplit(".", 1)[-1].lower()

        try:
            if ext == "csv":
                df = pd.read_csv(
                    io.BytesIO(content),
                    encoding="utf-8",
                    on_bad_lines="warn",
                    low_memory=False,
                )
            elif ext == "json":
                df = pd.read_json(io.BytesIO(content))
            else:
                raise ValueError(f"Unsupported format: '.{ext}'. Only CSV and JSON are accepted.")

        except UnicodeDecodeError:
            # Retry with latin-1 for legacy exports
            self._log("EXTRACT", "UTF-8 failed — retrying with latin-1 encoding", level="WARN")
            df = pd.read_csv(io.BytesIO(content), encoding="latin-1", on_bad_lines="warn")

        self.stats["total_rows"] = len(df)
        self._log("EXTRACT", f"Extracted {len(df):,} rows × {len(df.columns)} columns")
        return df

    # ------------------------------------------------------------------
    # Stage 2: Transform
    # ------------------------------------------------------------------

    def transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Apply 9-step transformation pipeline."""
        self._log("TRANSFORM", "Begin transformation pipeline")
        failed_parts: List[pd.DataFrame] = []

        df = self._step1_normalize_columns(df)
        df = self._step2_remove_duplicates(df)
        df, dropped = self._step3_handle_missing_values(df)
        failed_parts.append(dropped)
        df = self._step4_clean_strings(df)
        df, date_fails = self._step5_standardize_dates(df)
        failed_parts.append(date_fails)
        df, num_fails = self._step6_validate_numerics(df)
        failed_parts.append(num_fails)
        df = self._step7_normalize_categories(df)
        df = self._step8_generate_derived_columns(df)
        df = self._step9_handle_outliers(df)

        failed_df = pd.concat([f for f in failed_parts if not f.empty], ignore_index=True)
        self.stats["processed_rows"] = len(df)
        self.stats["failed_rows"] = len(failed_df)

        return df, failed_df

    # ── Step 1 ──────────────────────────────────────────────────────────

    def _step1_normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize column names to snake_case.
        Maps common variants (e.g. 'Sales', 'SALES', 'sales price') to canonical names.
        """
        original = df.columns.tolist()

        df.columns = (
            df.columns
            .str.lower()
            .str.strip()
            .str.replace(r"\s+", " ", regex=True)
        )

        df.columns = [self.COLUMN_ALIASES.get(c, c) for c in df.columns]
        df.columns = df.columns.str.replace(" ", "_").str.replace(r"[^\w]", "_", regex=True)

        changed = [(o, n) for o, n in zip(original, df.columns.tolist()) if o != n]
        if changed:
            self._log("TRANSFORM", f"[1] Normalized {len(changed)} column names: {changed[:5]}{'…' if len(changed) > 5 else ''}")

        return df

    # ── Step 2 ──────────────────────────────────────────────────────────

    def _step2_remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove exact and order-ID-level duplicates."""
        before = len(df)

        if "order_id" in df.columns:
            df = df.drop_duplicates(subset=["order_id"], keep="first")
        else:
            df = df.drop_duplicates()

        removed = before - len(df)
        self.stats["duplicates_removed"] = removed

        if removed:
            self._log("TRANSFORM", f"[2] Removed {removed:,} duplicate rows")
        else:
            self._log("TRANSFORM", "[2] No duplicates found")

        return df

    # ── Step 3 ──────────────────────────────────────────────────────────

    def _step3_handle_missing_values(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Critical columns → reject row if null.
        Non-critical columns → fill with sensible defaults.
        """
        available_critical = [c for c in self.CRITICAL_COLUMNS if c in df.columns]
        critical_null_mask = df[available_critical].isnull().any(axis=1)

        failed_df = df[critical_null_mask].copy()
        df = df[~critical_null_mask].copy()

        if len(failed_df):
            self._log("TRANSFORM", f"[3] Rejected {len(failed_df):,} rows missing critical fields")

        # Fill non-critical nulls
        defaults: Dict[str, Any] = {
            "region": "Unknown",
            "salesperson": "Unknown",
            "payment_method": "Unknown",
            "discount": 0.0,
            "sub_category": "General",
            "city": "Unknown",
            "state": "Unknown",
            "country": "United States",
            "segment": "Consumer",
            "ship_mode": "Standard Class",
            "postal_code": "00000",
        }

        total_filled = 0
        for col, default in defaults.items():
            if col in df.columns:
                n = df[col].isnull().sum()
                if n:
                    df[col] = df[col].fillna(default)
                    total_filled += n

        if total_filled:
            self.stats["missing_values_handled"] = total_filled
            self._log("TRANSFORM", f"[3] Filled {total_filled:,} missing values with defaults")

        return df, failed_df

    # ── Step 4 ──────────────────────────────────────────────────────────

    def _step4_clean_strings(self, df: pd.DataFrame) -> pd.DataFrame:
        """Trim whitespace; remove 'nan' string artefacts from stringify operations."""
        str_cols = df.select_dtypes(include=["object"]).columns

        for col in str_cols:
            df[col] = (
                df[col]
                .astype(str)
                .str.strip()
                .str.replace(r"\s+", " ", regex=True)
            )
            # Replace string 'nan'/'None' artefacts with actual NaN
            df[col] = df[col].replace({"nan": np.nan, "None": np.nan, "": np.nan})

        self._log("TRANSFORM", f"[4] Cleaned whitespace in {len(str_cols)} string columns")
        return df

    # ── Step 5 ──────────────────────────────────────────────────────────

    def _step5_standardize_dates(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Parse date columns using pandas' flexible date inference.
        Rows where order_date cannot be parsed are rejected.
        """
        date_cols = [c for c in ["order_date", "ship_date"] if c in df.columns]
        failed_df = pd.DataFrame()

        # Ordered format list — most specific first to avoid ambiguity
        DATE_FORMATS_TO_TRY = [
            "%Y-%m-%d",      # ISO: 2023-10-15
            "%m/%d/%Y",      # US:  10/15/2023
            "%d/%m/%Y",      # EU:  15/10/2023
            "%m-%d-%Y",      # US dashes: 10-15-2023
            "%d-%m-%Y",      # EU dashes: 15-10-2023
            "%B %d, %Y",     # Text: October 15, 2023
            "%b %d, %Y",     # Abbr: Oct 15, 2023
            "%Y/%m/%d",      # Alt ISO: 2023/10/15
        ]

        for col in date_cols:
            parsed = pd.Series(pd.NaT, index=df.index)

            # First pass: pandas flexible inference (handles most formats)
            first_pass = pd.to_datetime(df[col], errors="coerce", dayfirst=False)
            parsed = first_pass.copy()

            # Second pass: try explicit formats for anything that failed
            still_null = parsed.isnull() & df[col].notna()
            if still_null.any():
                for fmt in DATE_FORMATS_TO_TRY:
                    if not still_null.any():
                        break
                    retry = pd.to_datetime(
                        df.loc[still_null, col], format=fmt, errors="coerce"
                    )
                    parsed.loc[still_null] = retry
                    still_null = parsed.isnull() & df[col].notna()

            bad_mask = parsed.isnull() & df[col].notna()

            if bad_mask.any() and col == "order_date":
                self._log("TRANSFORM", f"[5] Rejecting {bad_mask.sum():,} rows with unparseable order_date", level="WARN")
                failed_df = pd.concat([failed_df, df[bad_mask]], ignore_index=True)
                df = df[~bad_mask].copy()
                parsed = parsed[~bad_mask]

            df[col] = parsed.dt.date
            self._log("TRANSFORM", f"[5] Standardized '{col}'")

        return df, failed_df

    # ── Step 6 ──────────────────────────────────────────────────────────

    def _step6_validate_numerics(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Strip currency symbols, coerce to float, apply range validation.
        Rows where required numeric fields fail coercion are rejected.
        """
        column_rules: Dict[str, Dict[str, Any]] = {
            "quantity":   {"min": 1,    "required": True},
            "unit_price": {"min": 0.01, "required": True},
            "discount":   {"min": 0.0, "max": 1.0, "required": False},
            "revenue":    {"min": 0.0,  "required": False},
        }

        failed_df = pd.DataFrame()

        for col, rules in column_rules.items():
            if col not in df.columns:
                continue

            # Strip currency symbols and commas (e.g. "$1,234.56" → "1234.56")
            # Check for any non-numeric dtype (object, string, StringDtype, etc.)
            if not pd.api.types.is_numeric_dtype(df[col]):
                df[col] = (
                    df[col].astype(str)
                    .str.replace(r"[$£€,\s]", "", regex=True)
                    .str.strip()
                )

            df[col] = pd.to_numeric(df[col], errors="coerce")

            if rules.get("required"):
                null_mask = df[col].isnull()
                if null_mask.any():
                    failed_df = pd.concat([failed_df, df[null_mask]], ignore_index=True)
                    df = df[~null_mask].copy()
                    self._log("TRANSFORM", f"[6] Rejected {null_mask.sum():,} rows — '{col}' not numeric", level="WARN")

            # Range clipping
            if "min" in rules and col in df.columns:
                below = (df[col] < rules["min"]).sum()
                if below:
                    df[col] = df[col].clip(lower=rules["min"])
                    self._log("TRANSFORM", f"[6] Clipped {below} values in '{col}' to min={rules['min']}")

            if "max" in rules and col in df.columns:
                above = (df[col] > rules["max"]).sum()
                if above:
                    df[col] = df[col].clip(upper=rules["max"])
                    self._log("TRANSFORM", f"[6] Clipped {above} values in '{col}' to max={rules['max']}")

        return df, failed_df

    # ── Step 7 ──────────────────────────────────────────────────────────

    def _step7_normalize_categories(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Title-case categorical fields; apply region alias normalization
        to collapse 'east', 'EAST', 'E', etc. into 'East'.
        """
        cat_cols = [c for c in ["category", "sub_category", "region", "payment_method", "segment", "ship_mode"] if c in df.columns]

        for col in cat_cols:
            df[col] = df[col].astype(str).str.strip().str.title()

        region_aliases: Dict[str, str] = {
            "E": "East", "W": "West", "N": "North", "S": "South",
            "Ne": "North East", "Se": "South East", "Nw": "North West", "Sw": "South West",
            "Midwest": "Central", "Mid-West": "Central",
        }
        if "region" in df.columns:
            df["region"] = df["region"].replace(region_aliases)

        self._log("TRANSFORM", f"[7] Normalized categories in: {cat_cols}")
        return df

    # ── Step 8 ──────────────────────────────────────────────────────────

    def _step8_generate_derived_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Feature engineering:
          - revenue  = quantity × unit_price × (1 − discount)
          - profit   = from data if present, else estimated at 20% margin
          - profit_margin = profit / revenue
        """
        derived: List[str] = []

        # Revenue
        if "revenue" not in df.columns or df["revenue"].isnull().all():
            discount = df["discount"].fillna(0.0) if "discount" in df.columns else pd.Series(0.0, index=df.index)
            df["revenue"] = (df["quantity"] * df["unit_price"] * (1 - discount)).round(2)
            derived.append("revenue")

        # Profit
        if "profit" not in df.columns:
            df["profit"] = (df["revenue"] * 0.20).round(2)
            derived.append("profit (estimated)")

        # Profit margin
        if "profit_margin" not in df.columns:
            df["profit_margin"] = np.where(
                df["revenue"] > 0,
                (df["profit"] / df["revenue"]).round(4),
                0.0,
            )
            derived.append("profit_margin")

        self.stats["derived_columns_added"] = derived
        self._log("TRANSFORM", f"[8] Generated derived columns: {derived}")
        return df

    # ── Step 9 ──────────────────────────────────────────────────────────

    def _step9_handle_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect outliers using IQR × OUTLIER_IQR_MULTIPLIER method.
        Caps rather than removes — preserves row count while bounding extremes.
        """
        target_cols = [c for c in ["quantity", "unit_price", "revenue", "profit"] if c in df.columns]
        k = self.OUTLIER_IQR_MULTIPLIER

        for col in target_cols:
            q1, q3 = df[col].quantile([0.25, 0.75])
            iqr = q3 - q1
            lower = max(q1 - k * iqr, 0)
            upper = q3 + k * iqr

            outliers = ((df[col] < lower) | (df[col] > upper)).sum()
            if outliers:
                df[col] = df[col].clip(lower=lower, upper=upper)
                self.stats["outliers_capped"] += int(outliers)
                self._log("TRANSFORM", f"[9] Capped {outliers} outliers in '{col}' → [{lower:.2f}, {upper:.2f}]")

        return df

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _log(self, stage: str, message: str, level: str = "INFO") -> None:
        entry = {"timestamp": datetime.utcnow().isoformat(), "stage": stage, "level": level, "message": message}
        self._transformation_log.append(entry)
        getattr(logger, level.lower() if level != "WARN" else "warning")(f"[{stage}] {message}")

    def get_stats(self) -> Dict[str, Any]:
        """Return pipeline statistics + full transformation log."""
        return {
            **self.stats,
            "elapsed_seconds": round(time.perf_counter() - self._start_time, 2) if self._start_time else 0,
            "transformation_log": self._transformation_log,
        }
