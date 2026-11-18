#!/usr/bin/env python3
"""
Supermarket Management System — Demonstration Dataset Seeder (Stage 9J)
Safely seeds a realistic Indian supermarket demonstration dataset into the local SQLite database.

Features:
- 100% Idempotent: Can be run repeatedly without duplicating products or inventory movements.
- Transactional: Rolls back on any error.
- Preserves existing records: Does not delete, truncate, or overwrite existing data.
- Safe: Restricts target path to local database files only.
"""

import os
import sys
import sqlite3
import hashlib
import binascii
import secrets
from typing import List, Dict, Any, Optional

DEFAULT_DB_PATH = os.environ.get(
    "DB_PATH",
    os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..",
        "backend",
        "data",
        "supermarket.db"
    )
)

# 24 Representative Indian Supermarket Products across 7 Core Categories
DEMO_PRODUCTS: List[Dict[str, Any]] = [
    # 1. Grains & Staples (Non-Perishable)
    {
        "sku": "SKU-GRAIN-001",
        "name": "Aashirvaad Superior MP Sharbati Whole Wheat Atta 5kg",
        "brand": "Aashirvaad",
        "category": "Grains & Staples",
        "type": "NON_PERISHABLE",
        "price_paise": 29500,  # Rs. 295.00
        "stock": 40,
        "expiry": None,
        "discount_type": "NONE",
        "discount_val": 0.0
    },
    {
        "sku": "SKU-GRAIN-002",
        "name": "India Gate Basmati Rice Classic 5kg",
        "brand": "India Gate",
        "category": "Grains & Staples",
        "type": "NON_PERISHABLE",
        "price_paise": 62500,  # Rs. 625.00
        "stock": 25,
        "expiry": None,
        "discount_type": "PERCENTAGE",
        "discount_val": 10.0
    },
    {
        "sku": "SKU-GRAIN-003",
        "name": "Tata Sampann Unpolished Toor Dal 1kg",
        "brand": "Tata Sampann",
        "category": "Grains & Staples",
        "type": "NON_PERISHABLE",
        "price_paise": 18500,  # Rs. 185.00
        "stock": 35,
        "expiry": None,
        "discount_type": "NONE",
        "discount_val": 0.0
    },
    {
        "sku": "SKU-GRAIN-004",
        "name": "Fortune Sunlite Refined Sunflower Oil 1L Pouch",
        "brand": "Fortune",
        "category": "Grains & Staples",
        "type": "NON_PERISHABLE",
        "price_paise": 14500,  # Rs. 145.00
        "stock": 50,
        "expiry": None,
        "discount_type": "FIXED",
        "discount_val": 1000.0  # Rs. 10.00 off
    },

    # 2. Dairy & Chilled (Perishable)
    {
        "sku": "SKU-DAIRY-001",
        "name": "Amul Taaza Homogenised Toned Milk 1L",
        "brand": "Amul",
        "category": "Dairy & Chilled",
        "type": "PERISHABLE",
        "price_paise": 5600,   # Rs. 56.00
        "stock": 60,
        "expiry": "2026-12-05",
        "discount_type": "NONE",
        "discount_val": 0.0
    },
    {
        "sku": "SKU-DAIRY-002",
        "name": "Amul Salted Pasteurised Butter 500g",
        "brand": "Amul",
        "category": "Dairy & Chilled",
        "type": "PERISHABLE",
        "price_paise": 27500,  # Rs. 275.00
        "stock": 30,
        "expiry": "2027-04-15",
        "discount_type": "PERCENTAGE",
        "discount_val": 5.0
    },
    {
        "sku": "SKU-DAIRY-003",
        "name": "Amul Malai Fresh Paneer 200g",
        "brand": "Amul",
        "category": "Dairy & Chilled",
        "type": "PERISHABLE",
        "price_paise": 9200,   # Rs. 92.00
        "stock": 18,
        "expiry": "2026-11-28",
        "discount_type": "NONE",
        "discount_val": 0.0
    },
    {
        "sku": "SKU-DAIRY-004",
        "name": "Mother Dairy Classic Dahi 400g Cup",
        "brand": "Mother Dairy",
        "category": "Dairy & Chilled",
        "type": "PERISHABLE",
        "price_paise": 4500,   # Rs. 45.00
        "stock": 22,
        "expiry": "2026-11-25",
        "discount_type": "NONE",
        "discount_val": 0.0
    },

    # 3. Snacks & Confectionery (Non-Perishable)
    {
        "sku": "SKU-SNACK-001",
        "name": "Haldiram's Nagpur Aloo Bhujia 400g",
        "brand": "Haldiram's",
        "category": "Snacks & Confectionery",
        "type": "NON_PERISHABLE",
        "price_paise": 11500,  # Rs. 115.00
        "stock": 45,
        "expiry": None,
        "discount_type": "PERCENTAGE",
        "discount_val": 10.0
    },
    {
        "sku": "SKU-SNACK-002",
        "name": "Haldiram's Gulab Jamun Tin 1kg",
        "brand": "Haldiram's",
        "category": "Snacks & Confectionery",
        "type": "NON_PERISHABLE",
        "price_paise": 24000,  # Rs. 240.00
        "stock": 20,
        "expiry": None,
        "discount_type": "NONE",
        "discount_val": 0.0
    },
    {
        "sku": "SKU-SNACK-003",
        "name": "Britannia Good Day Butter Cookies 600g Value Pack",
        "brand": "Britannia",
        "category": "Snacks & Confectionery",
        "type": "NON_PERISHABLE",
        "price_paise": 13000,  # Rs. 130.00
        "stock": 55,
        "expiry": None,
        "discount_type": "FIXED",
        "discount_val": 1500.0 # Rs. 15.00 off
    },
    {
        "sku": "SKU-SNACK-004",
        "name": "Parle-G Original Glucose Biscuits 800g Family Pack",
        "brand": "Parle",
        "category": "Snacks & Confectionery",
        "type": "NON_PERISHABLE",
        "price_paise": 7500,   # Rs. 75.00
        "stock": 70,
        "expiry": None,
        "discount_type": "NONE",
        "discount_val": 0.0
    },

    # 4. Beverages (Non-Perishable & Perishable)
    {
        "sku": "SKU-BEV-001",
        "name": "Tata Tea Premium Desh Ki Chai 500g",
        "brand": "Tata Tea",
        "category": "Beverages",
        "type": "NON_PERISHABLE",
        "price_paise": 26000,  # Rs. 260.00
        "stock": 40,
        "expiry": None,
        "discount_type": "PERCENTAGE",
        "discount_val": 5.0
    },
    {
        "sku": "SKU-BEV-002",
        "name": "Bru Instant Coffee Chicory Mixture 200g Jar",
        "brand": "Bru",
        "category": "Beverages",
        "type": "NON_PERISHABLE",
        "price_paise": 34000,  # Rs. 340.00
        "stock": 25,
        "expiry": None,
        "discount_type": "NONE",
        "discount_val": 0.0
    },
    {
        "sku": "SKU-BEV-003",
        "name": "Real Fruit Power Mixed Fruit Juice 1L",
        "brand": "Real",
        "category": "Beverages",
        "type": "PERISHABLE",
        "price_paise": 12000,  # Rs. 120.00
        "stock": 30,
        "expiry": "2027-02-10",
        "discount_type": "PERCENTAGE",
        "discount_val": 10.0
    },

    # 5. Personal Care (Non-Perishable)
    {
        "sku": "SKU-CARE-001",
        "name": "Dettol Original Germ Protection Bathing Soap (125g x 4)",
        "brand": "Dettol",
        "category": "Personal Care",
        "type": "NON_PERISHABLE",
        "price_paise": 19800,  # Rs. 198.00
        "stock": 35,
        "expiry": None,
        "discount_type": "PERCENTAGE",
        "discount_val": 8.0
    },
    {
        "sku": "SKU-CARE-002",
        "name": "Colgate Strong Teeth Dental Cream Toothpaste 300g",
        "brand": "Colgate",
        "category": "Personal Care",
        "type": "NON_PERISHABLE",
        "price_paise": 15500,  # Rs. 155.00
        "stock": 40,
        "expiry": None,
        "discount_type": "NONE",
        "discount_val": 0.0
    },
    {
        "sku": "SKU-CARE-003",
        "name": "Head & Shoulders Anti-Dandruff Cool Menthol Shampoo 340ml",
        "brand": "Head & Shoulders",
        "category": "Personal Care",
        "type": "NON_PERISHABLE",
        "price_paise": 38000,  # Rs. 380.00
        "stock": 15,
        "expiry": None,
        "discount_type": "FIXED",
        "discount_val": 3000.0 # Rs. 30.00 off
    },

    # 6. Household Essentials (Non-Perishable)
    {
        "sku": "SKU-HOME-001",
        "name": "Surf Excel Quick Wash Detergent Powder 2kg",
        "brand": "Surf Excel",
        "category": "Household Essentials",
        "type": "NON_PERISHABLE",
        "price_paise": 39000,  # Rs. 390.00
        "stock": 30,
        "expiry": None,
        "discount_type": "PERCENTAGE",
        "discount_val": 12.0
    },
    {
        "sku": "SKU-HOME-002",
        "name": "Vim Dishwash Gel Lemon 750ml Bottle",
        "brand": "Vim",
        "category": "Household Essentials",
        "type": "NON_PERISHABLE",
        "price_paise": 15500,  # Rs. 155.00
        "stock": 45,
        "expiry": None,
        "discount_type": "NONE",
        "discount_val": 0.0
    },
    {
        "sku": "SKU-HOME-003",
        "name": "Harpic Power Plus Disinfectant Toilet Cleaner 1L",
        "brand": "Harpic",
        "category": "Household Essentials",
        "type": "NON_PERISHABLE",
        "price_paise": 19500,  # Rs. 195.00
        "stock": 28,
        "expiry": None,
        "discount_type": "NONE",
        "discount_val": 0.0
    },

    # 7. Fresh Fruits & Vegetables (Perishable, including Low-Stock Example)
    {
        "sku": "SKU-FRESH-001",
        "name": "Fresh Shimla Royal Delicious Apples 1kg Pack",
        "brand": "Fresh Farm Direct",
        "category": "Fruits & Vegetables",
        "type": "PERISHABLE",
        "price_paise": 18000,  # Rs. 180.00
        "stock": 25,
        "expiry": "2026-11-26",
        "discount_type": "PERCENTAGE",
        "discount_val": 10.0
    },
    {
        "sku": "SKU-FRESH-002",
        "name": "Fresh Robusta Bananas 1 Dozen",
        "brand": "Fresh Farm Direct",
        "category": "Fruits & Vegetables",
        "type": "PERISHABLE",
        "price_paise": 6000,   # Rs. 60.00
        "stock": 30,
        "expiry": "2026-11-20",
        "discount_type": "NONE",
        "discount_val": 0.0
    },
    {
        "sku": "SKU-FRESH-003",
        "name": "Fresh Hybrid Tomatoes 1kg Net Bag",
        "brand": "Fresh Farm Direct",
        "category": "Fruits & Vegetables",
        "type": "PERISHABLE",
        "price_paise": 3800,   # Rs. 38.00
        "stock": 40,
        "expiry": "2026-11-22",
        "discount_type": "NONE",
        "discount_val": 0.0
    },
    {
        "sku": "SKU-FRESH-004",
        "name": "Fresh Organic Baby Spinach Palak 250g Bunch",
        "brand": "Fresh Farm Direct",
        "category": "Fruits & Vegetables",
        "type": "PERISHABLE",
        "price_paise": 2500,   # Rs. 25.00
        "stock": 3,            # Low-stock demo item (< 5 units)
        "expiry": "2026-11-19",
        "discount_type": "NONE",
        "discount_val": 0.0
    }
]

