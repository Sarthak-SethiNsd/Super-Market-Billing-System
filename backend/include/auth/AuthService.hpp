#pragma once
#include <string>
#include <optional>
#include <unordered_map>
#include <mutex>
#include <cstdint>
#include <chrono>

class DatabaseConnection;

struct SessionInfo {
    std::string token;
    std::string username;
    std::string role;
    int64_t createdAt = 0;
    int64_t expiresAt = 0;

    bool isExpired() const {
        auto now = std::chrono::duration_cast<std::chrono::seconds>(
            std::chrono::system_clock::now().time_since_epoch()).count();
        return now >= expiresAt;
    }
};

class AuthService {
private:
    DatabaseConnection& db;
    int sessionDurationSeconds;
    std::unordered_map<std::string, SessionInfo> activeSessions;
    mutable std::mutex sessionMutex;

    static int64_t currentTimestampSeconds() {
        return std::chrono::duration_cast<std::chrono::seconds>(
            std::chrono::system_clock::now().time_since_epoch()).count();
    }

public:
    explicit AuthService(DatabaseConnection& conn, int sessionDuration = 3600);

    bool initializeAdminFromEnv(const std::string& envVarName = "ADMIN_INITIAL_PASSWORD");
    bool isAdminConfigured();
    void createOrUpdateAdmin(const std::string& password);

    std::optional<std::string> unlockAdmin(const std::string& password);
    std::optional<SessionInfo> validateToken(const std::string& token);
    bool logout(const std::string& token);
    void cleanupExpiredSessions();
    void clearAllSessions(); // For testing
    int getSessionDurationSeconds() const { return sessionDurationSeconds; }
};
