#include "models/Product.hpp"
#include "models/Perishable.hpp"
#include "models/NonPerishable.hpp"
#include <iostream>
#include <stdexcept>
#include <string>

#define TEST_ASSERT(cond) \
    do { \
        if (!(cond)) { \
            throw std::runtime_error(std::string("Test assertion failed: ") + #cond + " at line " + std::to_string(__LINE__)); \
        } \
    } while (0)

void testStockReductionValid() {
    std::cout << "[RUNNING] testStockReductionValid...\n";
    Product p(1, "SKU-001", "Wheat Flour", 1, 1, 5000, 20); // 20 units
    TEST_ASSERT(p.getStock() == 20);

    p.reduceStock(5);
    TEST_ASSERT(p.getStock() == 15);

    p.reduceStock(15);
    TEST_ASSERT(p.getStock() == 0);

    p.addStock(10);
    TEST_ASSERT(p.getStock() == 10);
    std::cout << "  -> PASSED\n";
}

void testInsufficientStockRejection() {
    std::cout << "[RUNNING] testInsufficientStockRejection...\n";
    Product p(2, "SKU-002", "Sugar", 1, 1, 4500, 10); // 10 units
    bool caught = false;
    try {
        p.reduceStock(11); // Exceeds available stock
    } catch (const std::runtime_error&) {
        caught = true;
    }
    TEST_ASSERT(caught);
    TEST_ASSERT(p.getStock() == 10);
    std::cout << "  -> PASSED\n";
}

void testNegativeStockPrevention() {
    std::cout << "[RUNNING] testNegativeStockPrevention...\n";
    bool caughtInit = false;
    try {
        Product invalidInit(3, "SKU-003", "Bad Product", 1, 1, 1000, -5);
        (void)invalidInit;
    } catch (const std::invalid_argument&) {
        caughtInit = true;
    }
    TEST_ASSERT(caughtInit);

    Product p(4, "SKU-004", "Good Product", 1, 1, 1000, 5);
    bool caughtZeroReduction = false;
    try {
        p.reduceStock(0);
    } catch (const std::invalid_argument&) {
        caughtZeroReduction = true;
    }
    TEST_ASSERT(caughtZeroReduction);

    bool caughtNegativeReduction = false;
    try {
        p.reduceStock(-3);
    } catch (const std::invalid_argument&) {
        caughtNegativeReduction = true;
    }
    TEST_ASSERT(caughtNegativeReduction);

    std::cout << "  -> PASSED\n";
}

void testProductIdentityBasedOnId() {
    std::cout << "[RUNNING] testProductIdentityBasedOnId...\n";
    Product p1(10, "SKU-MILK-AMUL", "Full Cream Milk", 1, 2, 6000, 10);
    Product p2(10, "SKU-MILK-AMUL", "Full Cream Milk", 1, 2, 6000, 10);
    Product p3(11, "SKU-MILK-NESTLE", "Full Cream Milk", 2, 2, 6500, 15);

    // Identical IDs => Equal
    TEST_ASSERT(p1 == p2);

    // Same name but different brand/ID => NOT equal
    TEST_ASSERT(!(p1 == p3));
    std::cout << "  -> PASSED\n";
}

void testStockInfoNestedClass() {
    std::cout << "[RUNNING] testStockInfoNestedClass...\n";
    Product p(20, "SKU-OIL", "Sunflower Oil", 1, 1, 18000, 35);
    Product::StockInfo info = p.getStockInfo();
    TEST_ASSERT(info.getAvailable() == 35);
    TEST_ASSERT(info.getReserved() == 0);
    TEST_ASSERT(info.getTotal() == 35);
    std::cout << "  -> PASSED\n";
}

int main() {
    std::cout << "=== RUNNING INVENTORY SUITE TESTS ===\n";
    try {
        testStockReductionValid();
        testInsufficientStockRejection();
        testNegativeStockPrevention();
        testProductIdentityBasedOnId();
        testStockInfoNestedClass();
        std::cout << "=== ALL INVENTORY TESTS PASSED (5/5) ===\n";
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Test failed: " << e.what() << "\n";
        return 1;
    }
}
