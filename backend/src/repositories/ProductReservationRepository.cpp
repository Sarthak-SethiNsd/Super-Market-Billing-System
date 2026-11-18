#include "repositories/ProductReservationRepository.hpp"
#include "database/PreparedStatement.hpp"
#include "database/Transaction.hpp"
#include <chrono>
#include <algorithm>

static int64_t getCurrentEpochSeconds() {
    return std::chrono::duration_cast<std::chrono::seconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
}

int ProductReservationRepository::cleanExpired() {
    int64_t nowSec = getCurrentEpochSeconds();
    PreparedStatement stmt(db, "DELETE FROM product_reservations WHERE expires_at <= ?;");
    stmt.bind(1, nowSec);
    stmt.execute();
    return db.getChanges();
}

int ProductReservationRepository::getReservedStock(int productId, const std::string& excludeSessionId) {
    cleanExpired();
    int64_t nowSec = getCurrentEpochSeconds();
    if (!excludeSessionId.empty()) {
        PreparedStatement stmt(db, "SELECT COALESCE(SUM(quantity), 0) FROM product_reservations WHERE product_id = ? AND session_id != ? AND expires_at > ?;");
        stmt.bind(1, productId);
        stmt.bind(2, excludeSessionId);
        stmt.bind(3, nowSec);
        if (stmt.step()) {
            return stmt.getInt(0);
        }
    } else {
        PreparedStatement stmt(db, "SELECT COALESCE(SUM(quantity), 0) FROM product_reservations WHERE product_id = ? AND expires_at > ?;");
        stmt.bind(1, productId);
        stmt.bind(2, nowSec);
        if (stmt.step()) {
            return stmt.getInt(0);
        }
    }
    return 0;
}

std::unordered_map<int, int> ProductReservationRepository::getAllReservedStock(const std::string& excludeSessionId) {
    cleanExpired();
    int64_t nowSec = getCurrentEpochSeconds();
    std::unordered_map<int, int> result;
    if (!excludeSessionId.empty()) {
        PreparedStatement stmt(db, "SELECT product_id, COALESCE(SUM(quantity), 0) FROM product_reservations WHERE session_id != ? AND expires_at > ? GROUP BY product_id;");
        stmt.bind(1, excludeSessionId);
        stmt.bind(2, nowSec);
        while (stmt.step()) {
            result[stmt.getInt(0)] = stmt.getInt(1);
        }
    } else {
        PreparedStatement stmt(db, "SELECT product_id, COALESCE(SUM(quantity), 0) FROM product_reservations WHERE expires_at > ? GROUP BY product_id;");
        stmt.bind(1, nowSec);
        while (stmt.step()) {
            result[stmt.getInt(0)] = stmt.getInt(1);
        }
    }
    return result;
}

bool ProductReservationRepository::reserve(const std::string& sessionId, int productId, int quantity, int ttlSeconds, int& outAvailable) {
    if (sessionId.empty()) {
        outAvailable = 0;
        return false;
    }
    if (quantity <= 0) {
        release(sessionId, productId);
        outAvailable = getReservedStock(productId, sessionId);
        return true;
    }

    Transaction tx(db);
    cleanExpired();
    int64_t nowSec = getCurrentEpochSeconds();

    // 1. Verify product exists, is active, and fetch physical stock
    PreparedStatement prodStmt(db, "SELECT stock, is_active FROM products WHERE id = ?;");
    prodStmt.bind(1, productId);
    if (!prodStmt.step()) {
        outAvailable = 0;
        return false;
    }

    int physicalStock = prodStmt.getInt(0);
    int isActive = prodStmt.getInt(1);
    if (isActive == 0) {
        outAvailable = 0;
        return false;
    }

    // 2. Calculate units reserved by all OTHER sessions
    PreparedStatement otherStmt(db, "SELECT COALESCE(SUM(quantity), 0) FROM product_reservations WHERE product_id = ? AND session_id != ? AND expires_at > ?;");
    otherStmt.bind(1, productId);
    otherStmt.bind(2, sessionId);
    otherStmt.bind(3, nowSec);
    int otherReserved = 0;
    if (otherStmt.step()) {
        otherReserved = otherStmt.getInt(0);
    }

    int availableForSession = (std::max)(0, physicalStock - otherReserved);
    outAvailable = availableForSession;

    if (quantity > availableForSession) {
        // Insufficient stock available
        return false;
    }

    // 3. Upsert reservation row
    int64_t expiresAt = nowSec + (ttlSeconds > 0 ? ttlSeconds : 900); // Default 15 min

    PreparedStatement updateStmt(db, "UPDATE product_reservations SET quantity = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ? AND product_id = ?;");
    updateStmt.bind(1, quantity);
    updateStmt.bind(2, expiresAt);
    updateStmt.bind(3, sessionId);
    updateStmt.bind(4, productId);
    updateStmt.execute();

    if (db.getChanges() == 0) {
        PreparedStatement insertStmt(db, "INSERT INTO product_reservations (session_id, product_id, quantity, expires_at) VALUES (?, ?, ?, ?);");
        insertStmt.bind(1, sessionId);
        insertStmt.bind(2, productId);
        insertStmt.bind(3, quantity);
        insertStmt.bind(4, expiresAt);
        insertStmt.execute();
    }

    tx.commit();
    return true;
}

bool ProductReservationRepository::release(const std::string& sessionId, int productId) {
    if (sessionId.empty()) return false;
    PreparedStatement stmt(db, "DELETE FROM product_reservations WHERE session_id = ? AND product_id = ?;");
    stmt.bind(1, sessionId);
    stmt.bind(2, productId);
    stmt.execute();
    return db.getChanges() > 0;
}

int ProductReservationRepository::clearSession(const std::string& sessionId) {
    if (sessionId.empty()) return 0;
    PreparedStatement stmt(db, "DELETE FROM product_reservations WHERE session_id = ?;");
    stmt.bind(1, sessionId);
    stmt.execute();
    return db.getChanges();
}

std::vector<CartReservationItem> ProductReservationRepository::getSessionReservations(const std::string& sessionId) {
    std::vector<CartReservationItem> list;
    if (sessionId.empty()) return list;
    cleanExpired();
    int64_t nowSec = getCurrentEpochSeconds();

    PreparedStatement stmt(db, R"(
        SELECT r.id, r.session_id, r.product_id, p.name, p.sku, r.quantity, r.expires_at
        FROM product_reservations r
        JOIN products p ON r.product_id = p.id
        WHERE r.session_id = ? AND r.expires_at > ?
        ORDER BY r.id ASC;
    )");
    stmt.bind(1, sessionId);
    stmt.bind(2, nowSec);

    while (stmt.step()) {
        CartReservationItem item;
        item.id = stmt.getInt(0);
        item.sessionId = stmt.getString(1);
        item.productId = stmt.getInt(2);
        item.productName = stmt.getString(3);
        item.sku = stmt.getString(4);
        item.quantity = stmt.getInt(5);
        item.expiresAt = stmt.getInt64(6);
        item.remainingSeconds = static_cast<int>((std::max)(static_cast<int64_t>(0), item.expiresAt - nowSec));
        list.push_back(item);
    }
    return list;
}
