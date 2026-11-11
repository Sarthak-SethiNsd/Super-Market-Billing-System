#pragma once
#include <string>
#include <optional>

class DatabaseConnection;

struct UserRecord {
    int id = 0;
    std::string username;
    std::string passwordHash;
    std::string salt;
    int iterations = 100000;
    std::string role; // "ADMIN" or "STAFF"
    std::string createdAt;
    std::string updatedAt;

    UserRecord() = default;
    UserRecord(int id, const std::string& user, const std::string& hash, const std::string& salt,
               int iter, const std::string& role, const std::string& created, const std::string& updated)
        : id(id), username(user), passwordHash(hash), salt(salt),
          iterations(iter), role(role), createdAt(created), updatedAt(updated) {}
};

class UserRepository {
private:
    DatabaseConnection& db;

public:
    explicit UserRepository(DatabaseConnection& conn) : db(conn) {}

    int createUser(const std::string& username, const std::string& hash, const std::string& salt,
                   int iterations, const std::string& role);
    std::optional<UserRecord> findByUsername(const std::string& username);
    bool adminExists();
    bool updateUserPassword(const std::string& username, const std::string& newHash,
                            const std::string& newSalt, int iterations);
};
