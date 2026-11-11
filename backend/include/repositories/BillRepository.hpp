#pragma once
#include "models/Bill.hpp"
#include <vector>
#include <optional>
#include <string>
#include <cstdint>

class DatabaseConnection;

struct BillItemRecord {
    int id = 0;
    int billId = 0;
    std::optional<int> productId = std::nullopt;
    std::string productName;
    std::string brandName;
    int64_t unitPricePaise = 0;
    std::string discountType;
    double discountValue = 0.0;
    int64_t unitDiscountPaise = 0;
    int64_t finalUnitPricePaise = 0;
    int quantity = 0;
    int64_t lineTotalPaise = 0;

    double getFinalUnitPriceInRupees() const {
        return static_cast<double>(finalUnitPricePaise) / 100.0;
    }
    double getLineTotalInRupees() const {
        return static_cast<double>(lineTotalPaise) / 100.0;
    }
};

struct BillRecord {
    int id = 0;
    std::string billNumber;
    int64_t subtotalPaise = 0;
    int64_t totalDiscountPaise = 0;
    int64_t finalAmountPaise = 0;
    std::string createdAt;
    std::vector<BillItemRecord> items;

    double getSubtotalInRupees() const {
        return static_cast<double>(subtotalPaise) / 100.0;
    }
    double getTotalDiscountInRupees() const {
        return static_cast<double>(totalDiscountPaise) / 100.0;
    }
    double getFinalAmountInRupees() const {
        return static_cast<double>(finalAmountPaise) / 100.0;
    }
};

struct BillSummary {
    int totalBills = 0;
    int64_t totalGrossPaise = 0;
    int64_t totalDiscountPaise = 0;
    int64_t totalNetPaise = 0;
    int totalUnitsSold = 0;

    double getTotalGrossInRupees() const {
        return static_cast<double>(totalGrossPaise) / 100.0;
    }
    double getTotalDiscountInRupees() const {
        return static_cast<double>(totalDiscountPaise) / 100.0;
    }
    double getTotalNetInRupees() const {
        return static_cast<double>(totalNetPaise) / 100.0;
    }
};

class BillRepository {
private:
    DatabaseConnection& db;

    std::vector<BillItemRecord> getItemsForBill(int billId);

public:
    explicit BillRepository(DatabaseConnection& conn) : db(conn) {}

    int saveBill(const std::string& billNumber, const Bill& bill);
    std::optional<BillRecord> findById(int id);
    std::optional<BillRecord> findByBillNumber(const std::string& billNumber);
    std::vector<BillRecord> getRecentBills(int limit = 50, int offset = 0);
    int getTotalCount();
    BillSummary getSummary();
};
