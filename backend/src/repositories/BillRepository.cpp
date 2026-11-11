#include "repositories/BillRepository.hpp"
#include "database/DatabaseConnection.hpp"
#include "database/PreparedStatement.hpp"
#include "database/Transaction.hpp"
#include <stdexcept>
#include <unordered_map>

std::vector<BillItemRecord> BillRepository::getItemsForBill(int billId) {
    std::vector<BillItemRecord> list;
    PreparedStatement stmt(db, R"(
        SELECT id, bill_id, product_id, product_name, brand_name, unit_price_paise,
               discount_type, discount_value, unit_discount_paise, final_unit_price_paise,
               quantity, line_total_paise
        FROM bill_items
        WHERE bill_id = ?
        ORDER BY id ASC;
    )");
    stmt.bind(1, billId);

    while (stmt.step()) {
        BillItemRecord r;
        r.id = stmt.getInt(0);
        r.billId = stmt.getInt(1);
        r.productId = stmt.getOptionalInt(2);
        r.productName = stmt.getString(3);
        r.brandName = stmt.getString(4);
        r.unitPricePaise = stmt.getInt64(5);
        r.discountType = stmt.getString(6);
        r.discountValue = stmt.getDouble(7);
        r.unitDiscountPaise = stmt.getInt64(8);
        r.finalUnitPricePaise = stmt.getInt64(9);
        r.quantity = stmt.getInt(10);
        r.lineTotalPaise = stmt.getInt64(11);
        list.push_back(r);
    }
    return list;
}

int BillRepository::saveBill(const std::string& billNumber, const Bill& bill) {
    if (bill.isEmpty()) {
        throw std::invalid_argument("Cannot save an empty bill");
    }

    Transaction tx(db);

    // 1. Aggregate total requested quantity per product and verify active status & stock
    std::unordered_map<int, int> requestedByProduct;
    for (const auto& item : bill.getItems()) {
        if (item.getProductId() > 0) {
            requestedByProduct[item.getProductId()] += item.getQuantity();
        }
    }

    for (const auto& [prodId, totalRequested] : requestedByProduct) {
        PreparedStatement checkStmt(db, "SELECT stock, name, is_active FROM products WHERE id = ?;");
        checkStmt.bind(1, prodId);
        if (!checkStmt.step()) {
            throw std::runtime_error("Product not found for ID: " + std::to_string(prodId));
        }

        int currentStock = checkStmt.getInt(0);
        std::string prodName = checkStmt.getString(1);
        int isActive = checkStmt.getInt(2);

        if (isActive == 0) {
            throw std::runtime_error("Cannot sell inactive or deleted product '" + prodName + "'");
        }
        if (currentStock < totalRequested) {
            throw std::runtime_error("Insufficient stock for product '" + prodName +
                                     "'. Available: " + std::to_string(currentStock) +
                                     ", Requested: " + std::to_string(totalRequested));
        }
    }

    // 2. Insert into bills table
    PreparedStatement billStmt(db, R"(
        INSERT INTO bills (bill_number, subtotal_paise, total_discount_paise, final_amount_paise)
        VALUES (?, ?, ?, ?);
    )");
    billStmt.bind(1, billNumber);
    billStmt.bind(2, bill.getSubtotalInPaise());
    billStmt.bind(3, bill.getTotalDiscountInPaise());
    billStmt.bind(4, bill.getFinalAmountInPaise());
    billStmt.execute();

    int billId = static_cast<int>(db.getLastInsertRowId());

    // 3. Insert bill items and deduct stock
    for (const auto& item : bill.getItems()) {
        std::string brandName = "Standard";
        int currentStock = 0;

        if (item.getProductId() > 0) {
            PreparedStatement brandStmt(db, R"(
                SELECT b.name, p.stock
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.id
                WHERE p.id = ?;
            )");
            brandStmt.bind(1, item.getProductId());
            if (brandStmt.step()) {
                if (!brandStmt.isNull(0)) {
                    brandName = brandStmt.getString(0);
                }
                currentStock = brandStmt.getInt(1);
            }
        }

        std::string discountType = (item.getUnitDiscountInPaise() > 0) ? "APPLIED" : "NONE";
        double discountValue = static_cast<double>(item.getUnitDiscountInPaise());

        PreparedStatement itemStmt(db, R"(
            INSERT INTO bill_items (bill_id, product_id, product_name, brand_name, unit_price_paise,
                                    discount_type, discount_value, unit_discount_paise,
                                    final_unit_price_paise, quantity, line_total_paise)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        )");

        itemStmt.bind(1, billId);
        if (item.getProductId() > 0) {
            itemStmt.bind(2, item.getProductId());
        } else {
            itemStmt.bindNull(2);
        }
        itemStmt.bind(3, item.getName());
        itemStmt.bind(4, brandName);
        itemStmt.bind(5, item.getUnitPriceInPaise());
        itemStmt.bind(6, discountType);
        itemStmt.bind(7, discountValue);
        itemStmt.bind(8, item.getUnitDiscountInPaise());
        itemStmt.bind(9, item.getFinalUnitPriceInPaise());
        itemStmt.bind(10, item.getQuantity());
        itemStmt.bind(11, item.lineFinalTotalInPaise());
        itemStmt.execute();

        // Deduct inventory and record movement atomically with stock guard
        if (item.getProductId() > 0) {
            int newStock = currentStock - item.getQuantity();

            PreparedStatement updateStockStmt(db, "UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND stock >= ? AND is_active = 1;");
            updateStockStmt.bind(1, item.getQuantity());
            updateStockStmt.bind(2, item.getProductId());
            updateStockStmt.bind(3, item.getQuantity());
            updateStockStmt.execute();
            if (db.getChanges() == 0) {
                throw std::runtime_error("Concurrent stock conflict for product ID: " + std::to_string(item.getProductId()));
            }

            PreparedStatement moveStmt(db, R"(
                INSERT INTO inventory_movements (product_id, movement_type, quantity_change,
                                                previous_stock, new_stock, reason, related_bill_id)
                VALUES (?, 'SALE', ?, ?, ?, ?, ?);
            )");
            moveStmt.bind(1, item.getProductId());
            moveStmt.bind(2, -item.getQuantity());
            moveStmt.bind(3, currentStock);
            moveStmt.bind(4, newStock);
            moveStmt.bind(5, "Checkout sale for invoice: " + billNumber);
            moveStmt.bind(6, billId);
            moveStmt.execute();
        }
    }

    tx.commit();
    return billId;
}

