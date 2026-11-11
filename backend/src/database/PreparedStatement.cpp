#include "database/PreparedStatement.hpp"
#include "database/DatabaseConnection.hpp"
#include "sqlite3.h"

PreparedStatement::PreparedStatement(DatabaseConnection& conn, const std::string& sql)
    : stmtLock(conn.getMutex()), stmtHandle(nullptr) {
    if (!conn.isOpen()) {
        throw std::runtime_error("Cannot prepare statement on closed database connection");
    }

    int rc = sqlite3_prepare_v2(conn.getRawHandle(), sql.c_str(), -1, &stmtHandle, nullptr);
    if (rc != SQLITE_OK) {
        std::string errMsg = sqlite3_errmsg(conn.getRawHandle());
        throw std::runtime_error("Failed to prepare SQL statement: " + errMsg + "\nQuery: " + sql);
    }
}

PreparedStatement::~PreparedStatement() {
    if (stmtHandle) {
        sqlite3_finalize(stmtHandle);
    }
}

PreparedStatement::PreparedStatement(PreparedStatement&& other) noexcept
    : stmtLock(std::move(other.stmtLock)), stmtHandle(other.stmtHandle) {
    other.stmtHandle = nullptr;
}

PreparedStatement& PreparedStatement::operator=(PreparedStatement&& other) noexcept {
    if (this != &other) {
        if (stmtHandle) {
            sqlite3_finalize(stmtHandle);
        }
        this->stmtHandle = other.stmtHandle;
        this->stmtLock = std::move(other.stmtLock);
        other.stmtHandle = nullptr;
    }
    return *this;
}

void PreparedStatement::bind(int index, int value) {
    int rc = sqlite3_bind_int(stmtHandle, index, value);
    if (rc != SQLITE_OK) {
        throw std::runtime_error("Failed to bind int at index " + std::to_string(index));
    }
}

void PreparedStatement::bind(int index, int64_t value) {
    int rc = sqlite3_bind_int64(stmtHandle, index, value);
    if (rc != SQLITE_OK) {
        throw std::runtime_error("Failed to bind int64 at index " + std::to_string(index));
    }
}

void PreparedStatement::bind(int index, double value) {
    int rc = sqlite3_bind_double(stmtHandle, index, value);
    if (rc != SQLITE_OK) {
        throw std::runtime_error("Failed to bind double at index " + std::to_string(index));
    }
}

void PreparedStatement::bind(int index, const std::string& value) {
    int rc = sqlite3_bind_text(stmtHandle, index, value.c_str(), -1, SQLITE_TRANSIENT);
    if (rc != SQLITE_OK) {
        throw std::runtime_error("Failed to bind text at index " + std::to_string(index));
    }
}

void PreparedStatement::bindNull(int index) {
    int rc = sqlite3_bind_null(stmtHandle, index);
    if (rc != SQLITE_OK) {
        throw std::runtime_error("Failed to bind null at index " + std::to_string(index));
    }
}

void PreparedStatement::bind(int index, const std::optional<int>& value) {
    if (value.has_value()) {
        bind(index, *value);
    } else {
        bindNull(index);
    }
}

void PreparedStatement::bind(int index, const std::optional<std::string>& value) {
    if (value.has_value()) {
        bind(index, *value);
    } else {
        bindNull(index);
    }
}

bool PreparedStatement::step() {
    int rc = sqlite3_step(stmtHandle);
    if (rc == SQLITE_ROW) {
        return true;
    }
    if (rc == SQLITE_DONE) {
        return false;
    }
    throw std::runtime_error("Error evaluating statement step: " + std::string(sqlite3_errstr(rc)));
}

void PreparedStatement::execute() {
    int rc = sqlite3_step(stmtHandle);
    if (rc != SQLITE_DONE && rc != SQLITE_ROW) {
        throw std::runtime_error("Error executing statement: " + std::string(sqlite3_errstr(rc)));
    }
}

void PreparedStatement::reset() {
    sqlite3_reset(stmtHandle);
}

void PreparedStatement::clearBindings() {
    sqlite3_clear_bindings(stmtHandle);
}

int PreparedStatement::getInt(int colIndex) const {
    return sqlite3_column_int(stmtHandle, colIndex);
}

int64_t PreparedStatement::getInt64(int colIndex) const {
    return sqlite3_column_int64(stmtHandle, colIndex);
}

double PreparedStatement::getDouble(int colIndex) const {
    return sqlite3_column_double(stmtHandle, colIndex);
}

std::string PreparedStatement::getString(int colIndex) const {
    const unsigned char* text = sqlite3_column_text(stmtHandle, colIndex);
    return text ? reinterpret_cast<const char*>(text) : "";
}

bool PreparedStatement::isNull(int colIndex) const {
    return sqlite3_column_type(stmtHandle, colIndex) == SQLITE_NULL;
}

std::optional<int> PreparedStatement::getOptionalInt(int colIndex) const {
    if (isNull(colIndex)) {
        return std::nullopt;
    }
    return getInt(colIndex);
}

std::optional<std::string> PreparedStatement::getOptionalString(int colIndex) const {
    if (isNull(colIndex)) {
        return std::nullopt;
    }
    return getString(colIndex);
}
