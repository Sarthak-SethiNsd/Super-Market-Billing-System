#include "models/Perishable.hpp"
#include <iomanip>

Perishable::Perishable() : Product(), expiryDate("2099-12-31") {}

Perishable::Perishable(int id,
                       const std::string& sku,
                       const std::string& name,
                       int brandId,
                       int categoryId,
                       int64_t priceInPaise,
                       int initialStock,
                       const std::string& expiry,
                       std::shared_ptr<IDiscountStrategy> discount)
    : Product(id, sku, name, brandId, categoryId, priceInPaise, initialStock, discount),
      expiryDate(expiry) {}

Perishable::Perishable(const std::string& name, double priceInRupees, int initialStock, const std::string& expiry)
    : Product(name, priceInRupees, initialStock),
      expiryDate(expiry) {}

std::string Perishable::getExpiry() const {
    return expiryDate;
}

void Perishable::setExpiry(const std::string& newExpiry) {
    this->expiryDate = newExpiry;
}

void Perishable::display() const {
    std::cout << "[Perishable] [ID: " << getId() << "] " << getName()
              << " | Price: Rs." << std::fixed << std::setprecision(2) << getPrice()
              << " | Stock: " << getStock()
              << " | Expiry: " << expiryDate;
    if (getDiscount() && getDiscount()->getType() != DiscountType::NONE) {
        std::cout << " (" << getDiscount()->getDescription()
                  << " -> Rs." << getDiscountedPriceInRupees() << ")";
    }
    std::cout << "\n";
}

ProductType Perishable::getType() const {
    return ProductType::PERISHABLE;
}

std::string Perishable::getProductTypeString() const {
    return "Perishable";
}
