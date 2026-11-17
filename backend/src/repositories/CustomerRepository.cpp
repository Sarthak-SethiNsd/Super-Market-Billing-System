#include "repositories/CustomerRepository.hpp"
#include "database/DatabaseConnection.hpp"
#include "database/PreparedStatement.hpp"
#include "database/Transaction.hpp"
#include <sstream>
#include <iomanip>

int CustomerRepository::insert(const CustomerRecord& customer) {
    std::string code = customer.customerCode;
    if (code.empty()) {
        code = generateNextCustomerCode();
    }

    PreparedStatement stmt(db, R"(
        INSERT INTO customers (customer_code, full_name, phone, email, is_active)
        VALUES (?, ?, ?, ?, ?);
    )");
    stmt.bind(1, code);
    stmt.bind(2, customer.fullName);
    if (!customer.phone.empty()) {
        stmt.bind(3, customer.phone);
    } else {
        stmt.bindNull(3);
    }
    if (!customer.email.empty()) {
        stmt.bind(4, customer.email);
    } else {
        stmt.bindNull(4);
    }
    stmt.bind(5, customer.isActive ? 1 : 0);
    stmt.execute();

    return static_cast<int>(db.getLastInsertRowId());
}

bool CustomerRepository::update(const CustomerRecord& customer) {
    PreparedStatement stmt(db, R"(
        UPDATE customers
        SET full_name = ?, phone = ?, email = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
    )");
    stmt.bind(1, customer.fullName);
    if (!customer.phone.empty()) {
        stmt.bind(2, customer.phone);
    } else {
        stmt.bindNull(2);
    }
    if (!customer.email.empty()) {
        stmt.bind(3, customer.email);
    } else {
        stmt.bindNull(3);
    }
    stmt.bind(4, customer.isActive ? 1 : 0);
    stmt.bind(5, customer.id);
    stmt.execute();

    return true;
}

std::optional<CustomerRecord> CustomerRepository::findById(int id) {
    PreparedStatement stmt(db, R"(
        SELECT c.id, c.customer_code, c.full_name, COALESCE(c.phone, ''), COALESCE(c.email, ''),
               c.is_active, c.created_at, c.updated_at,
               COUNT(b.id) AS total_purchases,
               COALESCE(SUM(b.final_amount_paise), 0) AS lifetime_spent_paise,
               COALESCE(MAX(b.created_at), '') AS last_purchase_date
        FROM customers c
        LEFT JOIN bills b ON c.id = b.customer_id
        WHERE c.id = ?
        GROUP BY c.id;
    )");
    stmt.bind(1, id);

    if (stmt.step()) {
        CustomerRecord r;
        r.id = stmt.getInt(0);
        r.customerCode = stmt.getString(1);
        r.fullName = stmt.getString(2);
        r.phone = stmt.getString(3);
        r.email = stmt.getString(4);
        r.isActive = stmt.getInt(5) != 0;
        r.createdAt = stmt.getString(6);
        r.updatedAt = stmt.getString(7);
        r.totalPurchases = stmt.getInt(8);
        r.lifetimeSpentPaise = stmt.getInt64(9);
        r.lastPurchaseDate = stmt.getString(10);
        return r;
    }
    return std::nullopt;
}

std::optional<CustomerRecord> CustomerRepository::findByCode(const std::string& code) {
    PreparedStatement stmt(db, R"(
        SELECT c.id, c.customer_code, c.full_name, COALESCE(c.phone, ''), COALESCE(c.email, ''),
               c.is_active, c.created_at, c.updated_at,
               COUNT(b.id) AS total_purchases,
               COALESCE(SUM(b.final_amount_paise), 0) AS lifetime_spent_paise,
               COALESCE(MAX(b.created_at), '') AS last_purchase_date
        FROM customers c
        LEFT JOIN bills b ON c.id = b.customer_id
        WHERE c.customer_code = ?
        GROUP BY c.id;
    )");
    stmt.bind(1, code);

    if (stmt.step()) {
        CustomerRecord r;
        r.id = stmt.getInt(0);
        r.customerCode = stmt.getString(1);
        r.fullName = stmt.getString(2);
        r.phone = stmt.getString(3);
        r.email = stmt.getString(4);
        r.isActive = stmt.getInt(5) != 0;
        r.createdAt = stmt.getString(6);
        r.updatedAt = stmt.getString(7);
        r.totalPurchases = stmt.getInt(8);
        r.lifetimeSpentPaise = stmt.getInt64(9);
        r.lastPurchaseDate = stmt.getString(10);
        return r;
    }
    return std::nullopt;
}