std::optional<BillRecord> BillRepository::findById(int id) {
    PreparedStatement stmt(db, R"(
        SELECT id, bill_number, subtotal_paise, total_discount_paise, final_amount_paise, created_at
        FROM bills
        WHERE id = ?;
    )");
    stmt.bind(1, id);

    if (stmt.step()) {
        BillRecord record;
        record.id = stmt.getInt(0);
        record.billNumber = stmt.getString(1);
        record.subtotalPaise = stmt.getInt64(2);
        record.totalDiscountPaise = stmt.getInt64(3);
        record.finalAmountPaise = stmt.getInt64(4);
        record.createdAt = stmt.getString(5);
        record.items = getItemsForBill(record.id);
        return record;
    }
    return std::nullopt;
}

std::optional<BillRecord> BillRepository::findByBillNumber(const std::string& billNumber) {
    PreparedStatement stmt(db, R"(
        SELECT id, bill_number, subtotal_paise, total_discount_paise, final_amount_paise, created_at
        FROM bills
        WHERE bill_number = ?;
    )");
    stmt.bind(1, billNumber);

    if (stmt.step()) {
        BillRecord record;
        record.id = stmt.getInt(0);
        record.billNumber = stmt.getString(1);
        record.subtotalPaise = stmt.getInt64(2);
        record.totalDiscountPaise = stmt.getInt64(3);
        record.finalAmountPaise = stmt.getInt64(4);
        record.createdAt = stmt.getString(5);
        record.items = getItemsForBill(record.id);
        return record;
    }
    return std::nullopt;
}

std::vector<BillRecord> BillRepository::getRecentBills(int limit, int offset) {
    std::vector<BillRecord> list;
    PreparedStatement stmt(db, R"(
        SELECT id, bill_number, subtotal_paise, total_discount_paise, final_amount_paise, created_at
        FROM bills
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
    )");
    stmt.bind(1, limit);
    stmt.bind(2, offset);

    while (stmt.step()) {
        BillRecord record;
        record.id = stmt.getInt(0);
        record.billNumber = stmt.getString(1);
        record.subtotalPaise = stmt.getInt64(2);
        record.totalDiscountPaise = stmt.getInt64(3);
        record.finalAmountPaise = stmt.getInt64(4);
        record.createdAt = stmt.getString(5);
        record.items = getItemsForBill(record.id);
        list.push_back(record);
    }
    return list;
}

int BillRepository::getTotalCount() {
    PreparedStatement stmt(db, "SELECT COUNT(*) FROM bills;");
    if (stmt.step()) {
        return stmt.getInt(0);
    }
    return 0;
}

BillSummary BillRepository::getSummary() {
    BillSummary summary;
    PreparedStatement stmt(db, R"(
        SELECT
            COUNT(*),
            COALESCE(SUM(subtotal_paise), 0),
            COALESCE(SUM(total_discount_paise), 0),
            COALESCE(SUM(final_amount_paise), 0)
        FROM bills;
    )");
    if (stmt.step()) {
        summary.totalBills = stmt.getInt(0);
        summary.totalGrossPaise = stmt.getInt64(1);
        summary.totalDiscountPaise = stmt.getInt64(2);
        summary.totalNetPaise = stmt.getInt64(3);
    }
    PreparedStatement itemsStmt(db, "SELECT COALESCE(SUM(quantity), 0) FROM bill_items;");
    if (itemsStmt.step()) {
        summary.totalUnitsSold = itemsStmt.getInt(0);
    }
    return summary;
}
