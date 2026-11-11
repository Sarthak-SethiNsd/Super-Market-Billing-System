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
    }
}
