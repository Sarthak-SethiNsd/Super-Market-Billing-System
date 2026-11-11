#include "repositories/BrandRepository.hpp"
#include "database/DatabaseConnection.hpp"
#include "database/PreparedStatement.hpp"
#include <stdexcept>

int BrandRepository::insert(const std::string& name) {
    if (name.empty()) {
        throw std::invalid_argument("Brand name cannot be empty");
    }

    PreparedStatement stmt(db, "INSERT INTO brands (name) VALUES (?);");
    stmt.bind(1, name);
    stmt.execute();
    return static_cast<int>(db.getLastInsertRowId());
}

std::optional<Brand> BrandRepository::findById(int id) {
    PreparedStatement stmt(db, "SELECT id, name, created_at FROM brands WHERE id = ?;");
    stmt.bind(1, id);
    if (stmt.step()) {
        return Brand(stmt.getInt(0), stmt.getString(1), stmt.getString(2));
    }
    return std::nullopt;
}

std::optional<Brand> BrandRepository::findByName(const std::string& name) {
    PreparedStatement stmt(db, "SELECT id, name, created_at FROM brands WHERE name = ?;");
    stmt.bind(1, name);
    if (stmt.step()) {
        return Brand(stmt.getInt(0), stmt.getString(1), stmt.getString(2));
    }
    return std::nullopt;
}

std::vector<Brand> BrandRepository::getAll() {
    std::vector<Brand> list;
    PreparedStatement stmt(db, "SELECT id, name, created_at FROM brands ORDER BY name ASC;");
    while (stmt.step()) {
        list.emplace_back(stmt.getInt(0), stmt.getString(1), stmt.getString(2));
    }
    return list;
}

bool BrandRepository::update(int id, const std::string& newName) {
    if (newName.empty()) {
        throw std::invalid_argument("Brand name cannot be empty");
    }

    PreparedStatement stmt(db, "UPDATE brands SET name = ? WHERE id = ?;");
    stmt.bind(1, newName);
    stmt.bind(2, id);
    stmt.execute();
    return db.getChanges() > 0;
}

int BrandRepository::getProductCount(int brandId) {
    PreparedStatement stmt(db, "SELECT COUNT(*) FROM products WHERE brand_id = ?;");
    stmt.bind(1, brandId);
    if (stmt.step()) {
        return stmt.getInt(0);
    }
    return 0;
}

bool BrandRepository::remove(int id) {
    if (getProductCount(id) > 0) {
        throw std::runtime_error("Cannot delete brand: products are still associated with this brand.");
    }

    PreparedStatement stmt(db, "DELETE FROM brands WHERE id = ?;");
    stmt.bind(1, id);
    stmt.execute();
    return db.getChanges() > 0;
}
