#include "models/BillItem.hpp"
#include <iomanip>
#include <cmath>
#include <stdexcept>

BillItem::BillItem(int prodId,
                   const std::string& prodName,
                   int64_t originalUnitPriceInPaise,
                   int64_t discountPerUnitInPaise,
                   int qty)
    : productId(prodId),
      name(prodName),
      unitPriceInPaise(originalUnitPriceInPaise),
      unitDiscountInPaise(discountPerUnitInPaise),
      finalUnitPriceInPaise(std::max(INT64_C(0), originalUnitPriceInPaise - discountPerUnitInPaise)),
      quantity(qty) {
    if (qty <= 0) {
        throw std::invalid_argument("Bill item quantity must be positive");
    }
    if (originalUnitPriceInPaise < 0) {
        throw std::invalid_argument("Unit price cannot be negative");
    }
}

BillItem::BillItem(const std::string& n, double p, int q)
    : productId(0),
      name(n),
      unitPriceInPaise(static_cast<int64_t>(std::round(p * 100.0))),
      unitDiscountInPaise(0),
      finalUnitPriceInPaise(static_cast<int64_t>(std::round(p * 100.0))),
      quantity(q) {
    if (q <= 0) {
        throw std::invalid_argument("Quantity must be positive");
    }
    if (p < 0.0) {
        throw std::invalid_argument("Price cannot be negative");
    }
}

int BillItem::getProductId() const { return productId; }
std::string BillItem::getName() const { return name; }
int64_t BillItem::getUnitPriceInPaise() const { return unitPriceInPaise; }
double BillItem::getUnitPrice() const { return static_cast<double>(unitPriceInPaise) / 100.0; }
int64_t BillItem::getUnitDiscountInPaise() const { return unitDiscountInPaise; }
double BillItem::getUnitDiscountInRupees() const { return static_cast<double>(unitDiscountInPaise) / 100.0; }
int64_t BillItem::getFinalUnitPriceInPaise() const { return finalUnitPriceInPaise; }
double BillItem::getFinalUnitPriceInRupees() const { return static_cast<double>(finalUnitPriceInPaise) / 100.0; }
int BillItem::getQuantity() const { return quantity; }

int64_t BillItem::lineSubtotalInPaise() const {
    return unitPriceInPaise * quantity;
}

int64_t BillItem::lineDiscountInPaise() const {
    return unitDiscountInPaise * quantity;
}

int64_t BillItem::lineFinalTotalInPaise() const {
    return finalUnitPriceInPaise * quantity;
}

double BillItem::total() const {
    return static_cast<double>(lineFinalTotalInPaise()) / 100.0;
}

// ==========================================
// Operator Overloads
// ==========================================
BillItem operator+(const BillItem& a, const BillItem& b) {
    if (a.name != b.name) {
        throw std::invalid_argument("Cannot combine line items with different product names: " + a.name + " vs " + b.name);
    }
    if (a.finalUnitPriceInPaise != b.finalUnitPriceInPaise) {
        throw std::invalid_argument("Cannot combine line items with different final unit prices for " + a.name);
    }
    return BillItem(a.productId, a.name, a.unitPriceInPaise, a.unitDiscountInPaise, a.quantity + b.quantity);
}

bool operator==(const BillItem& a, const BillItem& b) {
    return a.name == b.name && a.finalUnitPriceInPaise == b.finalUnitPriceInPaise;
}

std::ostream& operator<<(std::ostream& out, const BillItem& item) {
    out << item.name << " x " << item.quantity
        << " @ Rs." << std::fixed << std::setprecision(2) << item.getFinalUnitPriceInRupees();
    if (item.unitDiscountInPaise > 0) {
        out << " (Discounted from Rs." << item.getUnitPrice() << ")";
    }
    out << " = Rs." << std::fixed << std::setprecision(2) << item.total();
    return out;
}
