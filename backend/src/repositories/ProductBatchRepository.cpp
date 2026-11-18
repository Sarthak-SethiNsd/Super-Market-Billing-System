#include "repositories/ProductBatchRepository.hpp"
#include "database/DatabaseConnection.hpp"
#include "database/PreparedStatement.hpp"
#include "utils/Exceptions.hpp"
#include <algorithm>

int ProductBatchRepository::addBatch(int productId, const std::string& batchNumber, int quantity, const std::string& expiryDate) {
    if (productId <= 0) {
        throw std::invalid_argument("Product ID must be positive");
    }
    if (quantity <= 0) {
        throw InvalidQuantityException("Batch quantity must be positive");
    }

    PreparedStatement stmt(db, R"(
        INSERT INTO product_batches (product_id, batch_number, quantity, expiry_date)
        VALUES (?, ?, ?, ?);
    )");
    stmt.bind(1, productId);
    stmt.bind(2, batchNumber);
    stmt.bind(3, quantity);
    stmt.bind(4, expiryDate);
    stmt.execute();
    return static_cast<int>(db.getLastInsertRowId());
}

std::vector<ProductBatch> ProductBatchRepository::getBatchesByProductId(int productId) {
    PreparedStatement stmt(db, R"(
        SELECT id, product_id, batch_number, quantity, expiry_date, created_at
        FROM product_batches
        WHERE product_id = ?
        ORDER BY expiry_date ASC, id ASC;
    )");
    stmt.bind(1, productId);
    std::vector<ProductBatch> list;
    while (stmt.step()) {
        list.emplace_back(stmt.getInt(0), stmt.getInt(1), stmt.getString(2),
                          stmt.getInt(3), stmt.getString(4), stmt.getString(5));
    }
    return list;
}

std::vector<ProductBatch> ProductBatchRepository::getActiveBatchesFEFO(int productId) {
    PreparedStatement stmt(db, R"(
        SELECT id, product_id, batch_number, quantity, expiry_date, created_at
        FROM product_batches
        WHERE product_id = ? AND quantity > 0
        ORDER BY expiry_date ASC, id ASC;
    )");
    stmt.bind(1, productId);
    std::vector<ProductBatch> list;
    while (stmt.step()) {
        list.emplace_back(stmt.getInt(0), stmt.getInt(1), stmt.getString(2),
                          stmt.getInt(3), stmt.getString(4), stmt.getString(5));
    }
    return list;
}

std::string ProductBatchRepository::getNearestExpiryDate(int productId) {
    // 1. Try earliest unexpired batch with positive stock
    PreparedStatement stmt(db, R"(
        SELECT expiry_date
        FROM product_batches
        WHERE product_id = ? AND quantity > 0 AND expiry_date >= DATE('now')
        ORDER BY expiry_date ASC
        LIMIT 1;
    )");
    stmt.bind(1, productId);
    if (stmt.step() && !stmt.isNull(0)) {
        return stmt.getString(0);
    }

    // 2. Fallback to any remaining batch with positive stock
    PreparedStatement stmt2(db, R"(
        SELECT expiry_date
        FROM product_batches
        WHERE product_id = ? AND quantity > 0
        ORDER BY expiry_date ASC
        LIMIT 1;
    )");
    stmt2.bind(1, productId);
    if (stmt2.step() && !stmt2.isNull(0)) {
        return stmt2.getString(0);
    }

    // 3. Fallback to any remaining batch regardless of quantity
    PreparedStatement stmt3(db, R"(
        SELECT expiry_date
        FROM product_batches
        WHERE product_id = ?
        ORDER BY expiry_date ASC
        LIMIT 1;
    )");
    stmt3.bind(1, productId);
    if (stmt3.step() && !stmt3.isNull(0)) {
        return stmt3.getString(0);
    }

    return "";
}

void ProductBatchRepository::updateProductNearestExpiry(int productId) {
    std::string nearest = getNearestExpiryDate(productId);
    if (!nearest.empty()) {
        PreparedStatement stmt(db, "UPDATE products SET expiry_date = ? WHERE id = ?;");
        stmt.bind(1, nearest);
        stmt.bind(2, productId);
        stmt.execute();
    }
}

void ProductBatchRepository::deductStockFEFO(int productId, int quantityToDeduct) {
    if (quantityToDeduct < 0) {
        throw InvalidQuantityException("Deduction quantity cannot be negative");
    }
    if (quantityToDeduct == 0) return;

    PreparedStatement countStmt(db, "SELECT COUNT(*) FROM product_batches WHERE product_id = ?;");
    countStmt.bind(1, productId);
    if (countStmt.step() && countStmt.getInt(0) == 0) {
        return;
    }

    auto activeBatches = getActiveBatchesFEFO(productId);
    int remaining = quantityToDeduct;

    // First pass: deduct from non-expired batches (FEFO)
    for (auto& batch : activeBatches) {
        if (remaining <= 0) break;
        if (batch.isExpired()) continue;

        int deductFromThis = std::min(batch.getQuantity(), remaining);
        int newQty = batch.getQuantity() - deductFromThis;

        PreparedStatement updateStmt(db, "UPDATE product_batches SET quantity = ? WHERE id = ?;");
        updateStmt.bind(1, newQty);
        updateStmt.bind(2, batch.getId());
        updateStmt.execute();

        remaining -= deductFromThis;
    }

    // Second pass fallback: if still remaining and allowed
    if (remaining > 0) {
        for (auto& batch : activeBatches) {
            if (remaining <= 0) break;
            if (!batch.isExpired()) continue;

            int deductFromThis = std::min(batch.getQuantity(), remaining);
            int newQty = batch.getQuantity() - deductFromThis;

            PreparedStatement updateStmt(db, "UPDATE product_batches SET quantity = ? WHERE id = ?;");
            updateStmt.bind(1, newQty);
            updateStmt.bind(2, batch.getId());
            updateStmt.execute();

            remaining -= deductFromThis;
        }
    }

    updateProductNearestExpiry(productId);
}

int ProductBatchRepository::getTotalBatchStock(int productId) {
    PreparedStatement stmt(db, "SELECT COALESCE(SUM(quantity), 0) FROM product_batches WHERE product_id = ?;");
    stmt.bind(1, productId);
    if (stmt.step()) {
        return stmt.getInt(0);
    }
    return 0;
}

bool ProductBatchRepository::removeBatch(int batchId) {
    PreparedStatement stmt(db, "DELETE FROM product_batches WHERE id = ?;");
    stmt.bind(1, batchId);
    stmt.execute();
    return db.getChanges() > 0;
}
