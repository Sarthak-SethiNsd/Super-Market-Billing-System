#include "auth/AuthService.hpp"
#include "auth/CryptoUtils.hpp"
#include "repositories/UserRepository.hpp"
#include "database/DatabaseConnection.hpp"
#include <cstdlib>
#include <iostream>

AuthService::AuthService(DatabaseConnection& conn, int sessionDuration)
    : db(conn), sessionDurationSeconds(sessionDuration) {}

bool AuthService::isStaffConfigured() {
    UserRepository userRepo(db);
    return userRepo.findByUsername("staff").has_value() || userRepo.findByUsername("admin").has_value();
}

bool AuthService::initializeStaffFromEnv(const std::string& envVarName) {
    UserRepository userRepo(db);

    // Ensure any legacy ADMIN records are migrated to STAFF role
    try {
        db.execute("UPDATE users SET role = 'STAFF' WHERE role = 'ADMIN';");
    } catch (...) {}

    const char* envVal = std::getenv(envVarName.c_str());
    if (!envVal || std::string(envVal).empty()) {
        envVal = std::getenv("ADMIN_INITIAL_PASSWORD");
    }
    if (!envVal || std::string(envVal).empty()) {
        envVal = std::getenv("STAFF_INITIAL_PASSWORD");
    }

    if (envVal && !std::string(envVal).empty()) {
        createOrUpdateStaff(envVal);
        std::cout << "[AUTH INFO] Staff account updated from environment.\n";
        return true;
    }

    if (isStaffConfigured()) {
        return true;
    }

    createOrUpdateStaff("Staff@123");
    std::cout << "[AUTH INFO] Default staff account provisioned.\n";
    return true;
}

void AuthService::createOrUpdateStaff(const std::string& password) {
    if (password.length() < 6) {
        throw std::invalid_argument("Staff password must be at least 6 characters long");
    }

    UserRepository userRepo(db);
    std::string salt = CryptoUtils::generateRandomHex(CryptoUtils::SALT_BYTE_LENGTH);
    std::string hash = CryptoUtils::hashPasswordPBKDF2(password, salt, CryptoUtils::DEFAULT_PBKDF2_ITERATIONS);

    try {
        db.execute("UPDATE users SET role = 'STAFF' WHERE role = 'ADMIN';");
    } catch (...) {}

    if (userRepo.findByUsername("staff").has_value()) {
        userRepo.updateUserPassword("staff", hash, salt, CryptoUtils::DEFAULT_PBKDF2_ITERATIONS);
    } else if (userRepo.findByUsername("admin").has_value()) {
        userRepo.updateUserPassword("admin", hash, salt, CryptoUtils::DEFAULT_PBKDF2_ITERATIONS);
        userRepo.createUser("staff", hash, salt, CryptoUtils::DEFAULT_PBKDF2_ITERATIONS, "STAFF");
    } else {
        userRepo.createUser("staff", hash, salt, CryptoUtils::DEFAULT_PBKDF2_ITERATIONS, "STAFF");
    }
}

std::optional<std::string> AuthService::loginStaff(const std::string& password) {
    UserRepository userRepo(db);
    auto staffUser = userRepo.findByUsername("staff");
    if (!staffUser.has_value()) {
        staffUser = userRepo.findByUsername("admin");
    }
    if (!staffUser.has_value()) {
        return std::nullopt;
    }

    bool valid = CryptoUtils::verifyPasswordPBKDF2(
        password,
        staffUser->salt,
        staffUser->iterations,
        staffUser->passwordHash
    );

    if (!valid) {
        return std::nullopt;
    }

    // Generate secure random bearer token
    std::string token = CryptoUtils::generateRandomHex(32); // 64 hex chars
    int64_t now = currentTimestampSeconds();

    SessionInfo session;
    session.token = token;
    session.username = staffUser->username;
    session.role = "STAFF";
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
