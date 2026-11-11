#pragma once
#include "models/InventoryMovement.hpp"
#include <vector>
#include <optional>
#include <string>

class DatabaseConnection;

struct InventorySummary {
    int totalMovements = 0;
    int totalAdditions = 0;
    int totalReductions = 0;
    int totalSales = 0;
    int totalAdjustments = 0;
};

class InventoryRepository {
private:
    DatabaseConnection& db;

public:
    explicit InventoryRepository(DatabaseConnection& conn) : db(conn) {}

    int recordMovement(int productId,
                       MovementType type,
                       int quantityChange,
                       int previousStock,
                       int newStock,
                       const std::string& reason = "",
                       std::optional<int> relatedBillId = std::nullopt);

    std::vector<InventoryMovement> getMovementsByProduct(int productId);
    std::vector<InventoryMovement> getMovementsByBill(int billId);
    std::vector<InventoryMovement> getRecentMovements(int limit = 50, int offset = 0);
    int getTotalCount();
    InventorySummary getSummary();
};
