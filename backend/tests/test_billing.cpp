#include "models/Bill.hpp"
#include "models/BillItem.hpp"
#include "models/Product.hpp"
#include "models/Perishable.hpp"
#include "models/NonPerishable.hpp"
#include "models/Manager.hpp"
#include "models/Discount.hpp"
#include "utils/Repository.hpp"
#include "utils/ApiResponse.hpp"
#include <iostream>
#include <stdexcept>
#include <string>
#include <memory>

#define TEST_ASSERT(cond) \
    do { \
        if (!(cond)) { \
            throw std::runtime_error(std::string("Test assertion failed: ") + #cond + " at line " + std::to_string(__LINE__)); \
        } \
    } while (0)

void testBillingCalculations() {
    std::cout << "[RUNNING] testBillingCalculations...\n";
    // Product 1: Rs. 200.00 (20000 paise), 10% discount -> Rs. 180.00 final
    Product p1(1, "SKU-P1", "Product One", 1, 1, 20000, 50, std::make_shared<PercentageDiscount>(10.0));

    // Product 2: Rs. 50.00 (5000 paise), flat Rs. 10.00 discount -> Rs. 40.00 final
    Product p2(2, "SKU-P2", "Product Two", 1, 1, 5000, 50, std::make_shared<FixedAmountDiscount>(FixedAmountDiscount::fromRupees(10.0)));

    Bill bill;
    bill.addItem(p1, 2); // 2 * 200 = 400 subtotal, 40 discount, 360 final
    bill.addItem(p2, 3); // 3 * 50 = 150 subtotal, 30 discount, 120 final

    // Subtotal: 40000 + 15000 = 55000 paise (Rs. 550.00)
    TEST_ASSERT(bill.getSubtotalInPaise() == 55000);
    TEST_ASSERT(bill.getSubtotalInRupees() == 550.00);

    // Discount: 4000 + 3000 = 7000 paise (Rs. 70.00)
    TEST_ASSERT(bill.getTotalDiscountInPaise() == 7000);
    TEST_ASSERT(bill.getTotalDiscountInRupees() == 70.00);

    // Final amount: 55000 - 7000 = 48000 paise (Rs. 480.00)
    TEST_ASSERT(bill.getFinalAmountInPaise() == 48000);
    TEST_ASSERT(bill.total() == 480.00);

    std::cout << "  -> PASSED\n";
}

void testInvalidQuantityRejection() {
    std::cout << "[RUNNING] testInvalidQuantityRejection...\n";
    Product p(3, "SKU-P3", "Product Three", 1, 1, 10000, 20);
    Bill bill;

    bool caughtZero = false;
    try {
        bill.addItem(p, 0);
    } catch (const std::invalid_argument&) {
        caughtZero = true;
    }
    TEST_ASSERT(caughtZero);

    bool caughtNegative = false;
    try {
        bill.addItem(p, -5);
    } catch (const std::invalid_argument&) {
        caughtNegative = true;
    }
    TEST_ASSERT(caughtNegative);

    std::cout << "  -> PASSED\n";
}

void testHistoricalSnapshotImmutability() {
    std::cout << "[RUNNING] testHistoricalSnapshotImmutability...\n";
    Product p(4, "SKU-P4", "Historical Item", 1, 1, 10000, 20); // Rs. 100.00
    Bill bill;
    bill.addItem(p, 2); // 2 items at Rs. 100 = Rs. 200.00

    TEST_ASSERT(bill.getFinalAmountInPaise() == 20000);

    // Modify original product in inventory/catalog
    p.setPriceInRupees(500.00);
    p.setDiscount(std::make_shared<PercentageDiscount>(50.0));

    // Existing bill should be completely unaffected!
    TEST_ASSERT(bill.getFinalAmountInPaise() == 20000);
    TEST_ASSERT(bill.getItems()[0].getUnitPriceInPaise() == 10000);
    TEST_ASSERT(bill.getItems()[0].getFinalUnitPriceInPaise() == 10000);

    std::cout << "  -> PASSED\n";
}

void testOperatorOverloads() {
    std::cout << "[RUNNING] testOperatorOverloads...\n";
    BillItem item1(1, "Biscuits", 2000, 0, 2); // 2 @ Rs. 20
    BillItem item2(1, "Biscuits", 2000, 0, 3); // 3 @ Rs. 20
    BillItem combined = item1 + item2;

    TEST_ASSERT(combined.getQuantity() == 5);
    TEST_ASSERT(combined.total() == 100.00);
    TEST_ASSERT(item1 == item2);

    Bill b1;
    b1.addItemDirect(item1);
    Bill b2;
    b2.addItemDirect(item2);

    Bill merged = b1 + b2;
    TEST_ASSERT(merged.getItemCount() == 2);
    TEST_ASSERT(merged.total() == 100.00);

    std::cout << "  -> PASSED\n";
}

void testDiamondInheritance() {
    std::cout << "[RUNNING] testDiamondInheritance...\n";
    Manager mgr("Suresh Gupta", "EMP-99", 350, "Inventory Administration");
    // Verify single Person base
    TEST_ASSERT(mgr.getName() == "Suresh Gupta");
    TEST_ASSERT(mgr.getEmployeeId() == "EMP-99");
    TEST_ASSERT(mgr.getLoyaltyPoints() == 350);
    TEST_ASSERT(mgr.getDepartment() == "Inventory Administration");

    // Dynamic upcasting to both branches works seamlessly without ambiguity
    Employee* empPtr = &mgr;
    Customer* custPtr = &mgr;
    TEST_ASSERT(empPtr->getName() == "Suresh Gupta");
    TEST_ASSERT(custPtr->getName() == "Suresh Gupta");

    std::cout << "  -> PASSED\n";
}

void testGenericTemplates() {
    std::cout << "[RUNNING] testGenericTemplates...\n";
    Repository<Product> repo;
    Product p1(1, "SKU-A", "Apple", 1, 1, 5000, 10);
    Product p2(2, "SKU-B", "Banana", 1, 1, 3000, 25);
    repo.add(p1);
    repo.add(p2);

    TEST_ASSERT(repo.count() == 2);

    auto found = repo.find([](const Product& p) { return p.getSku() == "SKU-B"; });
    TEST_ASSERT(found.has_value());
    TEST_ASSERT(found->getName() == "Banana");

    auto resp = ApiResponse<Product>::ok(p1, "Loaded Apple");
    TEST_ASSERT(resp.isSuccess());
    TEST_ASSERT(resp.getData().getName() == "Apple");
    TEST_ASSERT(resp.getTimestamp() > 0);

    std::cout << "  -> PASSED\n";
}

int main() {
    std::cout << "=== RUNNING BILLING & INTEGRATION SUITE TESTS ===\n";
    try {
        testBillingCalculations();
        testInvalidQuantityRejection();
        testHistoricalSnapshotImmutability();
        testOperatorOverloads();
        testDiamondInheritance();
        testGenericTemplates();
        std::cout << "=== ALL BILLING & INTEGRATION TESTS PASSED (6/6) ===\n";
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Test failed: " << e.what() << "\n";
        return 1;
    }
}
