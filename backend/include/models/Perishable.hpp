#pragma once
#include "models/Product.hpp"
#include <string>

/**
 * @brief Represents perishable goods with an expiration date.
 * Demonstrates:
 *  - Single public inheritance
 *  - Method overriding (virtual display() override)
 *  - Polymorphic behavior
 */
class Perishable : public Product {
private:
    std::string expiryDate;

public:
    Perishable();

    // Comprehensive constructor
    Perishable(int id,
               const std::string& sku,
               const std::string& name,
               int brandId,
               int categoryId,
               int64_t priceInPaise,
               int initialStock,
               const std::string& expiry,
               std::shared_ptr<IDiscountStrategy> discount = nullptr);

    // Legacy constructor (preserves original lab interface)
    Perishable(const std::string& name, double priceInRupees, int initialStock, const std::string& expiry);

    std::string getExpiry() const;
    void setExpiry(const std::string& newExpiry);

    void display() const override;
    ProductType getType() const override;
    std::string getProductTypeString() const override;
};
