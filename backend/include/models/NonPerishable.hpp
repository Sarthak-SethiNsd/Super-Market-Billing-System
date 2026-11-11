#pragma once
#include "models/Product.hpp"

/**
 * @brief Represents non-perishable goods (packaged items, dry goods, household products).
 * Demonstrates:
 *  - Inheritance
 *  - Method overriding calling base implementation
 */
class NonPerishable : public Product {
public:
    NonPerishable();

    // Comprehensive constructor
    NonPerishable(int id,
                  const std::string& sku,
                  const std::string& name,
                  int brandId,
                  int categoryId,
                  int64_t priceInPaise,
                  int initialStock,
                  std::shared_ptr<IDiscountStrategy> discount = nullptr);

    // Legacy constructor (preserves original lab interface)
    NonPerishable(const std::string& name, double priceInRupees, int initialStock);

    void display() const override;
    ProductType getType() const override;
    std::string getProductTypeString() const override;
};
