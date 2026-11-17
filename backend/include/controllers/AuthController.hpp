#pragma once
#include "controllers/ControllerUtils.hpp"
#include "auth/AuthService.hpp"

class AuthController {
public:
    static void registerRoutes(ControllerUtils::CrowApp& app, AuthService& auth, const std::string& allowedOrigin) {
        // Lambda handler for Staff Authentication
        auto handleStaffLogin = [&auth, allowedOrigin](const crow::request& req) {
            if (req.method == "OPTIONS"_method) {
                return ControllerUtils::corsPreflight(allowedOrigin);
            }

            if (!auth.isStaffConfigured()) {
                return ControllerUtils::errorResponse(
                    503,
                    "Staff access is not configured. Operator must set STAFF_PASSWORD or ADMIN_INITIAL_PASSWORD.",
                    allowedOrigin
                );
            }

            try {
                nlohmann::json body;
                crow::response parseErr;
                if (!ControllerUtils::parseJsonObject(req, body, allowedOrigin, parseErr)) {
                    return parseErr;
                }
                if (!body.contains("password") || !body["password"].is_string()) {
                    return ControllerUtils::errorResponse(400, "Password field is required", allowedOrigin);
                }

                std::string password = body["password"].get<std::string>();
                if (password.size() > 256) {
                    return ControllerUtils::errorResponse(400, "Password exceeds maximum length", allowedOrigin);
                }
                auto tokenOpt = auth.loginStaff(password);

                if (!tokenOpt.has_value()) {
                    return ControllerUtils::errorResponse(401, "Invalid staff credentials", allowedOrigin);
                }

                nlohmann::json data = {
                    {"token", *tokenOpt},
                    {"role", "STAFF"},
                    {"expiresInSeconds", auth.getSessionDurationSeconds()}
                };
                return ControllerUtils::successResponse(data, "Staff access authenticated successfully", allowedOrigin);
            } catch (const nlohmann::json::exception&) {
                return ControllerUtils::errorResponse(400, "Malformed or invalid JSON request", allowedOrigin);
            } catch (const std::exception& e) {
                return ControllerUtils::errorResponse(500, "Authentication error: " + std::string(e.what()), allowedOrigin);
            }
        };

        // POST /api/auth/staff/login (Primary two-mode staff authentication)
        CROW_ROUTE(app, "/api/auth/staff/login").methods("POST"_method, "OPTIONS"_method)(handleStaffLogin);

        // POST /api/auth/admin/unlock (Backward-compatible alias for existing tests and clients)
        CROW_ROUTE(app, "/api/auth/admin/unlock").methods("POST"_method, "OPTIONS"_method)(handleStaffLogin);

        // POST /api/auth/logout
        CROW_ROUTE(app, "/api/auth/logout").methods("POST"_method, "OPTIONS"_method)(
            [&auth, allowedOrigin](const crow::request& req) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                std::string token = ControllerUtils::extractBearerToken(req);
                if (token.empty()) {
                    return ControllerUtils::errorResponse(400, "Bearer token required for logout", allowedOrigin);
                }

                bool loggedOut = auth.logout(token);
                nlohmann::json data = {{"loggedOut", loggedOut}};
                return ControllerUtils::successResponse(data, "Session invalidated successfully", allowedOrigin);
            }
        );

        // GET /api/auth/session
        CROW_ROUTE(app, "/api/auth/session").methods("GET"_method, "OPTIONS"_method)(
            [&auth, allowedOrigin](const crow::request& req) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                std::string token = ControllerUtils::extractBearerToken(req);
                if (token.empty()) {
                    // Customer mode (unauthenticated public user)
                    nlohmann::json customerData = {
                        {"authenticated", false},
                        {"role", "CUSTOMER"}
                    };
                    return ControllerUtils::successResponse(customerData, "Current session is Customer Mode", allowedOrigin);
                }

                auto sessionOpt = auth.validateToken(token);
                if (!sessionOpt.has_value()) {
                    return ControllerUtils::errorResponse(401, "Session expired or invalid token", allowedOrigin);
                }

                nlohmann::json data = {
                    {"authenticated", true},
                    {"username", sessionOpt->username},
                    {"role", "STAFF"},
                    {"expiresAt", sessionOpt->expiresAt}
                };
                return ControllerUtils::successResponse(data, "Session valid (Staff Mode)", allowedOrigin);
            }
        );
    }
};
