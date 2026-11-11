#pragma once
#include "controllers/ControllerUtils.hpp"
#include "repositories/InventoryRepository.hpp"
#include "repositories/ProductRepository.hpp"
#include "database/Transaction.hpp"
#include "auth/AuthService.hpp"

class InventoryController {
public:
    static nlohmann::json movementToJson(const InventoryMovement& m) {
        return nlohmann::json{
            {"id", m.id},
            {"productId", m.productId},
            {"movementType", movementTypeToString(m.movementType)},
            {"quantityChange", m.quantityChange},
            {"previousStock", m.previousStock},
            {"newStock", m.newStock},
            {"reason", m.reason},
            {"relatedBillId", m.relatedBillId.has_value() ? nlohmann::json(*m.relatedBillId) : nlohmann::json(nullptr)},
            {"createdAt", m.createdAt}
        };
    }

    static void registerRoutes(ControllerUtils::CrowApp& app, DatabaseConnection& db, AuthService& auth, const std::string& allowedOrigin) {
        // GET /api/inventory/summary
        CROW_ROUTE(app, "/api/inventory/summary").methods("GET"_method, "OPTIONS"_method)(
            [&db, allowedOrigin](const crow::request& req) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                InventoryRepository repo(db);
                auto summary = repo.getSummary();

                nlohmann::json data = {
                    {"totalMovements", summary.totalMovements},
                    {"totalAdditions", summary.totalAdditions},
                    {"totalReductions", summary.totalReductions},
                    {"totalSales", summary.totalSales},
                    {"totalAdjustments", summary.totalAdjustments}
                };

                return ControllerUtils::successResponse(data, "Inventory summary retrieved", allowedOrigin);
            }
        );

