#pragma once

class DatabaseConnection;

class DemoDataSeeder {
public:
    /**
     * @brief Idempotently seeds initial catalog, synthetic customers, and 15 realistic sales.
     * Guaranteed to execute at most once using the system_metadata table.
     */
    static bool seedIfEmpty(DatabaseConnection& db);
};
