#include "repositories/InventoryRepository.hpp"
#include "database/DatabaseConnection.hpp"
#include "database/PreparedStatement.hpp"

int InventoryRepository::recordMovement(int productId,
                                        MovementType type,
                                        int quantityChange,
                                        int previousStock,
                                        int newStock,
                                        const std::string& reason,
                                        std::optional<int> relatedBillId) {
    PreparedStatement stmt(db, R"(
        INSERT INTO inventory_movements (product_id, movement_type, quantity_change,
                                        previous_stock, new_stock, reason, related_bill_id)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    )");

    stmt.bind(1, productId);
    stmt.bind(2, movementTypeToString(type));
    stmt.bind(3, quantityChange);
    stmt.bind(4, previousStock);
    stmt.bind(5, newStock);
    if (!reason.empty()) {
        stmt.bind(6, reason);
    } else {
        stmt.bindNull(6);
    }
    stmt.bind(7, relatedBillId);

    stmt.execute();
    return static_cast<int>(db.getLastInsertRowId());
}

std::vector<InventoryMovement> InventoryRepository::getMovementsByProduct(int productId) {
    std::vector<InventoryMovement> list;
    PreparedStatement stmt(db, R"(
        SELECT id, product_id, movement_type, quantity_change, previous_stock,
               new_stock, reason, related_bill_id, created_at
        FROM inventory_movements
        WHERE product_id = ?
        ORDER BY created_at DESC;
    )");
    stmt.bind(1, productId);

    while (stmt.step()) {
        list.emplace_back(stmt.getInt(0),
                          stmt.getInt(1),
                          stringToMovementType(stmt.getString(2)),
                          stmt.getInt(3),
                          stmt.getInt(4),
                          stmt.getInt(5),
                          stmt.getString(6),
                          stmt.getOptionalInt(7),
                          stmt.getString(8));
    }
    return list;
}

std::vector<InventoryMovement> InventoryRepository::getMovementsByBill(int billId) {
    std::vector<InventoryMovement> list;
    PreparedStatement stmt(db, R"(
        SELECT id, product_id, movement_type, quantity_change, previous_stock,
               new_stock, reason, related_bill_id, created_at
        FROM inventory_movements
        WHERE related_bill_id = ?
        ORDER BY created_at ASC;
    )");
    stmt.bind(1, billId);

    while (stmt.step()) {
        list.emplace_back(stmt.getInt(0),
                          stmt.getInt(1),
                          stringToMovementType(stmt.getString(2)),
                          stmt.getInt(3),
                          stmt.getInt(4),
                          stmt.getInt(5),
                          stmt.getString(6),
                          stmt.getOptionalInt(7),
                          stmt.getString(8));
    }
    return list;
}

std::vector<InventoryMovement> InventoryRepository::getRecentMovements(int limit, int offset) {
    std::vector<InventoryMovement> list;
    PreparedStatement stmt(db, R"(
        SELECT id, product_id, movement_type, quantity_change, previous_stock,
               new_stock, reason, related_bill_id, created_at
        FROM inventory_movements
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
    )");
    stmt.bind(1, limit);
    stmt.bind(2, offset);

    while (stmt.step()) {
        list.emplace_back(stmt.getInt(0),
                          stmt.getInt(1),
                          stringToMovementType(stmt.getString(2)),
                          stmt.getInt(3),
                          stmt.getInt(4),
                          stmt.getInt(5),
                          stmt.getString(6),
                          stmt.getOptionalInt(7),
                          stmt.getString(8));
    }
    return list;
}

int InventoryRepository::getTotalCount() {
    PreparedStatement stmt(db, "SELECT COUNT(*) FROM inventory_movements;");
    if (stmt.step()) {
        return stmt.getInt(0);
    }
    return 0;
}

InventorySummary InventoryRepository::getSummary() {
    InventorySummary summary;
    PreparedStatement stmt(db, R"(
        SELECT
            COUNT(*),
            COALESCE(SUM(CASE WHEN movement_type = 'ADDITION' THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN movement_type = 'REDUCTION' THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN movement_type = 'SALE' THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN movement_type = 'ADJUSTMENT' THEN 1 ELSE 0 END), 0)
        FROM inventory_movements;
    )");
    if (stmt.step()) {
        summary.totalMovements = stmt.getInt(0);
        summary.totalAdditions = stmt.getInt(1);
        summary.totalReductions = stmt.getInt(2);
        summary.totalSales = stmt.getInt(3);
        summary.totalAdjustments = stmt.getInt(4);
    }
    return summary;
}
