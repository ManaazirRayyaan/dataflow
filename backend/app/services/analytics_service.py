"""
DataFlow Analytics Service
==========================
All SQL aggregation queries for the analytics API endpoints.
Keeps route handlers thin and business logic testable.
"""

import logging
from datetime import date
from typing import List, Optional

from sqlalchemy import desc, extract, func, text
from sqlalchemy.orm import Session

from app.models.models import Customer, Order, Product
from app.schemas.schemas import (
    CategorySales,
    DashboardSummary,
    RegionRevenue,
    RevenuePoint,
    TopCustomer,
    TopProduct,
)

logger = logging.getLogger(__name__)


class AnalyticsService:

    def __init__(self, db: Session) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Dashboard summary
    # ------------------------------------------------------------------

    def get_dashboard_summary(self) -> DashboardSummary:
        total_revenue = self.db.query(func.coalesce(func.sum(Order.revenue), 0)).scalar() or 0.0
        total_orders = self.db.query(func.count(Order.id)).scalar() or 0
        total_customers = self.db.query(func.count(Customer.id)).scalar() or 0
        total_products = self.db.query(func.count(Product.id)).scalar() or 0
        avg_order_value = round(total_revenue / total_orders, 2) if total_orders else 0.0

        # Top category by revenue
        top_cat_row = (
            self.db.query(Product.category, func.sum(Order.revenue).label("rev"))
            .join(Order, Order.product_id == Product.id)
            .group_by(Product.category)
            .order_by(desc("rev"))
            .first()
        )
        top_category = top_cat_row[0] if top_cat_row else "N/A"

        # Top region by revenue
        top_region_row = (
            self.db.query(Order.region, func.sum(Order.revenue).label("rev"))
            .group_by(Order.region)
            .order_by(desc("rev"))
            .first()
        )
        top_region = top_region_row[0] if top_region_row else "N/A"

        # Monthly growth: (this_month - last_month) / last_month * 100
        monthly_growth = self._calculate_monthly_growth()

        revenue_trend = self.get_monthly_revenue(months=12)
        category_breakdown = self.get_sales_by_category()

        return DashboardSummary(
            total_revenue=round(total_revenue, 2),
            total_orders=total_orders,
            total_customers=total_customers,
            total_products=total_products,
            average_order_value=avg_order_value,
            top_category=top_category,
            top_region=top_region,
            monthly_growth_pct=monthly_growth,
            revenue_trend=revenue_trend,
            category_breakdown=category_breakdown,
        )

    def _calculate_monthly_growth(self) -> float:
        """Calculate revenue growth: current vs previous month."""
        try:
            row = self.db.execute(text("""
                SELECT
                    SUM(CASE WHEN DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE)
                             THEN revenue ELSE 0 END) AS this_month,
                    SUM(CASE WHEN DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                             THEN revenue ELSE 0 END) AS last_month
                FROM orders
            """)).fetchone()

            this_month = float(row[0] or 0)
            last_month = float(row[1] or 0)

            if last_month == 0:
                return 0.0

            return round((this_month - last_month) / last_month * 100, 2)
        except Exception as e:
            logger.warning(f"Growth calculation failed: {e}")
            return 0.0

    # ------------------------------------------------------------------
    # Revenue over time
    # ------------------------------------------------------------------

    def get_monthly_revenue(self, months: int = 12) -> List[RevenuePoint]:
        rows = (
            self.db.query(
                func.to_char(Order.order_date, "YYYY-MM").label("period"),
                func.sum(Order.revenue).label("revenue"),
                func.count(Order.id).label("orders"),
                func.sum(Order.profit).label("profit"),
            )
            .group_by("period")
            .order_by("period")
            .limit(months)
            .all()
        )

        return [
            RevenuePoint(
                period=r.period,
                revenue=round(float(r.revenue or 0), 2),
                orders=int(r.orders or 0),
                profit=round(float(r.profit or 0), 2),
            )
            for r in rows
        ]

    def get_daily_revenue(self, days: int = 30) -> List[RevenuePoint]:
        rows = (
            self.db.query(
                func.to_char(Order.order_date, "YYYY-MM-DD").label("period"),
                func.sum(Order.revenue).label("revenue"),
                func.count(Order.id).label("orders"),
                func.sum(Order.profit).label("profit"),
            )
            .group_by("period")
            .order_by(desc("period"))
            .limit(days)
            .all()
        )

        return sorted(
            [
                RevenuePoint(
                    period=r.period,
                    revenue=round(float(r.revenue or 0), 2),
                    orders=int(r.orders or 0),
                    profit=round(float(r.profit or 0), 2),
                )
                for r in rows
            ],
            key=lambda x: x.period,
        )

    # ------------------------------------------------------------------
    # Category breakdown
    # ------------------------------------------------------------------

    def get_sales_by_category(self) -> List[CategorySales]:
        rows = (
            self.db.query(
                Product.category,
                func.sum(Order.revenue).label("revenue"),
                func.count(Order.id).label("orders"),
                func.sum(Order.profit).label("profit"),
            )
            .join(Order, Order.product_id == Product.id)
            .group_by(Product.category)
            .order_by(desc("revenue"))
            .all()
        )

        return [
            CategorySales(
                category=r.category or "Unknown",
                revenue=round(float(r.revenue or 0), 2),
                orders=int(r.orders or 0),
                profit=round(float(r.profit or 0), 2),
            )
            for r in rows
        ]

    # ------------------------------------------------------------------
    # Regional breakdown
    # ------------------------------------------------------------------

    def get_revenue_by_region(self) -> List[RegionRevenue]:
        rows = (
            self.db.query(
                Order.region,
                func.sum(Order.revenue).label("revenue"),
                func.count(Order.id).label("orders"),
            )
            .group_by(Order.region)
            .order_by(desc("revenue"))
            .all()
        )

        return [
            RegionRevenue(
                region=r.region or "Unknown",
                revenue=round(float(r.revenue or 0), 2),
                orders=int(r.orders or 0),
            )
            for r in rows
        ]

    # ------------------------------------------------------------------
    # Top N
    # ------------------------------------------------------------------

    def get_top_products(self, limit: int = 10) -> List[TopProduct]:
        rows = (
            self.db.query(
                Product.name.label("product_name"),
                Product.category,
                func.sum(Order.revenue).label("revenue"),
                func.sum(Order.quantity).label("qty"),
                func.sum(Order.profit).label("profit"),
            )
            .join(Order, Order.product_id == Product.id)
            .group_by(Product.name, Product.category)
            .order_by(desc("revenue"))
            .limit(limit)
            .all()
        )

        return [
            TopProduct(
                product_name=r.product_name,
                category=r.category or "Unknown",
                revenue=round(float(r.revenue or 0), 2),
                quantity_sold=int(r.qty or 0),
                profit=round(float(r.profit or 0), 2),
            )
            for r in rows
        ]

    def get_top_customers(self, limit: int = 10) -> List[TopCustomer]:
        rows = (
            self.db.query(
                Customer.name.label("customer_name"),
                Customer.segment,
                func.sum(Order.revenue).label("total_revenue"),
                func.count(Order.id).label("total_orders"),
            )
            .join(Order, Order.customer_id == Customer.id)
            .group_by(Customer.name, Customer.segment)
            .order_by(desc("total_revenue"))
            .limit(limit)
            .all()
        )

        return [
            TopCustomer(
                customer_name=r.customer_name,
                segment=r.segment or "Unknown",
                total_revenue=round(float(r.total_revenue or 0), 2),
                total_orders=int(r.total_orders or 0),
            )
            for r in rows
        ]
