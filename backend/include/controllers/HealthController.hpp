#pragma once
#include "controllers/ControllerUtils.hpp"
#include <chrono>

class HealthController {
public:
    static void registerRoutes(ControllerUtils::CrowApp& app, const std::string& allowedOrigin) {
        CROW_ROUTE(app, "/api/health").methods("GET"_method, "OPTIONS"_method)(
            [allowedOrigin](const crow::request& req) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }
                auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::system_clock::now().time_since_epoch()).count();
                nlohmann::json data = {
                    {"status", "UP"},
                    {"service", "Supermarket Management API"},
                    {"version", "1.0.0"},
                    {"timestamp", now}
                };
                return ControllerUtils::successResponse(data, "Service operational", allowedOrigin);
            }
        );
    }
};
