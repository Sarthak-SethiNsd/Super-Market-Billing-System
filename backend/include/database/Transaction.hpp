#pragma once
#include <mutex>

class DatabaseConnection;

/**
 * @brief RAII Transaction Guard.
 * Demonstrates:
 *  - Automatic Rollback on Exception (Strong Exception Guarantee)
 *  - Atomic Two-Phase Commit semantics
 */
class Transaction {
private:
    DatabaseConnection& connection;
    std::unique_lock<std::recursive_mutex> txLock;
    bool completed;

public:
    explicit Transaction(DatabaseConnection& conn);
    ~Transaction();

    Transaction(const Transaction&) = delete;
    Transaction& operator=(const Transaction&) = delete;

    void commit();
    void rollback();
};