def hash_password_pbkdf2(password: str, salt_hex: str, iterations: int = 100000) -> str:
    salt = binascii.unhexlify(salt_hex)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations, dklen=32)
    return binascii.hexlify(dk).decode('ascii')

def seed_database(db_path: str):
    print("=================================================================")
    print("   SUPERMARKET MANAGEMENT SYSTEM — DEMO DATASET SEEDER (STAGE 9J)")
    print("=================================================================")

    # Strict Safety Check
    if db_path.startswith("http://") or db_path.startswith("https://") or db_path.startswith("//"):
        print(f"[SECURITY ERROR] Remote database targets are forbidden: {db_path}", file=sys.stderr)
        sys.exit(1)

    norm_path = os.path.normpath(os.path.abspath(db_path))
    print(f"[INFO] Target database path: {norm_path}")

    parent_dir = os.path.dirname(norm_path)
    if parent_dir and not os.path.exists(parent_dir):
        os.makedirs(parent_dir, exist_ok=True)
        print(f"[INFO] Created parent directory: {parent_dir}")

    conn = sqlite3.connect(norm_path)
    cur = conn.cursor()

    # Enable foreign keys
    cur.execute("PRAGMA foreign_keys = ON;")

    # Check that required schema tables exist
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    existing_tables = set(row[0] for row in cur.fetchall())
    required_tables = {'brands', 'categories', 'products', 'inventory_movements', 'users'}
    missing = required_tables - existing_tables
    if missing:
        print(f"[DATABASE ERROR] Database is missing tables: {missing}. Run migrations first.", file=sys.stderr)
        conn.close()
        sys.exit(1)

    brands_inserted = 0
    brands_skipped = 0
    categories_inserted = 0
    categories_skipped = 0
    products_inserted = 0
    products_skipped = 0
    stock_units_seeded = 0
    admin_created = False

    try:
        # Atomic Transaction
        cur.execute("BEGIN TRANSACTION;")

        # 1. Staff User check
        cur.execute("SELECT id FROM users WHERE username = 'admin' OR role = 'STAFF';")
        if not cur.fetchone():
            salt_hex = secrets.token_hex(16)
            pwd_hash = hash_password_pbkdf2("Staff@123", salt_hex, 100000)
            cur.execute("""
                INSERT INTO users (username, password_hash, salt, iterations, role)
                VALUES ('admin', ?, ?, 100000, 'STAFF');
            """, (pwd_hash, salt_hex))
            admin_created = True
            print("[AUTH] Default staff account provisioned.")
        else:
            print("[AUTH] Existing staff account detected. Preserved untouched.")

        # 2. Seed Categories
        for p in DEMO_PRODUCTS:
            cur.execute("SELECT id FROM categories WHERE name = ?;", (p["category"],))
            if not cur.fetchone():
                cur.execute("INSERT INTO categories (name) VALUES (?);", (p["category"],))
                categories_inserted += 1
            else:
                categories_skipped += 1

        # 3. Seed Brands
        for p in DEMO_PRODUCTS:
            cur.execute("SELECT id FROM brands WHERE name = ?;", (p["brand"],))
            if not cur.fetchone():
                cur.execute("INSERT INTO brands (name) VALUES (?);", (p["brand"],))
                brands_inserted += 1
            else:
                brands_skipped += 1

        # 4. Seed Products
        for p in DEMO_PRODUCTS:
            cur.execute("SELECT id FROM products WHERE sku = ?;", (p["sku"],))
            if cur.fetchone():
                products_skipped += 1
                continue

            # Look up brand and category IDs
            cur.execute("SELECT id FROM brands WHERE name = ?;", (p["brand"],))
            brand_id = cur.fetchone()[0]

            cur.execute("SELECT id FROM categories WHERE name = ?;", (p["category"],))
            category_id = cur.fetchone()[0]

            cur.execute("""
                INSERT INTO products (sku, name, brand_id, category_id, product_type,
                                      price_in_paise, stock, expiry_date, discount_type,
                                      discount_value, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);
            """, (
                p["sku"],
                p["name"],
                brand_id,
                category_id,
                p["type"],
                p["price_paise"],
                p["stock"],
                p["expiry"],
                p["discount_type"],
                p["discount_val"]
            ))
            product_id = cur.lastrowid

            # Record initial inventory intake movement
            if p["stock"] > 0:
                cur.execute("""
                    INSERT INTO inventory_movements (product_id, movement_type, quantity_change,
                                                     previous_stock, new_stock, reason)
                    VALUES (?, 'ADDITION', ?, 0, ?, 'Initial demonstration inventory intake');
                """, (product_id, p["stock"], p["stock"]))
                stock_units_seeded += p["stock"]

            products_inserted += 1

        conn.commit()

        print("\n================ SEEDING REPORT ================")
        print(f"Categories: {categories_inserted} inserted, {categories_skipped} already existing (skipped)")
        print(f"Brands:     {brands_inserted} inserted, {brands_skipped} already existing (skipped)")
        print(f"Products:   {products_inserted} inserted, {products_skipped} already existing (skipped)")
        print(f"Stock Units: {stock_units_seeded} total units recorded in inventory movements")
        print(f"Staff User: {'Created' if admin_created else 'Existing preserved'}")
        print("Status:     TRANSACTION COMMITTED SUCCESSFULLY")
        print("=================================================")

    except Exception as e:
        conn.rollback()
        print(f"\n[SEEDER FATAL] Seeding failed and was completely rolled back: {e}", file=sys.stderr)
        conn.close()
        sys.exit(1)

    conn.close()

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DB_PATH
    seed_database(target)
