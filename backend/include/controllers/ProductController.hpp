#pragma once
#include "controllers/ControllerUtils.hpp"
#include "repositories/ProductRepository.hpp"
#include "repositories/BrandRepository.hpp"
#include "repositories/CategoryRepository.hpp"
#include "repositories/InventoryRepository.hpp"
#include "repositories/ProductBatchRepository.hpp"
#include "repositories/ProductReservationRepository.hpp"
#include "database/PreparedStatement.hpp"
#include "database/Transaction.hpp"
#include "models/Perishable.hpp"
#include "models/NonPerishable.hpp"
#include "models/Discount.hpp"
#include "utils/Exceptions.hpp"
#include "auth/AuthService.hpp"
#include <cmath>
#include <algorithm>
#include <cctype>

class ProductController {
public:
    static std::shared_ptr<IDiscountStrategy> parseDiscountStrategy(const nlohmann::json& body, std::shared_ptr<IDiscountStrategy> defaultStrategy = nullptr) {
        std::string dType = "NONE";
        double dVal = 0.0;
        bool specified = false;

        if (body.contains("discount")) {
            if (!body["discount"].is_object()) {
                throw std::invalid_argument("Field 'discount' must be a JSON object");
            }
            const auto& dObj = body["discount"];
            if (dObj.contains("type")) {
                if (!dObj["type"].is_string()) {
                    throw std::invalid_argument("Field 'discount.type' must be a string");
                }
                dType = ControllerUtils::trimCopy(dObj["type"].get<std::string>());
            }
            if (dObj.contains("value") && !dObj["value"].is_null()) {
                if (!dObj["value"].is_number()) {
                    throw std::invalid_argument("Field 'discount.value' must be numeric");
                }
                dVal = dObj["value"].get<double>();
            }
            specified = true;
        } else if (body.contains("discountType")) {
            if (!body["discountType"].is_string()) {
                throw std::invalid_argument("Field 'discountType' must be a string");
            }
            dType = ControllerUtils::trimCopy(body["discountType"].get<std::string>());
            if (body.contains("discountValue") && !body["discountValue"].is_null()) {
                if (!body["discountValue"].is_number()) {
                    throw std::invalid_argument("Field 'discountValue' must be numeric");
                }
                dVal = body["discountValue"].get<double>();
            }
            specified = true;
        }

        if (!specified) {
            return defaultStrategy ? defaultStrategy : std::make_shared<NoDiscount>();
        }

        if (!std::isfinite(dVal)) {
            throw InvalidDiscountException("Discount value must be finite");
        }

        std::string dTypeUpper = dType;
        for (char& c : dTypeUpper) c = static_cast<char>(std::toupper(static_cast<unsigned char>(c)));

        if (dTypeUpper == "NONE" || dTypeUpper.empty()) {
            return std::make_shared<NoDiscount>();
        } else if (dTypeUpper == "PERCENTAGE") {
            if (dVal < 0.0) {
                throw InvalidDiscountException("Percentage discount cannot be negative");
            }
            if (dVal > 100.0) {
                throw InvalidDiscountException("Percentage discount cannot exceed 100%");
            }
            return std::make_shared<PercentageDiscount>(dVal);
        } else if (dTypeUpper == "FIXED") {
            if (dVal < 0.0) {
                throw InvalidDiscountException("Fixed discount amount cannot be negative");
            }
            if (dVal > 10000000.0) {
                throw InvalidDiscountException("Fixed discount is out of valid range");
            }
            int64_t fixedPaise = static_cast<int64_t>(std::round(dVal * 100.0));
            return std::make_shared<FixedAmountDiscount>(fixedPaise);
        }

        throw InvalidDiscountException("Invalid discountType '" + dType + "'. Expected NONE, PERCENTAGE, or FIXED");
    }

    static int64_t extractPriceInPaise(const nlohmann::json& body, bool required, int64_t fallbackPaise) {
        constexpr int64_t MAX_PAISE = 1000000000LL; // Rs. 10,000,000 cap avoids double/int64 overflow
        if (body.contains("priceInPaise")) {
            if (!body["priceInPaise"].is_number_integer()) {
                throw std::invalid_argument("Field 'priceInPaise' must be an integer");
            }
            int64_t p = body["priceInPaise"].get<int64_t>();
            if (p < 0 || p > MAX_PAISE) {
                throw std::invalid_argument("Field 'priceInPaise' must be between 0 and 1000000000");
            }
            return p;
        }
        auto parseRupees = [&](const char* key) -> int64_t {
            if (!body.at(key).is_number()) {
                throw std::invalid_argument(std::string("Field '") + key + "' must be numeric");
            }
            double d = body.at(key).get<double>();
            if (!std::isfinite(d) || d < 0.0 || d > 10000000.0) {
                throw std::invalid_argument(std::string("Field '") + key + "' must be between 0 and 10000000");
            }
            return static_cast<int64_t>(std::round(d * 100.0));
        };
        if (body.contains("priceInRupees")) return parseRupees("priceInRupees");
        if (body.contains("price")) return parseRupees("price");
        if (required) {
            throw std::invalid_argument("Price is required");
        }
        return fallbackPaise;
    }

    static std::string parseExpiryDate(const nlohmann::json& body) {
        if (!body.contains("expiryDate") || body["expiryDate"].is_null()) {
            return "";
        }
        if (!body["expiryDate"].is_string()) {
            throw std::invalid_argument("Field 'expiryDate' must be a string");
        }
        std::string expiryDate = ControllerUtils::trimCopy(body["expiryDate"].get<std::string>());
        if (!expiryDate.empty() && !ControllerUtils::isValidIsoDate(expiryDate)) {
            throw std::invalid_argument("expiryDate must be a valid YYYY-MM-DD date");
        }
        return expiryDate;
    }

