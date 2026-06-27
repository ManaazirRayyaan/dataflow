"""
DataFlow Database Models
========================
SQLAlchemy ORM models for the normalized sales analytics schema.
"""

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    city = Column(String(100), default="Unknown")
    state = Column(String(100), default="Unknown")
    country = Column(String(100), default="United States")
    segment = Column(String(100), default="Consumer")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    orders = relationship("Order", back_populates="customer", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<Customer id={self.id} name={self.name!r}>"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    category = Column(String(100), default="General", index=True)
    sub_category = Column(String(100), default="General")
    unit_price = Column(Float, default=0.0)

    orders = relationship("Order", back_populates="product", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name!r} category={self.category!r}>"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(100), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    # Financials
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    revenue = Column(Float, default=0.0)
    profit = Column(Float, default=0.0)
    profit_margin = Column(Float, default=0.0)

    # Logistics
    order_date = Column(Date, nullable=False, index=True)
    ship_date = Column(Date)
    region = Column(String(100), default="Unknown", index=True)
    salesperson = Column(String(255), default="Unknown")
    payment_method = Column(String(100), default="Unknown")
    ship_mode = Column(String(100), default="Standard Class")

    # Relationships
    customer = relationship("Customer", back_populates="orders")
    product = relationship("Product", back_populates="orders")

    def __repr__(self) -> str:
        return f"<Order id={self.id} order_id={self.order_id!r} revenue={self.revenue}>"


class UploadHistory(Base):
    __tablename__ = "upload_history"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_size_kb = Column(Float, default=0.0)
    total_rows = Column(Integer, default=0)
    processed_rows = Column(Integer, default=0)
    failed_rows = Column(Integer, default=0)
    orders_inserted = Column(Integer, default=0)
    customers_upserted = Column(Integer, default=0)
    products_upserted = Column(Integer, default=0)
    processing_time_sec = Column(Float, default=0.0)
    status = Column(String(50), default="pending")  # pending | processing | success | partial | failed
    error_log = Column(Text)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<UploadHistory id={self.id} file={self.filename!r} status={self.status!r}>"
