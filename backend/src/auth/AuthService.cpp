#include "auth/AuthService.hpp"
#include "auth/CryptoUtils.hpp"
#include "repositories/UserRepository.hpp"
#include "database/DatabaseConnection.hpp"
#include <cstdlib>
#include <iostream>

AuthService::AuthService(DatabaseConnection& conn, int sessionDuration)
    : db(conn), sessionDurationSeconds(sessionDuration) {}

bool AuthService::isAdminConfigured() {
    UserRepository userRepo(db);
    return userRepo.adminExists();
}

bool AuthService::initializeAdminFromEnv(const std::string& envVarName) {
    UserRepository userRepo(db);
    if (userRepo.adminExists()) {
        return true;
    }

    const char* envVal = std::getenv(envVarName.c_str());
    if (!envVal || std::string(envVal).empty()) {
        std::cerr << "[AUTH WARNING] " << envVarName
                  << " environment variable is not set. No default admin created.\n";
        return false;
    }

    createOrUpdateAdmin(envVal);
    std::cout << "[AUTH INFO] Initial admin account created successfully from environment.\n";
    return true;
}

void AuthService::createOrUpdateAdmin(const std::string& password) {
    if (password.length() < 6) {
        throw std::invalid_argument("Admin password must be at least 6 characters long");
    }

    UserRepository userRepo(db);
    std::string salt = CryptoUtils::generateRandomHex(CryptoUtils::SALT_BYTE_LENGTH);
    std::string hash = CryptoUtils::hashPasswordPBKDF2(password, salt, CryptoUtils::DEFAULT_PBKDF2_ITERATIONS);

    if (userRepo.adminExists()) {
        userRepo.updateUserPassword("admin", hash, salt, CryptoUtils::DEFAULT_PBKDF2_ITERATIONS);
    } else {
        userRepo.createUser("admin", hash, salt, CryptoUtils::DEFAULT_PBKDF2_ITERATIONS, "ADMIN");
    }
}

std::optional<std::string> AuthService::unlockAdmin(const std::string& password) {
    UserRepository userRepo(db);
    auto adminUser = userRepo.findByUsername("admin");
    if (!adminUser.has_value()) {
        return std::nullopt;
    }

    bool valid = CryptoUtils::verifyPasswordPBKDF2(
        password,
        adminUser->salt,
        adminUser->iterations,
        adminUser->passwordHash
    );

    if (!valid) {
        return std::nullopt;
    }

    // Generate secure random bearer token
    std::string token = CryptoUtils::generateRandomHex(32); // 64 hex chars
    int64_t now = currentTimestampSeconds();

    SessionInfo session;
    session.token = token;
    session.username = "admin";
    session.role = "ADMIN";
    session.createdAt = now;
    session.expiresAt = now + sessionDurationSeconds;

    {
        std::lock_guard<std::mutex> lock(sessionMutex);
        activeSessions[token] = session;
    }

    return token;
}

std::optional<SessionInfo> AuthService::validateToken(const std::string& token) {
    if (token.empty()) {
        return std::nullopt;
    }

    std::lock_guard<std::mutex> lock(sessionMutex);
    auto it = activeSessions.find(token);
    if (it == activeSessions.end()) {
        return std::nullopt;
    }

    if (it->second.isExpired()) {
        activeSessions.erase(it);
        return std::nullopt;
    }

    return it->second;
}

bool AuthService::logout(const std::string& token) {
    std::lock_guard<std::mutex> lock(sessionMutex);
    return activeSessions.erase(token) > 0;
}

void AuthService::cleanupExpiredSessions() {
    std::lock_guard<std::mutex> lock(sessionMutex);
    for (auto it = activeSessions.begin(); it != activeSessions.end();) {
        if (it->second.isExpired()) {
            it = activeSessions.erase(it);
        } else {
            ++it;
        }
    }
}

void AuthService::clearAllSessions() {
    std::lock_guard<std::mutex> lock(sessionMutex);
    activeSessions.clear();
}
