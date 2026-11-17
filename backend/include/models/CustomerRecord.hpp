#pragma once
#include <string>
#include <optional>
#include <cstdint>

/**
 * @brief Domain representation of a registered supermarket customer.
 * Supports loyalty tracking, lifetime statistics, and immutable receipt snapshots.
 */
struct CustomerRecord {
    int id = 0;
    std::string customerCode;
    std::string fullName;
    std::string phone;
    std::string email;
    bool isActive = true;
    std::string createdAt;
    std::string updatedAt;

    // Derived telemetry & analytics
    int totalPurchases = 0;
    int64_t lifetimeSpentPaise = 0;
    std::string lastPurchaseDate;

    double getLifetimeSpentInRupees() const {
        return static_cast<double>(lifetimeSpentPaise) / 100.0;
    }
};
