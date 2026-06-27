"""
Analytics & Dashboard Routes
=============================
GET /api/dashboard             — KPI summary card data
GET /api/analytics/revenue     — Revenue over time (monthly or daily)
GET /api/analytics/categories  — Sales by product category
GET /api/analytics/regions     — Revenue by region
GET /api/analytics/top-products
GET /api/analytics/top-customers
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.schemas import (
    CategorySales,
    DashboardSummary,
    RegionRevenue,
    RevenuePoint,
    TopCustomer,
    TopProduct,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(tags=["Analytics"])


# ------------------------------------------------------------------
# Dashboard summary
# ------------------------------------------------------------------

@router.get("/api/dashboard", response_model=DashboardSummary)
def get_dashboard(db: Session = Depends(get_db)) -> DashboardSummary:
    """
    Single endpoint powering the dashboard KPI cards.
    Returns totals, growth %, top category, and embedded trend data.
    """
    svc = AnalyticsService(db)
    return svc.get_dashboard_summary()


# ------------------------------------------------------------------
# Revenue trend
# ------------------------------------------------------------------

@router.get("/api/analytics/revenue", response_model=List[RevenuePoint])
def get_revenue(
    granularity: str = Query("monthly", pattern="^(monthly|daily)$"),
    periods: int = Query(12, ge=1, le=365),
    db: Session = Depends(get_db),
) -> List[RevenuePoint]:
    """
    Revenue trend data.

    - `granularity=monthly` (default): returns last N months
    - `granularity=daily`: returns last N days
    """
    svc = AnalyticsService(db)
    if granularity == "daily":
        return svc.get_daily_revenue(days=periods)
    return svc.get_monthly_revenue(months=periods)


# ------------------------------------------------------------------
# Category breakdown
# ------------------------------------------------------------------

@router.get("/api/analytics/categories", response_model=List[CategorySales])
def get_categories(db: Session = Depends(get_db)) -> List[CategorySales]:
    """Revenue and order count broken down by product category."""
    return AnalyticsService(db).get_sales_by_category()


# ------------------------------------------------------------------
# Regional breakdown
# ------------------------------------------------------------------

@router.get("/api/analytics/regions", response_model=List[RegionRevenue])
def get_regions(db: Session = Depends(get_db)) -> List[RegionRevenue]:
    """Revenue and order count broken down by region."""
    return AnalyticsService(db).get_revenue_by_region()


# ------------------------------------------------------------------
# Top N
# ------------------------------------------------------------------

@router.get("/api/analytics/top-products", response_model=List[TopProduct])
def get_top_products(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> List[TopProduct]:
    """Top-selling products by total revenue."""
    return AnalyticsService(db).get_top_products(limit=limit)


@router.get("/api/analytics/top-customers", response_model=List[TopCustomer])
def get_top_customers(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> List[TopCustomer]:
    """Top customers by total spend."""
    return AnalyticsService(db).get_top_customers(limit=limit)