std::optional<CustomerRecord> CustomerRepository::findByPhone(const std::string& phone) {
    PreparedStatement stmt(db, R"(
        SELECT c.id, c.customer_code, c.full_name, COALESCE(c.phone, ''), COALESCE(c.email, ''),
               c.is_active, c.created_at, c.updated_at,
               COUNT(b.id) AS total_purchases,
               COALESCE(SUM(b.final_amount_paise), 0) AS lifetime_spent_paise,
               COALESCE(MAX(b.created_at), '') AS last_purchase_date
        FROM customers c
        LEFT JOIN bills b ON c.id = b.customer_id
        WHERE c.phone = ?
        GROUP BY c.id;
    )");
    stmt.bind(1, phone);

    if (stmt.step()) {
        CustomerRecord r;
        r.id = stmt.getInt(0);
        r.customerCode = stmt.getString(1);
        r.fullName = stmt.getString(2);
        r.phone = stmt.getString(3);
        r.email = stmt.getString(4);
        r.isActive = stmt.getInt(5) != 0;
        r.createdAt = stmt.getString(6);
        r.updatedAt = stmt.getString(7);
        r.totalPurchases = stmt.getInt(8);
        r.lifetimeSpentPaise = stmt.getInt64(9);
        r.lastPurchaseDate = stmt.getString(10);
        return r;
    }
    return std::nullopt;
}

std::vector<CustomerRecord> CustomerRepository::findAll(int limit, int offset, const std::string& query) {
    std::vector<CustomerRecord> list;
    std::string sql = R"(
        SELECT c.id, c.customer_code, c.full_name, COALESCE(c.phone, ''), COALESCE(c.email, ''),
               c.is_active, c.created_at, c.updated_at,
               COUNT(b.id) AS total_purchases,
               COALESCE(SUM(b.final_amount_paise), 0) AS lifetime_spent_paise,
               COALESCE(MAX(b.created_at), '') AS last_purchase_date
        FROM customers c
        LEFT JOIN bills b ON c.id = b.customer_id
    )";

    if (!query.empty()) {
        sql += " WHERE c.customer_code LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?";
    }
    sql += " GROUP BY c.id ORDER BY c.id DESC LIMIT ? OFFSET ?;";

    PreparedStatement stmt(db, sql);
    int bindIdx = 1;
    if (!query.empty()) {
        std::string pattern = "%" + query + "%";
        stmt.bind(bindIdx++, pattern);
        stmt.bind(bindIdx++, pattern);
        stmt.bind(bindIdx++, pattern);
    }
    stmt.bind(bindIdx++, limit);
    stmt.bind(bindIdx++, offset);

    while (stmt.step()) {
        CustomerRecord r;
        r.id = stmt.getInt(0);
        r.customerCode = stmt.getString(1);
        r.fullName = stmt.getString(2);
        r.phone = stmt.getString(3);
        r.email = stmt.getString(4);
        r.isActive = stmt.getInt(5) != 0;
        r.createdAt = stmt.getString(6);
        r.updatedAt = stmt.getString(7);
        r.totalPurchases = stmt.getInt(8);
        r.lifetimeSpentPaise = stmt.getInt64(9);
        r.lastPurchaseDate = stmt.getString(10);
        list.push_back(r);
    }
    return list;
}

int CustomerRepository::getTotalCount(const std::string& query) {
    std::string sql = "SELECT COUNT(*) FROM customers";
    if (!query.empty()) {
        sql += " WHERE customer_code LIKE ? OR full_name LIKE ? OR phone LIKE ?";
    }
    sql += ";";

    PreparedStatement stmt(db, sql);
    if (!query.empty()) {
        std::string pattern = "%" + query + "%";
        stmt.bind(1, pattern);
        stmt.bind(2, pattern);
        stmt.bind(3, pattern);
    }

    if (stmt.step()) {
        return stmt.getInt(0);
    }
    return 0;
}

std::vector<BillRecord> CustomerRepository::getCustomerBills(int customerId, int limit, int offset) {
    BillRepository billRepo(db);
    std::vector<BillRecord> list;
    PreparedStatement stmt(db, R"(
        SELECT id, bill_number, subtotal_paise, total_discount_paise, final_amount_paise, created_at,
               customer_id, COALESCE(customer_name, ''), COALESCE(customer_phone, '')
        FROM bills
        WHERE customer_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
    )");
    stmt.bind(1, customerId);
    stmt.bind(2, limit);
    stmt.bind(3, offset);

    while (stmt.step()) {
        BillRecord record;
        record.id = stmt.getInt(0);
        record.billNumber = stmt.getString(1);
        record.subtotalPaise = stmt.getInt64(2);
        record.totalDiscountPaise = stmt.getInt64(3);
        record.finalAmountPaise = stmt.getInt64(4);
        record.createdAt = stmt.getString(5);
        record.customerId = stmt.getOptionalInt(6);
        record.customerName = stmt.getString(7);
        record.customerPhone = stmt.getString(8);
        list.push_back(record);
    }
    return list;
}

std::string CustomerRepository::generateNextCustomerCode() {
    PreparedStatement stmt(db, "SELECT COALESCE(MAX(id), 0) + 1 FROM customers;");
    int nextId = 1;
    if (stmt.step()) {
        nextId = stmt.getInt(0);
    }
    std::ostringstream ss;
    ss << "CUST-" << std::setfill('0') << std::setw(4) << (1000 + nextId);
    return ss.str();
}
