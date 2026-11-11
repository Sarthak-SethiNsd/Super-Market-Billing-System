#include "models/NonPerishable.hpp"

NonPerishable::NonPerishable() : Product() {}

NonPerishable::NonPerishable(int id,
                             const std::string& sku,
                             const std::string& name,
                             int brandId,
                             int categoryId,
                             int64_t priceInPaise,
                             int initialStock,
                             std::shared_ptr<IDiscountStrategy> discount)
    : Product(id, sku, name, brandId, categoryId, priceInPaise, initialStock, discount) {}

NonPerishable::NonPerishable(const std::string& name, double priceInRupees, int initialStock)
    : Product(name, priceInRupees, initialStock) {}

void NonPerishable::display() const {
    std::cout << "[Non-Perishable] ";
    Product::display();
}

ProductType NonPerishable::getType() const {
    return ProductType::NON_PERISHABLE;
}

std::string NonPerishable::getProductTypeString() const {
    return "Non-Perishable";
}
