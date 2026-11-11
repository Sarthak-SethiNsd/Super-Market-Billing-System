#pragma once
#include <string>
#include <memory>
#include <stdexcept>
#include <mutex>

// Forward declaration of SQLite struct
struct sqlite3;

/**
 * @brief RAII wrapper for SQLite database connection.
 * Demonstrates:
 *  - Resource Acquisition Is Initialization (RAII)
 *  - Move Semantics (Resource ownership transfer)
 *  - Enforces foreign keys and WAL mode on open
 */
class DatabaseConnection {
private:
    sqlite3* dbHandle;
    std::string databasePath;
    mutable std::recursive_mutex dbMutex;

    void open();

public:
    explicit DatabaseConnection(const std::string& dbPath);
    ~DatabaseConnection();

    // Non-copyable
    DatabaseConnection(const DatabaseConnection&) = delete;
    DatabaseConnection& operator=(const DatabaseConnection&) = delete;

    // Move-constructible and move-assignable
    DatabaseConnection(DatabaseConnection&& other) noexcept;
    DatabaseConnection& operator=(DatabaseConnection&& other) noexcept;

    sqlite3* getRawHandle() const;
    const std::string& getPath() const;
    bool isOpen() const;
    std::recursive_mutex& getMutex() const;
    std::unique_lock<std::recursive_mutex> lock() const;

    void execute(const std::string& sql);
    int64_t getLastInsertRowId() const;
    int getChanges() const;
    void close();
};
