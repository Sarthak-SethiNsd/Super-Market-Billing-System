#include "database/DemoDataSeeder.hpp"
#include "database/DatabaseConnection.hpp"
#include "database/PreparedStatement.hpp"
#include "database/Transaction.hpp"
#include "repositories/BrandRepository.hpp"
#include "repositories/CategoryRepository.hpp"
#include "repositories/ProductRepository.hpp"
#include "repositories/InventoryRepository.hpp"
#include "repositories/CustomerRepository.hpp"
#include "repositories/BillRepository.hpp"
#include "repositories/UserRepository.hpp"
#include "auth/AuthService.hpp"
#include "models/Perishable.hpp"
#include "models/NonPerishable.hpp"
#include "models/Discount.hpp"
#include <iostream>
#include <vector>
#include <memory>
#include <string>

struct InitialProductDef {
    std::string sku;
    std::string name;
    std::string brandName;
    std::string categoryName;
    bool isPerishable;
    int64_t priceInPaise;
    int stock;
    std::string expiryDate;
    std::string discountType;
    double discountValue;
};

const std::vector<InitialProductDef> INITIAL_PRODUCTS = {
    {"SKU-GRAIN-001", "Aashirvaad Superior MP Sharbati Whole Wheat Atta 5kg", "Aashirvaad", "Grains & Staples", false, 29500, 60, "", "NONE", 0.0},
    {"SKU-GRAIN-002", "India Gate Basmati Rice Classic 5kg", "India Gate", "Grains & Staples", false, 62500, 45, "", "PERCENTAGE", 10.0},
    {"SKU-GRAIN-003", "Tata Sampann Unpolished Toor Dal 1kg", "Tata Sampann", "Grains & Staples", false, 18500, 50, "", "NONE", 0.0},
    {"SKU-GRAIN-004", "Fortune Sunlite Refined Sunflower Oil 1L Pouch", "Fortune", "Grains & Staples", false, 14500, 70, "", "FIXED", 1000.0},
    {"SKU-DAIRY-001", "Amul Taaza Homogenised Toned Milk 1L", "Amul", "Dairy & Chilled", true, 5600, 90, "2026-12-05", "NONE", 0.0},
    {"SKU-DAIRY-002", "Amul Salted Pasteurised Butter 500g", "Amul", "Dairy & Chilled", true, 27500, 45, "2027-04-15", "PERCENTAGE", 5.0},
    {"SKU-DAIRY-003", "Amul Malai Fresh Paneer 200g", "Amul", "Dairy & Chilled", true, 9200, 35, "2026-11-28", "NONE", 0.0},
    {"SKU-DAIRY-004", "Mother Dairy Classic Dahi 400g Cup", "Mother Dairy", "Dairy & Chilled", true, 4500, 40, "2026-11-25", "NONE", 0.0},
    {"SKU-SNACK-001", "Haldiram's Nagpur Aloo Bhujia 400g", "Haldiram's", "Snacks & Confectionery", false, 11500, 65, "", "PERCENTAGE", 10.0},
    {"SKU-SNACK-002", "Haldiram's Gulab Jamun Tin 1kg", "Haldiram's", "Snacks & Confectionery", false, 24000, 30, "", "NONE", 0.0},
    {"SKU-SNACK-003", "Britannia Good Day Butter Cookies 600g Value Pack", "Britannia", "Snacks & Confectionery", false, 13000, 75, "", "FIXED", 1500.0},
    {"SKU-SNACK-004", "Parle-G Original Glucose Biscuits 800g Family Pack", "Parle", "Snacks & Confectionery", false, 7500, 100, "", "NONE", 0.0},
    {"SKU-BEV-001", "Tata Tea Premium Desh Ki Chai 500g", "Tata Tea", "Beverages", false, 26000, 55, "", "PERCENTAGE", 5.0},
    {"SKU-BEV-002", "Bru Instant Coffee Chicory Mixture 200g Jar", "Bru", "Beverages", false, 34000, 40, "", "NONE", 0.0},
    {"SKU-BEV-003", "Real Fruit Power Mixed Fruit Juice 1L", "Real", "Beverages", true, 12000, 45, "2027-02-10", "PERCENTAGE", 10.0},
    {"SKU-CARE-001", "Dettol Original Germ Protection Bathing Soap (125g x 4)", "Dettol", "Personal Care", false, 19800, 50, "", "PERCENTAGE", 8.0},
    {"SKU-CARE-002", "Colgate Strong Teeth Dental Cream Toothpaste 300g", "Colgate", "Personal Care", false, 15500, 60, "", "NONE", 0.0},
    {"SKU-CARE-003", "Head & Shoulders Anti-Dandruff Cool Menthol Shampoo 340ml", "Head & Shoulders", "Personal Care", false, 38000, 25, "", "FIXED", 3000.0},
    {"SKU-HOME-001", "Surf Excel Quick Wash Detergent Powder 2kg", "Surf Excel", "Household Essentials", false, 39000, 45, "", "PERCENTAGE", 12.0},
    {"SKU-HOME-002", "Vim Dishwash Gel Lemon 750ml Bottle", "Vim", "Household Essentials", false, 15500, 65, "", "NONE", 0.0},
    {"SKU-HOME-003", "Harpic Power Plus Disinfectant Toilet Cleaner 1L", "Harpic", "Household Essentials", false, 19500, 40, "", "NONE", 0.0},
    {"SKU-FRESH-001", "Fresh Shimla Royal Delicious Apples 1kg Pack", "Fresh Farm Direct", "Fruits & Vegetables", true, 18000, 35, "2026-11-26", "PERCENTAGE", 10.0},
    {"SKU-FRESH-002", "Fresh Robusta Bananas 1 Dozen", "Fresh Farm Direct", "Fruits & Vegetables", true, 6000, 45, "2026-11-20", "NONE", 0.0},
    {"SKU-FRESH-003", "Fresh Hybrid Tomatoes 1kg Net Bag", "Fresh Farm Direct", "Fruits & Vegetables", true, 3800, 50, "2026-11-22", "NONE", 0.0},
    {"SKU-FRESH-004", "Fresh Organic Baby Spinach Palak 250g Bunch", "Fresh Farm Direct", "Fruits & Vegetables", true, 2500, 15, "2026-11-19", "NONE", 0.0}
};