    static std::string normalizeName(const std::string& input) {
        std::string res;
        bool inSpace = false;
        for (char c : input) {
            if (std::isspace(static_cast<unsigned char>(c))) {
                if (!inSpace && !res.empty()) {
                    res.push_back(' ');
                    inSpace = true;
                }
            } else {
                res.push_back(static_cast<char>(std::tolower(static_cast<unsigned char>(c))));
                inSpace = false;
            }
        }
        while (!res.empty() && res.back() == ' ') {
            res.pop_back();
        }
        return res;
    }

    static std::string normalizeProductType(const std::string& raw) {
        std::string upper = ControllerUtils::trimCopy(raw);
        for (char& c : upper) {
            c = (c == '-') ? '_' : static_cast<char>(std::toupper(static_cast<unsigned char>(c)));
        }
        if (upper == "PERISHABLE" || upper == "NON_PERISHABLE") {
            return upper;
        }
        throw std::invalid_argument("Invalid productType. Expected PERISHABLE or NON_PERISHABLE");
    }

    static bool isValidBarcodeOrCode(const std::string& code) {
        if (code.size() < 3 || code.size() > 64) return false;
        for (char c : code) {
            if (!std::isdigit(static_cast<unsigned char>(c))) return false;
        }
        return true;
    }

    static bool isValidThreeDigitCode(const std::string& code) {
        return isValidBarcodeOrCode(code);
    }

    static nlohmann::json productToJson(const Product& p, DatabaseConnection& db, int reservedUnits = -1) {
        BrandRepository brandRepo(db);
        CategoryRepository catRepo(db);

        std::string brandName = "Unknown";
        auto brand = brandRepo.findById(p.getBrandId());
        if (brand.has_value()) brandName = brand->name;

        std::string catName = "Unknown";
        auto cat = catRepo.findById(p.getCategoryId());
        if (cat.has_value()) catName = cat->name;

        std::string expiry = "";
        if (p.getType() == ProductType::PERISHABLE) {
            const auto* per = dynamic_cast<const Perishable*>(&p);
            if (per) expiry = per->getExpiry();
        }

        std::string discType = "NONE";
        double discValue = 0.0;
        std::string discDesc = "No Discount";

        auto disc = p.getDiscount();
        if (disc) {
            discDesc = disc->getDescription();
            if (disc->getType() == DiscountType::PERCENTAGE) {
                discType = "PERCENTAGE";
                discValue = disc->getValue();
            } else if (disc->getType() == DiscountType::FIXED) {
                discType = "FIXED";
                discValue = disc->getValue(); // in Rupees
            }
        }

        // Fetch batches for this product (Multiple Expiry Dates)
        ProductBatchRepository batchRepo(db);
        auto batches = batchRepo.getBatchesByProductId(p.getId());

        nlohmann::json batchArr = nlohmann::json::array();
        bool hasExpired = false;
        int expiredUnits = 0;
        int activeUnits = 0;
        std::string nearestExp = "";

        for (const auto& b : batches) {
            bool exp = b.isExpired();
            if (exp) {
                hasExpired = true;
                expiredUnits += b.getQuantity();
            } else {
                activeUnits += b.getQuantity();
                if (b.getQuantity() > 0 && (nearestExp.empty() || b.getExpiryDate() < nearestExp)) {
                    nearestExp = b.getExpiryDate();
                }
            }
            batchArr.push_back({
                {"id", b.getId()},
                {"batchNumber", b.getBatchNumber()},
                {"quantity", b.getQuantity()},
                {"expiryDate", b.getExpiryDate()},
                {"isExpired", exp},
                {"daysUntilExpiry", b.getDaysUntilExpiry()},
                {"status", b.getStatus()},
                {"createdAt", b.getCreatedAt()}
            });
        }

        if (nearestExp.empty()) {
            for (const auto& b : batches) {
                if (!b.isExpired() && (nearestExp.empty() || b.getExpiryDate() < nearestExp)) {
                    nearestExp = b.getExpiryDate();
                }
            }
        }
        if (nearestExp.empty() && !batches.empty()) {
            for (const auto& b : batches) {
                if (nearestExp.empty() || b.getExpiryDate() < nearestExp) {
                    nearestExp = b.getExpiryDate();
                }
            }
        }

        std::string effectiveExpiry = !nearestExp.empty() ? nearestExp : expiry;

        // Fetch price & discount history (Daily Editing Audit Trail)
        nlohmann::json priceHistArr = nlohmann::json::array();
        try {
            PreparedStatement phQuery(db, "SELECT old_price_paise, new_price_paise, old_discount_type, new_discount_type, old_discount_value, new_discount_value, notes, changed_at FROM price_history WHERE product_id = ? ORDER BY id DESC;");
            phQuery.bind(1, p.getId());
            while (phQuery.step()) {
                priceHistArr.push_back({
                    {"oldPriceInRupees", phQuery.getInt64(0) / 100.0},
                    {"newPriceInRupees", phQuery.getInt64(1) / 100.0},
                    {"oldDiscountType", phQuery.getString(2)},
                    {"newDiscountType", phQuery.getString(3)},
                    {"oldDiscountValue", phQuery.getDouble(4)},
                    {"newDiscountValue", phQuery.getDouble(5)},
                    {"notes", phQuery.getString(6)},
                    {"changedAt", phQuery.getString(7)}
                });
            }
        } catch (...) {}

        int reservedUnitsCalculated = (reservedUnits >= 0)
            ? reservedUnits
            : ProductReservationRepository(db).getReservedStock(p.getId());
        int availableUnits = (std::max)(0, p.getStock() - reservedUnitsCalculated);

        return nlohmann::json{
            {"id", p.getId()},
            {"sku", p.getSku()},
            {"barcode", p.getSku()},
            {"name", p.getName()},
            {"brandId", p.getBrandId()},
            {"brandName", brandName},
            {"categoryId", p.getCategoryId()},
            {"categoryName", catName},
            {"productType", (p.getType() == ProductType::PERISHABLE ? "PERISHABLE" : "NON_PERISHABLE")},
            {"priceInPaise", p.getPriceInPaise()},
            {"priceInRupees", p.getPrice()},
            {"stock", availableUnits},
            {"availableStock", availableUnits},
            {"reservedStock", reservedUnitsCalculated},
            {"totalStock", p.getStock()},
            {"expiryDate", effectiveExpiry},
            {"nearestExpiryDate", effectiveExpiry},
            {"batches", batchArr},
            {"batchCount", batchArr.size()},
            {"hasExpiredBatches", hasExpired},
            {"expiredUnits", expiredUnits},
            {"activeUnits", (batches.empty() ? availableUnits : (std::max)(0, activeUnits - reservedUnitsCalculated))},
            {"priceHistory", priceHistArr},
            {"discount", {
                {"type", discType},
                {"value", discValue},
                {"description", discDesc},
                {"discountedPriceInPaise", p.getDiscountedPriceInPaise()},
                {"discountedPriceInRupees", p.getDiscountedPriceInRupees()}
            }}
        };
    }

