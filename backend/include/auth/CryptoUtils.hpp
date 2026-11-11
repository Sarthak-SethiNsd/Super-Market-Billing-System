#pragma once
#include <string>
#include <vector>
#include <cstdint>

/**
 * @brief Cryptographic utilities for password hashing and secure token generation.
 * Implements:
 *  - PBKDF2-HMAC-SHA256 (Windows CNG / BCrypt)
 *  - Cryptographically secure random salt and token generation (BCryptGenRandom)
 *  - Constant-time string comparison preventing timing attacks
 */
class CryptoUtils {
public:
    static constexpr int DEFAULT_PBKDF2_ITERATIONS = 100000;
    static constexpr size_t SALT_BYTE_LENGTH = 16;
    static constexpr size_t KEY_BYTE_LENGTH = 32;

    static std::string generateRandomHex(size_t byteCount);
    static std::string hashPasswordPBKDF2(const std::string& password, const std::string& saltHex, int iterations = DEFAULT_PBKDF2_ITERATIONS);
    static bool verifyPasswordPBKDF2(const std::string& password, const std::string& saltHex, int iterations, const std::string& expectedHashHex);
    static bool constantTimeEquals(const std::string& a, const std::string& b);
    static std::string bytesToHex(const uint8_t* data, size_t length);
    static std::vector<uint8_t> hexToBytes(const std::string& hex);
};
