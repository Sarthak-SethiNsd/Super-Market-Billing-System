#include "repositories/ProductRepository.hpp"
#include "database/DatabaseConnection.hpp"
#include "database/PreparedStatement.hpp"
#include "models/Discount.hpp"
#include <stdexcept>

std::shared_ptr<Product> ProductRepository::rowToProduct(PreparedStatement& stmt) {
    int id = stmt.getInt(0);
    std::string sku = stmt.getString(1);
    std::string name = stmt.getString(2);
    int brandId = stmt.getInt(3);
    int categoryId = stmt.getInt(4);
    std::string productTypeStr = stmt.getString(5);
    int64_t priceInPaise = stmt.getInt64(6);
    int stock = stmt.getInt(7);
    std::string expiry = stmt.getString(8);
    std::string discountTypeStr = stmt.getString(9);
    double discountValue = stmt.getDouble(10);

    // Build discount strategy
    std::shared_ptr<IDiscountStrategy> discount = nullptr;
    if (discountTypeStr == "PERCENTAGE") {
        discount = std::make_shared<PercentageDiscount>(discountValue);
    } else if (discountTypeStr == "FIXED") {
        discount = std::make_shared<FixedAmountDiscount>(static_cast<int64_t>(discountValue));
    } else {
        discount = std::make_shared<NoDiscount>();
    }

    if (productTypeStr == "PERISHABLE") {
        return std::make_shared<Perishable>(id, sku, name, brandId, categoryId, priceInPaise, stock, expiry, discount);
    } else {
        return std::make_shared<NonPerishable>(id, sku, name, brandId, categoryId, priceInPaise, stock, discount);
    }
}

int ProductRepository::insert(const Product& product) {
    std::string productTypeStr = (product.getType() == ProductType::PERISHABLE) ? "PERISHABLE" : "NON_PERISHABLE";
    std::string expiryStr = "";
    if (product.getType() == ProductType::PERISHABLE) {
        const auto* per = dynamic_cast<const Perishable*>(&product);
        if (per) {
            expiryStr = per->getExpiry();
        }
    }

    std::string discountTypeStr = "NONE";
    double discountValue = 0.0;
    auto strategy = product.getDiscount();
    if (strategy) {
        if (strategy->getType() == DiscountType::PERCENTAGE) {
            discountTypeStr = "PERCENTAGE";
            discountValue = strategy->getValue();
        } else if (strategy->getType() == DiscountType::FIXED) {
            discountTypeStr = "FIXED";
            discountValue = static_cast<double>(dynamic_cast<FixedAmountDiscount*>(strategy.get())->getAmountInPaise());
        }
    }

    PreparedStatement stmt(db, R"(
        INSERT INTO products (sku, name, brand_id, category_id, product_type, price_in_paise,
                              stock, expiry_date, discount_type, discount_value, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);
    )");

    stmt.bind(1, product.getSku());
    stmt.bind(2, product.getName());
    stmt.bind(3, product.getBrandId());
    stmt.bind(4, product.getCategoryId());
    stmt.bind(5, productTypeStr);
    stmt.bind(6, product.getPriceInPaise());
    stmt.bind(7, product.getStock());
    if (!expiryStr.empty()) {
        stmt.bind(8, expiryStr);
    } else {
        stmt.bindNull(8);
    }
    stmt.bind(9, discountTypeStr);
    stmt.bind(10, discountValue);

    stmt.execute();
    return static_cast<int>(db.getLastInsertRowId());
}

std::optional<std::shared_ptr<Product>> ProductRepository::findById(int id) {
    PreparedStatement stmt(db, R"(
        SELECT id, sku, name, brand_id, category_id, product_type, price_in_paise,
               stock, expiry_date, discount_type, discount_value, is_active
        FROM products
        WHERE id = ?;
    )");
    stmt.bind(1, id);

    if (stmt.step()) {
        return rowToProduct(stmt);
    }
    return std::nullopt;
}

std::optional<std::shared_ptr<Product>> ProductRepository::findBySku(const std::string& sku) {
    PreparedStatement stmt(db, R"(
        SELECT id, sku, name, brand_id, category_id, product_type, price_in_paise,
               stock, expiry_date, discount_type, discount_value, is_active
        FROM products
        WHERE sku = ?;
    )");
    stmt.bind(1, sku);

    if (stmt.step()) {
        return rowToProduct(stmt);
    }
    return std::nullopt;
}

bool ProductRepository::isActive(int productId) {
    PreparedStatement stmt(db, "SELECT is_active FROM products WHERE id = ?;");
    stmt.bind(1, productId);
    if (stmt.step()) {
        return stmt.getInt(0) != 0;
    }
    return false;
}

