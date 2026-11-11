#pragma once
#include "models/BillItem.hpp"
#include "models/Product.hpp"
#include "models/Discount.hpp"
#include "strategies/IDiscountStrategy.hpp"
#include <vector>
#include <iostream>
#include <cstdint>

/**
 * @brief Represents a customer transaction containing multiple line items.
 * Demonstrates:
 *  - Aggregate class / Collection management
 *  - Friend class of Product
 *  - Static members & static functions for transaction telemetry
 *  - Method Overloading (addItem)
 *  - Stream I/O and arithmetic operator overloading (+, <<, >>)
 *  - Immutable financial snapshot calculations
 */
class Bill {
private:
    std::vector<BillItem> items;
    static int totalBillsCreated;

public:
    Bill();

    static int getTotalBillsCreated();

    // Add item using product's configured discount strategy
    void addItem(Product& p, int quantity);

    // Overloaded addItem with explicit strategy
    void addItem(Product& p, int quantity, const IDiscountStrategy& strategy);

    // Overloaded addItem with legacy Discount class (for lab backwards-compatibility)
    void addItem(Product& p, int quantity, Discount& d);

    // Add pre-constructed item
    void addItemDirect(const BillItem& item);

    // Calculations in integer paise
    int64_t getSubtotalInPaise() const;
    int64_t getTotalDiscountInPaise() const;
    int64_t getFinalAmountInPaise() const;

    // Backward-compatible totals in Rupees
    double total() const;
    double getSubtotalInRupees() const;
    double getTotalDiscountInRupees() const;

    const std::vector<BillItem>& getItems() const;
    bool isEmpty() const;
    size_t getItemCount() const;

    // Operator Overloading
    friend Bill operator+(const Bill& b1, const Bill& b2);
    friend std::ostream& operator<<(std::ostream& out, const Bill& b);
    friend std::istream& operator>>(std::istream& in, Bill& b);
};
