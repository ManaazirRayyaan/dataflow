#!/usr/bin/env python3
"""
DataFlow Sample Dataset Generator
===================================
Generates a realistic sales CSV (~2,000 rows) for testing the ETL pipeline.
Intentionally includes the kinds of messiness the pipeline is built to handle:
  - Mixed case category names
  - Currency symbols in price columns
  - Various date formats
  - ~5% missing values
  - A handful of duplicates
  - Whitespace in string fields

Usage:
    python generate_sample_data.py
    python generate_sample_data.py --rows 5000 --out my_sales.csv
"""

import argparse
import random
import string
from datetime import date, timedelta

import numpy as np
import pandas as pd


PRODUCTS = [
    ("Staples",                    "Office Supplies", "Fasteners",    2.99),
    ("Avery Binders",              "Office Supplies", "Binders",      12.49),
    ("Xerox 1967",                 "Office Supplies", "Paper",        6.75),
    ("Canon PC1080F Copier",       "Technology",      "Copiers",      499.00),
    ("Apple iPhone 14",            "Technology",      "Phones",       799.99),
    ("Dell XPS 15 Laptop",         "Technology",      "Machines",     1249.00),
    ("Cisco TelePresence",         "Technology",      "Phones",       3999.00),
    ("Hon 5400 Series Chair",      "Furniture",       "Chairs",       210.00),
    ("Bush Somerset Bookcase",     "Furniture",       "Bookcases",    145.99),
    ("Ikea Galant Desk",           "Furniture",       "Tables",       320.50),
    ("Acco 5-Section Folders",     "Office Supplies", "Storage",      4.25),
    ("Logitech MX Master Mouse",   "Technology",      "Accessories",  89.99),
    ("Samsung 27in Monitor",       "Technology",      "Machines",     349.00),
    ("Eldon File Cart",            "Office Supplies", "Storage",      22.99),
    ("Fellowes PB500 Binder",      "Office Supplies", "Binders",      199.00),
]

CUSTOMERS = [
    ("Claire Gute",       "Consumer",    "Henderson",   "Kentucky",     "United States"),
    ("Darrin Van Huff",   "Corporate",   "Los Angeles", "California",   "United States"),
    ("Sean O'Donnell",    "Consumer",    "Fort Lauderdale", "Florida",  "United States"),
    ("Brosina Hoffman",   "Consumer",    "Los Angeles", "California",   "United States"),
    ("Andrew Allen",      "Consumer",    "Concord",     "North Carolina","United States"),
    ("Irene Maddox",      "Consumer",    "Seattle",     "Washington",   "United States"),
    ("Harold Pawlan",     "Home Office", "Fort Worth",  "Texas",        "United States"),
    ("Pete Kriz",         "Consumer",    "Madison",     "Wisconsin",    "United States"),
    ("Alejandro Grove",   "Consumer",    "West Jordan", "Utah",         "United States"),
    ("Zuschuss Donatelli","Corporate",   "San Francisco","California",  "United States"),
    ("Neil French",       "Corporate",   "Dover",       "Delaware",     "United States"),
    ("Julia West",        "Home Office", "Charlotte",   "North Carolina","United States"),
    ("Ranjit Bhatia",     "Consumer",    "Houston",     "Texas",        "United States"),
    ("Priya Kumaran",     "Corporate",   "Austin",      "Texas",        "United States"),
    ("Ahmed Hassan",      "Consumer",    "New York",    "New York",     "United States"),
]

REGIONS = ["East", "West", "Central", "South"]
SALESPERSONS = ["Anna", "Bob", "Carlos", "Diana", "Ethan", "Farah"]
PAYMENT_METHODS = ["Credit Card", "Debit Card", "Net 30", "PayPal", "Bank Transfer"]
SHIP_MODES = ["Standard Class", "Second Class", "First Class", "Same Day"]

# Messy category names the pipeline should normalize
CATEGORY_VARIANTS = {
    "Office Supplies": ["Office Supplies", "office supplies", "OFFICE SUPPLIES", "Office supplies "],
    "Technology":      ["Technology", "technology", "TECHNOLOGY", " Technology"],
    "Furniture":       ["Furniture", "furniture", "FURNITURE"],
}

