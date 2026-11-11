#include "models/Discount.hpp"
#include <sstream>
#include <iomanip>

// ==========================================
// NoDiscount Implementation
// ==========================================
int64_t NoDiscount::calculateDiscount(int64_t /*priceInPaise*/) const {
    return 0;
}

DiscountType NoDiscount::getType() const {
    return DiscountType::NONE;
}

double NoDiscount::getValue() const {
    return 0.0;
}

std::string NoDiscount::getDescription() const {
    return "No Discount";
}

std::unique_ptr<IDiscountStrategy> NoDiscount::clone() const {
    return std::make_unique<NoDiscount>(*this);
}

// ==========================================
// PercentageDiscount Implementation
// ==========================================
PercentageDiscount::PercentageDiscount(double p) : percent(p) {
    if (p < 0.0 || p > 100.0) {
        throw std::invalid_argument("Discount percentage must be between 0.0 and 100.0");
    }
}

int64_t PercentageDiscount::calculateDiscount(int64_t priceInPaise) const {
    if (priceInPaise <= 0 || percent <= 0.0) {
        return 0;
    }
    // Round to nearest paisa
    double discount = (static_cast<double>(priceInPaise) * percent) / 100.0;
    return static_cast<int64_t>(std::round(discount));
}

DiscountType PercentageDiscount::getType() const {
    return DiscountType::PERCENTAGE;
}

double PercentageDiscount::getValue() const {
    return percent;
}

std::string PercentageDiscount::getDescription() const {
    std::ostringstream ss;
    ss << std::fixed << std::setprecision(1) << percent << "% off";
    return ss.str();
}

std::unique_ptr<IDiscountStrategy> PercentageDiscount::clone() const {
    return std::make_unique<PercentageDiscount>(*this);
}

double PercentageDiscount::getPercent() const {
    return percent;
}

// ==========================================
// FixedAmountDiscount Implementation
// ==========================================
FixedAmountDiscount::FixedAmountDiscount(int64_t amountInPaise) : amountInPaise(amountInPaise) {
    if (amountInPaise < 0) {
        throw std::invalid_argument("Fixed discount amount cannot be negative");
    }
}

FixedAmountDiscount FixedAmountDiscount::fromRupees(double rupees) {
    if (rupees < 0.0) {
        throw std::invalid_argument("Fixed discount amount cannot be negative");
    }
    int64_t paise = static_cast<int64_t>(std::round(rupees * 100.0));
    return FixedAmountDiscount(paise);
}

int64_t FixedAmountDiscount::calculateDiscount(int64_t priceInPaise) const {
    if (priceInPaise <= 0 || amountInPaise <= 0) {
        return 0;
    }
    // Cannot exceed original product price
    return std::min(priceInPaise, amountInPaise);
}

DiscountType FixedAmountDiscount::getType() const {
    return DiscountType::FIXED;
}

double FixedAmountDiscount::getValue() const {
    return static_cast<double>(amountInPaise) / 100.0;
}

std::string FixedAmountDiscount::getDescription() const {
    std::ostringstream ss;
    ss << "Rs. " << std::fixed << std::setprecision(2) << (static_cast<double>(amountInPaise) / 100.0) << " off";
    return ss.str();
}

std::unique_ptr<IDiscountStrategy> FixedAmountDiscount::clone() const {
    return std::make_unique<FixedAmountDiscount>(*this);
}

int64_t FixedAmountDiscount::getAmountInPaise() const {
    return amountInPaise;
}

double FixedAmountDiscount::getAmountInRupees() const {
    return static_cast<double>(amountInPaise) / 100.0;
}

// ==========================================
// Legacy Discount (final class) Implementation
// ==========================================
Discount::Discount(double p) : percent(p) {
    if (p < 0.0 || p > 100.0) {
        throw std::invalid_argument("Discount must be 0-100");
    }
}

double Discount::apply(double amountInRupees) const {
    return amountInRupees - (amountInRupees * percent / 100.0);
}

int64_t Discount::applyToPaise(int64_t amountInPaise) const {
    double discount = (static_cast<double>(amountInPaise) * percent) / 100.0;
    int64_t discountPaise = static_cast<int64_t>(std::round(discount));
    return std::max(INT64_C(0), amountInPaise - discountPaise);
}

double Discount::getPercent() const {
    return percent;
}
