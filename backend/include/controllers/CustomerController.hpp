#pragma once
#include "controllers/ControllerUtils.hpp"
#include "repositories/CustomerRepository.hpp"
#include "auth/AuthService.hpp"
#include <crow_all.h>
#include <nlohmann/json.hpp>

class CustomerController {
public:
    static nlohmann::json customerToJson(const CustomerRecord& c) {
        return nlohmann::json{
            {"id", c.id},
            {"customerCode", c.customerCode},
            {"fullName", c.fullName},
            {"phone", c.phone},
            {"email", c.email},
            {"isActive", c.isActive},
            {"createdAt", c.createdAt},
            {"updatedAt", c.updatedAt},
            {"totalPurchases", c.totalPurchases},
            {"lifetimeSpentPaise", c.lifetimeSpentPaise},
            {"lifetimeSpentInRupees", c.getLifetimeSpentInRupees()},
            {"lastPurchaseDate", c.lastPurchaseDate}
        };
    }

    static void registerRoutes(ControllerUtils::CrowApp& app, DatabaseConnection& db, AuthService& auth, const std::string& allowedOrigin) {
        (void)auth;

        // 1. GET /api/customers & POST /api/customers
        CROW_ROUTE(app, "/api/customers").methods("GET"_method, "POST"_method, "OPTIONS"_method)(
            [&db, allowedOrigin](const crow::request& req) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                CustomerRepository repo(db);

                // GET /api/customers
                if (req.method == "GET"_method) {
                    int limit = 50;
                    int offset = 0;
                    std::string query = "";

                    if (req.url_params.get("limit")) {
                        try { limit = (std::max)(1, std::stoi(req.url_params.get("limit"))); } catch (...) {}
                    }
                    if (req.url_params.get("offset")) {
                        try { offset = (std::max)(0, std::stoi(req.url_params.get("offset"))); } catch (...) {}
                    }
                    if (req.url_params.get("q")) {
                        query = ControllerUtils::trimCopy(req.url_params.get("q"));
                    }

                    int totalCount = repo.getTotalCount(query);
                    auto list = repo.findAll(limit, offset, query);

                    nlohmann::json arr = nlohmann::json::array();
                    for (const auto& c : list) {
                        arr.push_back(customerToJson(c));
                    }

                    return ControllerUtils::successResponseWithPagination(arr, "Customers retrieved", allowedOrigin, totalCount, limit, offset);
                }

                // POST /api/customers
                if (req.method == "POST"_method) {
                    try {
                        nlohmann::json body;
                        crow::response parseErr;
                        if (!ControllerUtils::parseJsonObject(req, body, allowedOrigin, parseErr)) {
                            return parseErr;
                        }

                        if (!body.contains("fullName") || !body["fullName"].is_string()) {
                            return ControllerUtils::errorResponse(400, "Customer 'fullName' is required and must be a string", allowedOrigin);
                        }

                        std::string fullName = ControllerUtils::trimCopy(body["fullName"].get<std::string>());
                        if (fullName.empty()) {
                            return ControllerUtils::errorResponse(400, "Customer 'fullName' cannot be blank", allowedOrigin);
                        }

                        CustomerRecord customer;
                        customer.fullName = fullName;

                        if (body.contains("phone") && !body["phone"].is_null() && body["phone"].is_string()) {
                            customer.phone = ControllerUtils::trimCopy(body["phone"].get<std::string>());
                        }
                        if (body.contains("email") && !body["email"].is_null() && body["email"].is_string()) {
                            customer.email = ControllerUtils::trimCopy(body["email"].get<std::string>());
                        }
                        if (body.contains("customerCode") && !body["customerCode"].is_null() && body["customerCode"].is_string()) {
                            customer.customerCode = ControllerUtils::trimCopy(body["customerCode"].get<std::string>());
                        }

                        int newId = repo.insert(customer);
                        auto created = repo.findById(newId);
                        if (!created.has_value()) {
                            return ControllerUtils::errorResponse(500, "Failed to load newly created customer", allowedOrigin);
                        }

                        return ControllerUtils::successResponse(customerToJson(*created), "Customer created successfully", allowedOrigin, 201);
                    } catch (const std::exception& e) {
                        return ControllerUtils::errorResponse(400, "Error creating customer: " + std::string(e.what()), allowedOrigin);
                    }
                }

                return ControllerUtils::errorResponse(405, "Method Not Allowed", allowedOrigin);
            }
        );

