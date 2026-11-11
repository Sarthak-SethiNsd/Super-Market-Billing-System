#include "strategies/IDiscountStrategy.hpp"
#include "models/Discount.hpp"
#include <iostream>
#include <stdexcept>
#include <string>

#define TEST_ASSERT(cond) \
    do { \
        if (!(cond)) { \
            throw std::runtime_error(std::string("Test assertion failed: ") + #cond + " at line " + std::to_string(__LINE__)); \
        } \
    } while (0)

void testPercentageDiscount() {
    std::cout << "[RUNNING] testPercentageDiscount...\n";
    PercentageDiscount disc10(10.0);
    int64_t originalPrice = 25000;
    int64_t discountAmount = disc10.calculateDiscount(originalPrice);
    int64_t finalPrice = disc10.getDiscountedPrice(originalPrice);

    TEST_ASSERT(discountAmount == 2500);
    TEST_ASSERT(finalPrice == 22500);

    // 0% discount
    PercentageDiscount disc0(0.0);
    TEST_ASSERT(disc0.calculateDiscount(originalPrice) == 0);
    TEST_ASSERT(disc0.getDiscountedPrice(originalPrice) == 25000);

    // 100% discount
    PercentageDiscount disc100(100.0);
    TEST_ASSERT(disc100.calculateDiscount(originalPrice) == 25000);
    TEST_ASSERT(disc100.getDiscountedPrice(originalPrice) == 0);

    std::cout << "  -> PASSED\n";
}

void testFixedAmountDiscount() {
    std::cout << "[RUNNING] testFixedAmountDiscount...\n";
    FixedAmountDiscount fixedDisc = FixedAmountDiscount::fromRupees(20.0);
    int64_t price = 6000;
    int64_t discountAmount = fixedDisc.calculateDiscount(price);
    int64_t finalPrice = fixedDisc.getDiscountedPrice(price);

    TEST_ASSERT(discountAmount == 2000);
    TEST_ASSERT(finalPrice == 4000);

    std::cout << "  -> PASSED\n";
}

void testInvalidPercentageRejection() {
    std::cout << "[RUNNING] testInvalidPercentageRejection...\n";
    bool caughtNegative = false;
    try {
        PercentageDiscount invalidNeg(-5.0);
        (void)invalidNeg;
    } catch (const std::invalid_argument&) {
        caughtNegative = true;
    }
    TEST_ASSERT(caughtNegative);

    bool caughtOver100 = false;
    try {
        PercentageDiscount invalidOver(105.0);
        (void)invalidOver;
    } catch (const std::invalid_argument&) {
        caughtOver100 = true;
    }
    TEST_ASSERT(caughtOver100);

    std::cout << "  -> PASSED\n";
}

void testNegativeFixedDiscountRejection() {
    std::cout << "[RUNNING] testNegativeFixedDiscountRejection...\n";
    bool caught = false;
    try {
        FixedAmountDiscount invalidFixed(-1000);
        (void)invalidFixed;
    } catch (const std::invalid_argument&) {
        caught = true;
    }
    TEST_ASSERT(caught);

    std::cout << "  -> PASSED\n";
}

void testFixedDiscountExceedingProductPrice() {
    std::cout << "[RUNNING] testFixedDiscountExceedingProductPrice...\n";
    FixedAmountDiscount bigDiscount = FixedAmountDiscount::fromRupees(100.0);
    int64_t price = 4000; // Rs. 40

    int64_t discountCalculated = bigDiscount.calculateDiscount(price);
    int64_t finalPrice = bigDiscount.getDiscountedPrice(price);

    TEST_ASSERT(discountCalculated == 4000);
    TEST_ASSERT(finalPrice == 0);
    TEST_ASSERT(finalPrice >= 0);

    std::cout << "  -> PASSED\n";
}

int main() {
    std::cout << "=== RUNNING DISCOUNT SUITE TESTS ===\n";
    try {
        testPercentageDiscount();
        testFixedAmountDiscount();
        testInvalidPercentageRejection();
        testNegativeFixedDiscountRejection();
        testFixedDiscountExceedingProductPrice();
        std::cout << "=== ALL DISCOUNT TESTS PASSED (5/5) ===\n";
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Test failed: " << e.what() << "\n";
        return 1;
    }
}
