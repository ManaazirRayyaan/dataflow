"""
DataFlow Database Connection
============================
SQLAlchemy engine + session factory setup.
Connection string is read from DATABASE_URL environment variable.
"""

import os
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://dataflow:dataflow@localhost:5432/dataflow_db",
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # Detect stale connections
    pool_size=10,
    max_overflow=20,
    echo=False,               # Set True to log SQL (dev only)
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency — yields a database session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """Create all tables (used on startup if not using Alembic)."""
    Base.metadata.create_all(bind=engine)