        // 2. GET /api/customers/<id> & PUT /api/customers/<id>
        CROW_ROUTE(app, "/api/customers/<int>").methods("GET"_method, "PUT"_method, "OPTIONS"_method)(
            [&db, allowedOrigin](const crow::request& req, int id) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                CustomerRepository repo(db);

                // GET /api/customers/<id>
                if (req.method == "GET"_method) {
                    auto c = repo.findById(id);
                    if (!c.has_value()) {
                        return ControllerUtils::errorResponse(404, "Customer not found", allowedOrigin);
                    }
                    return ControllerUtils::successResponse(customerToJson(*c), "Customer retrieved", allowedOrigin);
                }

                // PUT /api/customers/<id>
                if (req.method == "PUT"_method) {
                    try {
                        auto existing = repo.findById(id);
                        if (!existing.has_value()) {
                            return ControllerUtils::errorResponse(404, "Customer not found", allowedOrigin);
                        }

                        nlohmann::json body;
                        crow::response parseErr;
                        if (!ControllerUtils::parseJsonObject(req, body, allowedOrigin, parseErr)) {
                            return parseErr;
                        }

                        CustomerRecord customer = *existing;
                        if (body.contains("fullName") && body["fullName"].is_string()) {
                            std::string name = ControllerUtils::trimCopy(body["fullName"].get<std::string>());
                            if (!name.empty()) {
                                customer.fullName = name;
                            }
                        }
                        if (body.contains("phone") && !body["phone"].is_null() && body["phone"].is_string()) {
                            customer.phone = ControllerUtils::trimCopy(body["phone"].get<std::string>());
                        }
                        if (body.contains("email") && !body["email"].is_null() && body["email"].is_string()) {
                            customer.email = ControllerUtils::trimCopy(body["email"].get<std::string>());
                        }
                        if (body.contains("isActive") && body["isActive"].is_boolean()) {
                            customer.isActive = body["isActive"].get<bool>();
                        }

                        repo.update(customer);
                        auto updated = repo.findById(id);
                        return ControllerUtils::successResponse(customerToJson(*updated), "Customer updated successfully", allowedOrigin);
                    } catch (const std::exception& e) {
                        return ControllerUtils::errorResponse(400, "Error updating customer: " + std::string(e.what()), allowedOrigin);
                    }
                }

                return ControllerUtils::errorResponse(405, "Method Not Allowed", allowedOrigin);
            }
        );

        // 3. GET /api/customers/<id>/bills (Purchase History)
        CROW_ROUTE(app, "/api/customers/<int>/bills").methods("GET"_method, "OPTIONS"_method)(
            [&db, allowedOrigin](const crow::request& req, int id) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                CustomerRepository repo(db);
                auto c = repo.findById(id);
                if (!c.has_value()) {
                    return ControllerUtils::errorResponse(404, "Customer not found", allowedOrigin);
                }

                int limit = 50;
                int offset = 0;
                if (req.url_params.get("limit")) {
                    try { limit = (std::max)(1, std::stoi(req.url_params.get("limit"))); } catch (...) {}
                }
                if (req.url_params.get("offset")) {
                    try { offset = (std::max)(0, std::stoi(req.url_params.get("offset"))); } catch (...) {}
                }

                auto bills = repo.getCustomerBills(id, limit, offset);
                nlohmann::json billsArr = nlohmann::json::array();
                for (const auto& b : bills) {
                    billsArr.push_back(nlohmann::json{
                        {"id", b.id},
                        {"billNumber", b.billNumber},
                        {"subtotalPaise", b.subtotalPaise},
                        {"subtotalInRupees", b.getSubtotalInRupees()},
                        {"totalDiscountPaise", b.totalDiscountPaise},
                        {"totalDiscountInRupees", b.getTotalDiscountInRupees()},
                        {"finalAmountPaise", b.finalAmountPaise},
                        {"finalAmountInRupees", b.getFinalAmountInRupees()},
                        {"createdAt", b.createdAt},
                        {"customerId", b.customerId.has_value() ? nlohmann::json(*b.customerId) : nlohmann::json(nullptr)},
                        {"customerName", b.customerName},
                        {"customerPhone", b.customerPhone}
                    });
                }

                return ControllerUtils::successResponse(billsArr, "Customer purchase history retrieved", allowedOrigin);
            }
        );
    }
};
