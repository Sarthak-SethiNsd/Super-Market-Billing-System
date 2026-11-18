#pragma once
#include "database/DatabaseConnection.hpp"
#include <string>
#include <vector>
#include <unordered_map>
#include <optional>
#include <cstdint>

struct CartReservationItem {
    int id;
    std::string sessionId;
    int productId;
    std::string productName;
    std::string sku;
    int quantity;
    int64_t expiresAt;
    int remainingSeconds;
};

class ProductReservationRepository {
private:
    DatabaseConnection& db;

public:
    explicit ProductReservationRepository(DatabaseConnection& conn) : db(conn) {}

    // Clean expired reservations from database
    int cleanExpired();

    // Get total reserved units for a specific product
    int getReservedStock(int productId, const std::string& excludeSessionId = "");

    // Get bulk map of productId -> total reserved units across all active sessions
    std::unordered_map<int, int> getAllReservedStock(const std::string& excludeSessionId = "");

    // Reserve quantity for a session with TTL. Returns true if feasible, false if insufficient stock.
    // outAvailable receives the maximum available units that can be reserved by this session.
    bool reserve(const std::string& sessionId, int productId, int quantity, int ttlSeconds, int& outAvailable);

    // Release reservation for a specific session and product
    bool release(const std::string& sessionId, int productId);

    // Release all reservations for a session
    int clearSession(const std::string& sessionId);

    // Retrieve active reservations for a session
    std::vector<CartReservationItem> getSessionReservations(const std::string& sessionId);
};