std::vector<std::shared_ptr<Product>> ProductRepository::getAll(bool activeOnly) {
    std::string sql = R"(
        SELECT id, sku, name, brand_id, category_id, product_type, price_in_paise,
               stock, expiry_date, discount_type, discount_value, is_active
        FROM products
    )";
    if (activeOnly) {
        sql += " WHERE is_active = 1 ";
    }
    sql += " ORDER BY name ASC;";

    PreparedStatement stmt(db, sql);
    std::vector<std::shared_ptr<Product>> list;
    while (stmt.step()) {
        list.push_back(rowToProduct(stmt));
    }
    return list;
}

bool ProductRepository::update(const Product& product) {
    std::string productTypeStr = (product.getType() == ProductType::PERISHABLE) ? "PERISHABLE" : "NON_PERISHABLE";
    std::string expiryStr = "";
    if (product.getType() == ProductType::PERISHABLE) {
        const auto* per = dynamic_cast<const Perishable*>(&product);
        if (per) {
            expiryStr = per->getExpiry();
        }
    }

    std::string discountTypeStr = "NONE";
    double discountValue = 0.0;
    auto strategy = product.getDiscount();
    if (strategy) {
        if (strategy->getType() == DiscountType::PERCENTAGE) {
            discountTypeStr = "PERCENTAGE";
            discountValue = strategy->getValue();
        } else if (strategy->getType() == DiscountType::FIXED) {
            discountTypeStr = "FIXED";
            discountValue = static_cast<double>(dynamic_cast<FixedAmountDiscount*>(strategy.get())->getAmountInPaise());
        }
    }

    PreparedStatement stmt(db, R"(
        UPDATE products
        SET sku = ?, name = ?, brand_id = ?, category_id = ?, product_type = ?,
            price_in_paise = ?, stock = ?, expiry_date = ?, discount_type = ?,
            discount_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
    )");

    stmt.bind(1, product.getSku());
    stmt.bind(2, product.getName());
    stmt.bind(3, product.getBrandId());
    stmt.bind(4, product.getCategoryId());
    stmt.bind(5, productTypeStr);
    stmt.bind(6, product.getPriceInPaise());
    stmt.bind(7, product.getStock());
    if (!expiryStr.empty()) {
        stmt.bind(8, expiryStr);
    } else {
        stmt.bindNull(8);
    }
    stmt.bind(9, discountTypeStr);
    stmt.bind(10, discountValue);
    stmt.bind(11, product.getId());

    stmt.execute();
    return db.getChanges() > 0;
}

bool ProductRepository::updateStock(int productId, int newStock) {
    if (newStock < 0) {
        throw std::invalid_argument("Stock quantity cannot be negative");
    }

    PreparedStatement stmt(db, "UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;");
    stmt.bind(1, newStock);
    stmt.bind(2, productId);
    stmt.execute();
    return db.getChanges() > 0;
}

bool ProductRepository::softDelete(int productId) {
    PreparedStatement stmt(db, "UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?;");
    stmt.bind(1, productId);
    stmt.execute();
    return db.getChanges() > 0;
}

std::vector<std::shared_ptr<Product>> ProductRepository::search(const std::string& query,
                                                              std::optional<int> brandId,
                                                              std::optional<int> categoryId) {
    std::string sql = R"(
        SELECT id, sku, name, brand_id, category_id, product_type, price_in_paise,
               stock, expiry_date, discount_type, discount_value, is_active
        FROM products
        WHERE is_active = 1
    )";

    if (!query.empty()) {
        sql += " AND (name LIKE ? OR sku LIKE ?) ";
    }
    if (brandId.has_value()) {
        sql += " AND brand_id = ? ";
    }
    if (categoryId.has_value()) {
        sql += " AND category_id = ? ";
    }
    sql += " ORDER BY name ASC;";

    PreparedStatement stmt(db, sql);
    int bindIndex = 1;
    if (!query.empty()) {
        std::string pattern = "%" + query + "%";
        stmt.bind(bindIndex++, pattern);
        stmt.bind(bindIndex++, pattern);
    }
    if (brandId.has_value()) {
        stmt.bind(bindIndex++, *brandId);
    }
    if (categoryId.has_value()) {
        stmt.bind(bindIndex++, *categoryId);
    }

    std::vector<std::shared_ptr<Product>> list;
    while (stmt.step()) {
        list.push_back(rowToProduct(stmt));
    }
    return list;
}

ProductSummary ProductRepository::getSummary() {
    ProductSummary summary;
    PreparedStatement stmt(db, R"(
        SELECT
            COUNT(*),
            COALESCE(SUM(stock), 0),
            COALESCE(SUM(CASE WHEN stock <= 5 AND stock > 0 THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END), 0)
        FROM products
        WHERE is_active = 1;
    )");
    if (stmt.step()) {
        summary.totalActiveProducts = stmt.getInt(0);
        summary.totalStockUnits = stmt.getInt(1);
        summary.lowStockCount = stmt.getInt(2);
        summary.outOfStockCount = stmt.getInt(3);
    }
    return summary;
}
