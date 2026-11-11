#include "models/Bill.hpp"
#include <iomanip>
#include <stdexcept>

int Bill::totalBillsCreated = 0;

Bill::Bill() {
    totalBillsCreated++;
}

int Bill::getTotalBillsCreated() {
    return totalBillsCreated;
}

void Bill::addItem(Product& p, int quantity) {
    p.reduceStock(quantity);

    int64_t originalPrice = p.getPriceInPaise();
    int64_t discountAmount = 0;

    auto strategy = p.getDiscount();
    if (strategy) {
        discountAmount = strategy->calculateDiscount(originalPrice);
    }

    items.emplace_back(p.getId(), p.getName(), originalPrice, discountAmount, quantity);
}

void Bill::addItem(Product& p, int quantity, const IDiscountStrategy& strategy) {
    p.reduceStock(quantity);

    int64_t originalPrice = p.getPriceInPaise();
    int64_t discountAmount = strategy.calculateDiscount(originalPrice);

    items.emplace_back(p.getId(), p.getName(), originalPrice, discountAmount, quantity);
}

void Bill::addItem(Product& p, int quantity, Discount& d) {
    p.reduceStock(quantity);

    int64_t originalPrice = p.getPriceInPaise();
    int64_t discountedPrice = d.applyToPaise(originalPrice);
    int64_t discountAmount = originalPrice - discountedPrice;

    items.emplace_back(p.getId(), p.getName(), originalPrice, discountAmount, quantity);
}

void Bill::addItemDirect(const BillItem& item) {
    items.push_back(item);
}

int64_t Bill::getSubtotalInPaise() const {
    int64_t sum = 0;
    for (const auto& item : items) {
        sum += item.lineSubtotalInPaise();
    }
    return sum;
}

int64_t Bill::getTotalDiscountInPaise() const {
    int64_t sum = 0;
    for (const auto& item : items) {
        sum += item.lineDiscountInPaise();
    }
    return sum;
}

int64_t Bill::getFinalAmountInPaise() const {
    int64_t sum = 0;
    for (const auto& item : items) {
        sum += item.lineFinalTotalInPaise();
    }
    return sum;
}

double Bill::total() const {
    return static_cast<double>(getFinalAmountInPaise()) / 100.0;
}

double Bill::getSubtotalInRupees() const {
    return static_cast<double>(getSubtotalInPaise()) / 100.0;
}

double Bill::getTotalDiscountInRupees() const {
    return static_cast<double>(getTotalDiscountInPaise()) / 100.0;
}

const std::vector<BillItem>& Bill::getItems() const {
    return items;
}

bool Bill::isEmpty() const {
    return items.empty();
}

size_t Bill::getItemCount() const {
    return items.size();
}

// ==========================================
// Operator Overloads
// ==========================================
Bill operator+(const Bill& b1, const Bill& b2) {
    Bill result;
    for (const auto& item : b1.items) {
        result.items.push_back(item);
    }
    for (const auto& item : b2.items) {
        result.items.push_back(item);
    }
    return result;
}

std::ostream& operator<<(std::ostream& out, const Bill& b) {
    out << "\n============================== BILL ==============================\n";
    if (b.items.empty()) {
        out << "  [Empty Bill]\n";
    } else {
        for (const auto& item : b.items) {
            out << "  - " << item << "\n";
        }
    }
    out << "------------------------------------------------------------------\n";
    out << "  Subtotal:       Rs." << std::fixed << std::setprecision(2) << b.getSubtotalInRupees() << "\n";
    out << "  Total Discount: Rs." << std::fixed << std::setprecision(2) << b.getTotalDiscountInRupees() << "\n";
    out << "  Payable Total:  Rs." << std::fixed << std::setprecision(2) << b.total() << "\n";
    out << "==================================================================\n";
    return out;
}

std::istream& operator>>(std::istream& in, Bill& b) {
    std::string name;
    double price;
    int qty;
    std::cout << "Enter item name, price, quantity: ";
    if (in >> name >> price >> qty) {
        if (qty <= 0) {
            throw std::invalid_argument("Quantity must be positive");
        }
        if (price < 0.0) {
            throw std::invalid_argument("Price cannot be negative");
        }
        b.items.emplace_back(name, price, qty);
    }
    return in;
}
