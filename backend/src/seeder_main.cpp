#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <filesystem>
#include <iomanip>

#include "database/DatabaseConnection.hpp"
#include "database/DatabaseMigrator.hpp"
#include "database/DemoDataSeeder.hpp"
#include "database/Transaction.hpp"
#include "repositories/BrandRepository.hpp"
#include "repositories/CategoryRepository.hpp"
#include "repositories/ProductRepository.hpp"
#include "repositories/InventoryRepository.hpp"
#include "repositories/UserRepository.hpp"
#include "auth/AuthService.hpp"
#include "models/Perishable.hpp"
#include "models/NonPerishable.hpp"
#include "models/Discount.hpp"

namespace fs = std::filesystem;

struct DemoProductDef {
    std::string sku;
    std::string name;
    std::string brandName;
    std::string categoryName;
    bool isPerishable;
    int64_t priceInPaise;
    int stock;
    std::string expiryDate;
    std::string discountType; // "NONE", "PERCENTAGE", "FIXED"
    double discountValue;     // % or paise
};

// Comprehensive, realistic Indian supermarket demonstration dataset across 7 categories
const std::vector<DemoProductDef> DEMO_PRODUCTS = {
    // 1. Grains & Staples (Non-Perishable)
    {"SKU-GRAIN-001", "Aashirvaad Superior MP Sharbati Whole Wheat Atta 5kg", "Aashirvaad", "Grains & Staples", false, 29500, 40, "", "NONE", 0.0},
    {"SKU-GRAIN-002", "India Gate Basmati Rice Classic 5kg", "India Gate", "Grains & Staples", false, 62500, 25, "", "PERCENTAGE", 10.0},
    {"SKU-GRAIN-003", "Tata Sampann Unpolished Toor Dal 1kg", "Tata Sampann", "Grains & Staples", false, 18500, 35, "", "NONE", 0.0},
    {"SKU-GRAIN-004", "Fortune Sunlite Refined Sunflower Oil 1L Pouch", "Fortune", "Grains & Staples", false, 14500, 50, "", "FIXED", 1000.0},

    // 2. Dairy & Chilled (Perishable)
    {"SKU-DAIRY-001", "Amul Taaza Homogenised Toned Milk 1L", "Amul", "Dairy & Chilled", true, 5600, 60, "2026-12-05", "NONE", 0.0},
    {"SKU-DAIRY-002", "Amul Salted Pasteurised Butter 500g", "Amul", "Dairy & Chilled", true, 27500, 30, "2027-04-15", "PERCENTAGE", 5.0},
    {"SKU-DAIRY-003", "Amul Malai Fresh Paneer 200g", "Amul", "Dairy & Chilled", true, 9200, 18, "2026-11-28", "NONE", 0.0},
    {"SKU-DAIRY-004", "Mother Dairy Classic Dahi 400g Cup", "Mother Dairy", "Dairy & Chilled", true, 4500, 22, "2026-11-25", "NONE", 0.0},

    // 3. Snacks & Confectionery (Non-Perishable)
    {"SKU-SNACK-001", "Haldiram's Nagpur Aloo Bhujia 400g", "Haldiram's", "Snacks & Confectionery", false, 11500, 45, "", "PERCENTAGE", 10.0},
    {"SKU-SNACK-002", "Haldiram's Gulab Jamun Tin 1kg", "Haldiram's", "Snacks & Confectionery", false, 24000, 20, "", "NONE", 0.0},
    {"SKU-SNACK-003", "Britannia Good Day Butter Cookies 600g Value Pack", "Britannia", "Snacks & Confectionery", false, 13000, 55, "", "FIXED", 1500.0},
    {"SKU-SNACK-004", "Parle-G Original Glucose Biscuits 800g Family Pack", "Parle", "Snacks & Confectionery", false, 7500, 70, "", "NONE", 0.0},

    // 4. Beverages (Non-Perishable & Perishable)
    {"SKU-BEV-001", "Tata Tea Premium Desh Ki Chai 500g", "Tata Tea", "Beverages", false, 26000, 40, "", "PERCENTAGE", 5.0},
    {"SKU-BEV-002", "Bru Instant Coffee Chicory Mixture 200g Jar", "Bru", "Beverages", false, 34000, 25, "", "NONE", 0.0},
    {"SKU-BEV-003", "Real Fruit Power Mixed Fruit Juice 1L", "Real", "Beverages", true, 12000, 30, "2027-02-10", "PERCENTAGE", 10.0},

    // 5. Personal Care (Non-Perishable)
    {"SKU-CARE-001", "Dettol Original Germ Protection Bathing Soap (125g x 4)", "Dettol", "Personal Care", false, 19800, 35, "", "PERCENTAGE", 8.0},
    {"SKU-CARE-002", "Colgate Strong Teeth Dental Cream Toothpaste 300g", "Colgate", "Personal Care", false, 15500, 40, "", "NONE", 0.0},
    {"SKU-CARE-003", "Head & Shoulders Anti-Dandruff Cool Menthol Shampoo 340ml", "Head & Shoulders", "Personal Care", false, 38000, 15, "", "FIXED", 3000.0},

    // 6. Household Essentials (Non-Perishable)
    {"SKU-HOME-001", "Surf Excel Quick Wash Detergent Powder 2kg", "Surf Excel", "Household Essentials", false, 39000, 30, "", "PERCENTAGE", 12.0},
    {"SKU-HOME-002", "Vim Dishwash Gel Lemon 750ml Bottle", "Vim", "Household Essentials", false, 15500, 45, "", "NONE", 0.0},
    {"SKU-HOME-003", "Harpic Power Plus Disinfectant Toilet Cleaner 1L", "Harpic", "Household Essentials", false, 19500, 28, "", "NONE", 0.0},

    // 7. Fresh Fruits & Vegetables (Perishable, including low-stock example)
    {"SKU-FRESH-001", "Fresh Shimla Royal Delicious Apples 1kg Pack", "Fresh Farm Direct", "Fruits & Vegetables", true, 18000, 25, "2026-11-26", "PERCENTAGE", 10.0},
    {"SKU-FRESH-002", "Fresh Robusta Bananas 1 Dozen", "Fresh Farm Direct", "Fruits & Vegetables", true, 6000, 30, "2026-11-20", "NONE", 0.0},
    {"SKU-FRESH-003", "Fresh Hybrid Tomatoes 1kg Net Bag", "Fresh Farm Direct", "Fruits & Vegetables", true, 3800, 40, "2026-11-22", "NONE", 0.0},
    {"SKU-FRESH-004", "Fresh Organic Baby Spinach Palak 250g Bunch", "Fresh Farm Direct", "Fruits & Vegetables", true, 2500, 3, "2026-11-19", "NONE", 0.0} // Low-Stock Example (<5 units)
};

