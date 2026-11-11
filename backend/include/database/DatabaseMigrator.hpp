#pragma once

class DatabaseConnection;

/**
 * @brief Manages database schema versions, table creations, and migrations.
 * Demonstrates:
 *  - Safe, idempotent schema initialization
 *  - Version tracking via PRAGMA user_version
 */
class DatabaseMigrator {
public:
    static int getCurrentVersion(DatabaseConnection& conn);
    static void setVersion(DatabaseConnection& conn, int version);
    static void migrate(DatabaseConnection& conn);
};
