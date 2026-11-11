#pragma once
#include <string>
#include <cstdlib>

struct ServerConfig {
    int port = 8080;
    std::string host = "0.0.0.0";
    std::string allowedOrigin = "http://localhost:5173";
    std::string dbPath = "data/supermarket.db";
    int sessionDurationSeconds = 3600;

    static ServerConfig loadFromEnvironment() {
        ServerConfig cfg;

        const char* p = std::getenv("PORT");
        if (p) {
            try { cfg.port = std::stoi(p); } catch (...) {}
        }

        const char* h = std::getenv("HOST");
        if (h) cfg.host = h;

        const char* origin = std::getenv("CORS_ALLOWED_ORIGIN");
        if (origin && std::string(origin).find_first_not_of(" \t\r\n") != std::string::npos) {
            cfg.allowedOrigin = origin;
        }

        const char* db = std::getenv("DB_PATH");
        if (db && std::string(db).find_first_not_of(" \t\r\n") != std::string::npos) {
            cfg.dbPath = db;
        }

        const char* dur = std::getenv("SESSION_DURATION_SECONDS");
        if (dur) {
            try {
                int parsed = std::stoi(dur);
                if (parsed > 0) cfg.sessionDurationSeconds = parsed;
            } catch (...) {}
        }

        return cfg;
    }
};