int main(int argc, char* argv[]) {
    std::cout << "=================================================================\n";
    std::cout << "   SUPERMARKET MANAGEMENT SYSTEM — DEMO DATASET SEEDER (STAGE 9J)\n";
    std::cout << "=================================================================\n";

    std::string dbPath = "";
    if (argc > 1) {
        dbPath = argv[1];
    } else {
        const char* envDb = std::getenv("DB_PATH");
        if (envDb && std::string(envDb).find_first_not_of(" \t\r\n") != std::string::npos) {
            dbPath = envDb;
        } else {
            // Resolve canonical backend/data/supermarket.db
            try {
                fs::path exeDir = fs::absolute(fs::path(argv[0])).parent_path();
                fs::path candidate = exeDir / ".." / ".." / "data" / "supermarket.db";
                if (fs::exists(candidate.parent_path()) || fs::exists(candidate)) {
                    dbPath = candidate.lexically_normal().string();
                }
            } catch (...) {}
            if (dbPath.empty()) {
                if (fs::exists("../../data") || fs::exists("../../data/supermarket.db")) {
                    dbPath = "../../data/supermarket.db";
                } else {
                    dbPath = "data/supermarket.db";
                }
            }
        }
    }

    // Safety checks: Ensure seeder cannot target remote addresses
    if (dbPath.rfind("http://", 0) == 0 || dbPath.rfind("https://", 0) == 0 || dbPath.rfind("//", 0) == 0) {
        std::cerr << "[SAFETY REJECTION] Seeder cannot target remote or URI destinations: " << dbPath << "\n";
        return 1;
    }

    std::cout << "[INFO] Target database: " << dbPath << "\n";

    try {
        fs::path p(dbPath);
        if (p.has_parent_path() && !fs::exists(p.parent_path())) {
            fs::create_directories(p.parent_path());
            std::cout << "[INFO] Created database directory: " << p.parent_path().string() << "\n";
        }

        DatabaseConnection db(dbPath);
        DatabaseMigrator::migrate(db);
        DemoDataSeeder::seedIfEmpty(db);

        // Ensure default staff user exists
        UserRepository userRepo(db);
        bool adminCreated = false;
        if (!userRepo.adminExists()) {
            AuthService auth(db, 3600);
            auth.createOrUpdateStaff("Staff@123");
            adminCreated = true;
            std::cout << "[AUTH] Initial staff user provisioned.\n";
        } else {
            std::cout << "[AUTH] Existing staff account detected. Preserved untouched.\n";
        }

        BrandRepository brandRepo(db);
        CategoryRepository catRepo(db);
        ProductRepository productRepo(db);
        InventoryRepository invRepo(db);

        int brandsInserted = 0;
        int brandsSkipped = 0;
        int categoriesInserted = 0;
        int categoriesSkipped = 0;
        int productsInserted = 0;
        int productsSkipped = 0;
        int totalUnitsSeeded = 0;

        // Wrap the entire dataset seeding in an atomic database transaction
        {
            Transaction tx(db);

            // 1. Seed Categories
            for (const auto& item : DEMO_PRODUCTS) {
                if (!catRepo.findByName(item.categoryName).has_value()) {
                    catRepo.insert(item.categoryName);
                    categoriesInserted++;
                } else {
                    categoriesSkipped++;
                }
            }

            // 2. Seed Brands
            for (const auto& item : DEMO_PRODUCTS) {
                if (!brandRepo.findByName(item.brandName).has_value()) {
                    brandRepo.insert(item.brandName);
                    brandsInserted++;
                } else {
                    brandsSkipped++;
                }
            }

            // 3. Seed Products (Idempotent: SKU existence check)
            for (const auto& item : DEMO_PRODUCTS) {
                auto existing = productRepo.findBySku(item.sku);
                if (existing.has_value()) {
                    productsSkipped++;
                    continue; // Skip without overwriting existing product or stock
                }

                auto brand = brandRepo.findByName(item.brandName);
                auto category = catRepo.findByName(item.categoryName);
                if (!brand.has_value() || !category.has_value()) {
                    throw std::runtime_error("Brand or Category lookup failed for SKU: " + item.sku);
                }

                // Construct polymorphic discount strategy
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

                // Record initial stock addition movement
                if (item.stock > 0) {
                    invRepo.recordMovement(newId,
                                           MovementType::ADDITION,
                                           item.stock,
                                           0,
                                           item.stock,
                                           "Initial demonstration inventory intake");
                    totalUnitsSeeded += item.stock;
                }

                productsInserted++;
            }

            tx.commit();
        }

        std::cout << "\n================ SEEDING REPORT ================\n";
        std::cout << "Categories: " << categoriesInserted << " inserted, " << categoriesSkipped << " already existing (skipped)\n";
        std::cout << "Brands:     " << brandsInserted << " inserted, " << brandsSkipped << " already existing (skipped)\n";
        std::cout << "Products:   " << productsInserted << " inserted, " << productsSkipped << " already existing (skipped)\n";
        std::cout << "Stock Units:" << totalUnitsSeeded << " units recorded in inventory movements\n";
        std::cout << "Staff User: " << (adminCreated ? "Created" : "Existing preserved") << "\n";
        std::cout << "Status:     TRANSACTION COMMITTED SUCCESSFULLY\n";
        std::cout << "=================================================\n";

        return 0;
    } catch (const std::exception& e) {
        std::cerr << "[SEEDER ERROR] Seeding aborted and rolled back: " << e.what() << "\n";
        return 1;
    }
}