        // GET /api/inventory/movements
        CROW_ROUTE(app, "/api/inventory/movements").methods("GET"_method, "OPTIONS"_method)(
            [&db, allowedOrigin](const crow::request& req) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                int limit = 50;
                int offset = 0;
                if (req.url_params.get("limit")) {
                    try { limit = (std::max)(1, std::stoi(req.url_params.get("limit"))); } catch (...) {}
                }
                if (req.url_params.get("offset")) {
                    try { offset = (std::max)(0, std::stoi(req.url_params.get("offset"))); } catch (...) {}
                }

                InventoryRepository repo(db);
                int totalCount = repo.getTotalCount();
                auto movements = repo.getRecentMovements(limit, offset);

                nlohmann::json list = nlohmann::json::array();
                for (const auto& m : movements) {
                    list.push_back(movementToJson(m));
                }

                return ControllerUtils::successResponseWithPagination(list, "Inventory movements retrieved", allowedOrigin, totalCount, limit, offset);
            }
        );

        // GET /api/inventory/products/{id}/movements
        CROW_ROUTE(app, "/api/inventory/products/<int>/movements").methods("GET"_method, "OPTIONS"_method)(
            [&db, allowedOrigin](const crow::request& req, int productId) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                ProductRepository prodRepo(db);
                if (!prodRepo.findById(productId).has_value()) {
                    return ControllerUtils::errorResponse(404, "Product not found", allowedOrigin);
                }

                InventoryRepository repo(db);
                auto movements = repo.getMovementsByProduct(productId);

                nlohmann::json list = nlohmann::json::array();
                for (const auto& m : movements) {
                    list.push_back(movementToJson(m));
                }

                return ControllerUtils::successResponse(list, "Product inventory movements retrieved", allowedOrigin);
            }
        );

        // POST /api/inventory/adjustments (Admin only)
        CROW_ROUTE(app, "/api/inventory/adjustments").methods("POST"_method, "OPTIONS"_method)(
            [&db, &auth, allowedOrigin](const crow::request& req) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

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
                    if (!body.contains("productId")) {
                        return ControllerUtils::errorResponse(400, "productId is required", allowedOrigin);
                    }

                    int productId = 0;
                    std::string fieldErr;
                    if (!ControllerUtils::parseStrictIntField(body, "productId", 1, 1000000000, productId, fieldErr)) {
                        return ControllerUtils::errorResponse(400, fieldErr, allowedOrigin);
                    }

                    int quantityChange = 0;
                    if (body.contains("quantityChange")) {
                        if (!ControllerUtils::parseStrictIntField(body, "quantityChange", -10000000, 10000000, quantityChange, fieldErr)) {
                            return ControllerUtils::errorResponse(400, fieldErr, allowedOrigin);
                        }
                    } else if (body.contains("delta")) {
                        if (!ControllerUtils::parseStrictIntField(body, "delta", -10000000, 10000000, quantityChange, fieldErr)) {
                            return ControllerUtils::errorResponse(400, fieldErr, allowedOrigin);
                        }
                    } else {
                        return ControllerUtils::errorResponse(400, "quantityChange or delta is required", allowedOrigin);
                    }

                    std::string reason = (body.contains("reason") && body["reason"].is_string())
                        ? ControllerUtils::trimCopy(body["reason"].get<std::string>())
                        : "";
                    if (reason.empty() || reason.size() > 500) {
                        return ControllerUtils::errorResponse(400, "Reason must be a non-empty string up to 500 characters", allowedOrigin);
                    }

                    MovementType mType = (quantityChange >= 0) ? MovementType::ADDITION : MovementType::REDUCTION;
                    if (body.contains("movementType")) {
                        if (!body["movementType"].is_string()) {
                            return ControllerUtils::errorResponse(400, "movementType must be a string", allowedOrigin);
                        }
                        auto parsedType = tryParseMovementType(ControllerUtils::trimCopy(body["movementType"].get<std::string>()));
                        if (!parsedType.has_value()) {
                            return ControllerUtils::errorResponse(400, "Invalid movementType. Expected ADDITION, REDUCTION, SALE, or ADJUSTMENT", allowedOrigin);
                        }
                        mType = *parsedType;
                    }

                    Transaction tx(db);

                    ProductRepository prodRepo(db);
                    auto prodOpt = prodRepo.findById(productId);
                    if (!prodOpt.has_value()) {
                        return ControllerUtils::errorResponse(404, "Product not found", allowedOrigin);
                    }
                    if (!prodRepo.isActive(productId)) {
                        return ControllerUtils::errorResponse(409, "Cannot adjust stock for an inactive or deleted product", allowedOrigin);
                    }

                    auto prod = *prodOpt;
                    int prevStock = prod->getStock();
                    int64_t newStock64 = static_cast<int64_t>(prevStock) + static_cast<int64_t>(quantityChange);
                    if (newStock64 < 0 || newStock64 > 10000000) {
                        return ControllerUtils::errorResponse(400, "Adjustment results in out-of-bounds stock (" + std::to_string(newStock64) + ")", allowedOrigin);
                    }
                    int newStock = static_cast<int>(newStock64);

                    prodRepo.updateStock(productId, newStock);

                    InventoryRepository invRepo(db);
                    int moveId = invRepo.recordMovement(productId, mType, quantityChange, prevStock, newStock, reason);
                    tx.commit();

                    nlohmann::json data = {
                        {"movementId", moveId},
                        {"productId", productId},
                        {"previousStock", prevStock},
                        {"quantityChange", quantityChange},
                        {"newStock", newStock},
                        {"reason", reason}
                    };

                    return ControllerUtils::successResponse(data, "Stock adjusted successfully", allowedOrigin);
                } catch (const nlohmann::json::exception&) {
                    return ControllerUtils::errorResponse(400, "Malformed or invalid JSON request", allowedOrigin);
                } catch (const std::exception& e) {
                    return ControllerUtils::errorResponse(500, "Error adjusting stock: " + std::string(e.what()), allowedOrigin);
                }
            }
        );
    }
};
