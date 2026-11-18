#pragma once
#include "controllers/ControllerUtils.hpp"
#include "repositories/ProductReservationRepository.hpp"
#include "repositories/ProductRepository.hpp"
#include <string>

class CartController {
public:
    static void registerRoutes(ControllerUtils::CrowApp& app, DatabaseConnection& db, const std::string& allowedOrigin) {
        // OPTIONS preflight handlers
        CROW_ROUTE(app, "/api/cart").methods("OPTIONS"_method)(
            [allowedOrigin](const crow::request&) {
                return ControllerUtils::corsPreflight(allowedOrigin);
            }
        );
        CROW_ROUTE(app, "/api/cart/reserve").methods("OPTIONS"_method)(
            [allowedOrigin](const crow::request&) {
                return ControllerUtils::corsPreflight(allowedOrigin);
            }
        );
        CROW_ROUTE(app, "/api/cart/release").methods("OPTIONS"_method)(
            [allowedOrigin](const crow::request&) {
                return ControllerUtils::corsPreflight(allowedOrigin);
            }
        );
        CROW_ROUTE(app, "/api/cart/clear").methods("OPTIONS"_method)(
            [allowedOrigin](const crow::request&) {
                return ControllerUtils::corsPreflight(allowedOrigin);
            }
        );

        // GET /api/cart - List active cart reservations for a session
        CROW_ROUTE(app, "/api/cart").methods("GET"_method)(
            [&db, allowedOrigin](const crow::request& req) {
                std::string sessionId = req.url_params.get("sessionId") ? req.url_params.get("sessionId") : "";
                if (sessionId.empty()) {
                    auto headerVal = req.get_header_value("X-Session-ID");
                    if (!headerVal.empty()) sessionId = headerVal;
                }

                if (sessionId.empty()) {
                    return ControllerUtils::errorResponse(400, "Missing required parameter 'sessionId'", allowedOrigin);
                }

                ProductReservationRepository repo(db);
                auto items = repo.getSessionReservations(sessionId);

                nlohmann::json itemsArr = nlohmann::json::array();
                int totalReservedUnits = 0;
                for (const auto& it : items) {
                    totalReservedUnits += it.quantity;
                    itemsArr.push_back({
                        {"id", it.id},
                        {"sessionId", it.sessionId},
                        {"productId", it.productId},
                        {"productName", it.productName},
                        {"sku", it.sku},
                        {"quantity", it.quantity},
                        {"expiresAt", it.expiresAt},
                        {"remainingSeconds", it.remainingSeconds}
                    });
                }

                nlohmann::json data = {
                    {"sessionId", sessionId},
                    {"totalReservedUnits", totalReservedUnits},
                    {"itemCount", items.size()},
                    {"items", itemsArr}
                };

                return ControllerUtils::successResponse(data, "Active cart reservations retrieved", allowedOrigin);
            }
        );

        // POST /api/cart/reserve - Hold/reserve stock for an active cart session
        CROW_ROUTE(app, "/api/cart/reserve").methods("POST"_method)(
            [&db, allowedOrigin](const crow::request& req) {
                try {
                    nlohmann::json body;
                    crow::response parseErr;
                    if (!ControllerUtils::parseJsonObject(req, body, allowedOrigin, parseErr)) {
                        return parseErr;
                    }

                    if (!body.contains("sessionId") || !body["sessionId"].is_string()) {
                        return ControllerUtils::errorResponse(400, "Field 'sessionId' is required and must be a string", allowedOrigin);
                    }
                    std::string sessionId = ControllerUtils::trimCopy(body["sessionId"].get<std::string>());
                    if (sessionId.empty()) {
                        return ControllerUtils::errorResponse(400, "Field 'sessionId' cannot be empty", allowedOrigin);
                    }

                    if (!body.contains("productId") || !body["productId"].is_number_integer()) {
                        return ControllerUtils::errorResponse(400, "Field 'productId' is required and must be an integer", allowedOrigin);
                    }
                    int productId = body["productId"].get<int>();

                    if (!body.contains("quantity") || !body["quantity"].is_number_integer()) {
                        return ControllerUtils::errorResponse(400, "Field 'quantity' is required and must be an integer", allowedOrigin);
                    }
                    int quantity = body["quantity"].get<int>();
                    if (quantity <= 0) {
                        return ControllerUtils::errorResponse(400, "Invalid quantity: must be positive", allowedOrigin);
                    }

                    int ttlSeconds = 900; // 15 minutes default
                    if (body.contains("ttlSeconds") && body["ttlSeconds"].is_number_integer()) {
                        ttlSeconds = (std::max)(60, (std::min)(86400, body["ttlSeconds"].get<int>()));
                    }

                    auto dbLock = db.lock();
                    ProductReservationRepository repo(db);
                    ProductRepository prodRepo(db);

                    auto prodOpt = prodRepo.findById(productId);
                    if (!prodOpt.has_value()) {
                        return ControllerUtils::errorResponse(404, "Product with ID " + std::to_string(productId) + " not found", allowedOrigin);
                    }

                    int availableForSession = 0;
                    bool ok = repo.reserve(sessionId, productId, quantity, ttlSeconds, availableForSession);

                    if (!ok) {
                        return ControllerUtils::errorResponse(
                            409,
                            "Cannot reserve " + std::to_string(quantity) + " units of '" + (*prodOpt)->getName() +
                            "'. Available stock (after reservations) is " + std::to_string(availableForSession) + " unit(s).",
                            allowedOrigin
                        );
                    }

                    int totalReserved = repo.getReservedStock(productId);
                    int remainingAvailable = (std::max)(0, (*prodOpt)->getStock() - totalReserved);

                    nlohmann::json data = {
                        {"sessionId", sessionId},
                        {"productId", productId},
                        {"productName", (*prodOpt)->getName()},
                        {"quantity", quantity},
                        {"totalStock", (*prodOpt)->getStock()},
                        {"reservedStock", totalReserved},
                        {"availableStock", remainingAvailable},
                        {"ttlSeconds", ttlSeconds}
                    };

                    return ControllerUtils::successResponse(data, "Stock reservation updated successfully", allowedOrigin);
                } catch (const std::exception& e) {
                    return ControllerUtils::errorResponse(500, "Error updating stock reservation: " + std::string(e.what()), allowedOrigin);
                }
            }
        );

        // POST /api/cart/release - Release a specific product reservation
        CROW_ROUTE(app, "/api/cart/release").methods("POST"_method)(
            [&db, allowedOrigin](const crow::request& req) {
                try {
                    nlohmann::json body;
                    crow::response parseErr;
                    if (!ControllerUtils::parseJsonObject(req, body, allowedOrigin, parseErr)) {
                        return parseErr;
                    }

                    if (!body.contains("sessionId") || !body["sessionId"].is_string()) {
                        return ControllerUtils::errorResponse(400, "Field 'sessionId' is required", allowedOrigin);
                    }
                    std::string sessionId = ControllerUtils::trimCopy(body["sessionId"].get<std::string>());

                    if (!body.contains("productId") || !body["productId"].is_number_integer()) {
                        return ControllerUtils::errorResponse(400, "Field 'productId' is required", allowedOrigin);
                    }
                    int productId = body["productId"].get<int>();

                    auto dbLock = db.lock();
                    ProductReservationRepository repo(db);
                    bool released = repo.release(sessionId, productId);

                    nlohmann::json data = {
                        {"sessionId", sessionId},
                        {"productId", productId},
                        {"released", released}
                    };

                    return ControllerUtils::successResponse(data, "Reservation released successfully", allowedOrigin);
                } catch (const std::exception& e) {
                    return ControllerUtils::errorResponse(500, "Error releasing reservation: " + std::string(e.what()), allowedOrigin);
                }
            }
        );

        // POST /api/cart/clear - Clear all active reservations for a session
        CROW_ROUTE(app, "/api/cart/clear").methods("POST"_method)(
            [&db, allowedOrigin](const crow::request& req) {
                try {
                    nlohmann::json body;
                    crow::response parseErr;
                    if (!ControllerUtils::parseJsonObject(req, body, allowedOrigin, parseErr)) {
                        return parseErr;
                    }

                    if (!body.contains("sessionId") || !body["sessionId"].is_string()) {
                        return ControllerUtils::errorResponse(400, "Field 'sessionId' is required", allowedOrigin);
                    }
                    std::string sessionId = ControllerUtils::trimCopy(body["sessionId"].get<std::string>());

                    auto dbLock = db.lock();
                    ProductReservationRepository repo(db);
                    int count = repo.clearSession(sessionId);

                    nlohmann::json data = {
                        {"sessionId", sessionId},
                        {"clearedReservations", count}
                    };

                    return ControllerUtils::successResponse(data, "Cart reservations cleared successfully", allowedOrigin);
                } catch (const std::exception& e) {
                    return ControllerUtils::errorResponse(500, "Error clearing cart reservations: " + std::string(e.what()), allowedOrigin);
                }
            }
        );
    }
};
