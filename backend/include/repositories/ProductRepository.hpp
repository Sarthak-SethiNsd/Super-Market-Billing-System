#pragma once
#include "models/Product.hpp"
#include "models/Perishable.hpp"
#include "models/NonPerishable.hpp"
#include <vector>
#include <optional>
#include <memory>
#include <string>

class DatabaseConnection;

struct ProductSummary {
    int totalActiveProducts = 0;
    int totalStockUnits = 0;
    int lowStockCount = 0;
    int outOfStockCount = 0;
};

class ProductRepository {
private:
    DatabaseConnection& db;

    std::shared_ptr<Product> rowToProduct(class PreparedStatement& stmt);

public:
    explicit ProductRepository(DatabaseConnection& conn) : db(conn) {}

    int insert(const Product& product);
    std::optional<std::shared_ptr<Product>> findById(int id);
    std::optional<std::shared_ptr<Product>> findBySku(const std::string& sku);
    bool isActive(int productId);
    std::vector<std::shared_ptr<Product>> getAll(bool activeOnly = true);
    bool update(const Product& product);
    bool updateStock(int productId, int newStock);
    bool softDelete(int productId);
    std::vector<std::shared_ptr<Product>> search(const std::string& query,
                                                std::optional<int> brandId = std::nullopt,
                                                std::optional<int> categoryId = std::nullopt);
    ProductSummary getSummary();
};
