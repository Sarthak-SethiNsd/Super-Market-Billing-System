#pragma once
#include "controllers/ControllerUtils.hpp"
#include "repositories/BrandRepository.hpp"
#include "auth/AuthService.hpp"

class BrandController {
public:
    static void registerRoutes(ControllerUtils::CrowApp& app, DatabaseConnection& db, AuthService& auth, const std::string& allowedOrigin) {
        // GET /api/brands & POST /api/brands
        CROW_ROUTE(app, "/api/brands").methods("GET"_method, "POST"_method, "OPTIONS"_method)(
            [&db, &auth, allowedOrigin](const crow::request& req) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                BrandRepository repo(db);

                if (req.method == "GET"_method) {
                    auto brands = repo.getAll();
                    nlohmann::json list = nlohmann::json::array();
                    for (const auto& b : brands) {
                        list.push_back({
                            {"id", b.id},
                            {"name", b.name},
                            {"createdAt", b.createdAt},
                            {"productCount", repo.getProductCount(b.id)}
                        });
                    }
                    return ControllerUtils::successResponse(list, "Brands retrieved", allowedOrigin);
                }

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
                            return ControllerUtils::errorResponse(400, "Brand name is required", allowedOrigin);
                        }

                        std::string name = ControllerUtils::trimCopy(body["name"].get<std::string>());
                        if (name.empty() || name.size() > 200) {
                            return ControllerUtils::errorResponse(400, "Brand name must be between 1 and 200 characters", allowedOrigin);
                        }

                        auto dbLock = db.lock();
                        if (repo.findByName(name).has_value()) {
                            return ControllerUtils::errorResponse(409, "Brand with this name already exists", allowedOrigin);
                        }

                        int id = repo.insert(name);
                        nlohmann::json data = {{"id", id}, {"name", name}};
                        return ControllerUtils::successResponse(data, "Brand created successfully", allowedOrigin, 201);
                    } catch (const nlohmann::json::exception&) {
                        return ControllerUtils::errorResponse(400, "Invalid JSON request", allowedOrigin);
                    } catch (const std::exception& e) {
                        return ControllerUtils::errorResponse(500, "Failed to create brand: " + std::string(e.what()), allowedOrigin);
                    }
                }

                return ControllerUtils::errorResponse(405, "Method Not Allowed", allowedOrigin);
            }
        );

        // PUT /api/brands/{id} & DELETE /api/brands/{id}
        CROW_ROUTE(app, "/api/brands/<int>").methods("PUT"_method, "DELETE"_method, "OPTIONS"_method)(
            [&db, &auth, allowedOrigin](const crow::request& req, int id) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                crow::response err;
                if (!ControllerUtils::requireAdmin(req, auth, allowedOrigin, err)) {
                    return err;
                }

                BrandRepository repo(db);
                auto existing = repo.findById(id);
                if (!existing.has_value()) {
                    return ControllerUtils::errorResponse(404, "Brand not found", allowedOrigin);
                }

                if (req.method == "PUT"_method) {
                    try {
                        nlohmann::json body;
                        crow::response parseErr;
                        if (!ControllerUtils::parseJsonObject(req, body, allowedOrigin, parseErr)) {
                            return parseErr;
                        }
                        if (!body.contains("name") || !body["name"].is_string()) {
                            return ControllerUtils::errorResponse(400, "New brand name is required", allowedOrigin);
                        }

                        std::string newName = ControllerUtils::trimCopy(body["name"].get<std::string>());
                        if (newName.empty() || newName.size() > 200) {
                            return ControllerUtils::errorResponse(400, "Brand name must be between 1 and 200 characters", allowedOrigin);
                        }

                        auto dbLock = db.lock();
                        auto duplicate = repo.findByName(newName);
                        if (duplicate.has_value() && duplicate->id != id) {
                            return ControllerUtils::errorResponse(409, "Brand with this name already exists", allowedOrigin);
                        }

                        repo.update(id, newName);
                        nlohmann::json data = {{"id", id}, {"name", newName}};
                        return ControllerUtils::successResponse(data, "Brand updated successfully", allowedOrigin);
                    } catch (const nlohmann::json::exception&) {
                        return ControllerUtils::errorResponse(400, "Invalid JSON request", allowedOrigin);
                    } catch (const std::exception& e) {
                        return ControllerUtils::errorResponse(500, "Failed to update brand: " + std::string(e.what()), allowedOrigin);
                    }
                }

                if (req.method == "DELETE"_method) {
                    try {
                        bool deleted = repo.remove(id);
                        if (!deleted) {
                            return ControllerUtils::errorResponse(404, "Brand not found", allowedOrigin);
                        }
                        nlohmann::json data = {{"id", id}, {"deleted", true}};
                        return ControllerUtils::successResponse(data, "Brand deleted successfully", allowedOrigin);
                    } catch (const std::exception& e) {
                        return ControllerUtils::errorResponse(409, e.what(), allowedOrigin);
                    }
                }

                return ControllerUtils::errorResponse(405, "Method Not Allowed", allowedOrigin);
            }
        );
    }
};
