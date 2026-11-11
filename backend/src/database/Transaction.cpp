#include "database/Transaction.hpp"
#include "database/DatabaseConnection.hpp"
#include <iostream>

Transaction::Transaction(DatabaseConnection& conn)
    : connection(conn), txLock(conn.getMutex()), completed(true) {
    connection.execute("BEGIN IMMEDIATE TRANSACTION;");
    completed = false;
}

Transaction::~Transaction() {
    if (!completed) {
        try {
            rollback();
        } catch (const std::exception& e) {
            std::cerr << "Failed to rollback transaction in destructor: " << e.what() << "\n";
        }
    }
}

void Transaction::commit() {
    if (!completed) {
        connection.execute("COMMIT;");
        completed = true;
        if (txLock.owns_lock()) {
            txLock.unlock();
        }
    }
}

void Transaction::rollback() {
    if (!completed) {
        try {
            connection.execute("ROLLBACK;");
        } catch (...) {
            completed = true;
            if (txLock.owns_lock()) {
                txLock.unlock();
            }
            throw;
        }
        completed = true;
        if (txLock.owns_lock()) {
            txLock.unlock();
        }
    }
}
