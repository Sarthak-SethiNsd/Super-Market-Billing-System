#pragma once
#ifndef ASIO_STANDALONE
#define ASIO_STANDALONE
#endif
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0601
#endif
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <crow_all.h>

#include "server/ServerConfig.hpp"
#include "database/DatabaseConnection.hpp"
#include "database/DatabaseMigrator.hpp"
#include "auth/AuthService.hpp"
#include "controllers/HealthController.hpp"
#include "controllers/AuthController.hpp"
#include "controllers/BrandController.hpp"
#include "controllers/CategoryController.hpp"
#include "controllers/ProductController.hpp"
#include "controllers/InventoryController.hpp"
#include "controllers/BillController.hpp"
#include <memory>
#include <iostream>

class AppServer {
private:
    ServerConfig config;
    std::unique_ptr<DatabaseConnection> dbConnection;
    std::unique_ptr<AuthService> authService;
    ControllerUtils::CrowApp app;

    void setupRoutes() {
        HealthController::registerRoutes(app, config.allowedOrigin);
        AuthController::registerRoutes(app, *authService, config.allowedOrigin);
        BrandController::registerRoutes(app, *dbConnection, *authService, config.allowedOrigin);
        CategoryController::registerRoutes(app, *dbConnection, *authService, config.allowedOrigin);
        ProductController::registerRoutes(app, *dbConnection, *authService, config.allowedOrigin);
        InventoryController::registerRoutes(app, *dbConnection, *authService, config.allowedOrigin);
        BillController::registerRoutes(app, *dbConnection, config.allowedOrigin);
    }

public:
    explicit AppServer(const ServerConfig& cfg) : config(cfg) {
        dbConnection = std::make_unique<DatabaseConnection>(config.dbPath);
        DatabaseMigrator::migrate(*dbConnection);

        authService = std::make_unique<AuthService>(*dbConnection, config.sessionDurationSeconds);
        authService->initializeAdminFromEnv("ADMIN_INITIAL_PASSWORD");

        app.get_middleware<ControllerUtils::CorsMiddleware>().allowedOrigin = config.allowedOrigin;
        setupRoutes();
    }

    ControllerUtils::CrowApp& getCrowApp() {
        return app;
    }

    DatabaseConnection& getDb() {
        return *dbConnection;
    }

    AuthService& getAuthService() {
        return *authService;
    }

    const ServerConfig& getConfig() const {
        return config;
    }

    void run() {
        std::cout << "======================================================\n";
        std::cout << "  Supermarket Billing & Inventory REST API (Crow/C++)\n";
        std::cout << "  Server listening on http://" << config.host << ":" << config.port << "\n";
        std::cout << "  Allowed CORS Origin: " << config.allowedOrigin << "\n";
        std::cout << "  Database: " << config.dbPath << "\n";
        std::cout << "======================================================\n";

        app.port(config.port)
           .bindaddr(config.host)
           .multithreaded()
           .run();
    }
};
