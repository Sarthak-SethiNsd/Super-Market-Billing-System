#pragma once
#include "controllers/ControllerUtils.hpp"
#include "repositories/ProductRepository.hpp"
#include "repositories/BrandRepository.hpp"
#include "repositories/CategoryRepository.hpp"
#include "repositories/InventoryRepository.hpp"
#include "database/Transaction.hpp"
#include "models/Perishable.hpp"
#include "models/NonPerishable.hpp"
#include "models/Discount.hpp"
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
            throw std::invalid_argument("Discount value must be finite");
        }

        std::string dTypeUpper = dType;
        for (char& c : dTypeUpper) c = static_cast<char>(std::toupper(static_cast<unsigned char>(c)));

        if (dTypeUpper == "NONE") {
            return std::make_shared<NoDiscount>();
        } else if (dTypeUpper == "PERCENTAGE") {
            if (dVal < 0.0 || dVal > 100.0) {
                throw std::invalid_argument("Percentage discount must be between 0 and 100");
            }
            return std::make_shared<PercentageDiscount>(dVal);
        } else if (dTypeUpper == "FIXED") {
            if (dVal < 0.0 || dVal > 10000000.0) {
                throw std::invalid_argument("Fixed discount is out of valid range");
            }
            int64_t fixedPaise = static_cast<int64_t>(std::round(dVal * 100.0));
            return std::make_shared<FixedAmountDiscount>(fixedPaise);
        }

        throw std::invalid_argument("Invalid discountType. Expected NONE, PERCENTAGE, or FIXED");
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

    static nlohmann::json productToJson(const Product& p, DatabaseConnection& db) {
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

        return nlohmann::json{
            {"id", p.getId()},
            {"sku", p.getSku()},
            {"name", p.getName()},
            {"brandId", p.getBrandId()},
            {"brandName", brandName},
            {"categoryId", p.getCategoryId()},
            {"categoryName", catName},
            {"productType", (p.getType() == ProductType::PERISHABLE ? "PERISHABLE" : "NON_PERISHABLE")},
            {"priceInPaise", p.getPriceInPaise()},
            {"priceInRupees", p.getPrice()},
            {"stock", p.getStock()},
            {"expiryDate", expiry},
            {"discount", {
                {"type", discType},
                {"value", discValue},
                {"description", discDesc},
                {"discountedPriceInPaise", p.getDiscountedPriceInPaise()},
                {"discountedPriceInRupees", p.getDiscountedPriceInRupees()}
            }}
        };
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

                    nlohmann::json list = nlohmann::json::array();
                    int startIdx = (std::min)(offset, totalCount);
                    int endIdx = (std::min)(startIdx + limit, totalCount);
                    for (int i = startIdx; i < endIdx; ++i) {
                        list.push_back(productToJson(*products[i], db));
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
                        if (!body.contains("sku") || !body["sku"].is_string()) {
                            return ControllerUtils::errorResponse(400, "Product SKU is required", allowedOrigin);
                        }

                        std::string name = ControllerUtils::trimCopy(body["name"].get<std::string>());
                        std::string sku = ControllerUtils::trimCopy(body["sku"].get<std::string>());
                        if (name.empty() || name.size() > 200) {
                            return ControllerUtils::errorResponse(400, "Product name must be between 1 and 200 characters", allowedOrigin);
                        }
                        if (sku.empty() || sku.size() > 64) {
                            return ControllerUtils::errorResponse(400, "Product SKU must be between 1 and 64 characters", allowedOrigin);
                        }

                        std::string fieldErr;
                        int brandId = 0;
                        int categoryId = 0;
                        if (!body.contains("brandId") || !ControllerUtils::parseStrictIntField(body, "brandId", 1, 1000000000, brandId, fieldErr)) {
                            return ControllerUtils::errorResponse(400, "A valid positive integer brandId is required", allowedOrigin);
                        }
                        if (!body.contains("categoryId") || !ControllerUtils::parseStrictIntField(body, "categoryId", 1, 1000000000, categoryId, fieldErr)) {
                            return ControllerUtils::errorResponse(400, "A valid positive integer categoryId is required", allowedOrigin);
                        }

                        int stock = 0;
                        if (body.contains("stock")) {
                            if (!ControllerUtils::parseStrictIntField(body, "stock", 0, 10000000, stock, fieldErr)) {
                                return ControllerUtils::errorResponse(400, fieldErr, allowedOrigin);
                            }
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
                        } catch (const std::exception& ex) {
                            return ControllerUtils::errorResponse(400, ex.what(), allowedOrigin);
                        }

                        Transaction tx(db);
                        if (repo.findBySku(sku).has_value()) {
                            return ControllerUtils::errorResponse(409, "A product with this SKU already exists", allowedOrigin);
                        }

                        BrandRepository brandRepo(db);
                        if (!brandRepo.findById(brandId).has_value()) {
                            return ControllerUtils::errorResponse(400, "Referenced brandId does not exist", allowedOrigin);
                        }
                        CategoryRepository catRepo(db);
                        if (!catRepo.findById(categoryId).has_value()) {
                            return ControllerUtils::errorResponse(400, "Referenced categoryId does not exist", allowedOrigin);
                        }

                        int newId = 0;
                        if (productTypeUpper == "PERISHABLE") {
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

                        tx.commit();

                        auto created = repo.findById(newId);
                        if (!created.has_value()) {
                            return ControllerUtils::errorResponse(500, "Failed to retrieve newly created product", allowedOrigin);
                        }

                        return ControllerUtils::successResponse(productToJson(**created, db), "Product created successfully", allowedOrigin, 201);
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

                nlohmann::json data = {
                    {"totalActiveProducts", summary.totalActiveProducts},
                    {"totalStockUnits", summary.totalStockUnits},
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
                            sku = ControllerUtils::trimCopy(body["sku"].get<std::string>());
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
                        if (sku != p->getSku() && repo.findBySku(sku).has_value()) {
                            return ControllerUtils::errorResponse(409, "A product with this SKU already exists", allowedOrigin);
                        }

                        std::string fieldErr;
                        int brandId = p->getBrandId();
                        if (body.contains("brandId") && !ControllerUtils::parseStrictIntField(body, "brandId", 1, 1000000000, brandId, fieldErr)) {
                            return ControllerUtils::errorResponse(400, fieldErr, allowedOrigin);
                        }
                        int categoryId = p->getCategoryId();
                        if (body.contains("categoryId") && !ControllerUtils::parseStrictIntField(body, "categoryId", 1, 1000000000, categoryId, fieldErr)) {
                            return ControllerUtils::errorResponse(400, fieldErr, allowedOrigin);
                        }
                        if (!BrandRepository(db).findById(brandId).has_value()) {
                            return ControllerUtils::errorResponse(400, "Referenced brandId does not exist", allowedOrigin);
                        }
                        if (!CategoryRepository(db).findById(categoryId).has_value()) {
                            return ControllerUtils::errorResponse(400, "Referenced categoryId does not exist", allowedOrigin);
                        }

                        int stock = p->getStock();
                        if (body.contains("stock") && !ControllerUtils::parseStrictIntField(body, "stock", 0, 10000000, stock, fieldErr)) {
                            return ControllerUtils::errorResponse(400, fieldErr, allowedOrigin);
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
                        } catch (const std::exception& ex) {
                            return ControllerUtils::errorResponse(400, ex.what(), allowedOrigin);
                        }

                        if (productTypeUpper == "PERISHABLE") {
                            Perishable updated(id, sku, name, brandId, categoryId, priceInPaise, stock, expiryDate, strategy);
                            repo.update(updated);
                        } else {
                            NonPerishable updated(id, sku, name, brandId, categoryId, priceInPaise, stock, strategy);
                            repo.update(updated);
                        }

                        tx.commit();
                        auto saved = repo.findById(id);
                        return ControllerUtils::successResponse(productToJson(**saved, db), "Product updated successfully", allowedOrigin);
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
    }
};
