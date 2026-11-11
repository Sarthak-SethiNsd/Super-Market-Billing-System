#pragma once
#include <string>
#include <iostream>
#include <cstdint>

/**
 * @brief Represents an immutable line item snapshot inside a Bill.
 * Demonstrates:
 *  - Immutability of historical sales data
 *  - Operator Overloading: +, ==, <<
 *  - Financial calculations using integer paise
 */
class BillItem {
private:
    int productId;
    std::string name;
    int64_t unitPriceInPaise;
    int64_t unitDiscountInPaise;
    int64_t finalUnitPriceInPaise;
    int quantity;

public:
    // Comprehensive Constructor
    BillItem(int prodId,
             const std::string& prodName,
             int64_t originalUnitPriceInPaise,
             int64_t discountPerUnitInPaise,
             int qty);

    // Legacy Constructor (in Rupees, for lab backwards-compatibility)
    BillItem(const std::string& n, double p, int q);

    int getProductId() const;
    std::string getName() const;
    int64_t getUnitPriceInPaise() const;
    double getUnitPrice() const; // in Rupees
    int64_t getUnitDiscountInPaise() const;
    double getUnitDiscountInRupees() const;
    int64_t getFinalUnitPriceInPaise() const;
    double getFinalUnitPriceInRupees() const;
    int getQuantity() const;

    // Line totals
    int64_t lineSubtotalInPaise() const;
    int64_t lineDiscountInPaise() const;
    int64_t lineFinalTotalInPaise() const;

    double total() const; // in Rupees, for backwards compatibility

    // Operator Overloading
    friend BillItem operator+(const BillItem& a, const BillItem& b);
    friend bool operator==(const BillItem& a, const BillItem& b);
    friend std::ostream& operator<<(std::ostream& out, const BillItem& item);
};
