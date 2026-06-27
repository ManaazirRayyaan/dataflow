# DataFlow — Python Data Pipeline & Analytics Dashboard

A production-ready full-stack analytics platform demonstrating end-to-end data engineering: from CSV/JSON ingestion through a Pandas ETL pipeline, into PostgreSQL, served via a FastAPI REST API, and visualized in a React dashboard.

---

## Tech Stack

| Layer       | Technology                                |
|-------------|-------------------------------------------|
| Backend     | Python 3.12, FastAPI, SQLAlchemy, Alembic |
| Database    | PostgreSQL 16                             |
| ETL         | Pandas, NumPy                             |
| Frontend    | React 18, Vite, Tailwind CSS, Recharts   |
| DevOps      | Docker, Docker Compose                    |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      React Dashboard                     │
│   KPI Cards · Revenue Charts · Data Tables · Upload     │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / REST
┌────────────────────────▼────────────────────────────────┐
│                    FastAPI Backend                        │
│   /api/upload  /api/dashboard  /api/analytics/*         │
│   /api/orders  /api/customers  /api/products            │
└───────────┬──────────────────────────┬──────────────────┘
            │                          │
┌───────────▼──────────┐   ┌──────────▼──────────────────┐
│   ETL Pipeline       │   │   Analytics Service          │
│   ─────────────────  │   │   ──────────────────────     │
│   Extract (CSV/JSON) │   │   Revenue trend queries      │
│   Transform (Pandas) │   │   Category breakdowns        │
│   └ 9-step cleaning  │   │   Top N aggregations         │
│   Load (PostgreSQL)  │   │   Monthly growth calc        │
└───────────┬──────────┘   └──────────┬──────────────────┘
            │                          │
┌───────────▼──────────────────────────▼──────────────────┐
│               PostgreSQL Database                         │
│   customers · products · orders · upload_history        │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Option A — Docker (recommended)

```bash
git clone https://github.com/ManaazirRayyaan/dataflow.git
cd dataflow

# Copy environment config
cp .env.example .env

# Start all services
docker compose up --build

# Open in browser
# Dashboard:  http://localhost:3000
# API docs:   http://localhost:8000/docs
```

### Option B — Local development

**Backend:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

# Set environment variable
export DATABASE_URL=postgresql://dataflow:dataflow@localhost:5432/dataflow_db

# Start PostgreSQL (if not using Docker)
docker run -d --name pg \
  -e POSTGRES_USER=dataflow \
  -e POSTGRES_PASSWORD=dataflow \
  -e POSTGRES_DB=dataflow_db \
  -p 5432:5432 postgres:16-alpine

# Run API
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## Importing Your First Dataset

### Option 1 — Generate sample data

```bash
# Install Pandas if not already installed
pip install pandas numpy

python generate_sample_data.py --rows 2000

# Upload via the dashboard Upload page, or via API:
curl -X POST http://localhost:8000/api/upload \
  -F "file=@sample_sales_data.csv"
```

### Option 2 — Superstore dataset (Kaggle)

1. Download from: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final
2. Upload `Sample - Superstore.csv` via the Upload page
3. The pipeline automatically maps Superstore column names

### Option 3 — Any sales CSV

The pipeline normalizes column names automatically. These all work:

| Your column | Recognized as |
|-------------|--------------|
| `Sales`, `Revenue` | `revenue` |
| `Order Date`, `OrderDate` | `order_date` |
| `Customer Name`, `Customer` | `customer_name` |
| `Sub-Category`, `SubCategory` | `sub_category` |
| `Unit Price`, `Price` | `unit_price` |

---

## ETL Pipeline — 9 Transformation Steps

The pipeline in `backend/app/pipeline/etl.py` applies these steps in order:

| Step | Operation |
|------|-----------|
| 1 | Normalize column names to snake_case |
| 2 | Remove duplicate records (by order_id) |
| 3 | Reject rows missing critical fields; fill optional nulls |
| 4 | Strip whitespace; remove "nan" string artefacts |
| 5 | Parse and standardize dates (supports multiple formats) |
| 6 | Strip currency symbols; validate and clip numeric ranges |
| 7 | Normalize category names (title-case; alias variants) |
| 8 | Generate derived columns (revenue, profit, profit_margin) |
| 9 | Cap outliers using IQR × 3 method |

---

## API Reference

Interactive docs available at `http://localhost:8000/docs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload CSV or JSON dataset |
| GET | `/api/upload/history` | Paginated upload history |
| GET | `/api/dashboard` | KPI summary for dashboard |
| GET | `/api/analytics/revenue` | Revenue trend (monthly/daily) |
| GET | `/api/analytics/categories` | Sales by category |
| GET | `/api/analytics/regions` | Revenue by region |
| GET | `/api/analytics/top-products` | Top N products |
| GET | `/api/analytics/top-customers` | Top N customers |
| GET | `/api/orders` | Paginated orders (search, filter, sort) |
| GET | `/api/orders/{id}` | Single order detail |
| GET | `/api/customers` | Paginated customers |
| GET | `/api/products` | Paginated products |
| GET | `/health` | Health check |

---

## Project Structure

```
dataflow/
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── upload.py       ← Upload endpoint + history
│   │   │   ├── analytics.py    ← Dashboard + analytics endpoints
│   │   │   └── data.py         ← Orders, customers, products
│   │   ├── pipeline/
│   │   │   ├── etl.py          ← 9-step Pandas transform pipeline
│   │   │   └── loader.py       ← PostgreSQL batch loader
│   │   ├── models/
│   │   │   └── models.py       ← SQLAlchemy ORM models
│   │   ├── schemas/
│   │   │   └── schemas.py      ← Pydantic request/response schemas
│   │   ├── services/
│   │   │   └── analytics_service.py  ← SQL aggregation queries
│   │   ├── database/
│   │   │   └── connection.py   ← Engine, session, Base
│   │   └── main.py             ← FastAPI app entry point
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/         ← Recharts wrappers
│   │   │   ├── DataTable.jsx   ← Paginated sortable table
│   │   │   ├── KPICard.jsx     ← Metric card with trend
│   │   │   ├── Sidebar.jsx
│   │   │   └── Header.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Upload.jsx
│   │   ├── services/api.js     ← Axios API layer
│   │   └── App.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── Dockerfile
│
├── generate_sample_data.py     ← Creates test CSV with realistic messiness
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Portfolio Notes

This project demonstrates:

- **Python data engineering**: 9-step Pandas ETL pipeline handling real-world data quality issues
- **FastAPI**: REST API with Pydantic validation, dependency injection, OpenAPI docs
- **PostgreSQL**: Normalized relational schema with proper foreign keys
- **SQLAlchemy**: ORM with relationship loading and aggregation queries
- **React**: Component architecture with custom hooks, routing, and state management
- **Recharts**: Interactive area, bar, and pie charts with custom tooltips
- **Docker**: Multi-service Compose setup with health checks and service dependencies
