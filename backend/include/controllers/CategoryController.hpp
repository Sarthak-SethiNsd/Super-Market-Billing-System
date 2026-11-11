#pragma once
#include "controllers/ControllerUtils.hpp"
#include "repositories/CategoryRepository.hpp"
#include "auth/AuthService.hpp"

class CategoryController {
public:
    static void registerRoutes(ControllerUtils::CrowApp& app, DatabaseConnection& db, AuthService& auth, const std::string& allowedOrigin) {
        // GET /api/categories & POST /api/categories
        CROW_ROUTE(app, "/api/categories").methods("GET"_method, "POST"_method, "OPTIONS"_method)(
            [&db, &auth, allowedOrigin](const crow::request& req) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                CategoryRepository repo(db);

                if (req.method == "GET"_method) {
                    auto categories = repo.getAll();
                    nlohmann::json list = nlohmann::json::array();
                    for (const auto& c : categories) {
                        list.push_back({
                            {"id", c.id},
                            {"name", c.name},
                            {"createdAt", c.createdAt},
                            {"productCount", repo.getProductCount(c.id)}
                        });
                    }
                    return ControllerUtils::successResponse(list, "Categories retrieved", allowedOrigin);
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
                            return ControllerUtils::errorResponse(400, "Category name is required", allowedOrigin);
                        }

                        std::string name = ControllerUtils::trimCopy(body["name"].get<std::string>());
                        if (name.empty() || name.size() > 200) {
                            return ControllerUtils::errorResponse(400, "Category name must be between 1 and 200 characters", allowedOrigin);
                        }

                        auto dbLock = db.lock();
                        if (repo.findByName(name).has_value()) {
                            return ControllerUtils::errorResponse(409, "Category with this name already exists", allowedOrigin);
                        }

                        int id = repo.insert(name);
                        nlohmann::json data = {{"id", id}, {"name", name}};
                        return ControllerUtils::successResponse(data, "Category created successfully", allowedOrigin, 201);
                    } catch (const nlohmann::json::exception&) {
                        return ControllerUtils::errorResponse(400, "Invalid JSON request", allowedOrigin);
                    } catch (const std::exception& e) {
                        return ControllerUtils::errorResponse(500, "Failed to create category: " + std::string(e.what()), allowedOrigin);
                    }
                }

                return ControllerUtils::errorResponse(405, "Method Not Allowed", allowedOrigin);
            }
        );

        // PUT /api/categories/{id} & DELETE /api/categories/{id}
        CROW_ROUTE(app, "/api/categories/<int>").methods("PUT"_method, "DELETE"_method, "OPTIONS"_method)(
            [&db, &auth, allowedOrigin](const crow::request& req, int id) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                crow::response err;
                if (!ControllerUtils::requireAdmin(req, auth, allowedOrigin, err)) {
                    return err;
                }

                CategoryRepository repo(db);
                auto existing = repo.findById(id);
                if (!existing.has_value()) {
                    return ControllerUtils::errorResponse(404, "Category not found", allowedOrigin);
                }

                if (req.method == "PUT"_method) {
                    try {
                        nlohmann::json body;
                        crow::response parseErr;
                        if (!ControllerUtils::parseJsonObject(req, body, allowedOrigin, parseErr)) {
                            return parseErr;
                        }
                        if (!body.contains("name") || !body["name"].is_string()) {
                            return ControllerUtils::errorResponse(400, "New category name is required", allowedOrigin);
                        }

                        std::string newName = ControllerUtils::trimCopy(body["name"].get<std::string>());
                        if (newName.empty() || newName.size() > 200) {
                            return ControllerUtils::errorResponse(400, "Category name must be between 1 and 200 characters", allowedOrigin);
                        }

                        auto dbLock = db.lock();
                        auto duplicate = repo.findByName(newName);
                        if (duplicate.has_value() && duplicate->id != id) {
                            return ControllerUtils::errorResponse(409, "Category with this name already exists", allowedOrigin);
                        }

                        repo.update(id, newName);
                        nlohmann::json data = {{"id", id}, {"name", newName}};
                        return ControllerUtils::successResponse(data, "Category updated successfully", allowedOrigin);
                    } catch (const nlohmann::json::exception&) {
                        return ControllerUtils::errorResponse(400, "Invalid JSON request", allowedOrigin);
                    } catch (const std::exception& e) {
                        return ControllerUtils::errorResponse(500, "Failed to update category: " + std::string(e.what()), allowedOrigin);
                    }
                }

                if (req.method == "DELETE"_method) {
                    try {
                        bool deleted = repo.remove(id);
                        if (!deleted) {
                            return ControllerUtils::errorResponse(404, "Category not found", allowedOrigin);
                        }
                        nlohmann::json data = {{"id", id}, {"deleted", true}};
                        return ControllerUtils::successResponse(data, "Category deleted successfully", allowedOrigin);
                    } catch (const std::exception& e) {
                        return ControllerUtils::errorResponse(409, e.what(), allowedOrigin);
                    }
                }

                return ControllerUtils::errorResponse(405, "Method Not Allowed", allowedOrigin);
            }
        );
    }
};
