#include "auth/CryptoUtils.hpp"

#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <bcrypt.h>
#else
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <limits>
#endif

#include <stdexcept>
#include <iomanip>
#include <sstream>

std::string CryptoUtils::bytesToHex(const uint8_t* data, size_t length) {
    std::ostringstream ss;
    ss << std::hex << std::setfill('0');
    for (size_t i = 0; i < length; ++i) {
        ss << std::setw(2) << static_cast<int>(data[i]);
    }
    return ss.str();
}

std::vector<uint8_t> CryptoUtils::hexToBytes(const std::string& hex) {
    if (hex.length() % 2 != 0) {
        throw std::invalid_argument("Invalid hex string length");
    }
    std::vector<uint8_t> bytes;
    bytes.reserve(hex.length() / 2);
    for (size_t i = 0; i < hex.length(); i += 2) {
        std::string byteString = hex.substr(i, 2);
        auto byte = static_cast<uint8_t>(std::stoul(byteString, nullptr, 16));
        bytes.push_back(byte);
    }
    return bytes;
}

std::string CryptoUtils::generateRandomHex(size_t byteCount) {
    if (byteCount == 0) {
        return "";
    }
    std::vector<uint8_t> buffer(byteCount);
#ifdef _WIN32
    NTSTATUS status = BCryptGenRandom(nullptr, buffer.data(), static_cast<ULONG>(buffer.size()), BCRYPT_USE_SYSTEM_PREFERRED_RNG);
    if (!BCRYPT_SUCCESS(status)) {
        throw std::runtime_error("Failed to generate cryptographically secure random bytes via BCryptGenRandom");
    }
#else
    if (byteCount > static_cast<size_t>((std::numeric_limits<int>::max)())) {
        throw std::invalid_argument("Random byte count exceeds OpenSSL RAND_bytes limit");
    }
    if (RAND_bytes(buffer.data(), static_cast<int>(buffer.size())) != 1) {
        throw std::runtime_error("Failed to generate cryptographically secure random bytes via OpenSSL RAND_bytes");
    }
#endif
    return bytesToHex(buffer.data(), buffer.size());
}

std::string CryptoUtils::hashPasswordPBKDF2(const std::string& password, const std::string& saltHex, int iterations) {
    std::vector<uint8_t> saltBytes = hexToBytes(saltHex);
    std::vector<uint8_t> derivedKey(KEY_BYTE_LENGTH);

#ifdef _WIN32
    BCRYPT_ALG_HANDLE hAlg = nullptr;
    NTSTATUS status = BCryptOpenAlgorithmProvider(&hAlg, BCRYPT_SHA256_ALGORITHM, nullptr, BCRYPT_ALG_HANDLE_HMAC_FLAG);
    if (!BCRYPT_SUCCESS(status)) {
        throw std::runtime_error("Failed to open BCrypt HMAC SHA256 algorithm provider");
    }

    status = BCryptDeriveKeyPBKDF2(
        hAlg,
        reinterpret_cast<PUCHAR>(const_cast<char*>(password.data())),
        static_cast<ULONG>(password.size()),
        saltBytes.data(),
        static_cast<ULONG>(saltBytes.size()),
        static_cast<ULONGLONG>(iterations),
        derivedKey.data(),
        static_cast<ULONG>(derivedKey.size()),
        0
    );

    BCryptCloseAlgorithmProvider(hAlg, 0);

    if (!BCRYPT_SUCCESS(status)) {
        throw std::runtime_error("Failed to derive PBKDF2-HMAC-SHA256 key via BCrypt");
    }
#else
    if (iterations <= 0) {
        throw std::invalid_argument("PBKDF2 iteration count must be positive");
    }
    if (password.size() > static_cast<size_t>((std::numeric_limits<int>::max)()) ||
        saltBytes.size() > static_cast<size_t>((std::numeric_limits<int>::max)())) {
        throw std::invalid_argument("PBKDF2 input length exceeds OpenSSL integer limit");
    }
    int rc = PKCS5_PBKDF2_HMAC(
        password.data(),
        static_cast<int>(password.size()),
        saltBytes.data(),
        static_cast<int>(saltBytes.size()),
        iterations,
        EVP_sha256(),
        static_cast<int>(derivedKey.size()),
        derivedKey.data()
    );
    if (rc != 1) {
        throw std::runtime_error("Failed to derive PBKDF2-HMAC-SHA256 key via OpenSSL PKCS5_PBKDF2_HMAC");
    }
#endif

    return bytesToHex(derivedKey.data(), derivedKey.size());
}

bool CryptoUtils::verifyPasswordPBKDF2(const std::string& password, const std::string& saltHex, int iterations, const std::string& expectedHashHex) {
    std::string computedHash = hashPasswordPBKDF2(password, saltHex, iterations);
    return constantTimeEquals(computedHash, expectedHashHex);
}

bool CryptoUtils::constantTimeEquals(const std::string& a, const std::string& b) {
    if (a.length() != b.length()) {
        return false;
    }
    uint8_t diff = 0;
    for (size_t i = 0; i < a.length(); ++i) {
        diff |= static_cast<uint8_t>(a[i] ^ b[i]);
    }
    return diff == 0;
}
