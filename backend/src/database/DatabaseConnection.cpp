#include "database/DatabaseConnection.hpp"
#include "sqlite3.h"
#include <filesystem>
#include <iostream>

void DatabaseConnection::open() {
    // Ensure parent directory exists if path contains directories
    std::filesystem::path p(databasePath);
    if (p.has_parent_path()) {
        std::filesystem::create_directories(p.parent_path());
    }

    int rc = sqlite3_open_v2(databasePath.c_str(),
                             &dbHandle,
                             SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX,
                             nullptr);
    if (rc != SQLITE_OK) {
        std::string errMsg = dbHandle ? sqlite3_errmsg(dbHandle) : "Unable to allocate SQLite memory";
        close();
        throw std::runtime_error("Failed to open SQLite database at '" + databasePath + "': " + errMsg);
    }

    // Enforce critical pragmas
    execute("PRAGMA foreign_keys = ON;");
    execute("PRAGMA journal_mode = WAL;");
    execute("PRAGMA busy_timeout = 5000;");
}

DatabaseConnection::DatabaseConnection(const std::string& dbPath)
    : dbHandle(nullptr), databasePath(dbPath) {
    open();
}

DatabaseConnection::~DatabaseConnection() {
    close();
}

DatabaseConnection::DatabaseConnection(DatabaseConnection&& other) noexcept
    : dbHandle(nullptr) {
    std::lock_guard<std::recursive_mutex> lk(other.dbMutex);
    dbHandle = other.dbHandle;
    databasePath = std::move(other.databasePath);
    other.dbHandle = nullptr;
}

DatabaseConnection& DatabaseConnection::operator=(DatabaseConnection&& other) noexcept {
    if (this != &other) {
        std::unique_lock<std::recursive_mutex> lkThis(dbMutex, std::defer_lock);
        std::unique_lock<std::recursive_mutex> lkOther(other.dbMutex, std::defer_lock);
        std::lock(lkThis, lkOther);
        close();
        this->dbHandle = other.dbHandle;
        this->databasePath = std::move(other.databasePath);
        other.dbHandle = nullptr;
    }
    return *this;
}

sqlite3* DatabaseConnection::getRawHandle() const {
    return dbHandle;
}

const std::string& DatabaseConnection::getPath() const {
    return databasePath;
}

bool DatabaseConnection::isOpen() const {
    std::lock_guard<std::recursive_mutex> lk(dbMutex);
    return dbHandle != nullptr;
}

std::recursive_mutex& DatabaseConnection::getMutex() const {
    return dbMutex;
}

std::unique_lock<std::recursive_mutex> DatabaseConnection::lock() const {
    return std::unique_lock<std::recursive_mutex>(dbMutex);
}

void DatabaseConnection::execute(const std::string& sql) {
    std::lock_guard<std::recursive_mutex> lk(dbMutex);
    if (!dbHandle) {
        throw std::runtime_error("Attempted to execute SQL on closed database connection");
    }

    char* zErrMsg = nullptr;
    int rc = sqlite3_exec(dbHandle, sql.c_str(), nullptr, nullptr, &zErrMsg);
    if (rc != SQLITE_OK) {
        std::string err = zErrMsg ? zErrMsg : "Unknown SQLite error";
        sqlite3_free(zErrMsg);
        throw std::runtime_error("SQL execution error: " + err + "\nQuery: " + sql);
    }
}

int64_t DatabaseConnection::getLastInsertRowId() const {
    std::lock_guard<std::recursive_mutex> lk(dbMutex);
    if (!dbHandle) return 0;
    return sqlite3_last_insert_rowid(dbHandle);
}

int DatabaseConnection::getChanges() const {
    std::lock_guard<std::recursive_mutex> lk(dbMutex);
    if (!dbHandle) return 0;
    return sqlite3_changes(dbHandle);
}

void DatabaseConnection::close() {
    std::lock_guard<std::recursive_mutex> lk(dbMutex);
    if (dbHandle) {
        sqlite3_close_v2(dbHandle);
        dbHandle = nullptr;
    }
}
