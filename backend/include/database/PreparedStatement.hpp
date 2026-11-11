#pragma once
#include <string>
#include <optional>
#include <cstdint>
#include <stdexcept>
#include <mutex>

class DatabaseConnection;
struct sqlite3_stmt;

/**
 * @brief RAII wrapper for SQLite prepared statements.
 * Demonstrates:
 *  - RAII for prepared statement finalization
 *  - Strong exception safety
 *  - Parameterized binding preventing SQL injection
 */
class PreparedStatement {
private:
    std::unique_lock<std::recursive_mutex> stmtLock;
    sqlite3_stmt* stmtHandle;

public:
    PreparedStatement(DatabaseConnection& conn, const std::string& sql);
    ~PreparedStatement();

    // Non-copyable
    PreparedStatement(const PreparedStatement&) = delete;
    PreparedStatement& operator=(const PreparedStatement&) = delete;

    // Move-constructible and move-assignable
    PreparedStatement(PreparedStatement&& other) noexcept;
    PreparedStatement& operator=(PreparedStatement&& other) noexcept;

    // Parameter binding (1-based index)
    void bind(int index, int value);
    void bind(int index, int64_t value);
    void bind(int index, double value);
    void bind(int index, const std::string& value);
    void bindNull(int index);
    void bind(int index, const std::optional<int>& value);
    void bind(int index, const std::optional<std::string>& value);

    // Execution
    bool step(); // Returns true on SQLITE_ROW, false on SQLITE_DONE
    void execute(); // Executes query expecting SQLITE_DONE
    void reset();
    void clearBindings();

    // Column extraction (0-based index)
    int getInt(int colIndex) const;
    int64_t getInt64(int colIndex) const;
    double getDouble(int colIndex) const;
    std::string getString(int colIndex) const;
    bool isNull(int colIndex) const;
    std::optional<int> getOptionalInt(int colIndex) const;
    std::optional<std::string> getOptionalString(int colIndex) const;
};
