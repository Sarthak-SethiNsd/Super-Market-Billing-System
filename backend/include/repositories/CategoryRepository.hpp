#pragma once
#include "models/Category.hpp"
#include <vector>
#include <optional>
#include <string>

class DatabaseConnection;

class CategoryRepository {
private:
    DatabaseConnection& db;

public:
    explicit CategoryRepository(DatabaseConnection& conn) : db(conn) {}

    int insert(const std::string& name);
    std::optional<Category> findById(int id);
    std::optional<Category> findByName(const std::string& name);
    std::vector<Category> getAll();
    bool update(int id, const std::string& newName);
    bool remove(int id);
    int getProductCount(int categoryId);
};
