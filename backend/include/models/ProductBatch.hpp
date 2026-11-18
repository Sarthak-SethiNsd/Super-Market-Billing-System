#pragma once
#include <string>
#include <ctime>
#include <iomanip>
#include <sstream>

class ProductBatch {
private:
    int id;
    int productId;
    std::string batchNumber;
    int quantity;
    std::string expiryDate; // YYYY-MM-DD
    std::string createdAt;

public:
    ProductBatch(int id, int productId, const std::string& batchNumber,
                 int quantity, const std::string& expiryDate, const std::string& createdAt = "")
        : id(id), productId(productId), batchNumber(batchNumber),
          quantity(quantity), expiryDate(expiryDate), createdAt(createdAt) {}

    int getId() const { return id; }
    int getProductId() const { return productId; }
    const std::string& getBatchNumber() const { return batchNumber; }
    int getQuantity() const { return quantity; }
    const std::string& getExpiryDate() const { return expiryDate; }
    const std::string& getCreatedAt() const { return createdAt; }

    void setQuantity(int q) { quantity = q; }

    bool isExpired() const {
        if (expiryDate.empty()) return false;
        std::time_t t = std::time(nullptr);
        std::tm* now = std::localtime(&t);
        char buf[32];
        std::strftime(buf, sizeof(buf), "%Y-%m-%d", now);
        std::string today(buf);
        return expiryDate < today;
    }

    int getDaysUntilExpiry() const {
        if (expiryDate.empty()) return 999999;
        std::tm expTm = {};
        std::istringstream ss(expiryDate);
        ss >> std::get_time(&expTm, "%Y-%m-%d");
        if (ss.fail()) return 999999;

        std::time_t t = std::time(nullptr);
        std::tm* now = std::localtime(&t);
        now->tm_hour = 0; now->tm_min = 0; now->tm_sec = 0;
        expTm.tm_hour = 0; expTm.tm_min = 0; expTm.tm_sec = 0;

        double diffSeconds = std::difftime(std::mktime(&expTm), std::mktime(now));
        return static_cast<int>(diffSeconds / (60 * 60 * 24));
    }

    std::string getStatus() const {
        if (isExpired()) return "EXPIRED";
        int days = getDaysUntilExpiry();
        if (days <= 7) return "NEAR_EXPIRY";
        return "GOOD";
    }
};
