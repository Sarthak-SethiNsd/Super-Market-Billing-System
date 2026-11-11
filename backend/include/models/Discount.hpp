#pragma once
#include "strategies/IDiscountStrategy.hpp"
#include <string>
#include <stdexcept>
#include <memory>
#include <cmath>

/**
 * @brief Default strategy representing zero discount.
 */
class NoDiscount : public IDiscountStrategy {
public:
    int64_t calculateDiscount(int64_t /*priceInPaise*/) const override;
    DiscountType getType() const override;
    double getValue() const override;
    std::string getDescription() const override;
    std::unique_ptr<IDiscountStrategy> clone() const override;
};

/**
 * @brief Concrete strategy for percentage-based price discounts.
 * Validates that percentage is strictly within [0.0, 100.0].
 */
class PercentageDiscount : public IDiscountStrategy {
private:
    double percent;

public:
    explicit PercentageDiscount(double p);

    int64_t calculateDiscount(int64_t priceInPaise) const override;
    DiscountType getType() const override;
    double getValue() const override;
    std::string getDescription() const override;
    std::unique_ptr<IDiscountStrategy> clone() const override;

    double getPercent() const;
};

/**
 * @brief Concrete strategy for fixed-amount (flat cash) deductions.
 * Validates that fixed deduction is non-negative.
 * Capped so deduction does not exceed the item's unit price.
 */
class FixedAmountDiscount : public IDiscountStrategy {
private:
    int64_t amountInPaise;

public:
    explicit FixedAmountDiscount(int64_t amountInPaise);
    static FixedAmountDiscount fromRupees(double rupees);

    int64_t calculateDiscount(int64_t priceInPaise) const override;
    DiscountType getType() const override;
    double getValue() const override;
    std::string getDescription() const override;
    std::unique_ptr<IDiscountStrategy> clone() const override;

    int64_t getAmountInPaise() const;
    double getAmountInRupees() const;
};

/**
 * @brief Preserved legacy Discount class with 'final' specifier.
 * Demonstrates the C++ 'final' contextual keyword and backwards-compatible usage.
 */
class Discount final {
private:
    double percent;

public:
    explicit Discount(double p);

    double apply(double amountInRupees) const;
    int64_t applyToPaise(int64_t amountInPaise) const;
    double getPercent() const;
};
