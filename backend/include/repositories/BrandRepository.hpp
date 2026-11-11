#pragma once
#include "models/Brand.hpp"
#include <vector>
#include <optional>
#include <string>

class DatabaseConnection;

class BrandRepository {
private:
    DatabaseConnection& db;

public:
    explicit BrandRepository(DatabaseConnection& conn) : db(conn) {}

    int insert(const std::string& name);
    std::optional<Brand> findById(int id);
    std::optional<Brand> findByName(const std::string& name);
    std::vector<Brand> getAll();
    bool update(int id, const std::string& newName);
    bool remove(int id);
    int getProductCount(int brandId);
};