    static void registerRoutes(ControllerUtils::CrowApp& app, DatabaseConnection& db, AuthService& auth, const std::string& allowedOrigin) {
        // GET /api/products & POST /api/products
        CROW_ROUTE(app, "/api/products").methods("GET"_method, "POST"_method, "OPTIONS"_method)(
            [&db, &auth, allowedOrigin](const crow::request& req) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                ProductRepository repo(db);

                // 1. GET /api/products
                if (req.method == "GET"_method) {
                    std::string q = req.url_params.get("q") ? req.url_params.get("q") : "";
                    std::optional<int> brandId;
                    if (req.url_params.get("brandId")) {
                        try { brandId = std::stoi(req.url_params.get("brandId")); } catch (...) {}
                    }
                    std::optional<int> categoryId;
                    if (req.url_params.get("categoryId")) {
                        try { categoryId = std::stoi(req.url_params.get("categoryId")); } catch (...) {}
                    }

                    bool activeOnly = true;
                    if (req.url_params.get("activeOnly") && std::string(req.url_params.get("activeOnly")) == "false") {
                        activeOnly = false;
                    }

                    std::vector<std::shared_ptr<Product>> products;
                    if (!q.empty() || brandId.has_value() || categoryId.has_value()) {
                        products = repo.search(q, brandId, categoryId);
                    } else {
                        products = repo.getAll(activeOnly);
                    }

                    int totalCount = static_cast<int>(products.size());
                    int limit = 50;
                    int offset = 0;
                    if (req.url_params.get("limit")) {
                        try { limit = (std::max)(1, (std::min)(200, std::stoi(req.url_params.get("limit")))); } catch (...) {}
                    }
                    if (req.url_params.get("offset")) {
                        try { offset = (std::max)(0, std::stoi(req.url_params.get("offset"))); } catch (...) {}
                    }

                    ProductReservationRepository resRepo(db);
                    auto allReserved = resRepo.getAllReservedStock();

                    nlohmann::json list = nlohmann::json::array();
                    int startIdx = (std::min)(offset, totalCount);
                    int endIdx = (std::min)(startIdx + limit, totalCount);
                    for (int i = startIdx; i < endIdx; ++i) {
                        int pId = products[i]->getId();
                        int rUnits = allReserved.count(pId) ? allReserved[pId] : 0;
                        list.push_back(productToJson(*products[i], db, rUnits));
                    }

                    nlohmann::json result = {
                        {"total", totalCount},
                        {"limit", limit},
                        {"offset", offset},
                        {"products", list}
                    };
                    return ControllerUtils::successResponseWithPagination(result, "Products retrieved", allowedOrigin, totalCount, limit, offset);
                }

                // 2. POST /api/products (Admin Only)
                if (req.method == "POST"_method) {
                    crow::response err;
                    if (!ControllerUtils::requireAdmin(req, auth, allowedOrigin, err)) {
                        return err;
                    }

                    try {
                        nlohmann::json body;
                        crow::response parseErr;
                        if (!ControllerUtils::parseJsonObject(req, body, allowedOrigin, parseErr)) {
                            return parseErr;
                        }

                        if (!body.contains("name") || !body["name"].is_string()) {
                            return ControllerUtils::errorResponse(400, "Product name is required", allowedOrigin);
                        }

                        std::string sku = "";
                        if (body.contains("sku") && body["sku"].is_string()) {
                            sku = ControllerUtils::trimCopy(body["sku"].get<std::string>());
                        } else if (body.contains("barcode") && body["barcode"].is_string()) {
                            sku = ControllerUtils::trimCopy(body["barcode"].get<std::string>());
                        } else if (body.contains("code") && body["code"].is_string()) {
                            sku = ControllerUtils::trimCopy(body["code"].get<std::string>());
                        }

                        std::string name = ControllerUtils::trimCopy(body["name"].get<std::string>());
                        if (name.empty() || name.size() > 200) {
                            return ControllerUtils::errorResponse(400, "Product name must be between 1 and 200 characters", allowedOrigin);
                        }
                        if (sku.empty() || sku.size() > 64) {
                            return ControllerUtils::errorResponse(400, "Product barcode/SKU is required and must be between 1 and 64 characters", allowedOrigin);
                        }
                        if (!isValidBarcodeOrCode(sku)) {
                            return ControllerUtils::errorResponse(400, "Product code/barcode must contain only numeric digits (minimum 3 digits, e.g. 001, 123456)", allowedOrigin);
                        }

                        std::string fieldErr;
                        CategoryRepository catRepo(db);
                        int categoryId = 0;
                        if (body.contains("categoryId") && ControllerUtils::parseStrictIntField(body, "categoryId", 1, 1000000000, categoryId, fieldErr)) {
                            // categoryId parsed
                        } else if (body.contains("category") && body["category"].is_string()) {
                            std::string catName = ControllerUtils::trimCopy(body["category"].get<std::string>());
                            auto catOpt = catRepo.findByName(catName);
                            if (catOpt.has_value()) {
                                categoryId = catOpt->id;
                            } else {
                                categoryId = catRepo.insert(catName);
                            }
                        } else if (body.contains("categoryName") && body["categoryName"].is_string()) {
                            std::string catName = ControllerUtils::trimCopy(body["categoryName"].get<std::string>());
                            auto catOpt = catRepo.findByName(catName);
                            if (catOpt.has_value()) {
                                categoryId = catOpt->id;
                            } else {
                                categoryId = catRepo.insert(catName);
                            }
                        }
                        if (categoryId <= 0 || !catRepo.findById(categoryId).has_value()) {
                            return ControllerUtils::errorResponse(400, "A valid category must be selected", allowedOrigin);
                        }

                        BrandRepository brandRepo(db);
                        int brandId = 0;
                        if (body.contains("brandName") && body["brandName"].is_string()) {
                            std::string bName = ControllerUtils::trimCopy(body["brandName"].get<std::string>());
                            if (bName.empty()) return ControllerUtils::errorResponse(400, "Brand name cannot be empty", allowedOrigin);
                            brandId = brandRepo.getOrCreate(bName);
                        } else if (body.contains("brand") && body["brand"].is_string()) {
                            std::string bName = ControllerUtils::trimCopy(body["brand"].get<std::string>());
                            if (bName.empty()) return ControllerUtils::errorResponse(400, "Brand name cannot be empty", allowedOrigin);
                            brandId = brandRepo.getOrCreate(bName);
                        } else if (body.contains("brandId") && ControllerUtils::parseStrictIntField(body, "brandId", 1, 1000000000, brandId, fieldErr)) {
                            if (!brandRepo.findById(brandId).has_value()) {
                                return ControllerUtils::errorResponse(400, "Referenced brandId does not exist", allowedOrigin);
                            }
                        } else {
                            auto catBrands = catRepo.getBrands(categoryId);
                            if (!catBrands.empty()) {
                                brandId = catBrands[0].id;
                            } else {
                                brandId = brandRepo.getOrCreate("General");
                            }
                        }

                        if (!catRepo.hasBrand(categoryId, brandId)) {
                            if (body.contains("brandId") && !body.contains("brandName") && !body.contains("brand")) {
                                return ControllerUtils::errorResponse(400, "The selected brand is not associated with the selected category", allowedOrigin);
                            } else {
                                catRepo.addBrand(categoryId, brandId);
                            }
                        }

                        int stock = 0;
                        if (body.contains("stock")) {
                            if (!body["stock"].is_number_integer()) {
                                return ControllerUtils::errorResponse(400, "Field 'stock' must be an integer", allowedOrigin);
                            }
                            int64_t rawStock = body["stock"].get<int64_t>();
                            if (rawStock < 0) {
                                return ControllerUtils::errorResponse(400, "Stock quantity cannot be negative", allowedOrigin);
                            }
                            if (rawStock > 10000000) {
                                return ControllerUtils::errorResponse(400, "Field 'stock' is out of allowed range", allowedOrigin);
                            }
                            stock = static_cast<int>(rawStock);
                        } else if (body.contains("quantity")) {
                            if (!body["quantity"].is_number_integer()) {
                                return ControllerUtils::errorResponse(400, "Field 'quantity' must be an integer", allowedOrigin);
                            }
                            int64_t rawStock = body["quantity"].get<int64_t>();
                            if (rawStock < 0) {
                                return ControllerUtils::errorResponse(400, "Stock quantity cannot be negative", allowedOrigin);
                            }
                            if (rawStock > 10000000) {
                                return ControllerUtils::errorResponse(400, "Field 'quantity' is out of allowed range", allowedOrigin);
                            }
                            stock = static_cast<int>(rawStock);
                        }

                        int64_t priceInPaise = 0;
                        std::string productTypeUpper;
                        std::shared_ptr<IDiscountStrategy> strategy;
                        std::string expiryDate;
                        try {
                            priceInPaise = extractPriceInPaise(body, true, 0);
                            std::string productTypeRaw = "NON_PERISHABLE";
                            if (body.contains("productType") && !body["productType"].is_null()) {
                                if (!body["productType"].is_string()) {
                                    return ControllerUtils::errorResponse(400, "Field 'productType' must be a string", allowedOrigin);
                                }
                                productTypeRaw = body["productType"].get<std::string>();
                            }
                            productTypeUpper = normalizeProductType(productTypeRaw);
                            strategy = parseDiscountStrategy(body);
                            expiryDate = parseExpiryDate(body);

                            if (strategy && strategy->getType() == DiscountType::FIXED) {
                                auto fixedStrat = std::dynamic_pointer_cast<FixedAmountDiscount>(strategy);
                                if (fixedStrat && fixedStrat->getAmountInPaise() > priceInPaise) {
                                    throw InvalidDiscountException("Fixed discount amount cannot exceed unit price");
                                }
                            }
                        } catch (const std::exception& ex) {
                            return ControllerUtils::errorResponse(400, ex.what(), allowedOrigin);
                        }

                        Transaction tx(db);

                        // 1. DUPLICATE PREVENTION (ADD TO EXISTING STOCK)
                        auto existingOpt = repo.findBySku(sku);
                        if (!existingOpt.has_value()) {
                            auto allProds = repo.getAll(true);
                            std::string inputNorm = normalizeName(name);
                            for (const auto& prod : allProds) {
                                if (normalizeName(prod->getName()) == inputNorm && (categoryId == 0 || prod->getCategoryId() == categoryId)) {
                                    existingOpt = prod;
                                    break;
                                }
                            }
                        }
                        if (existingOpt.has_value()) {
                            auto existing = *existingOpt;
                            std::string existingNorm = normalizeName(existing->getName());
                            std::string inputNorm = normalizeName(name);

                            if (existingNorm == inputNorm && (categoryId == 0 || existing->getCategoryId() == categoryId)) {
                                // EXACT SAME ITEM: Do NOT create a new record. Increase quantity of existing item.
                                int oldStock = existing->getStock();
                                int newStock = oldStock + stock;
                                repo.updateStock(existing->getId(), newStock);

                                if (existing->getType() == ProductType::PERISHABLE || !expiryDate.empty()) {
                                    ProductBatchRepository batchRepo(db);
                                    std::string bExp = !expiryDate.empty() ? expiryDate : parseExpiryDate(body);
                                    if (!bExp.empty()) {
                                        std::string bNum = (body.contains("batchNumber") && body["batchNumber"].is_string())
                                            ? body["batchNumber"].get<std::string>()
                                            : ("BATCH-" + std::to_string(existing->getId()) + "-" + bExp);
                                        batchRepo.addBatch(existing->getId(), bNum, stock, bExp);
                                        batchRepo.updateProductNearestExpiry(existing->getId());
                                    }
                                }

                                InventoryRepository invRepo(db);
                                invRepo.recordMovement(existing->getId(), MovementType::ADDITION, stock, oldStock, newStock,
                                                       "Restock / Duplicate item addition: " + std::to_string(stock) + " units");

                                tx.commit();
                                auto updated = repo.findById(existing->getId());
                                nlohmann::json respData = productToJson(**updated, db);
                                respData["isRestocked"] = true;
                                respData["addedQuantity"] = stock;
                                respData["previousStock"] = oldStock;
                                respData["currentStock"] = newStock;
                                return ControllerUtils::successResponse(respData, "Existing item detected. Stock successfully increased by " + std::to_string(stock) + " units.", allowedOrigin, 200);
                            } else {
                                // Same barcode assigned to a different product -> conflict error!
                                return ControllerUtils::errorResponse(409, "Barcode/SKU '" + sku + "' is already assigned to a different product: '" + existing->getName() + "'", allowedOrigin);
                            }
                        }

                        // NEW ITEM: Create record
                        int newId = 0;
                        if (productTypeUpper == "PERISHABLE" || !expiryDate.empty()) {
                            Perishable p(0, sku, name, brandId, categoryId, priceInPaise, stock, expiryDate, strategy);
                            newId = repo.insert(p);
                        } else {
                            NonPerishable p(0, sku, name, brandId, categoryId, priceInPaise, stock, strategy);
                            newId = repo.insert(p);
                        }

                        if (stock > 0) {
                            InventoryRepository invRepo(db);
                            invRepo.recordMovement(newId, MovementType::ADDITION, stock, 0, stock, "Initial product stock");
                        }

                        if (!expiryDate.empty()) {
                            ProductBatchRepository batchRepo(db);
                            std::string bNum = (body.contains("batchNumber") && body["batchNumber"].is_string())
                                ? body["batchNumber"].get<std::string>()
                                : ("BATCH-" + std::to_string(newId) + "-" + expiryDate);
                            batchRepo.addBatch(newId, bNum, stock, expiryDate);
                            batchRepo.updateProductNearestExpiry(newId);
                        }

                        tx.commit();

                        auto created = repo.findById(newId);
                        if (!created.has_value()) {
                            return ControllerUtils::errorResponse(500, "Failed to retrieve newly created product", allowedOrigin);
                        }

                        return ControllerUtils::successResponse(productToJson(**created, db), "Product created successfully", allowedOrigin, 201);
                    } catch (const InvalidDiscountException& e) {
                        return ControllerUtils::errorResponse(400, e.what(), allowedOrigin);
                    } catch (const InvalidQuantityException& e) {
                        return ControllerUtils::errorResponse(400, e.what(), allowedOrigin);
                    } catch (const InsufficientStockException& e) {
                        return ControllerUtils::errorResponse(400, e.what(), allowedOrigin);
                    } catch (const std::invalid_argument& e) {
                        return ControllerUtils::errorResponse(400, e.what(), allowedOrigin);
                    } catch (const nlohmann::json::exception&) {
                        return ControllerUtils::errorResponse(400, "Malformed or invalid JSON request", allowedOrigin);
                    } catch (const std::exception& e) {
                        return ControllerUtils::errorResponse(500, "Error creating product: " + std::string(e.what()), allowedOrigin);
                    }
                }

                return ControllerUtils::errorResponse(405, "Method Not Allowed", allowedOrigin);
            }
        );

