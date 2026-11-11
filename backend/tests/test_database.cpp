#include "database/DatabaseConnection.hpp"
#include "database/DatabaseMigrator.hpp"
#include "database/Transaction.hpp"
#include "database/PreparedStatement.hpp"
#include "repositories/BrandRepository.hpp"
#include "repositories/CategoryRepository.hpp"
#include "repositories/ProductRepository.hpp"
#include "repositories/BillRepository.hpp"
#include "repositories/InventoryRepository.hpp"
#include "models/Perishable.hpp"
#include "models/NonPerishable.hpp"
#include "models/Discount.hpp"
#include <iostream>
#include <filesystem>
#include <cassert>
#include <stdexcept>
#include <memory>

#define TEST_ASSERT(cond) \
    do { \
        if (!(cond)) { \
            throw std::runtime_error(std::string("Test assertion failed: ") + #cond + " at line " + std::to_string(__LINE__)); \
        } \
    } while (0)

const std::string TEST_DB_PATH = "test_supermarket.db";

void cleanTestDb() {
    std::filesystem::remove(TEST_DB_PATH);
    std::filesystem::remove(TEST_DB_PATH + "-wal");
    std::filesystem::remove(TEST_DB_PATH + "-shm");
}

void testDatabaseInitialization() {
    std::cout << "[RUNNING] testDatabaseInitialization...\n";
    cleanTestDb();

    {
        DatabaseConnection conn(TEST_DB_PATH);
        TEST_ASSERT(conn.isOpen());

        DatabaseMigrator::migrate(conn);
        int v = DatabaseMigrator::getCurrentVersion(conn);
        TEST_ASSERT(v == 2);

        // Verify repeatable migration is non-destructive
        DatabaseMigrator::migrate(conn);
        TEST_ASSERT(DatabaseMigrator::getCurrentVersion(conn) == 2);
    }

    // Reopen database and verify version remains 2
    {
        DatabaseConnection conn(TEST_DB_PATH);
        TEST_ASSERT(DatabaseMigrator::getCurrentVersion(conn) == 2);
    }

    std::cout << "  -> PASSED\n";
}

void testBrandAndCategoryRepositories() {
    std::cout << "[RUNNING] testBrandAndCategoryRepositories...\n";
    cleanTestDb();
    DatabaseConnection conn(TEST_DB_PATH);
    DatabaseMigrator::migrate(conn);

    BrandRepository brandRepo(conn);
    CategoryRepository catRepo(conn);

    // 1. Insert Brands
    int amulId = brandRepo.insert("Amul");
    int nestleId = brandRepo.insert("Nestle");
    TEST_ASSERT(amulId > 0);
    TEST_ASSERT(nestleId > amulId);

    // 2. Find Brand
    auto b = brandRepo.findById(amulId);
    TEST_ASSERT(b.has_value());
    TEST_ASSERT(b->name == "Amul");

    auto bByName = brandRepo.findByName("Nestle");
    TEST_ASSERT(bByName.has_value());
    TEST_ASSERT(bByName->id == nestleId);

    // 3. Update Brand
    bool updated = brandRepo.update(nestleId, "Nestle India");
    TEST_ASSERT(updated);
    TEST_ASSERT(brandRepo.findById(nestleId)->name == "Nestle India");

    // 4. Duplicate Brand Name Rejection
    bool caughtDuplicate = false;
    try {
        brandRepo.insert("Amul");
    } catch (const std::exception&) {
        caughtDuplicate = true;
    }
    TEST_ASSERT(caughtDuplicate);

    // 5. Category Operations
    int dairyId = catRepo.insert("Dairy");
    int staplesId = catRepo.insert("Staples");
    TEST_ASSERT(dairyId > 0 && staplesId > dairyId);
    TEST_ASSERT(catRepo.getAll().size() == 2);

    std::cout << "  -> PASSED\n";
}

void testProductRepositoryCrudAndPolymorphism() {
    std::cout << "[RUNNING] testProductRepositoryCrudAndPolymorphism...\n";
    cleanTestDb();
    DatabaseConnection conn(TEST_DB_PATH);
    DatabaseMigrator::migrate(conn);

    BrandRepository brandRepo(conn);
    CategoryRepository catRepo(conn);
    ProductRepository prodRepo(conn);

    int brandId = brandRepo.insert("India Gate");
    int catId = catRepo.insert("Rice & Grains");

    // 1. Insert NonPerishable Product with 10% Discount
    NonPerishable rice(0, "SKU-RICE-001", "Basmati Classic 5kg", brandId, catId, 25000, 40,
                       std::make_shared<PercentageDiscount>(10.0));
    int riceId = prodRepo.insert(rice);
    TEST_ASSERT(riceId > 0);

    // 2. Insert Perishable Product with Fixed Discount
    Perishable milk(0, "SKU-MILK-002", "Fresh Cow Milk 1L", brandId, catId, 6000, 25, "2026-11-20",
                    std::make_shared<FixedAmountDiscount>(FixedAmountDiscount::fromRupees(5.0)));
    int milkId = prodRepo.insert(milk);
    TEST_ASSERT(milkId > 0);

    // 3. Find by ID and Verify Polymorphic Reconstitution
    auto fetchedRice = prodRepo.findById(riceId);
    TEST_ASSERT(fetchedRice.has_value());
    TEST_ASSERT((*fetchedRice)->getName() == "Basmati Classic 5kg");
    TEST_ASSERT((*fetchedRice)->getType() == ProductType::NON_PERISHABLE);
    TEST_ASSERT((*fetchedRice)->getDiscountedPriceInPaise() == 22500); // 10% off 25000

    auto fetchedMilk = prodRepo.findById(milkId);
    TEST_ASSERT(fetchedMilk.has_value());
    TEST_ASSERT((*fetchedMilk)->getType() == ProductType::PERISHABLE);
    auto perishableMilk = std::dynamic_pointer_cast<Perishable>(*fetchedMilk);
    TEST_ASSERT(perishableMilk != nullptr);
    TEST_ASSERT(perishableMilk->getExpiry() == "2026-11-20");
    TEST_ASSERT(perishableMilk->getDiscountedPriceInPaise() == 5500); // Rs. 5 off 6000

    // 4. Update Product
    perishableMilk->reduceStock(5);
    perishableMilk->setPriceInRupees(65.00);
    bool updOk = prodRepo.update(*perishableMilk);
    TEST_ASSERT(updOk);

    auto updatedMilk = prodRepo.findById(milkId);
    TEST_ASSERT((*updatedMilk)->getStock() == 20);
    TEST_ASSERT((*updatedMilk)->getPriceInPaise() == 6500);

    // 5. Search Products
    auto searchResults = prodRepo.search("Basmati");
    TEST_ASSERT(searchResults.size() == 1);
    TEST_ASSERT(searchResults[0]->getSku() == "SKU-RICE-001");

    // 6. Soft Delete
    bool softDelOk = prodRepo.softDelete(riceId);
    TEST_ASSERT(softDelOk);
    TEST_ASSERT(prodRepo.getAll(true).size() == 1);  // active only
    TEST_ASSERT(prodRepo.getAll(false).size() == 2); // all including deleted

    std::cout << "  -> PASSED\n";
}

void testBillingPersistenceAndStockSafety() {
    std::cout << "[RUNNING] testBillingPersistenceAndStockSafety...\n";
    cleanTestDb();
    DatabaseConnection conn(TEST_DB_PATH);
    DatabaseMigrator::migrate(conn);

    BrandRepository brandRepo(conn);
    CategoryRepository catRepo(conn);
    ProductRepository prodRepo(conn);
    BillRepository billRepo(conn);
    InventoryRepository invRepo(conn);

    int brandId = brandRepo.insert("Tata");
    int catId = catRepo.insert("Beverages");

    NonPerishable tea(0, "SKU-TEA-001", "Tata Tea Gold 500g", brandId, catId, 30000, 15,
                      std::make_shared<PercentageDiscount>(10.0)); // Rs. 300 - 10% = Rs. 270
    int teaId = prodRepo.insert(tea);

    // Create an in-memory bill
    auto teaProd = prodRepo.findById(teaId);
    TEST_ASSERT(teaProd.has_value());

    Bill customerBill;
    customerBill.addItem(**teaProd, 3); // 3 units @ Rs. 270 = Rs. 810 final (subtotal 900, discount 90)

    // Save Bill to SQLite
    int billId = billRepo.saveBill("INV-20261108-0001", customerBill);
    TEST_ASSERT(billId > 0);

    // 1. Verify Stock Reduced in SQLite
    auto teaAfterSale = prodRepo.findById(teaId);
    TEST_ASSERT(teaAfterSale.has_value());
    TEST_ASSERT((*teaAfterSale)->getStock() == 12); // 15 - 3 = 12

    // 2. Verify Inventory Movement Logged
    auto movements = invRepo.getMovementsByProduct(teaId);
    TEST_ASSERT(movements.size() == 1);
    TEST_ASSERT(movements[0].movementType == MovementType::SALE);
    TEST_ASSERT(movements[0].quantityChange == -3);
    TEST_ASSERT(movements[0].previousStock == 15);
    TEST_ASSERT(movements[0].newStock == 12);
    TEST_ASSERT(movements[0].relatedBillId == billId);

    // 3. Verify Bill Retrieval with Line Items
    auto savedBill = billRepo.findByBillNumber("INV-20261108-0001");
    TEST_ASSERT(savedBill.has_value());
    TEST_ASSERT(savedBill->subtotalPaise == 90000);
    TEST_ASSERT(savedBill->totalDiscountPaise == 9000);
    TEST_ASSERT(savedBill->finalAmountPaise == 81000);
    TEST_ASSERT(savedBill->items.size() == 1);
    TEST_ASSERT(savedBill->items[0].productName == "Tata Tea Gold 500g");
    TEST_ASSERT(savedBill->items[0].quantity == 3);
    TEST_ASSERT(savedBill->items[0].finalUnitPricePaise == 27000);

    // 4. Historical Snapshot Immutability Test
    // Now modify the original product in the database: change price to Rs. 500, remove discount, change name
    NonPerishable updatedTea(teaId, "SKU-TEA-001", "Tata Premium Gold Extra 500g", brandId, catId, 50000, 12,
                            std::make_shared<NoDiscount>());
    prodRepo.update(updatedTea);

    // Re-fetch the previously generated invoice: Historical snapshot must remain 100% UNCHANGED!
    auto historicalBill = billRepo.findByBillNumber("INV-20261108-0001");
    TEST_ASSERT(historicalBill.has_value());
    TEST_ASSERT(historicalBill->finalAmountPaise == 81000);
    TEST_ASSERT(historicalBill->items[0].productName == "Tata Tea Gold 500g");
    TEST_ASSERT(historicalBill->items[0].finalUnitPricePaise == 27000);

    std::cout << "  -> PASSED\n";
}

void testTransactionRollbackOnStockFailure() {
    std::cout << "[RUNNING] testTransactionRollbackOnStockFailure...\n";
    cleanTestDb();
    DatabaseConnection conn(TEST_DB_PATH);
    DatabaseMigrator::migrate(conn);

    BrandRepository brandRepo(conn);
    CategoryRepository catRepo(conn);
    ProductRepository prodRepo(conn);
    BillRepository billRepo(conn);

    int brandId = brandRepo.insert("Britannia");
    int catId = catRepo.insert("Snacks");

    NonPerishable biscuits(0, "SKU-BIS-001", "Good Day 100g", brandId, catId, 2500, 5); // 5 in stock
    int bisId = prodRepo.insert(biscuits);

    // Construct a bill requesting 10 units (exceeds 5 available)
    Bill badBill;
    BillItem oversizedItem(bisId, "Good Day 100g", 2500, 0, 10);
    badBill.addItemDirect(oversizedItem);

    bool caught = false;
    try {
        billRepo.saveBill("INV-FAILED-001", badBill);
    } catch (const std::exception&) {
        caught = true;
    }
    TEST_ASSERT(caught);

    // Verify stock remains untouched at 5 and invoice was NOT created
    auto bisAfter = prodRepo.findById(bisId);
    TEST_ASSERT(bisAfter.has_value());
    TEST_ASSERT((*bisAfter)->getStock() == 5);

    auto nonExistent = billRepo.findByBillNumber("INV-FAILED-001");
    TEST_ASSERT(!nonExistent.has_value());

    std::cout << "  -> PASSED\n";
}

void testFailureRecoveryAndTransactionRollback() {
    std::cout << "[RUNNING] testFailureRecoveryAndTransactionRollback...\n";
    cleanTestDb();
    DatabaseConnection conn(TEST_DB_PATH);
    DatabaseMigrator::migrate(conn);

    BrandRepository brandRepo(conn);
    CategoryRepository catRepo(conn);
    ProductRepository prodRepo(conn);
    BillRepository billRepo(conn);
    InventoryRepository invRepo(conn);

    int brandId = brandRepo.insert("Tata");
    int catId = catRepo.insert("Staples");
    NonPerishable salt(0, "SKU-SALT-01", "Tata Salt 1kg", brandId, catId, 2800, 5);
    int saltId = prodRepo.insert(salt);

    // 1. Invalid product during checkout -> rolls back cleanly
    {
        Bill b;
        b.addItemDirect(BillItem(99999, "Ghost Item", 1000, 0, 1));
        bool thrown = false;
        try { billRepo.saveBill("INV-REC-01", b); } catch (const std::exception&) { thrown = true; }
        TEST_ASSERT(thrown);
        TEST_ASSERT(!billRepo.findByBillNumber("INV-REC-01").has_value());
        TEST_ASSERT(billRepo.getTotalCount() == 0);
    }

    // 2. Cumulative duplicate product lines exceeding stock -> rolls back before inserting bill
    {
        Bill b;
        b.addItemDirect(BillItem(saltId, "Tata Salt 1kg", 2800, 0, 3));
        b.addItemDirect(BillItem(saltId, "Tata Salt 1kg", 2800, 0, 3)); // total 6 > 5 stock
        bool thrown = false;
        try { billRepo.saveBill("INV-REC-DUP-LINE", b); } catch (const std::exception&) { thrown = true; }
        TEST_ASSERT(thrown);
        TEST_ASSERT((*prodRepo.findById(saltId))->getStock() == 5);
        TEST_ASSERT(billRepo.getTotalCount() == 0);
        TEST_ASSERT(invRepo.getTotalCount() == 0);
    }

    // 3. Failure BEFORE bill item insertion (bill row inserted inside tx, exception thrown prior to commit)
    {
        bool thrown = false;
        try {
            Transaction tx(conn);
            PreparedStatement bStmt(conn, "INSERT INTO bills (bill_number, subtotal_paise, total_discount_paise, final_amount_paise) VALUES (?, 2800, 0, 2800);");
            bStmt.bind(1, std::string("INV-PARTIAL-1"));
            bStmt.execute();
            throw std::runtime_error("Simulated failure before bill_items insert");
        } catch (const std::exception&) {
            thrown = true;
        }
        TEST_ASSERT(thrown);
        TEST_ASSERT(!billRepo.findByBillNumber("INV-PARTIAL-1").has_value());
        TEST_ASSERT(billRepo.getTotalCount() == 0);
    }

    // 4. Failure DURING stock update (bill + bill_item inserted, stock CHECK constraint violated inside tx)
    {
        bool thrown = false;
        try {
            Transaction tx(conn);
            PreparedStatement bStmt(conn, "INSERT INTO bills (bill_number, subtotal_paise, total_discount_paise, final_amount_paise) VALUES (?, 2800, 0, 2800);");
            bStmt.bind(1, std::string("INV-PARTIAL-2"));
            bStmt.execute();
            int bid = static_cast<int>(conn.getLastInsertRowId());

            PreparedStatement iStmt(conn, "INSERT INTO bill_items (bill_id, product_id, product_name, brand_name, unit_price_paise, discount_type, discount_value, unit_discount_paise, final_unit_price_paise, quantity, line_total_paise) VALUES (?, ?, 'Tata Salt 1kg', 'Tata', 2800, 'NONE', 0, 0, 2800, 1, 2800);");
            iStmt.bind(1, bid);
            iStmt.bind(2, saltId);
            iStmt.execute();

            // Force CHECK (stock >= 0) constraint failure during stock update!
            PreparedStatement uStmt(conn, "UPDATE products SET stock = -1 WHERE id = ?;");
            uStmt.bind(1, saltId);
            uStmt.execute();
            tx.commit();
        } catch (const std::exception&) {
            thrown = true;
        }
        TEST_ASSERT(thrown);
        TEST_ASSERT(billRepo.getTotalCount() == 0);
        PreparedStatement itemCountStmt(conn, "SELECT COUNT(*) FROM bill_items;");
        TEST_ASSERT(itemCountStmt.step() && itemCountStmt.getInt(0) == 0);
        TEST_ASSERT((*prodRepo.findById(saltId))->getStock() == 5);
        TEST_ASSERT(invRepo.getTotalCount() == 0);
    }

    // 5. Failure AFTER stock update & movement, BEFORE tx.commit() -> RAII destructor rollback
    {
        bool thrown = false;
        try {
            Transaction tx(conn);
            prodRepo.updateStock(saltId, 2);
            invRepo.recordMovement(saltId, MovementType::SALE, -3, 5, 2, "Uncommitted sale");
            throw std::runtime_error("Simulated crash before commit");
        } catch (const std::exception&) {
            thrown = true;
        }
        TEST_ASSERT(thrown);
        TEST_ASSERT((*prodRepo.findById(saltId))->getStock() == 5);
        TEST_ASSERT(invRepo.getTotalCount() == 0);
    }

    // 6. Verify duplicate bill_number DB UNIQUE constraint rollback cleanly
    {
        Bill b1;
        b1.addItemDirect(BillItem(saltId, "Tata Salt 1kg", 2800, 0, 1));
        int okId = billRepo.saveBill("INV-UNIQUE-1", b1);
        TEST_ASSERT(okId > 0);
        TEST_ASSERT((*prodRepo.findById(saltId))->getStock() == 4);

        bool dupThrown = false;
        try {
            Bill b2;
            b2.addItemDirect(BillItem(saltId, "Tata Salt 1kg", 2800, 0, 2));
            billRepo.saveBill("INV-UNIQUE-1", b2);
        } catch (const std::exception&) {
            dupThrown = true;
        }
        TEST_ASSERT(dupThrown);
        TEST_ASSERT((*prodRepo.findById(saltId))->getStock() == 4);
        TEST_ASSERT(billRepo.getTotalCount() == 1);
        TEST_ASSERT(invRepo.getTotalCount() == 1);
    }

    // 7. SQLite PRAGMA integrity_check and foreign_key_check
    {
        PreparedStatement ic(conn, "PRAGMA integrity_check;");
        TEST_ASSERT(ic.step() && ic.getString(0) == "ok");
        PreparedStatement fkc(conn, "PRAGMA foreign_key_check;");
        TEST_ASSERT(!fkc.step());
    }

    std::cout << "  -> PASSED\n";
}

int main() {
    std::cout << "=====================================================\n";
    std::cout << "       RUNNING SQLITE DATABASE PERSISTENCE TESTS     \n";
    std::cout << "=====================================================\n";
    try {
        testDatabaseInitialization();
        testBrandAndCategoryRepositories();
        testProductRepositoryCrudAndPolymorphism();
        testBillingPersistenceAndStockSafety();
        testTransactionRollbackOnStockFailure();
        testFailureRecoveryAndTransactionRollback();
        cleanTestDb();
        std::cout << "=====================================================\n";
        std::cout << "     ALL DATABASE PERSISTENCE TESTS PASSED (6/6)     \n";
        std::cout << "=====================================================\n";
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "DATABASE TEST FAILED: " << e.what() << "\n";
        cleanTestDb();
        return 1;
    }
}
