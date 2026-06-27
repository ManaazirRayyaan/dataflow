"""
Data Resource Routes
====================
Orders, Customers, Products — CRUD read endpoints with:
  - Pagination
  - Text search
  - Column filtering
  - Sort direction
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.models.models import Customer, Order, Product
from app.schemas.schemas import CustomerOut, OrderOut, Page, ProductOut

router = APIRouter(tags=["Data"])


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def paginate(query, page: int, page_size: int) -> Page:
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return Page(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, -(-total // page_size)),
    )


# ==================================================================
# Orders
# ==================================================================

@router.get("/api/orders", response_model=Page)
def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by order ID or customer name"),
    region: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: str = Query("order_date", description="Column to sort by"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
) -> Page:
    """
    Paginated, searchable, filterable order list.

    Supports:
    - `search`: fuzzy match on order_id or customer name
    - `region`: filter by region name (exact, case-insensitive)
    - `category`: filter by product category
    - `sort_by` / `sort_dir`: sort on any order column
    """
    query = (
        db.query(Order)
        .join(Order.customer)
        .join(Order.product)
        .options(joinedload(Order.customer), joinedload(Order.product))
    )

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Order.order_id.ilike(term),
                Customer.name.ilike(term),
            )
        )

    if region:
        query = query.filter(Order.region.ilike(region))

    if category:
        query = query.filter(Product.category.ilike(category))

    # Sorting
    sort_col = getattr(Order, sort_by, Order.order_date)
    query = query.order_by(desc(sort_col) if sort_dir == "desc" else asc(sort_col))

    raw_page = paginate(query, page, page_size)

    # Enrich with joined names
    enriched_items = []
    for o in raw_page.items:
        enriched_items.append(
            OrderOut(
                id=o.id,
                order_id=o.order_id,
                customer_id=o.customer_id,
                product_id=o.product_id,
                quantity=o.quantity,
                unit_price=o.unit_price,
                discount=o.discount,
                revenue=o.revenue,
                profit=o.profit,
                profit_margin=o.profit_margin,
                order_date=o.order_date,
                ship_date=o.ship_date,
                region=o.region,
                salesperson=o.salesperson,
                payment_method=o.payment_method,
                ship_mode=o.ship_mode,
                customer_name=o.customer.name if o.customer else None,
                product_name=o.product.name if o.product else None,
                category=o.product.category if o.product else None,
            )
        )

    raw_page.items = enriched_items
    return raw_page


@router.get("/api/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: str, db: Session = Depends(get_db)) -> OrderOut:
    """Get a single order by its order_id string."""
    o = (
        db.query(Order)
        .filter(Order.order_id == order_id)
        .options(joinedload(Order.customer), joinedload(Order.product))
        .first()
    )
    if not o:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order '{order_id}' not found")

    return OrderOut(
        id=o.id,
        order_id=o.order_id,
        customer_id=o.customer_id,
        product_id=o.product_id,
        quantity=o.quantity,
        unit_price=o.unit_price,
        discount=o.discount,
        revenue=o.revenue,
        profit=o.profit,
        profit_margin=o.profit_margin,
        order_date=o.order_date,
        ship_date=o.ship_date,
        region=o.region,
        salesperson=o.salesperson,
        payment_method=o.payment_method,
        ship_mode=o.ship_mode,
        customer_name=o.customer.name if o.customer else None,
        product_name=o.product.name if o.product else None,
        category=o.product.category if o.product else None,
    )


# ==================================================================
# Customers
# ==================================================================

@router.get("/api/customers", response_model=Page)
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by name, city, or state"),
    segment: Optional[str] = None,
    sort_by: str = Query("name"),
    sort_dir: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
) -> Page:
    """Paginated customer list with search and segment filter."""
    query = db.query(Customer)

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Customer.name.ilike(term),
                Customer.city.ilike(term),
                Customer.state.ilike(term),
            )
        )

    if segment:
        query = query.filter(Customer.segment.ilike(segment))

    sort_col = getattr(Customer, sort_by, Customer.name)
    query = query.order_by(desc(sort_col) if sort_dir == "desc" else asc(sort_col))

    raw = paginate(query, page, page_size)

    # Annotate with order stats
    enriched = []
    for c in raw.items:
        total_orders = c.orders.count()
        total_revenue = sum(o.revenue for o in c.orders)
        enriched.append(
            CustomerOut(
                id=c.id,
                name=c.name,
                city=c.city,
                state=c.state,
                country=c.country,
                segment=c.segment,
                created_at=c.created_at,
                total_orders=total_orders,
                total_revenue=round(total_revenue, 2),
            )
        )

    raw.items = enriched
    return raw


# ==================================================================
# Products
# ==================================================================

@router.get("/api/products", response_model=Page)
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by product name"),
    category: Optional[str] = None,
    sort_by: str = Query("name"),
    sort_dir: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
) -> Page:
    """Paginated product list with search and category filter."""
    query = db.query(Product)

    if search:
        term = f"%{search}%"
        query = query.filter(Product.name.ilike(term))

    if category:
        query = query.filter(Product.category.ilike(category))

    sort_col = getattr(Product, sort_by, Product.name)
    query = query.order_by(desc(sort_col) if sort_dir == "desc" else asc(sort_col))

    raw = paginate(query, page, page_size)

    enriched = []
    for p in raw.items:
        total_sold = sum(o.quantity for o in p.orders)
        total_revenue = sum(o.revenue for o in p.orders)
        enriched.append(
            ProductOut(
                id=p.id,
                name=p.name,
                category=p.category,
                sub_category=p.sub_category,
                unit_price=p.unit_price,
                total_sold=total_sold,
                total_revenue=round(total_revenue, 2),
            )
        )

    raw.items = enriched
    return raw
