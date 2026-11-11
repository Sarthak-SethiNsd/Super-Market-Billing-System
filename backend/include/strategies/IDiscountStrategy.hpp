#pragma once
#include <string>
#include <memory>
#include <cstdint>
#include <algorithm>

/**
 * @brief Enumeration of supported discount mechanisms.
 */
enum class DiscountType {
    NONE,
    PERCENTAGE,
    FIXED
};

/**
 * @brief Abstract Strategy Interface for product discounts.
 * Demonstrates:
 *  - Abstraction & Pure Virtual Functions (= 0)
 *  - Strategy Design Pattern
 *  - Financial calculation using integer paise to avoid IEEE-754 precision issues.
 */
class IDiscountStrategy {
public:
    virtual ~IDiscountStrategy() = default;

    /**
     * @brief Computes the discount deduction in paise for a given selling price.
     * @param priceInPaise The original price of the product in paise.
     * @return Discount deduction amount in paise.
     */
    virtual int64_t calculateDiscount(int64_t priceInPaise) const = 0;

    /**
     * @brief Returns the final payable price in paise after applying the discount.
     * Guarantees the final price never drops below zero.
     */
    virtual int64_t getDiscountedPrice(int64_t priceInPaise) const {
        int64_t discount = calculateDiscount(priceInPaise);
        return std::max(INT64_C(0), priceInPaise - discount);
    }

    /**
     * @brief Returns the category/type of the discount.
     */
    virtual DiscountType getType() const = 0;

    /**
     * @brief Returns the numerical configuration value (e.g. 10.0 for 10% or 500 for Rs.5.00).
     */
    virtual double getValue() const = 0;

    /**
     * @brief Human-readable description of the discount strategy.
     */
    virtual std::string getDescription() const = 0;

    /**
     * @brief Virtual copy constructor (Prototype/Clone pattern).
     */
    virtual std::unique_ptr<IDiscountStrategy> clone() const = 0;
};
