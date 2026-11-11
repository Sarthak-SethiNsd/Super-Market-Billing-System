#include "repositories/UserRepository.hpp"
#include "database/DatabaseConnection.hpp"
#include "database/PreparedStatement.hpp"
#include <stdexcept>

int UserRepository::createUser(const std::string& username,
                               const std::string& hash,
                               const std::string& salt,
                               int iterations,
                               const std::string& role) {
    if (username.empty()) {
        throw std::invalid_argument("Username cannot be empty");
    }
    if (role != "ADMIN" && role != "STAFF") {
        throw std::invalid_argument("Role must be ADMIN or STAFF");
    }

    PreparedStatement stmt(db, R"(
        INSERT INTO users (username, password_hash, salt, iterations, role)
        VALUES (?, ?, ?, ?, ?);
    )");
    stmt.bind(1, username);
    stmt.bind(2, hash);
    stmt.bind(3, salt);
    stmt.bind(4, iterations);
    stmt.bind(5, role);
    stmt.execute();

    return static_cast<int>(db.getLastInsertRowId());
}

std::optional<UserRecord> UserRepository::findByUsername(const std::string& username) {
    PreparedStatement stmt(db, R"(
        SELECT id, username, password_hash, salt, iterations, role, created_at, updated_at
        FROM users
        WHERE username = ?;
    )");
    stmt.bind(1, username);

    if (stmt.step()) {
        return UserRecord(
            stmt.getInt(0),
            stmt.getString(1),
            stmt.getString(2),
            stmt.getString(3),
            stmt.getInt(4),
            stmt.getString(5),
            stmt.getString(6),
            stmt.getString(7)
        );
    }
    return std::nullopt;
}

bool UserRepository::adminExists() {
    PreparedStatement stmt(db, "SELECT COUNT(*) FROM users WHERE role = 'ADMIN';");
    if (stmt.step()) {
        return stmt.getInt(0) > 0;
    }
    return false;
}

bool UserRepository::updateUserPassword(const std::string& username,
                                       const std::string& newHash,
                                       const std::string& newSalt,
                                       int iterations) {
    PreparedStatement stmt(db, R"(
        UPDATE users
        SET password_hash = ?, salt = ?, iterations = ?, updated_at = CURRENT_TIMESTAMP
        WHERE username = ?;
    )");
    stmt.bind(1, newHash);
    stmt.bind(2, newSalt);
    stmt.bind(3, iterations);
    stmt.bind(4, username);
    stmt.execute();

    return db.getChanges() > 0;
}
