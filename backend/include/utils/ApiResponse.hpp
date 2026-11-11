#pragma once
#include <string>
#include <optional>
#include <chrono>

/**
 * @brief Generic REST API response envelope template.
 * Demonstrates:
 *  - Class Templates with optional payload type
 *  - Type-safe payload wrapping
 *  - Modern C++ std::chrono for timestamping
 *
 * @tparam T The payload data type.
 */
template <typename T>
class ApiResponse {
private:
    bool success;
    std::string message;
    std::optional<T> data;
    int64_t timestamp;

    static int64_t currentTimestampMillis() {
        return std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count();
    }

public:
    ApiResponse(bool isOk, const std::string& msg, const std::optional<T>& payload = std::nullopt)
        : success(isOk), message(msg), data(payload), timestamp(currentTimestampMillis()) {}

    static ApiResponse<T> ok(const T& payload, const std::string& msg = "Success") {
        return ApiResponse<T>(true, msg, payload);
    }

    static ApiResponse<T> error(const std::string& msg) {
        return ApiResponse<T>(false, msg, std::nullopt);
    }

    bool isSuccess() const {
        return success;
    }

    std::string getMessage() const {
        return message;
    }

    bool hasData() const {
        return data.has_value();
    }

    const T& getData() const {
        if (!data.has_value()) {
            throw std::runtime_error("ApiResponse has no data payload");
        }
        return *data;
    }

    std::optional<T> getOptionalData() const {
        return data;
    }

    int64_t getTimestamp() const {
        return timestamp;
    }
};
