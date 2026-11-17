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

int BrandRepository::getOrCreate(const std::string& rawName) {
    size_t first = rawName.find_first_not_of(" \t\r\n");
    if (first == std::string::npos) {
        throw std::invalid_argument("Brand name cannot be empty");
    }
    size_t last = rawName.find_last_not_of(" \t\r\n");
    std::string trimmed = rawName.substr(first, (last - first + 1));

    // Case-insensitive & trimmed search in database
    PreparedStatement stmt(db, "SELECT id, name FROM brands WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1;");
    stmt.bind(1, trimmed);
    if (stmt.step()) {
        return stmt.getInt(0); // reuse existing brand ID!
    }

    // Not found: insert safely
    try {
        return insert(trimmed);
    } catch (...) {
        // Fallback retry if inserted concurrently
        PreparedStatement retry(db, "SELECT id, name FROM brands WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1;");
        retry.bind(1, trimmed);
        if (retry.step()) {
            return retry.getInt(0);
        }
        throw;
    }
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

std::vector<Category> BrandRepository::getCategories(int brandId) {
    std::vector<Category> list;
    PreparedStatement stmt(db, R"(
        SELECT c.id, c.name, c.created_at
        FROM categories c
        JOIN category_brands cb ON c.id = cb.category_id
        WHERE cb.brand_id = ?
        ORDER BY c.name ASC;
    )");
    stmt.bind(1, brandId);
    while (stmt.step()) {
        list.emplace_back(stmt.getInt(0), stmt.getString(1), stmt.getString(2));
    }
    return list;
}

bool BrandRepository::isAssociatedWithCategory(int brandId, int categoryId) {
    PreparedStatement stmt(db, "SELECT 1 FROM category_brands WHERE brand_id = ? AND category_id = ? LIMIT 1;");
    stmt.bind(1, brandId);
    stmt.bind(2, categoryId);
    return stmt.step();
}
