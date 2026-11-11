#pragma once
#include <string>
#include <optional>
#include <algorithm>
#include <cctype>

enum class MovementType {
    ADDITION,
    REDUCTION,
    SALE,
    ADJUSTMENT
};

inline std::string movementTypeToString(MovementType type) {
    switch (type) {
        case MovementType::ADDITION: return "ADDITION";
        case MovementType::REDUCTION: return "REDUCTION";
        case MovementType::SALE: return "SALE";
        case MovementType::ADJUSTMENT: return "ADJUSTMENT";
    }
    return "ADJUSTMENT";
}

inline std::optional<MovementType> tryParseMovementType(const std::string& str) {
    std::string upper = str;
    std::transform(upper.begin(), upper.end(), upper.begin(),
                   [](unsigned char c) { return static_cast<char>(std::toupper(c)); });
    if (upper == "ADDITION") return MovementType::ADDITION;
    if (upper == "REDUCTION") return MovementType::REDUCTION;
    if (upper == "SALE") return MovementType::SALE;
    if (upper == "ADJUSTMENT") return MovementType::ADJUSTMENT;
    return std::nullopt;
}

inline MovementType stringToMovementType(const std::string& str) {
    return tryParseMovementType(str).value_or(MovementType::ADJUSTMENT);
}

struct InventoryMovement {
    int id = 0;
    int productId = 0;
    MovementType movementType = MovementType::ADJUSTMENT;
    int quantityChange = 0;
    int previousStock = 0;
    int newStock = 0;
    std::string reason;
    std::optional<int> relatedBillId = std::nullopt;
    std::string createdAt;

    InventoryMovement() = default;
    InventoryMovement(int id,
                      int productId,
                      MovementType type,
                      int qtyChange,
                      int prevStock,
                      int nextStock,
                      const std::string& reason = "",
                      std::optional<int> billId = std::nullopt,
                      const std::string& timestamp = "")
        : id(id),
          productId(productId),
          movementType(type),
          quantityChange(qtyChange),
          previousStock(prevStock),
          newStock(nextStock),
          reason(reason),
          relatedBillId(billId),
          createdAt(timestamp) {}
};
