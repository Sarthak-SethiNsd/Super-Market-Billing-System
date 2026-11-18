#pragma once
#include "models/ProductBatch.hpp"
#include <vector>
#include <string>
#include <optional>

class DatabaseConnection;

class ProductBatchRepository {
private:
    DatabaseConnection& db;

public:
    explicit ProductBatchRepository(DatabaseConnection& conn) : db(conn) {}

    int addBatch(int productId, const std::string& batchNumber, int quantity, const std::string& expiryDate);
    std::vector<ProductBatch> getBatchesByProductId(int productId);
    std::vector<ProductBatch> getActiveBatchesFEFO(int productId);
    std::string getNearestExpiryDate(int productId);
    void updateProductNearestExpiry(int productId);
    void deductStockFEFO(int productId, int quantityToDeduct);
    int getTotalBatchStock(int productId);
    bool removeBatch(int batchId);
};
