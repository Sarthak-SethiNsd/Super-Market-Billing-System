#include "database/DatabaseMigrator.hpp"
#include "database/DatabaseConnection.hpp"
#include "database/PreparedStatement.hpp"
#include "database/Transaction.hpp"
#include <iostream>

int DatabaseMigrator::getCurrentVersion(DatabaseConnection& conn) {
    PreparedStatement stmt(conn, "PRAGMA user_version;");
    if (stmt.step()) {
        return stmt.getInt(0);
    }
    return 0;
}

void DatabaseMigrator::setVersion(DatabaseConnection& conn, int version) {
    conn.execute("PRAGMA user_version = " + std::to_string(version) + ";");
}

void DatabaseMigrator::migrate(DatabaseConnection& conn) {
    int currentVersion = getCurrentVersion(conn);

    if (currentVersion < 1) {
        Transaction tx(conn);

        // 1. Brands Table
        conn.execute(R"(
            CREATE TABLE IF NOT EXISTS brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        )");

        // 2. Categories Table
        conn.execute(R"(
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        )");

        // 3. Products Table
        conn.execute(R"(
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sku TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                brand_id INTEGER NOT NULL,
                category_id INTEGER NOT NULL,
                product_type TEXT NOT NULL CHECK (product_type IN ('PERISHABLE', 'NON_PERISHABLE')),
                price_in_paise INTEGER NOT NULL CHECK (price_in_paise >= 0),
                stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
                expiry_date TEXT,
                discount_type TEXT NOT NULL DEFAULT 'NONE' CHECK (discount_type IN ('NONE', 'PERCENTAGE', 'FIXED')),
                discount_value REAL NOT NULL DEFAULT 0.0 CHECK (discount_value >= 0),
                is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
            );
        )");

        // 4. Bills Table
        conn.execute(R"(
            CREATE TABLE IF NOT EXISTS bills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bill_number TEXT NOT NULL UNIQUE,
                subtotal_paise INTEGER NOT NULL CHECK (subtotal_paise >= 0),
                total_discount_paise INTEGER NOT NULL CHECK (total_discount_paise >= 0),
                final_amount_paise INTEGER NOT NULL CHECK (final_amount_paise >= 0),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        )");

        // 5. Bill Items Table (Historical Snapshot)
        conn.execute(R"(
            CREATE TABLE IF NOT EXISTS bill_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bill_id INTEGER NOT NULL,
                product_id INTEGER,
                product_name TEXT NOT NULL,
                brand_name TEXT NOT NULL,
                unit_price_paise INTEGER NOT NULL,
                discount_type TEXT NOT NULL,
                discount_value REAL NOT NULL,
                unit_discount_paise INTEGER NOT NULL,
                final_unit_price_paise INTEGER NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity > 0),
                line_total_paise INTEGER NOT NULL CHECK (line_total_paise >= 0),
                FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
            );
        )");

        // 6. Inventory Movements Table
        conn.execute(R"(
            CREATE TABLE IF NOT EXISTS inventory_movements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                movement_type TEXT NOT NULL CHECK (movement_type IN ('ADDITION', 'REDUCTION', 'SALE', 'ADJUSTMENT')),
                quantity_change INTEGER NOT NULL,
                previous_stock INTEGER NOT NULL,
                new_stock INTEGER NOT NULL,
                reason TEXT,
                related_bill_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
                FOREIGN KEY (related_bill_id) REFERENCES bills(id) ON DELETE SET NULL
            );
        )");

        // 7. Indexes for Query Performance
        conn.execute("CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_bills_number ON bills(bill_number);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_bills_created ON bills(created_at);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_bill_items_product ON bill_items(product_id);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_movements_product ON inventory_movements(product_id);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_movements_bill ON inventory_movements(related_bill_id);");

        tx.commit();
        setVersion(conn, 1);
        currentVersion = 1;
    }

    if (currentVersion < 2) {
        Transaction tx(conn);

        // 8. Users & Credentials Table (Stage 3)
        conn.execute(R"(
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                iterations INTEGER NOT NULL DEFAULT 100000,
                role TEXT NOT NULL CHECK (role IN ('ADMIN', 'STAFF')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        )");

        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);");

        tx.commit();
        setVersion(conn, 2);
        currentVersion = 2;
    }

    if (currentVersion < 3) {
        Transaction tx(conn);

        // 9. Customers Table (Stage 10I)
        conn.execute(R"(
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_code TEXT NOT NULL UNIQUE,
                full_name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        )");

        conn.execute("CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(full_name);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);");

        // 10. Evolve Bills Table to link customers with historical snapshot columns
        conn.execute("ALTER TABLE bills ADD COLUMN customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;");
        conn.execute("ALTER TABLE bills ADD COLUMN customer_name TEXT;");
        conn.execute("ALTER TABLE bills ADD COLUMN customer_phone TEXT;");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_bills_customer ON bills(customer_id);");

        // 11. System Metadata Table for Idempotent Seed Tracking
        conn.execute(R"(
            CREATE TABLE IF NOT EXISTS system_metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        )");

        tx.commit();
        setVersion(conn, 3);
        currentVersion = 3;
    }

    if (currentVersion < 4) {
        Transaction tx(conn);

        // 12. Category-Brands Junction Table (Stage 10L)
        conn.execute(R"(
            CREATE TABLE IF NOT EXISTS category_brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                brand_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
                UNIQUE(category_id, brand_id)
            );
        )");

        conn.execute("CREATE INDEX IF NOT EXISTS idx_category_brands_category ON category_brands(category_id);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_category_brands_brand ON category_brands(brand_id);");

        // Seed existing associations from current products
        conn.execute(R"(
            INSERT OR IGNORE INTO category_brands (category_id, brand_id)
            SELECT DISTINCT category_id, brand_id FROM products WHERE category_id IS NOT NULL AND brand_id IS NOT NULL;
        )");

        // Ensure demonstration categories (expanding taxonomy to 10 categories)
        conn.execute("INSERT OR IGNORE INTO categories (name) VALUES ('Milk');");
        conn.execute("INSERT OR IGNORE INTO categories (name) VALUES ('Peas');");
        conn.execute("INSERT OR IGNORE INTO categories (name) VALUES ('Bakery & Breads');");

        // Ensure demonstration brands
        conn.execute("INSERT OR IGNORE INTO brands (name) VALUES ('Safal');");
        conn.execute("INSERT OR IGNORE INTO brands (name) VALUES ('ITC Master Chef');");
        conn.execute("INSERT OR IGNORE INTO brands (name) VALUES ('Godrej Yummiez');");

        // Associate Milk (4 brands: Amul, Mother Dairy, Pure Organics, Britannia)
        conn.execute(R"(
            INSERT OR IGNORE INTO category_brands (category_id, brand_id)
            SELECT c.id, b.id FROM categories c, brands b
            WHERE c.name = 'Milk' AND b.name IN ('Amul', 'Mother Dairy', 'Pure Organics', 'Britannia');
        )");

        // Associate Peas (5 brands: Safal, Fresh Farm Direct, Mother Dairy, ITC Master Chef, Godrej Yummiez)
        conn.execute(R"(
            INSERT OR IGNORE INTO category_brands (category_id, brand_id)
            SELECT c.id, b.id FROM categories c, brands b
            WHERE c.name = 'Peas' AND b.name IN ('Safal', 'Fresh Farm Direct', 'Mother Dairy', 'ITC Master Chef', 'Godrej Yummiez');
        )");

        // Associate Bakery & Breads (2 brands: Britannia, Parle)
        conn.execute(R"(
            INSERT OR IGNORE INTO category_brands (category_id, brand_id)
            SELECT c.id, b.id FROM categories c, brands b
            WHERE c.name = 'Bakery & Breads' AND b.name IN ('Britannia', 'Parle');
        )");

        tx.commit();
        setVersion(conn, 4);
        currentVersion = 4;
    }

    if (currentVersion < 5) {
        Transaction tx(conn);

        // 13. Product Batches Table (Multiple Expiry Dates & FEFO Support)
        conn.execute(R"(
            CREATE TABLE IF NOT EXISTS product_batches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                batch_number TEXT NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity >= 0),
                expiry_date TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );
        )");

        conn.execute("CREATE INDEX IF NOT EXISTS idx_batches_product ON product_batches(product_id);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_batches_expiry ON product_batches(expiry_date);");

        // Seed initial batches from existing perishable products
        conn.execute(R"(
            INSERT INTO product_batches (product_id, batch_number, quantity, expiry_date)
            SELECT id, 'BATCH-' || id || '-INITIAL', stock, expiry_date
            FROM products
            WHERE product_type = 'PERISHABLE' AND expiry_date IS NOT NULL AND expiry_date != '' AND stock > 0;
        )");

        // 14. Price & Discount History Table (Daily Editing & Audit Trail)
        conn.execute(R"(
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                old_price_paise INTEGER NOT NULL,
                new_price_paise INTEGER NOT NULL,
                old_discount_type TEXT NOT NULL,
                new_discount_type TEXT NOT NULL,
                old_discount_value REAL NOT NULL,
                new_discount_value REAL NOT NULL,
                notes TEXT,
                changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );
        )");

        conn.execute("CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);");
        conn.execute("CREATE INDEX IF NOT EXISTS idx_price_history_time ON price_history(changed_at);");

        tx.commit();
        setVersion(conn, 5);
        currentVersion = 5;
    }
}