# Unambiguous formats — avoids day/month confusion in parser
DATE_FORMATS = ["%Y-%m-%d", "%m/%d/%Y", "%B %d, %Y", "%b %d, %Y"]


def random_date(start_year: int = 2021, end_year: int = 2024) -> date:
    start = date(start_year, 1, 1)
    end = date(end_year, 12, 31)
    return start + timedelta(days=random.randint(0, (end - start).days))


def generate_order_id(n: int) -> str:
    year = random.randint(2021, 2024)
    return f"CA-{year}-{n:06d}"


def generate(n_rows: int, seed: int = 42) -> pd.DataFrame:
    random.seed(seed)
    np.random.seed(seed)

    rows = []
    for i in range(1, n_rows + 1):
        customer = random.choice(CUSTOMERS)
        product = random.choice(PRODUCTS)
        qty = random.randint(1, 15)
        base_price = product[3]

        # Occasional currency symbol (messy data)
        if random.random() < 0.15:
            price_str = f"${base_price:.2f}"
        else:
            price_str = round(base_price * random.uniform(0.9, 1.1), 2)

        discount = round(random.choice([0, 0, 0, 0.1, 0.2, 0.3]), 2)
        revenue = round(qty * float(str(price_str).replace("$", "")) * (1 - discount), 2)

        order_date = random_date()
        ship_date = order_date + timedelta(days=random.randint(2, 7))

        # Vary date format (messiness)
        fmt = random.choice(DATE_FORMATS)
        order_date_str = order_date.strftime(fmt)

        # Messy category name
        cat_clean = product[2] if product[2] in ("Chairs", "Bookcases") else product[1]
        # Try to pick a variant
        variants = CATEGORY_VARIANTS.get(cat_clean, [cat_clean])
        cat_display = random.choice(variants)

        rows.append({
            "Order ID":       generate_order_id(i),
            "Customer Name":  customer[0],
            "Segment":        customer[1],
            "City":           customer[2],
            "State":          customer[3],
            "Country":        customer[4],
            "Region":         random.choice(REGIONS),
            "Product Name":   product[0],
            "Category":       cat_display,
            "Sub-Category":   product[2],
            "Quantity":       qty,
            "Unit Price":     price_str,
            "Discount":       discount,
            "Sales":          revenue,    # Intentionally named 'Sales' not 'Revenue'
            "Salesperson":    random.choice(SALESPERSONS),
            "Order Date":     order_date_str,
            "Ship Date":      ship_date.strftime("%Y-%m-%d"),
            "Ship Mode":      random.choice(SHIP_MODES),
            "Payment":        random.choice(PAYMENT_METHODS),
        })

    df = pd.DataFrame(rows)

    # ── Inject messiness ──────────────────────────────────────────────

    # ~5% missing values in non-critical columns
    for col in ["Region", "Salesperson", "Payment", "Discount"]:
        mask = np.random.random(len(df)) < 0.05
        df.loc[mask, col] = np.nan

    # ~2% missing critical values (should be rejected)
    mask = np.random.random(len(df)) < 0.02
    df.loc[mask, "Customer Name"] = np.nan

    # ~1% duplicates (same Order ID)
    n_dupes = max(1, int(n_rows * 0.01))
    dupe_indices = np.random.choice(df.index, n_dupes, replace=False)
    dupes = df.loc[dupe_indices].copy()
    df = pd.concat([df, dupes], ignore_index=True).sample(frac=1, random_state=seed).reset_index(drop=True)

    return df


def main():
    parser = argparse.ArgumentParser(description="Generate a sample sales dataset")
    parser.add_argument("--rows",  type=int, default=2000, help="Number of rows (default: 2000)")
    parser.add_argument("--out",   type=str, default="sample_sales_data.csv", help="Output filename")
    parser.add_argument("--seed",  type=int, default=42, help="Random seed")
    args = parser.parse_args()

    print(f"Generating {args.rows:,} row dataset…")
    df = generate(args.rows, args.seed)
    df.to_csv(args.out, index=False)
    print(f"✓ Saved {len(df):,} rows (incl. dupes/nulls) → {args.out}")
    print(f"  Columns: {', '.join(df.columns.tolist())}")


if __name__ == "__main__":
    main()
