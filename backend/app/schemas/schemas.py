"""
DataFlow Pydantic Schemas
=========================
Request and response models for the FastAPI endpoints.
Separates API contracts from internal ORM models.
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ------------------------------------------------------------------
# Shared base
# ------------------------------------------------------------------

class OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ------------------------------------------------------------------
# Customer schemas
# ------------------------------------------------------------------

class CustomerBase(OrmBase):
    name: str
    city: str = "Unknown"
    state: str = "Unknown"
    country: str = "United States"
    segment: str = "Consumer"


class CustomerOut(CustomerBase):
    id: int
    created_at: Optional[datetime] = None
    total_orders: Optional[int] = None
    total_revenue: Optional[float] = None


# ------------------------------------------------------------------
# Product schemas
# ------------------------------------------------------------------

class ProductBase(OrmBase):
    name: str
    category: str = "General"
    sub_category: str = "General"
    unit_price: float = 0.0


class ProductOut(ProductBase):
    id: int
    total_sold: Optional[int] = None
    total_revenue: Optional[float] = None


# ------------------------------------------------------------------
# Order schemas
# ------------------------------------------------------------------

class OrderBase(OrmBase):
    order_id: str
    quantity: int
    unit_price: float
    discount: float = 0.0
    revenue: float
    profit: float
    profit_margin: float
    order_date: date
    ship_date: Optional[date] = None
    region: str = "Unknown"
    salesperson: str = "Unknown"
    payment_method: str = "Unknown"
    ship_mode: str = "Standard Class"


class OrderOut(OrderBase):
    id: int
    customer_id: int
    product_id: int
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    category: Optional[str] = None


# ------------------------------------------------------------------
# Upload / History schemas
# ------------------------------------------------------------------

class UploadHistoryOut(OrmBase):
    id: int
    filename: str
    file_size_kb: float
    total_rows: int
    processed_rows: int
    failed_rows: int
    orders_inserted: int
    customers_upserted: int
    products_upserted: int
    processing_time_sec: float
    status: str
    error_log: Optional[str] = None
    uploaded_at: datetime


class UploadResult(BaseModel):
    message: str
    upload_id: int
    filename: str
    stats: Dict[str, Any]


# ------------------------------------------------------------------
# Analytics schemas
# ------------------------------------------------------------------

class RevenuePoint(BaseModel):
    period: str
    revenue: float
    orders: int
    profit: float


class CategorySales(BaseModel):
    category: str
    revenue: float
    orders: int
    profit: float


class RegionRevenue(BaseModel):
    region: str
    revenue: float
    orders: int


class TopProduct(BaseModel):
    product_name: str
    category: str
    revenue: float
    quantity_sold: int
    profit: float


class TopCustomer(BaseModel):
    customer_name: str
    segment: str
    total_revenue: float
    total_orders: int


# ------------------------------------------------------------------
# Dashboard summary schema
# ------------------------------------------------------------------

class DashboardSummary(BaseModel):
    total_revenue: float
    total_orders: int
    total_customers: int
    total_products: int
    average_order_value: float
    top_category: str
    top_region: str
    monthly_growth_pct: float
    revenue_trend: List[RevenuePoint]
    category_breakdown: List[CategorySales]


# ------------------------------------------------------------------
# Pagination envelope
# ------------------------------------------------------------------

class Page(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    pages: int


# ------------------------------------------------------------------
# Standard error response
# ------------------------------------------------------------------

class ErrorResponse(BaseModel):
    detail: str
    status_code: int
