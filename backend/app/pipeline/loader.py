"""
DataFlow Pipeline Loader
========================
Transforms a cleaned Pandas DataFrame into normalized PostgreSQL records.
Uses batch inserts and upsert logic to handle re-imports gracefully.
"""

import logging
from typing import Any, Dict, List, Optional

import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from app.models.models import Customer, Order, Product

logger = logging.getLogger(__name__)


class PipelineLoader:
    """
    Load stage of the ETL pipeline.

    Responsibilities:
      - Split flat DataFrame into Customer / Product / Order records
      - Deduplicate against existing DB rows using upsert
      - Batch-insert for performance
      - Return import statistics
    """

    BATCH_SIZE = 500

    def __init__(self, db: Session) -> None:
        self.db = db
        self._customer_cache: Dict[str, int] = {}
        self._product_cache: Dict[str, int] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def load(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Load all rows in df into the database.

        Returns a stats dict with counts of inserted/updated records.
        """
        logger.info(f"Loading {len(df):,} rows into PostgreSQL")

        stats = {
            "orders_inserted": 0,
            "customers_upserted": 0,
            "products_upserted": 0,
            "errors": [],
        }

        # Pre-load or create Customers and Products in bulk
        stats["customers_upserted"] = self._load_customers(df)
        stats["products_upserted"] = self._load_products(df)

        # Insert Orders in batches
        errors, inserted = self._load_orders(df)
        stats["orders_inserted"] = inserted
        stats["errors"] = errors

        return stats

    # ------------------------------------------------------------------
    # Loaders
    # ------------------------------------------------------------------

    def _load_customers(self, df: pd.DataFrame) -> int:
        """Upsert unique customers from the dataset."""
        if "customer_name" not in df.columns:
            return 0

        customer_cols = [c for c in ["customer_name", "city", "state", "country", "segment"] if c in df.columns]
        unique_customers = df[customer_cols].drop_duplicates(subset=["customer_name"])

        upserted = 0
        for _, row in unique_customers.iterrows():
            name = str(row["customer_name"]).strip()
            if not name or name == "nan":
                continue

            existing = self.db.query(Customer).filter_by(name=name).first()
            if existing:
                self._customer_cache[name] = existing.id
            else:
                customer = Customer(
                    name=name,
                    city=row.get("city", "Unknown") if "city" in row else "Unknown",
                    state=row.get("state", "Unknown") if "state" in row else "Unknown",
                    country=row.get("country", "United States") if "country" in row else "United States",
                    segment=row.get("segment", "Consumer") if "segment" in row else "Consumer",
                )
                self.db.add(customer)
                self.db.flush()
                self._customer_cache[name] = customer.id
                upserted += 1

        self.db.commit()
        logger.info(f"Upserted {upserted} customers")
        return upserted

    def _load_products(self, df: pd.DataFrame) -> int:
        """Upsert unique products from the dataset."""
        if "product_name" not in df.columns:
            return 0

        product_cols = [c for c in ["product_name", "category", "sub_category", "unit_price"] if c in df.columns]
        unique_products = df[product_cols].drop_duplicates(subset=["product_name"])

        upserted = 0
        for _, row in unique_products.iterrows():
            name = str(row["product_name"]).strip()
            if not name or name == "nan":
                continue

            existing = self.db.query(Product).filter_by(name=name).first()
            if existing:
                self._product_cache[name] = existing.id
            else:
                product = Product(
                    name=name,
                    category=row.get("category", "General") if "category" in row else "General",
                    sub_category=row.get("sub_category", "General") if "sub_category" in row else "General",
                    unit_price=float(row["unit_price"]) if "unit_price" in row else 0.0,
                )
                self.db.add(product)
                self.db.flush()
                self._product_cache[name] = product.id
                upserted += 1

        self.db.commit()
        logger.info(f"Upserted {upserted} products")
        return upserted

    def _load_orders(self, df: pd.DataFrame) -> tuple[List[str], int]:
        """Batch-insert orders, skipping duplicates by order_id."""
        errors: List[str] = []
        inserted = 0

        for batch_start in range(0, len(df), self.BATCH_SIZE):
            batch = df.iloc[batch_start : batch_start + self.BATCH_SIZE]

            for _, row in batch.iterrows():
                try:
                    order_id = str(row.get("order_id", "")).strip()
                    if not order_id or order_id == "nan":
                        continue

                    # Skip if order already exists
                    if self.db.query(Order).filter_by(order_id=order_id).first():
                        continue

                    customer_name = str(row.get("customer_name", "")).strip()
                    product_name = str(row.get("product_name", "")).strip()

                    customer_id = self._customer_cache.get(customer_name)
                    product_id = self._product_cache.get(product_name)

                    if not customer_id or not product_id:
                        errors.append(f"Missing FK for order {order_id}")
                        continue

                    order = Order(
                        order_id=order_id,
                        customer_id=customer_id,
                        product_id=product_id,
                        quantity=int(row.get("quantity", 1)),
                        unit_price=float(row.get("unit_price", 0)),
                        discount=float(row.get("discount", 0)),
                        revenue=float(row.get("revenue", 0)),
                        profit=float(row.get("profit", 0)),
                        profit_margin=float(row.get("profit_margin", 0)),
                        order_date=row.get("order_date"),
                        ship_date=row.get("ship_date"),
                        region=str(row.get("region", "Unknown")),
                        salesperson=str(row.get("salesperson", "Unknown")),
                        payment_method=str(row.get("payment_method", "Unknown")),
                        ship_mode=str(row.get("ship_mode", "Standard Class")),
                    )
                    self.db.add(order)
                    inserted += 1

                except Exception as e:
                    errors.append(f"Row error: {str(e)}")
                    logger.warning(f"Failed to insert row: {e}")

            self.db.commit()
            logger.info(f"Committed batch ending at row {batch_start + len(batch)}")

        logger.info(f"Inserted {inserted} orders with {len(errors)} errors")
        return errors, inserted
