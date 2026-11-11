#include <iostream>
#include <vector>
#include <memory>
#include <iomanip>
#include <filesystem>

#include "models/Product.hpp"
#include "models/Perishable.hpp"
#include "models/NonPerishable.hpp"
#include "models/Discount.hpp"
#include "models/Bill.hpp"
#include "models/BillItem.hpp"
#include "models/Person.hpp"
#include "models/Employee.hpp"
#include "models/Customer.hpp"
#include "models/Manager.hpp"
#include "strategies/IDiscountStrategy.hpp"
#include "utils/Repository.hpp"
#include "utils/ApiResponse.hpp"

#include "database/DatabaseConnection.hpp"
#include "database/DatabaseMigrator.hpp"
#include "repositories/BrandRepository.hpp"
#include "repositories/CategoryRepository.hpp"
#include "repositories/ProductRepository.hpp"
#include "repositories/BillRepository.hpp"
#include "repositories/InventoryRepository.hpp"

using namespace std;

int main() {
    cout << "=================================================================\n";
    cout << "     SUPERMARKET BILLING & INVENTORY MANAGEMENT SYSTEM (C++17)   \n";
    cout << "               COMPREHENSIVE OOP CONCEPT DEMONSTRATION           \n";
    cout << "=================================================================\n\n";

    // -------------------------------------------------------------
    // 1. Classes, Objects, and Polymorphic Pointers
    // -------------------------------------------------------------
    cout << "--- 1. POINTERS TO OBJECTS & INHERITANCE ---\n";
    Product* p1 = new Product(101, "SKU-RICE-01", "Basmati Rice 5kg", 1, 10, 25000, 20); // Rs. 250.00
    Perishable* p2 = new Perishable(102, "SKU-MILK-02", "Organic Milk 1L", 2, 20, 6200, 30, "2026-11-15"); // Rs. 62.00
    NonPerishable* p3 = new NonPerishable(103, "SKU-SALT-03", "Iodized Salt 1kg", 3, 30, 3000, 50); // Rs. 30.00

    cout << "Product pointer: " << p1->getName() << " | Price: Rs." << p1->getPrice() << endl;
    cout << "Derived pointer: " << p2->getName() << " | Expiry: " << p2->getExpiry() << endl;

    // -------------------------------------------------------------
    // 2. Stream Insertion Operator Overload (<<)
    // -------------------------------------------------------------
    cout << "\n--- 2. STREAM OPERATOR OVERLOADING (operator<<) ---\n";
    cout << *p1 << endl;
    cout << *p2 << endl;
    cout << *p3 << endl;

    // -------------------------------------------------------------
    // 3. Runtime Polymorphism & Virtual Functions
    // -------------------------------------------------------------
    cout << "\n--- 3. RUNTIME POLYMORPHISM VIA BASE CLASS POINTER ARRAY ---\n";
    Product* catalog[3] = {p1, p2, p3};
    for (int i = 0; i < 3; i++) {
        cout << "catalog[" << i << "]->display(): ";
        catalog[i]->display(); // Virtual dispatch dynamically resolves to derived display()
    }

    // -------------------------------------------------------------
    // 4. Static Data Members and Static Functions
    // -------------------------------------------------------------
    cout << "\n--- 4. STATIC TELEMETRY & TRACKING ---\n";
    cout << "Product::getTotalProducts():   " << Product::getTotalProducts() << endl;
    cout << "Product::getTotalStockUnits(): " << Product::getTotalStockUnits() << endl;
    cout << "Bill::getTotalBillsCreated():  " << Bill::getTotalBillsCreated() << endl;

    // -------------------------------------------------------------
    // 5. Nested Class: Product::StockInfo
    // -------------------------------------------------------------
    cout << "\n--- 5. NESTED CLASS DEMONSTRATION (Product::StockInfo) ---\n";
    Product::StockInfo info = p1->getStockInfo();
    cout << "StockInfo display: ";
    info.display();

    // -------------------------------------------------------------
    // 6. Object Slicing Demonstration & Explanation
    // -------------------------------------------------------------
    cout << "\n--- 6. OBJECT SLICING DEMONSTRATION & DETAILED ANALYSIS ---\n";
    Perishable perishableItem(104, "SKU-CURD-04", "Fresh Curd 500g", 2, 20, 4000, 15, "2026-11-12");
    
    // Assigning a derived object to a base object by value causes OBJECT SLICING:
    Product slicedItem = perishableItem; 

    cout << "Original Perishable object: ";
    perishableItem.display(); // Derived Perishable::display() shows expiry date

    cout << "Sliced Product object:      ";
    slicedItem.display();     // Base Product::display() has NO expiry date

    cout << "\n[ACADEMIC EXPLANATION OF OBJECT SLICING]:\n"
         << "When 'perishableItem' was assigned by value to 'Product slicedItem',\n"
         << "only the base 'Product' subobject was copied. The derived 'expiryDate'\n"
         << "member and the virtual method table (vptr) were sliced away.\n"
         << "In modern C++, we prevent unintended slicing by passing polymorphic\n"
         << "objects via reference (Product&) or smart pointers (std::shared_ptr<Product>).\n";

    // -------------------------------------------------------------
    // 7. The 'this' Pointer Demonstration
    // -------------------------------------------------------------
    cout << "\n--- 7. 'this' POINTER DEMONSTRATION ---\n";
    cout << "Inside Product member functions, 'this' is a const pointer to the current object.\n";
    cout << "Product p1 object address via this: " << p1 << " | Name: " << p1->getName() << endl;

    // -------------------------------------------------------------
    // 8. Virtual Base Classes & Diamond Problem Resolution
    // -------------------------------------------------------------
    cout << "\n--- 8. VIRTUAL INHERITANCE (DIAMOND PROBLEM RESOLUTION) ---\n";
    Manager storeManager("Rahul Sharma", "MGR-2026", 1200, "Supermarket Retail Operations");
    storeManager.display();
    cout << "Verification: 'Person' is a virtual base class of 'Employee' and 'Customer'.\n"
         << "As a result, 'storeManager' possesses exactly ONE unique 'name' attribute ('"
         << storeManager.getName() << "'), eliminating ambiguity.\n";

    // -------------------------------------------------------------
    // 9. Strategy Pattern for Individual Product Discounts
    // -------------------------------------------------------------
    cout << "\n--- 9. STRATEGY PATTERN FOR PRODUCT DISCOUNTS ---\n";
    // Apply 10% percentage discount to Basmati Rice
    auto tenPercentDiscount = make_shared<PercentageDiscount>(10.0);
    p1->setDiscount(tenPercentDiscount);

    // Apply flat Rs. 12.00 discount to Organic Milk
    auto flatDiscount = make_shared<FixedAmountDiscount>(FixedAmountDiscount::fromRupees(12.0));
    p2->setDiscount(flatDiscount);

    cout << "Updated Catalog with Configured Strategies:\n";
    p1->display();
    p2->display();
    p3->display();

    // -------------------------------------------------------------
    // 10. Billing Domain, Exception Handling, & Immutability
    // -------------------------------------------------------------
    cout << "\n--- 10. BILLING OPERATIONS & TRANSACTIONAL STOCK VALIDATION ---\n";
    Bill bill1;
    try {
        cout << "Adding 2 units of Rice to Bill 1...\n";
        bill1.addItem(*p1, 2);

        cout << "Adding 3 units of Milk to Bill 1...\n";
        bill1.addItem(*p2, 3);

        cout << "Attempting to add 999 units of Salt (should trigger exception)...\n";
        bill1.addItem(*p3, 999);
    } catch (const exception& ex) {
        cout << "[HANDLED EXCEPTION]: " << ex.what() << endl;
    }

    cout << bill1 << endl;

    // -------------------------------------------------------------
    // 11. Historical Snapshot Immutability Verification
    // -------------------------------------------------------------
    cout << "\n--- 11. HISTORICAL INVOICE IMMUTABILITY DEMONSTRATION ---\n";
    cout << "Original Rice price in catalog: Rs. " << p1->getPrice() << endl;
    cout << "Now modifying Rice price in catalog to Rs. 350.00...\n";
    p1->setPriceInRupees(350.00);
    cout << "New Rice price in catalog: Rs. " << p1->getPrice() << endl;

    cout << "Re-checking previously issued Bill 1:\n";
    cout << bill1;
    cout << "Result: Previously generated invoice preserved its original Rs. 250.00 unit price!\n";

    // -------------------------------------------------------------
    // 12. Operator Overloading: BillItem (+, ==) and Bill (+)
    // -------------------------------------------------------------
    cout << "\n--- 12. OPERATOR OVERLOADING ON BILL & BILLITEM ---\n";
    BillItem itemA(101, "Basmati Rice 5kg", 25000, 2500, 2);
    BillItem itemB(101, "Basmati Rice 5kg", 25000, 2500, 3);
    BillItem combinedItem = itemA + itemB;
    cout << "itemA + itemB: " << combinedItem << endl;
    if (itemA == itemB) {
        cout << "Verification: itemA == itemB evaluated to TRUE (identical product & unit price)\n";
    }

    Bill bill2;
    bill2.addItem(*p3, 5); // 5 units of Salt
    Bill mergedBill = bill1 + bill2;
    cout << "\nMerged Bill (bill1 + bill2):" << mergedBill << endl;

    // -------------------------------------------------------------
    // 13. Generic Template Demonstrations: Repository<T> & ApiResponse<T>
    // -------------------------------------------------------------
    cout << "\n--- 13. GENERIC TEMPLATE DEMONSTRATIONS ---\n";
    cout << "[Template 1]: Repository<shared_ptr<Product>> (Polymorphic Storage)\n";
    Repository<shared_ptr<Product>> productRepo;
    productRepo.add(make_shared<Product>(*p1));
    productRepo.add(make_shared<Perishable>(*p2));
    productRepo.add(make_shared<NonPerishable>(*p3));
    cout << "Total items in polymorphic productRepo: " << productRepo.count() << endl;

    auto foundProduct = productRepo.find([](const shared_ptr<Product>& prod) {
        return prod->getId() == 102;
    });
    if (foundProduct.has_value()) {
        cout << "Repository successfully found product by ID 102: " << (*foundProduct)->getName()
             << " (" << (*foundProduct)->getProductTypeString() << ")" << endl;
    }

    auto perishableList = productRepo.filter([](const shared_ptr<Product>& prod) {
        return prod->getType() == ProductType::PERISHABLE;
    });
    cout << "Filtered perishable products count: " << perishableList.size()
         << " (Correctly preserved via smart-pointer polymorphism!)" << endl;

    cout << "\n[Template 2]: ApiResponse<T>\n";
    auto responseOk = ApiResponse<Product>::ok(*p1, "Product fetched successfully");
    cout << "ApiResponse Status: " << (responseOk.isSuccess() ? "SUCCESS" : "ERROR")
         << " | Message: " << responseOk.getMessage()
         << " | Product: " << responseOk.getData().getName()
         << " | Timestamp: " << responseOk.getTimestamp() << endl;

    auto responseErr = ApiResponse<string>::error("Database connection timeout");
    cout << "ApiResponse Status: " << (responseErr.isSuccess() ? "SUCCESS" : "ERROR")
         << " | Message: " << responseErr.getMessage() << endl;

    // -------------------------------------------------------------
    // 14. Virtual Destructor & Dynamic Cleanup
    // -------------------------------------------------------------
    cout << "\n--- 14. DYNAMIC MEMORY CLEANUP & VIRTUAL DESTRUCTOR ---\n";
    cout << "Products currently in memory: " << Product::getTotalProducts() << endl;
    delete p1;
    delete p2;
    delete p3;
    cout << "Products remaining after delete: " << Product::getTotalProducts() << endl;

    // -------------------------------------------------------------
    // 15. SQLite Database Persistence Demonstration (Stage 2)
    // -------------------------------------------------------------
    cout << "\n--- 15. SQLITE DATABASE PERSISTENCE DEMONSTRATION ---\n";
    const string demoDb = "data/supermarket_demo.db";
    std::filesystem::remove(demoDb);
    std::filesystem::remove(demoDb + "-wal");
    std::filesystem::remove(demoDb + "-shm");

    {
        cout << "Opening SQLite Database Connection at: " << demoDb << "\n";
        DatabaseConnection db(demoDb);
        DatabaseMigrator::migrate(db);
        cout << "Schema successfully migrated! PRAGMA user_version: "
             << DatabaseMigrator::getCurrentVersion(db) << "\n";

        BrandRepository brandRepo(db);
        CategoryRepository catRepo(db);
        ProductRepository prodRepo(db);
        BillRepository billRepo(db);
        InventoryRepository invRepo(db);

        int b1 = brandRepo.insert("Fortune");
        int c1 = catRepo.insert("Edible Oils");
        cout << "Inserted Brand: Fortune [ID: " << b1 << "] and Category: Edible Oils [ID: " << c1 << "]\n";

        NonPerishable oil(0, "SKU-OIL-101", "Fortune Sunflower Oil 1L", b1, c1, 16500, 50,
                          make_shared<PercentageDiscount>(5.0)); // Rs. 165.00 with 5% off
        int oilId = prodRepo.insert(oil);
        cout << "Persisted Product into SQLite [ID: " << oilId << "] Stock: 50\n";

        // Query product back from SQLite
        auto dbProduct = prodRepo.findById(oilId);
        if (dbProduct.has_value()) {
            cout << "Retrieved from DB: " << (*dbProduct)->getName()
                 << " | Selling Price: Rs." << (*dbProduct)->getPrice()
                 << " | Discounted Price: Rs." << (*dbProduct)->getDiscountedPriceInRupees() << "\n";

            // Perform transactional checkout in SQLite
            Bill dbBill;
            dbBill.addItem(**dbProduct, 5); // 5 units

            int billId = billRepo.saveBill("INV-DEMO-2026-0001", dbBill);
            cout << "Successfully finalized and saved invoice to SQLite! Bill ID: " << billId << "\n";

            // Verify updated inventory and movement
            auto oilAfter = prodRepo.findById(oilId);
            cout << "Updated stock in DB after sale: " << (*oilAfter)->getStock() << " units (reduced from 50)\n";

            auto movements = invRepo.getMovementsByProduct(oilId);
            cout << "Inventory movements logged in DB: " << movements.size()
                 << " (Type: " << movementTypeToString(movements[0].movementType)
                 << ", Qty: " << movements[0].quantityChange << ")\n";

            // Retrieve invoice historical record
            auto invoiceRecord = billRepo.findByBillNumber("INV-DEMO-2026-0001");
            if (invoiceRecord.has_value()) {
                cout << "Retrieved historical invoice from DB: " << invoiceRecord->billNumber
                     << " | Final Amount: Rs." << invoiceRecord->getFinalAmountInRupees()
                     << " | Line items stored: " << invoiceRecord->items.size() << "\n";
            }
        }
    }

    cout << "\n=================================================================\n";
    cout << "               ALL DEMONSTRATIONS COMPLETED SUCCESSFULLY         \n";
    cout << "=================================================================\n";

    return 0;
}
