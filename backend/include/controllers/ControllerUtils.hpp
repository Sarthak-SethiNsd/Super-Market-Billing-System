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
#include <nlohmann/json.hpp>
#include <string>
#include <cmath>
#include <cctype>
#include <cstdint>
#include <limits>

namespace ControllerUtils {

inline constexpr size_t MAX_REQUEST_BODY_BYTES = 1048576; // 1 MiB limit

inline std::string trimCopy(const std::string& s) {
    const auto first = s.find_first_not_of(" \t\r\n");
    if (first == std::string::npos) return "";
    const auto last = s.find_last_not_of(" \t\r\n");
    return s.substr(first, last - first + 1);
}

inline bool isValidIsoDate(const std::string& s) {
    if (s.size() != 10 || s[4] != '-' || s[7] != '-') return false;
    for (size_t i = 0; i < 10; ++i) {
        if (i == 4 || i == 7) continue;
        if (!std::isdigit(static_cast<unsigned char>(s[i]))) return false;
    }
    int year = std::stoi(s.substr(0, 4));
    int month = std::stoi(s.substr(5, 2));
    int day = std::stoi(s.substr(8, 2));
    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) return false;
    static const int daysInMonth[12] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    int maxDay = daysInMonth[month - 1];
    if (month == 2 && ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0))) {
        maxDay = 29;
    }
    return day <= maxDay;
}

inline std::string extractBearerToken(const crow::request& req) {
    auto authHeader = req.get_header_value("Authorization");
    if (authHeader.rfind("Bearer ", 0) == 0) {
        return authHeader.substr(7);
    }
    return "";
}

inline void applyCors(crow::response& res, const std::string& allowedOrigin) {
    res.add_header("Access-Control-Allow-Origin", allowedOrigin);
    if (allowedOrigin != "*") {
        res.add_header("Vary", "Origin");
    }
    res.add_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.add_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.add_header("Access-Control-Expose-Headers", "X-Total-Count, X-Limit, X-Offset");
    res.add_header("Access-Control-Allow-Credentials", "true");
}

inline crow::response corsPreflight(const std::string& allowedOrigin) {
    crow::response res(204);
    applyCors(res, allowedOrigin);
    return res;
}

inline crow::response jsonResponse(int statusCode, const nlohmann::json& body, const std::string& allowedOrigin) {
    crow::response res(statusCode, body.dump());
    res.add_header("Content-Type", "application/json");
    applyCors(res, allowedOrigin);
    return res;
}

inline crow::response errorResponse(int statusCode, const std::string& message, const std::string& allowedOrigin) {
    nlohmann::json j = {
        {"success", false},
        {"error", message}
    };
    return jsonResponse(statusCode, j, allowedOrigin);
}

inline crow::response successResponse(const nlohmann::json& data, const std::string& message, const std::string& allowedOrigin, int statusCode = 200) {
    nlohmann::json j = {
        {"success", true},
        {"message", message},
        {"data", data}
    };
    return jsonResponse(statusCode, j, allowedOrigin);
}

inline crow::response successResponseWithPagination(const nlohmann::json& data, const std::string& message, const std::string& allowedOrigin, int totalCount, int limit, int offset, int statusCode = 200) {
    crow::response res = successResponse(data, message, allowedOrigin, statusCode);
    res.add_header("X-Total-Count", std::to_string(totalCount));
    res.add_header("X-Limit", std::to_string(limit));
    res.add_header("X-Offset", std::to_string(offset));
    return res;
}

inline bool parseJsonObject(const crow::request& req, nlohmann::json& outBody, const std::string& allowedOrigin, crow::response& errRes) {
    if (req.body.size() > MAX_REQUEST_BODY_BYTES) {
        errRes = errorResponse(413, "Request payload exceeds maximum allowed size (1 MiB)", allowedOrigin);
        return false;
    }
    try {
        outBody = nlohmann::json::parse(req.body);
    } catch (const nlohmann::json::parse_error&) {
        errRes = errorResponse(400, "Malformed JSON request", allowedOrigin);
        return false;
    }
    if (!outBody.is_object()) {
        errRes = errorResponse(400, "Request body must be a JSON object", allowedOrigin);
        return false;
    }
    return true;
}

inline bool parseStrictIntField(const nlohmann::json& obj, const char* key, int minVal, int maxVal, int& outVal, std::string& errMsg) {
    const auto& val = obj.at(key);
    if (!val.is_number_integer()) {
        errMsg = std::string("Field '") + key + "' must be an integer";
        return false;
    }
    int64_t raw = val.get<int64_t>();
    if (raw < static_cast<int64_t>(minVal) || raw > static_cast<int64_t>(maxVal)) {
        errMsg = std::string("Field '") + key + "' is out of allowed range";
        return false;
    }
    outVal = static_cast<int>(raw);
    return true;
}

inline bool requireAdmin(const crow::request& req, class AuthService& auth, const std::string& allowedOrigin, crow::response& errRes) {
    std::string token = extractBearerToken(req);
    if (token.empty()) {
        errRes = errorResponse(401, "Authentication token required for administrative action", allowedOrigin);
        return false;
    }

    auto session = auth.validateToken(token);
    if (!session.has_value() || session->role != "ADMIN") {
        errRes = errorResponse(403, "Invalid, expired, or insufficient permissions for administrative action", allowedOrigin);
        return false;
    }

    return true;
}

struct CorsMiddleware {
    struct context {};
    std::string allowedOrigin = "*";

    void before_handle(crow::request& /*req*/, crow::response& /*res*/, context& /*ctx*/) {}

    void after_handle(crow::request& /*req*/, crow::response& res, context& /*ctx*/) {
        if (res.get_header_value("Access-Control-Allow-Origin").empty()) {
            applyCors(res, allowedOrigin);
        }
    }
};

using CrowApp = crow::App<CorsMiddleware>;

} // namespace ControllerUtils
