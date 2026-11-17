#pragma once
#include "models/CustomerRecord.hpp"
#include "repositories/BillRepository.hpp"
#include <vector>
#include <optional>
#include <string>

class DatabaseConnection;

class CustomerRepository {
private:
    DatabaseConnection& db;

public:
    explicit CustomerRepository(DatabaseConnection& conn) : db(conn) {}

    int insert(const CustomerRecord& customer);
    bool update(const CustomerRecord& customer);
    std::optional<CustomerRecord> findById(int id);
    std::optional<CustomerRecord> findByCode(const std::string& code);
    std::optional<CustomerRecord> findByPhone(const std::string& phone);
    std::vector<CustomerRecord> findAll(int limit = 50, int offset = 0, const std::string& query = "");
    int getTotalCount(const std::string& query = "");
    std::vector<BillRecord> getCustomerBills(int customerId, int limit = 50, int offset = 0);
    std::string generateNextCustomerCode();
};
