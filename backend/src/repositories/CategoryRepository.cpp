#include "repositories/CategoryRepository.hpp"
#include "database/DatabaseConnection.hpp"
#include "database/PreparedStatement.hpp"
#include <stdexcept>

int CategoryRepository::insert(const std::string& name) {
    if (name.empty()) {
        throw std::invalid_argument("Category name cannot be empty");
    }

    PreparedStatement stmt(db, "INSERT INTO categories (name) VALUES (?);");
    stmt.bind(1, name);
    stmt.execute();
    return static_cast<int>(db.getLastInsertRowId());
}

std::optional<Category> CategoryRepository::findById(int id) {
    PreparedStatement stmt(db, "SELECT id, name, created_at FROM categories WHERE id = ?;");
    stmt.bind(1, id);
    if (stmt.step()) {
        return Category(stmt.getInt(0), stmt.getString(1), stmt.getString(2));
    }
    return std::nullopt;
}

std::optional<Category> CategoryRepository::findByName(const std::string& name) {
    PreparedStatement stmt(db, "SELECT id, name, created_at FROM categories WHERE name = ?;");
    stmt.bind(1, name);
    if (stmt.step()) {
        return Category(stmt.getInt(0), stmt.getString(1), stmt.getString(2));
    }
    return std::nullopt;
}

std::vector<Category> CategoryRepository::getAll() {
    std::vector<Category> list;
    PreparedStatement stmt(db, "SELECT id, name, created_at FROM categories ORDER BY name ASC;");
    while (stmt.step()) {
        list.emplace_back(stmt.getInt(0), stmt.getString(1), stmt.getString(2));
    }
    return list;
}

bool CategoryRepository::update(int id, const std::string& newName) {
    if (newName.empty()) {
        throw std::invalid_argument("Category name cannot be empty");
    }

    PreparedStatement stmt(db, "UPDATE categories SET name = ? WHERE id = ?;");
    stmt.bind(1, newName);
    stmt.bind(2, id);
    stmt.execute();
    return db.getChanges() > 0;
}

int CategoryRepository::getProductCount(int categoryId) {
    PreparedStatement stmt(db, "SELECT COUNT(*) FROM products WHERE category_id = ?;");
    stmt.bind(1, categoryId);
    if (stmt.step()) {
        return stmt.getInt(0);
    }
    return 0;
}

bool CategoryRepository::remove(int id) {
    if (getProductCount(id) > 0) {
        throw std::runtime_error("Cannot delete category: products are still associated with this category.");
    }

    PreparedStatement stmt(db, "DELETE FROM categories WHERE id = ?;");
    stmt.bind(1, id);
    stmt.execute();
    return db.getChanges() > 0;
}