        // GET /api/products/summary (Must be before /api/products/<int>)
        CROW_ROUTE(app, "/api/products/summary").methods("GET"_method, "OPTIONS"_method)(
            [&db, allowedOrigin](const crow::request& req) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                ProductRepository repo(db);
                auto summary = repo.getSummary();

                ProductReservationRepository resRepo(db);
                int totalReserved = 0;
                for (const auto& pair : resRepo.getAllReservedStock()) {
                    totalReserved += pair.second;
                }

                nlohmann::json data = {
                    {"totalActiveProducts", summary.totalActiveProducts},
                    {"totalStockUnits", summary.totalStockUnits},
                    {"totalReservedUnits", totalReserved},
                    {"totalAvailableUnits", (std::max)(0, summary.totalStockUnits - totalReserved)},
                    {"lowStockCount", summary.lowStockCount},
                    {"outOfStockCount", summary.outOfStockCount}
                };

                return ControllerUtils::successResponse(data, "Products summary retrieved", allowedOrigin);
            }
        );

        // GET /api/products/{id}, PUT /api/products/{id}, DELETE /api/products/{id}
        CROW_ROUTE(app, "/api/products/<int>").methods("GET"_method, "PUT"_method, "DELETE"_method, "OPTIONS"_method)(
            [&db, &auth, allowedOrigin](const crow::request& req, int id) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                ProductRepository repo(db);
                auto productOpt = repo.findById(id);

                if (req.method == "GET"_method) {
                    if (!productOpt.has_value()) {
                        return ControllerUtils::errorResponse(404, "Product not found", allowedOrigin);
                    }
                    return ControllerUtils::successResponse(productToJson(**productOpt, db), "Product retrieved", allowedOrigin);
                }

                // PUT and DELETE require ADMIN
                crow::response err;
                if (!ControllerUtils::requireAdmin(req, auth, allowedOrigin, err)) {
                    return err;
                }

                if (!productOpt.has_value()) {
                    return ControllerUtils::errorResponse(404, "Product not found", allowedOrigin);
                }

                if (req.method == "PUT"_method) {
                    try {
                        nlohmann::json body;
                        crow::response parseErr;
                        if (!ControllerUtils::parseJsonObject(req, body, allowedOrigin, parseErr)) {
                            return parseErr;
                        }

                        Transaction tx(db);
                        auto latestOpt = repo.findById(id);
                        if (!latestOpt.has_value()) {
                            return ControllerUtils::errorResponse(404, "Product not found", allowedOrigin);
                        }
                        auto p = *latestOpt;

                        std::string sku = p->getSku();
                        if (body.contains("sku")) {
                            if (!body["sku"].is_string()) {
                                return ControllerUtils::errorResponse(400, "Field 'sku' must be a string", allowedOrigin);
                            }
                            std::string inputSku = ControllerUtils::trimCopy(body["sku"].get<std::string>());
                            if (inputSku != p->getSku()) {
                                if (!isValidBarcodeOrCode(inputSku)) {
                                    return ControllerUtils::errorResponse(400, "Product code/barcode must contain only numeric digits (minimum 3 digits, e.g. 001, 123456)", allowedOrigin);
                                }
                                if (repo.findBySku(inputSku).has_value()) {
                                    return ControllerUtils::errorResponse(409, "A product with this SKU already exists", allowedOrigin);
                                }
                                sku = inputSku;
                            }
                        }
                        std::string name = p->getName();
                        if (body.contains("name")) {
                            if (!body["name"].is_string()) {
                                return ControllerUtils::errorResponse(400, "Field 'name' must be a string", allowedOrigin);
                            }
                            name = ControllerUtils::trimCopy(body["name"].get<std::string>());
                        }
                        if (name.empty() || name.size() > 200 || sku.empty() || sku.size() > 64) {
                            return ControllerUtils::errorResponse(400, "Product name (1-200 chars) and SKU (1-64 chars) are invalid", allowedOrigin);
                        }

                        std::string fieldErr;
                        BrandRepository brandRepo(db);
                        int brandId = p->getBrandId();
                        if (body.contains("brandName") && body["brandName"].is_string()) {
                            std::string bName = ControllerUtils::trimCopy(body["brandName"].get<std::string>());
                            if (bName.empty()) {
                                return ControllerUtils::errorResponse(400, "Brand name cannot be empty", allowedOrigin);
                            }
                            brandId = brandRepo.getOrCreate(bName);
                        } else if (body.contains("brand") && body["brand"].is_string()) {
                            std::string bName = ControllerUtils::trimCopy(body["brand"].get<std::string>());
                            if (bName.empty()) {
                                return ControllerUtils::errorResponse(400, "Brand name cannot be empty", allowedOrigin);
                            }
                            brandId = brandRepo.getOrCreate(bName);
                        } else if (body.contains("brandId")) {
                            if (!ControllerUtils::parseStrictIntField(body, "brandId", 1, 1000000000, brandId, fieldErr)) {
                                return ControllerUtils::errorResponse(400, fieldErr, allowedOrigin);
                            }
                            if (!brandRepo.findById(brandId).has_value()) {
                                return ControllerUtils::errorResponse(400, "Referenced brandId does not exist", allowedOrigin);
                            }
                        }

                        int categoryId = p->getCategoryId();
                        if (body.contains("categoryId")) {
                            if (!ControllerUtils::parseStrictIntField(body, "categoryId", 1, 1000000000, categoryId, fieldErr)) {
                                return ControllerUtils::errorResponse(400, "A valid category must be selected", allowedOrigin);
                            }
                        }

                        CategoryRepository catRepo(db);
                        if (!catRepo.findById(categoryId).has_value()) {
                            return ControllerUtils::errorResponse(400, "Referenced categoryId does not exist", allowedOrigin);
                        }
                        if (!catRepo.hasBrand(categoryId, brandId)) {
                            catRepo.addBrand(categoryId, brandId);
                        }

                        int stock = p->getStock();
                        if (body.contains("stock")) {
                            if (!body["stock"].is_number_integer()) {
                                return ControllerUtils::errorResponse(400, "Field 'stock' must be an integer", allowedOrigin);
                            }
                            int64_t rawStock = body["stock"].get<int64_t>();
                            if (rawStock < 0) {
                                return ControllerUtils::errorResponse(400, "Stock quantity cannot be negative", allowedOrigin);
                            }
                            if (rawStock > 10000000) {
                                return ControllerUtils::errorResponse(400, "Field 'stock' is out of allowed range", allowedOrigin);
                            }
                            stock = static_cast<int>(rawStock);
                        } else if (body.contains("quantity")) {
                            if (!body["quantity"].is_number_integer()) {
                                return ControllerUtils::errorResponse(400, "Field 'quantity' must be an integer", allowedOrigin);
                            }
                            int64_t rawStock = body["quantity"].get<int64_t>();
                            if (rawStock < 0) {
                                return ControllerUtils::errorResponse(400, "Stock quantity cannot be negative", allowedOrigin);
                            }
                            if (rawStock > 10000000) {
                                return ControllerUtils::errorResponse(400, "Field 'quantity' is out of allowed range", allowedOrigin);
                            }
                            stock = static_cast<int>(rawStock);
                        }

                        int64_t priceInPaise = p->getPriceInPaise();
                        std::shared_ptr<IDiscountStrategy> strategy;
                        std::string productTypeUpper;
                        std::string expiryDate;
                        try {
                            priceInPaise = extractPriceInPaise(body, false, p->getPriceInPaise());
                            strategy = parseDiscountStrategy(body, p->getDiscount());
                            std::string productTypeRaw = (p->getType() == ProductType::PERISHABLE ? "PERISHABLE" : "NON_PERISHABLE");
                            if (body.contains("productType") && !body["productType"].is_null()) {
                                if (!body["productType"].is_string()) {
                                    return ControllerUtils::errorResponse(400, "Field 'productType' must be a string", allowedOrigin);
                                }
                                productTypeRaw = body["productType"].get<std::string>();
                            }
                            productTypeUpper = normalizeProductType(productTypeRaw);
                            expiryDate = parseExpiryDate(body);

                            if (strategy && strategy->getType() == DiscountType::FIXED) {
                                auto fixedStrat = std::dynamic_pointer_cast<FixedAmountDiscount>(strategy);
                                if (fixedStrat && fixedStrat->getAmountInPaise() > priceInPaise) {
                                    throw InvalidDiscountException("Fixed discount amount cannot exceed unit price");
                                }
                            }
                        } catch (const std::exception& ex) {
                            return ControllerUtils::errorResponse(400, ex.what(), allowedOrigin);
                        }

                        // 3. EDITING EXISTING ITEMS DAILY (Track Price & Discount History)
                        bool priceChanged = (p->getPriceInPaise() != priceInPaise);

                        std::string oldDType = "NONE";
                        double oldDVal = 0.0;
                        if (p->getDiscount()) {
                            if (p->getDiscount()->getType() == DiscountType::PERCENTAGE) {
                                oldDType = "PERCENTAGE"; oldDVal = p->getDiscount()->getValue();
                            } else if (p->getDiscount()->getType() == DiscountType::FIXED) {
                                oldDType = "FIXED"; oldDVal = p->getDiscount()->getValue();
                            }
                        }

                        std::string newDType = "NONE";
                        double newDVal = 0.0;
                        if (strategy) {
                            if (strategy->getType() == DiscountType::PERCENTAGE) {
                                newDType = "PERCENTAGE"; newDVal = strategy->getValue();
                            } else if (strategy->getType() == DiscountType::FIXED) {
                                newDType = "FIXED"; newDVal = strategy->getValue();
                            }
                        }
                        bool discountChanged = (oldDType != newDType || std::abs(oldDVal - newDVal) > 0.001);

                        if (priceChanged || discountChanged) {
                            PreparedStatement phStmt(db, R"(
                                INSERT INTO price_history (product_id, old_price_paise, new_price_paise,
                                                           old_discount_type, new_discount_type,
                                                           old_discount_value, new_discount_value, notes)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                            )");
                            phStmt.bind(1, id);
                            phStmt.bind(2, p->getPriceInPaise());
                            phStmt.bind(3, priceInPaise);
                            phStmt.bind(4, oldDType);
                            phStmt.bind(5, newDType);
                            phStmt.bind(6, oldDVal);
                            phStmt.bind(7, newDVal);
                            std::string notes = "Daily item update: ";
                            if (priceChanged) notes += "Price updated from Rs " + std::to_string(p->getPrice()) + " to Rs " + std::to_string(priceInPaise / 100.0) + ". ";
                            if (discountChanged) notes += "Discount updated to " + newDType + " (" + std::to_string(newDVal) + ").";
                            phStmt.bind(8, notes);
                            phStmt.execute();
                        }

                        // Track Inventory Movement on Stock Adjustment
                        if (stock != p->getStock()) {
                            int diff = stock - p->getStock();
                            InventoryRepository invRepo(db);
                            invRepo.recordMovement(id, MovementType::ADJUSTMENT, diff, p->getStock(), stock,
                                                   "Daily inventory adjustment via product edit");
                        }

                        if (productTypeUpper == "PERISHABLE" || !expiryDate.empty()) {
                            // Retain existing expiry date if not provided in the request body
                            if (expiryDate.empty() && p->getType() == ProductType::PERISHABLE) {
                                const auto* oldPer = dynamic_cast<const Perishable*>(p.get());
                                if (oldPer) expiryDate = oldPer->getExpiry();
                            }

                            Perishable updated(id, sku, name, brandId, categoryId, priceInPaise, stock, expiryDate, strategy);
                            repo.update(updated);

                            if (!expiryDate.empty()) {
                                ProductBatchRepository batchRepo(db);

                                // Check how many batches exist for this product
                                PreparedStatement countStmt(db, "SELECT COUNT(*) FROM product_batches WHERE product_id = ?;");
                                countStmt.bind(1, id);
                                int bCount = 0;
                                if (countStmt.step()) bCount = countStmt.getInt(0);

                                if (bCount == 0) {
                                    // Create initial batch with the edited expiry date
                                    batchRepo.addBatch(id, "BATCH-" + std::to_string(id) + "-" + expiryDate, stock, expiryDate);
                                } else {
                                    // Synchronize expiry date to product_batches
                                    PreparedStatement updateBatchStmt(db, "UPDATE product_batches SET expiry_date = ? WHERE product_id = ?;");
                                    updateBatchStmt.bind(1, expiryDate);
                                    updateBatchStmt.bind(2, id);
                                    updateBatchStmt.execute();

                                    if (bCount == 1) {
                                        PreparedStatement updateQtyStmt(db, "UPDATE product_batches SET quantity = ? WHERE product_id = ?;");
                                        updateQtyStmt.bind(1, stock);
                                        updateQtyStmt.bind(2, id);
                                        updateQtyStmt.execute();
                                    }
                                }

                                // Update product's nearest expiry date
                                batchRepo.updateProductNearestExpiry(id);
                            }
                        } else {
                            NonPerishable updated(id, sku, name, brandId, categoryId, priceInPaise, stock, strategy);
                            repo.update(updated);

                            // When converted to non-perishable, clear batch records and reset expiry_date
                            PreparedStatement clearBatches(db, "DELETE FROM product_batches WHERE product_id = ?;");
                            clearBatches.bind(1, id);
                            clearBatches.execute();

                            PreparedStatement clearExp(db, "UPDATE products SET expiry_date = '' WHERE id = ?;");
                            clearExp.bind(1, id);
                            clearExp.execute();
                        }

                        tx.commit();
                        auto saved = repo.findById(id);
                        return ControllerUtils::successResponse(productToJson(**saved, db), "Product updated successfully", allowedOrigin);
                    } catch (const InvalidDiscountException& e) {
                        return ControllerUtils::errorResponse(400, e.what(), allowedOrigin);
                    } catch (const InvalidQuantityException& e) {
                        return ControllerUtils::errorResponse(400, e.what(), allowedOrigin);
                    } catch (const InsufficientStockException& e) {
                        return ControllerUtils::errorResponse(400, e.what(), allowedOrigin);
                    } catch (const std::invalid_argument& e) {
                        return ControllerUtils::errorResponse(400, e.what(), allowedOrigin);
                    } catch (const nlohmann::json::exception&) {
                        return ControllerUtils::errorResponse(400, "Malformed or invalid JSON request", allowedOrigin);
                    } catch (const std::exception& e) {
                        return ControllerUtils::errorResponse(500, "Error updating product: " + std::string(e.what()), allowedOrigin);
                    }
                }

                if (req.method == "DELETE"_method) {
                    bool deleted = repo.softDelete(id);
                    if (!deleted) {
                        return ControllerUtils::errorResponse(500, "Failed to deactivate product", allowedOrigin);
                    }
                    nlohmann::json data = {
                        {"id", id},
                        {"deleted", true}
                    };
                    return ControllerUtils::successResponse(data, "Product deactivated successfully", allowedOrigin);
                }

                return ControllerUtils::errorResponse(405, "Method Not Allowed", allowedOrigin);
            }
        );

        // GET /api/products/{id}/batches & POST /api/products/{id}/batches
        CROW_ROUTE(app, "/api/products/<int>/batches").methods("GET"_method, "POST"_method, "OPTIONS"_method)(
            [&db, &auth, allowedOrigin](const crow::request& req, int id) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                ProductRepository repo(db);
                auto productOpt = repo.findById(id);
                if (!productOpt.has_value()) {
                    return ControllerUtils::errorResponse(404, "Product not found", allowedOrigin);
                }

                ProductBatchRepository batchRepo(db);

                if (req.method == "GET"_method) {
                    auto batches = batchRepo.getBatchesByProductId(id);
                    nlohmann::json arr = nlohmann::json::array();
                    for (const auto& b : batches) {
                        arr.push_back({
                            {"id", b.getId()},
                            {"productId", b.getProductId()},
                            {"batchNumber", b.getBatchNumber()},
                            {"quantity", b.getQuantity()},
                            {"expiryDate", b.getExpiryDate()},
                            {"isExpired", b.isExpired()},
                            {"daysUntilExpiry", b.getDaysUntilExpiry()},
                            {"status", b.getStatus()},
                            {"createdAt", b.getCreatedAt()}
                        });
                    }
                    return ControllerUtils::successResponse(arr, "Batches retrieved", allowedOrigin);
                }

                if (req.method == "POST"_method) {
                    crow::response err;
                    if (!ControllerUtils::requireAdmin(req, auth, allowedOrigin, err)) {
                        return err;
                    }

                    nlohmann::json body;
                    if (!ControllerUtils::parseJsonObject(req, body, allowedOrigin, err)) {
                        return err;
                    }

                    int quantity = 0;
                    std::string fieldErr;
                    if (!ControllerUtils::parseStrictIntField(body, "quantity", 1, 1000000, quantity, fieldErr)) {
                        return ControllerUtils::errorResponse(400, "Quantity must be a positive integer", allowedOrigin);
                    }

                    std::string expiryDate = parseExpiryDate(body);
                    if (expiryDate.empty()) {
                        return ControllerUtils::errorResponse(400, "Valid expiryDate (YYYY-MM-DD) is required", allowedOrigin);
                    }

                    std::string batchNumber = "BATCH-" + std::to_string(id) + "-" + expiryDate;
                    if (body.contains("batchNumber") && body["batchNumber"].is_string()) {
                        batchNumber = ControllerUtils::trimCopy(body["batchNumber"].get<std::string>());
                    }

                    try {
                        Transaction tx(db);
                        int batchId = batchRepo.addBatch(id, batchNumber, quantity, expiryDate);

                        auto prod = *productOpt;
                        int oldStock = prod->getStock();
                        int newStock = oldStock + quantity;
                        repo.updateStock(id, newStock);

                        batchRepo.updateProductNearestExpiry(id);

                        InventoryRepository invRepo(db);
                        invRepo.recordMovement(id, MovementType::ADDITION, quantity, oldStock, newStock,
                                               "New batch added: " + batchNumber + " (" + std::to_string(quantity) + " units, exp: " + expiryDate + ")");

                        tx.commit();

                        nlohmann::json data = {
                            {"batchId", batchId},
                            {"batchNumber", batchNumber},
                            {"quantity", quantity},
                            {"expiryDate", expiryDate},
                            {"newTotalStock", newStock}
                        };
                        return ControllerUtils::successResponse(data, "Batch added successfully", allowedOrigin, 201);
                    } catch (const InvalidQuantityException& e) {
                        return ControllerUtils::errorResponse(400, e.what(), allowedOrigin);
                    } catch (const std::invalid_argument& e) {
                        return ControllerUtils::errorResponse(400, e.what(), allowedOrigin);
                    } catch (const std::exception& e) {
                        return ControllerUtils::errorResponse(500, "Error adding batch: " + std::string(e.what()), allowedOrigin);
                    }
                }

                return ControllerUtils::errorResponse(405, "Method Not Allowed", allowedOrigin);
            }
        );
    }
};