bool DemoDataSeeder::seedIfEmpty(DatabaseConnection& db) {
    // 1. Check idempotency marker
    {
        PreparedStatement checkStmt(db, "SELECT value FROM system_metadata WHERE key = 'demo_sales_seeded';");
        if (checkStmt.step()) {
            return false; // Already seeded, skip
        }
    }

    std::cout << "[DEMO SEEDER] Initializing 15 realistic demonstration sales & synthetic customers...\n";

    // 2. Ensure staff account exists
    UserRepository userRepo(db);
    if (!userRepo.adminExists()) {
        AuthService auth(db, 3600);
        auth.createOrUpdateStaff("Staff@123");
        std::cout << "[DEMO SEEDER] Created staff account\n";
    }

    BrandRepository brandRepo(db);
    CategoryRepository catRepo(db);
    ProductRepository productRepo(db);
    InventoryRepository invRepo(db);
    CustomerRepository custRepo(db);
    BillRepository billRepo(db);

    // 3. Seed base categories, brands, products if needed
    for (const auto& item : INITIAL_PRODUCTS) {
        if (!catRepo.findByName(item.categoryName).has_value()) {
            catRepo.insert(item.categoryName);
        }
        if (!brandRepo.findByName(item.brandName).has_value()) {
            brandRepo.insert(item.brandName);
        }
        auto brand = brandRepo.findByName(item.brandName);
        auto category = catRepo.findByName(item.categoryName);
        if (brand.has_value() && category.has_value()) {
            if (!catRepo.hasBrand(category->id, brand->id)) {
                catRepo.addBrand(category->id, brand->id);
            }
        }

        if (!productRepo.findBySku(item.sku).has_value()) {

            std::shared_ptr<IDiscountStrategy> discount;
            if (item.discountType == "PERCENTAGE") {
                discount = std::make_shared<PercentageDiscount>(item.discountValue);
            } else if (item.discountType == "FIXED") {
                discount = std::make_shared<FixedAmountDiscount>(static_cast<int64_t>(item.discountValue));
            } else {
                discount = std::make_shared<NoDiscount>();
            }

            int newId = 0;
            if (item.isPerishable) {
                Perishable prod(0, item.sku, item.name, brand->id, category->id,
                                item.priceInPaise, item.stock, item.expiryDate, discount);
                newId = productRepo.insert(prod);
            } else {
                NonPerishable prod(0, item.sku, item.name, brand->id, category->id,
                                   item.priceInPaise, item.stock, discount);
                newId = productRepo.insert(prod);
            }

            invRepo.recordMovement(newId, MovementType::ADDITION, item.stock, 0, item.stock, "Initial inventory stock");
        }
    }

    // 4. Seed 5 Synthetic Customers
    struct SyntheticCustomerDef {
        std::string code;
        std::string name;
        std::string phone;
        std::string email;
    };

    const std::vector<SyntheticCustomerDef> SYNTHETIC_CUSTOMERS = {
        {"CUST-1001", "Aarav Sharma", "+91 98765 43210", "aarav.sharma@example.com"},
        {"CUST-1002", "Priya Patel", "+91 98123 45678", "priya.patel@example.com"},
        {"CUST-1003", "Vikram Malhotra", "+91 97234 56789", "vikram.m@example.com"},
        {"CUST-1004", "Sneha Reddy", "+91 96345 67890", "sneha.reddy@example.com"},
        {"CUST-1005", "Rajesh Kumar", "+91 95456 78901", "rajesh.k@example.com"}
    };

    std::vector<int> customerIds;
    for (const auto& cDef : SYNTHETIC_CUSTOMERS) {
        auto existing = custRepo.findByCode(cDef.code);
        if (existing.has_value()) {
            customerIds.push_back(existing->id);
        } else {
            CustomerRecord c;
            c.customerCode = cDef.code;
            c.fullName = cDef.name;
            c.phone = cDef.phone;
            c.email = cDef.email;
            c.isActive = true;
            int cid = custRepo.insert(c);
            customerIds.push_back(cid);
        }
    }

    // 5. Seed 15 Completed Demo Sales
    struct DemoSaleItem {
        std::string sku;
        int qty;
    };

    struct DemoSaleDef {
        std::string billNumber;
        std::string createdAt;
        int customerIdx; // 0..4 for customers, -1 for walk-in
        std::vector<DemoSaleItem> items;
    };

    const std::vector<DemoSaleDef> DEMO_SALES = {
        // Bill 1: Aarav Sharma (2026-10-18)
        {"INV-20261018-001", "2026-10-18 10:24:12", 0, {{"SKU-GRAIN-001", 1}, {"SKU-GRAIN-004", 1}, {"SKU-BEV-001", 1}}},
        // Bill 2: Priya Patel (2026-10-20)
        {"INV-20261020-002", "2026-10-20 14:15:30", 1, {{"SKU-GRAIN-002", 1}, {"SKU-GRAIN-003", 2}, {"SKU-DAIRY-002", 1}}},
        // Bill 3: Walk-in (2026-10-22)
        {"INV-20261022-003", "2026-10-22 17:08:45", -1, {{"SKU-SNACK-001", 2}, {"SKU-SNACK-004", 3}}},
        // Bill 4: Vikram Malhotra (2026-10-24)
        {"INV-20261024-004", "2026-10-24 11:32:19", 2, {{"SKU-CARE-001", 1}, {"SKU-CARE-002", 2}, {"SKU-CARE-003", 1}}},
        // Bill 5: Sneha Reddy (2026-10-26)
        {"INV-20261026-005", "2026-10-26 19:40:02", 3, {{"SKU-DAIRY-001", 2}, {"SKU-DAIRY-003", 1}, {"SKU-FRESH-002", 1}}},
        // Bill 6: Walk-in (2026-10-28)
        {"INV-20261028-006", "2026-10-28 12:15:20", -1, {{"SKU-SNACK-002", 1}, {"SKU-SNACK-003", 2}}},
        // Bill 7: Rajesh Kumar (2026-10-30)
        {"INV-20261030-007", "2026-10-30 16:50:11", 4, {{"SKU-HOME-001", 1}, {"SKU-HOME-002", 1}, {"SKU-HOME-003", 1}}},
        // Bill 8: Aarav Sharma (Repeat Visit, 2026-11-01)
        {"INV-20261101-008", "2026-11-01 10:45:55", 0, {{"SKU-GRAIN-001", 1}, {"SKU-GRAIN-003", 1}, {"SKU-DAIRY-001", 2}}},
        // Bill 9: Walk-in (2026-11-03)
        {"INV-20261103-009", "2026-11-03 15:20:40", -1, {{"SKU-BEV-003", 2}, {"SKU-BEV-002", 1}}},
        // Bill 10: Priya Patel (Repeat Visit, 2026-11-05)
        {"INV-20261105-010", "2026-11-05 18:35:10", 1, {{"SKU-GRAIN-002", 1}, {"SKU-DAIRY-002", 1}, {"SKU-DAIRY-004", 2}}},
        // Bill 11: Walk-in (2026-11-07)
        {"INV-20261107-011", "2026-11-07 13:10:05", -1, {{"SKU-FRESH-001", 1}, {"SKU-FRESH-003", 2}}},
        // Bill 12: Vikram Malhotra (Repeat Visit, 2026-11-09)
        {"INV-20261109-012", "2026-11-09 17:42:30", 2, {{"SKU-CARE-002", 2}, {"SKU-CARE-001", 1}, {"SKU-HOME-002", 1}}},
        // Bill 13: Sneha Reddy (Repeat Visit, 2026-11-11)
        {"INV-20261111-013", "2026-11-11 11:25:40", 3, {{"SKU-DAIRY-001", 3}, {"SKU-DAIRY-003", 2}, {"SKU-FRESH-002", 1}}},
        // Bill 14: Walk-in (2026-11-13)
        {"INV-20261113-014", "2026-11-13 16:05:15", -1, {{"SKU-SNACK-001", 1}, {"SKU-SNACK-003", 1}, {"SKU-BEV-003", 1}}},
        // Bill 15: Rajesh Kumar (Repeat Visit, 2026-11-15)
        {"INV-20261115-015", "2026-11-15 19:30:22", 4, {{"SKU-HOME-001", 1}, {"SKU-BEV-001", 1}, {"SKU-GRAIN-001", 1}}}
    };

    int billsSeeded = 0;
    for (const auto& s : DEMO_SALES) {
        std::optional<int> custId = std::nullopt;
        if (s.customerIdx >= 0 && s.customerIdx < static_cast<int>(customerIds.size())) {
            custId = customerIds[s.customerIdx];
        }

        Bill domainBill;
        for (const auto& item : s.items) {
            auto prodOpt = productRepo.findBySku(item.sku);
            if (prodOpt.has_value()) {
                domainBill.addItem(**prodOpt, item.qty);
            }
        }

        if (!domainBill.isEmpty()) {
            int billId = billRepo.saveBill(s.billNumber, domainBill, custId);

            // Update created_at timestamp on bill and its related inventory movements
            PreparedStatement updateBillDate(db, "UPDATE bills SET created_at = ? WHERE id = ?;");
            updateBillDate.bind(1, s.createdAt);
            updateBillDate.bind(2, billId);
            updateBillDate.execute();

            PreparedStatement updateMoveDate(db, "UPDATE inventory_movements SET created_at = ? WHERE related_bill_id = ?;");
            updateMoveDate.bind(1, s.createdAt);
            updateMoveDate.bind(2, billId);
            updateMoveDate.execute();

            billsSeeded++;
        }
    }

    // 6. Record seed completion marker
    PreparedStatement markerStmt(db, "INSERT OR REPLACE INTO system_metadata (key, value) VALUES ('demo_sales_seeded', 'v1');");
    markerStmt.execute();

    std::cout << "[DEMO SEEDER] Seeded " << billsSeeded << " realistic demonstration bills successfully.\n";
    return true;
}
