#include "server/AppServer.hpp"
#include <iostream>
#include <filesystem>
#include <cassert>
#include <stdexcept>

#define TEST_ASSERT(cond) \
    do { \
        if (!(cond)) { \
            throw std::runtime_error(std::string("API test assertion failed: ") + #cond + " at line " + std::to_string(__LINE__)); \
        } \
    } while (0)

const std::string API_TEST_DB = "data/test_api.db";

void cleanApiTestDb() {
    std::error_code ec;
    std::filesystem::remove(API_TEST_DB, ec);
    std::filesystem::remove(API_TEST_DB + "-wal", ec);
    std::filesystem::remove(API_TEST_DB + "-shm", ec);
}

crow::response makeRequest(AppServer& server,
                          const std::string& methodStr,
                          const std::string& fullUrl,
                          const std::string& body = "",
                          const std::string& token = "") {
    crow::request req;
    req.raw_url = fullUrl;
    auto qPos = fullUrl.find('?');
    if (qPos != std::string::npos) {
        req.url = fullUrl.substr(0, qPos);
        req.url_params = crow::query_string(fullUrl);
    } else {
        req.url = fullUrl;
    }

    if (methodStr == "GET") req.method = "GET"_method;
    else if (methodStr == "POST") req.method = "POST"_method;
    else if (methodStr == "PUT") req.method = "PUT"_method;
    else if (methodStr == "DELETE") req.method = "DELETE"_method;
    else if (methodStr == "OPTIONS") req.method = "OPTIONS"_method;

    req.body = body;
    if (!token.empty()) {
        req.headers.insert({"Authorization", "Bearer " + token});
    }
    if (!body.empty()) {
        req.headers.insert({"Content-Type", "application/json"});
    }

    crow::response res;
    server.getCrowApp().handle_full(req, res);
    return res;
}

int main() {
    std::cout << "=====================================================\n";
    std::cout << "       RUNNING CROW REST API & AUTH TEST SUITE       \n";
    std::cout << "=====================================================\n";

    cleanApiTestDb();

    try {
        std::string adminToken;
        int brandId = 0;
        int catId = 0;
        int prodId = 0;

        {
            ServerConfig config;
            config.port = 8888;
            config.host = "127.0.0.1";
            config.allowedOrigin = "http://localhost:5173";
            config.dbPath = API_TEST_DB;

            AppServer server(config);
            server.getCrowApp().validate();

            // Set up known admin password for testing
            server.getAuthService().createOrUpdateAdmin("SuperSecret123!");

            // 1. Health Endpoint Test
            std::cout << "[RUNNING] 1. Health Endpoint Test...\n";
            {
                auto res = makeRequest(server, "GET", "/api/health");
                TEST_ASSERT(res.code == 200);
                auto j = nlohmann::json::parse(res.body);
                TEST_ASSERT(j["success"] == true);
                TEST_ASSERT(j["data"]["status"] == "UP");
                TEST_ASSERT(j["data"]["service"] == "Supermarket Management API");
                std::cout << "  -> PASSED\n";
            }

            // 2. Auth Endpoint Tests (Admin Unlock)
            std::cout << "[RUNNING] 2. Admin Authentication & Session Management...\n";
            {
                // Invalid password
                auto resFail = makeRequest(server, "POST", "/api/auth/admin/unlock", "{\"password\":\"WrongPass123!\"}");
                TEST_ASSERT(resFail.code == 401);
                auto jFail = nlohmann::json::parse(resFail.body);
                TEST_ASSERT(jFail["success"] == false);

                // Valid password
                auto resSuccess = makeRequest(server, "POST", "/api/auth/admin/unlock", "{\"password\":\"SuperSecret123!\"}");
                TEST_ASSERT(resSuccess.code == 200);
                auto jSuccess = nlohmann::json::parse(resSuccess.body);
                TEST_ASSERT(jSuccess["success"] == true);
                TEST_ASSERT(jSuccess["data"]["role"] == "ADMIN");
                adminToken = jSuccess["data"]["token"].get<std::string>();
                TEST_ASSERT(!adminToken.empty());

                // Check session with valid token
                auto resSession = makeRequest(server, "GET", "/api/auth/session", "", adminToken);
                TEST_ASSERT(resSession.code == 200);
                auto jSession = nlohmann::json::parse(resSession.body);
                TEST_ASSERT(jSession["data"]["canAdmin"] == true);
                TEST_ASSERT(jSession["data"]["role"] == "ADMIN");

                // Check session without token (Staff mode)
                auto resAnonSession = makeRequest(server, "GET", "/api/auth/session");
                TEST_ASSERT(resAnonSession.code == 200);
                auto jAnon = nlohmann::json::parse(resAnonSession.body);
                TEST_ASSERT(jAnon["data"]["canAdmin"] == false);
                TEST_ASSERT(jAnon["data"]["role"] == "STAFF");

                std::cout << "  -> PASSED\n";
            }

            // 3. RBAC Enforcement on Protected Routes
            std::cout << "[RUNNING] 3. RBAC Route Protection...\n";
            {
                // Anonymous attempting to create a brand -> 401 or 403
                auto resUnauthorized = makeRequest(server, "POST", "/api/brands", "{\"name\":\"UnauthorizedBrand\"}");
                TEST_ASSERT(resUnauthorized.code == 401 || resUnauthorized.code == 403);

                // Staff attempting to create a product -> 401 or 403
                auto resProdUnauth = makeRequest(server, "POST", "/api/products", "{\"sku\":\"TEST001\",\"name\":\"Test\"}");
                TEST_ASSERT(resProdUnauth.code == 401 || resProdUnauth.code == 403);

                // Staff attempting inventory adjustment -> 401 or 403
                auto resAdjUnauth = makeRequest(server, "POST", "/api/inventory/adjustments", "{\"productId\":1,\"delta\":10,\"reason\":\"test\"}");
                TEST_ASSERT(resAdjUnauth.code == 401 || resAdjUnauth.code == 403);

                std::cout << "  -> PASSED\n";
            }

            // 4. Brands & Categories CRUD (Admin)
            std::cout << "[RUNNING] 4. Brands & Categories Management...\n";
            {
                // Create Brand
                auto resBrand = makeRequest(server, "POST", "/api/brands", "{\"name\":\"Organic Valley\"}", adminToken);
                TEST_ASSERT(resBrand.code == 201);
                auto jBrand = nlohmann::json::parse(resBrand.body);
                brandId = jBrand["data"]["id"].get<int>();
                TEST_ASSERT(brandId > 0);

                // Create Category
                auto resCat = makeRequest(server, "POST", "/api/categories", "{\"name\":\"Grains & Cereals\"}", adminToken);
                TEST_ASSERT(resCat.code == 201);
                auto jCat = nlohmann::json::parse(resCat.body);
                catId = jCat["data"]["id"].get<int>();
                TEST_ASSERT(catId > 0);

                // Read all brands as staff/anonymous (publicly viewable)
                auto resGetBrands = makeRequest(server, "GET", "/api/brands");
                TEST_ASSERT(resGetBrands.code == 200);
                auto jGetBrands = nlohmann::json::parse(resGetBrands.body);
                TEST_ASSERT(jGetBrands["data"].size() >= 1);

                std::cout << "  -> PASSED\n";
            }

            // 5. Product CRUD & Discount Support (Admin creation, Staff view)
            std::cout << "[RUNNING] 5. Product Creation & Filtering...\n";
            {
                nlohmann::json newProd = {
                    {"sku", "GRAIN-001"},
                    {"name", "Organic Quinoa 1kg"},
                    {"brandId", brandId},
                    {"categoryId", catId},
                    {"productType", "non-perishable"},
                    {"priceInPaise", 45000}, // Rs 450.00
                    {"stock", 50},
                    {"expiryDate", ""},
                    {"discountType", "percentage"},
                    {"discountValue", 10.0} // 10% discount
                };

                auto resProd = makeRequest(server, "POST", "/api/products", newProd.dump(), adminToken);
                TEST_ASSERT(resProd.code == 201);
                auto jProd = nlohmann::json::parse(resProd.body);
                prodId = jProd["data"]["id"].get<int>();
                TEST_ASSERT(prodId > 0);
                TEST_ASSERT(jProd["data"]["priceInPaise"] == 45000);
                TEST_ASSERT(jProd["data"]["discount"]["discountedPriceInPaise"] == 40500); // 45000 - 10% = 40500

                // Staff / Public can view product list
                auto resList = makeRequest(server, "GET", "/api/products?q=Quinoa");
                TEST_ASSERT(resList.code == 200);
                auto jList = nlohmann::json::parse(resList.body);
                TEST_ASSERT(jList["data"]["products"].size() == 1);
                TEST_ASSERT(jList["data"]["products"][0]["sku"] == "GRAIN-001");

                // Update product (Admin)
                nlohmann::json updateProd = {
                    {"sku", "GRAIN-001"},
                    {"name", "Organic Royal White Quinoa 1kg"},
                    {"brandId", brandId},
                    {"categoryId", catId},
                    {"productType", "non-perishable"},
                    {"priceInPaise", 45000},
                    {"stock", 50},
                    {"expiryDate", ""},
                    {"discountType", "percentage"},
                    {"discountValue", 10.0}
                };
                auto resUpdate = makeRequest(server, "PUT", "/api/products/" + std::to_string(prodId), updateProd.dump(), adminToken);
                TEST_ASSERT(resUpdate.code == 200);
                auto jUpdated = nlohmann::json::parse(resUpdate.body);
                TEST_ASSERT(jUpdated["data"]["name"] == "Organic Royal White Quinoa 1kg");

                std::cout << "  -> PASSED\n";
            }

            // 6. Inventory Adjustment (Admin) & Movement Tracking
            std::cout << "[RUNNING] 6. Inventory Management & Movement Tracking...\n";
            {
                nlohmann::json adj = {
                    {"productId", prodId},
                    {"delta", 20},
                    {"reason", "Restock shipment from distributor"}
                };
                auto resAdj = makeRequest(server, "POST", "/api/inventory/adjustments", adj.dump(), adminToken);
                TEST_ASSERT(resAdj.code == 200);
                auto jAdj = nlohmann::json::parse(resAdj.body);
                TEST_ASSERT(jAdj["data"]["newStock"] == 70);

                // Fetch movements for product
                auto resMov = makeRequest(server, "GET", "/api/inventory/products/" + std::to_string(prodId) + "/movements", "", adminToken);
                TEST_ASSERT(resMov.code == 200);
                auto jMov = nlohmann::json::parse(resMov.body);
                // Should have initial movement (+50) and adjustment movement (+20)
                TEST_ASSERT(jMov["data"].size() >= 2);

                std::cout << "  -> PASSED\n";
            }

            // 7. Transactional Billing Checkout (Available to Staff / POS terminal)
            std::cout << "[RUNNING] 7. Transactional Billing Checkout & Invoice Snapshot...\n";
            int billId = 0;
            {
                nlohmann::json checkoutReq = {
                    {"items", {
                        {
                            {"productId", prodId},
                            {"quantity", 4}
                        }
                    }}
                };

                // Checkout performed by staff (no admin token required!)
                auto resBill = makeRequest(server, "POST", "/api/bills", checkoutReq.dump());
                TEST_ASSERT(resBill.code == 201);
                auto jBill = nlohmann::json::parse(resBill.body);
                TEST_ASSERT(jBill["success"] == true);
                billId = jBill["data"]["id"].get<int>();
                TEST_ASSERT(billId > 0);
                TEST_ASSERT(jBill["data"]["subtotalPaise"] == 180000); // 4 * 45000 = 180000
                TEST_ASSERT(jBill["data"]["totalDiscountPaise"] == 18000); // 4 * 4500 = 18000
                TEST_ASSERT(jBill["data"]["finalAmountPaise"] == 162000); // 162000 paise (Rs 1620.00)

                // Verify stock was reduced from 70 to 66
                auto resProdCheck = makeRequest(server, "GET", "/api/products/" + std::to_string(prodId));
                TEST_ASSERT(resProdCheck.code == 200);
                auto jProdCheck = nlohmann::json::parse(resProdCheck.body);
                TEST_ASSERT(jProdCheck["data"]["stock"] == 66);

                // Attempt to checkout with excess stock -> should fail (409 Conflict)
                nlohmann::json excessCheckout = {
                    {"items", {
                        {
                            {"productId", prodId},
                            {"quantity", 999}
                        }
                    }}
                };
                auto resExcess = makeRequest(server, "POST", "/api/bills", excessCheckout.dump());
                TEST_ASSERT(resExcess.code == 400 || resExcess.code == 409);

                // Stock should still be 66 (atomicity/rollback preserved)
                auto resRollbackCheck = makeRequest(server, "GET", "/api/products/" + std::to_string(prodId));
                auto jRollbackCheck = nlohmann::json::parse(resRollbackCheck.body);
                TEST_ASSERT(jRollbackCheck["data"]["stock"] == 66);

                // Retrieve historical bill and verify snapshot
                auto resGetBill = makeRequest(server, "GET", "/api/bills/" + std::to_string(billId));
                TEST_ASSERT(resGetBill.code == 200);
                auto jHist = nlohmann::json::parse(resGetBill.body);
                TEST_ASSERT(jHist["data"]["finalAmountPaise"] == 162000);
                TEST_ASSERT(jHist["data"]["items"][0]["productName"] == "Organic Royal White Quinoa 1kg");
                TEST_ASSERT(jHist["data"]["items"][0]["finalUnitPricePaise"] == 40500);

                std::cout << "  -> PASSED\n";
            }

            // 8. Historical Invoice Snapshot Immutability Test
            std::cout << "[RUNNING] 8. Historical Invoice Snapshot Immutability Verification...\n";
            {
                // Alter the product in catalog: rename, change price to Rs 999.00, remove discount
                nlohmann::json alterReq = {
                    {"sku", "SKU-ALTERED-001"},
                    {"name", "Completely Altered Quinoa Name"},
                    {"brandId", brandId},
                    {"categoryId", catId},
                    {"productType", "NON_PERISHABLE"},
                    {"priceInRupees", 999.00},
                    {"stock", 5},
                    {"discountType", "NONE"},
                    {"discountValue", 0.0}
                };
                auto resAlter = makeRequest(server, "PUT", "/api/products/" + std::to_string(prodId), alterReq.dump(), adminToken);
                TEST_ASSERT(resAlter.code == 200);

                // Soft-delete the product
                auto resDel = makeRequest(server, "DELETE", "/api/products/" + std::to_string(prodId), "", adminToken);
                TEST_ASSERT(resDel.code == 200);

                // Re-fetch the historical bill and assert every line item snapshot is 100% UNTOUCHED
                auto resHistAfter = makeRequest(server, "GET", "/api/bills/" + std::to_string(billId));
                TEST_ASSERT(resHistAfter.code == 200);
                auto jHistAfter = nlohmann::json::parse(resHistAfter.body);

                TEST_ASSERT(jHistAfter["data"]["finalAmountPaise"] == 162000);
                TEST_ASSERT(jHistAfter["data"]["subtotalPaise"] == 180000);
                TEST_ASSERT(jHistAfter["data"]["totalDiscountPaise"] == 18000);
                TEST_ASSERT(jHistAfter["data"]["items"].size() == 1);

                const auto& snapshotItem = jHistAfter["data"]["items"][0];
                TEST_ASSERT(snapshotItem["productName"] == "Organic Royal White Quinoa 1kg");
                TEST_ASSERT(snapshotItem["unitPricePaise"] == 45000);
                TEST_ASSERT(snapshotItem["unitDiscountPaise"] == 4500);
                TEST_ASSERT(snapshotItem["finalUnitPricePaise"] == 40500);
                TEST_ASSERT(snapshotItem["lineTotalPaise"] == 162000);
                TEST_ASSERT(snapshotItem["quantity"] == 4);

                std::cout << "  -> PASSED (Historical snapshot is strictly immutable)\n";
            }

            // 9. Database Aggregates & Pagination Metadata Test
            std::cout << "[RUNNING] 9. Database Summary Aggregates & Pagination Metadata...\n";
            {
                // Test GET /api/bills/summary
                auto resBillSum = makeRequest(server, "GET", "/api/bills/summary");
                TEST_ASSERT(resBillSum.code == 200);
                auto jBillSum = nlohmann::json::parse(resBillSum.body);
                TEST_ASSERT(jBillSum["data"]["totalBills"] == 1);
                TEST_ASSERT(jBillSum["data"]["totalGrossPaise"] == 180000);
                TEST_ASSERT(jBillSum["data"]["totalDiscountPaise"] == 18000);
                TEST_ASSERT(jBillSum["data"]["totalNetPaise"] == 162000);
                TEST_ASSERT(jBillSum["data"]["totalUnitsSold"] == 4);

                // Test GET /api/bills pagination headers
                auto resPagedBills = makeRequest(server, "GET", "/api/bills?limit=1&offset=0");
                TEST_ASSERT(resPagedBills.code == 200);
                TEST_ASSERT(resPagedBills.get_header_value("X-Total-Count") == "1");
                TEST_ASSERT(resPagedBills.get_header_value("X-Limit") == "1");
                TEST_ASSERT(resPagedBills.get_header_value("X-Offset") == "0");

                // Test GET /api/products/summary
                auto resProdSum = makeRequest(server, "GET", "/api/products/summary");
                TEST_ASSERT(resProdSum.code == 200);
                auto jProdSum = nlohmann::json::parse(resProdSum.body);
                TEST_ASSERT(jProdSum["data"].contains("totalActiveProducts"));
                TEST_ASSERT(jProdSum["data"].contains("totalStockUnits"));

                // Test GET /api/inventory/summary
                auto resInvSum = makeRequest(server, "GET", "/api/inventory/summary");
                TEST_ASSERT(resInvSum.code == 200);
                auto jInvSum = nlohmann::json::parse(resInvSum.body);
                TEST_ASSERT(jInvSum["data"]["totalSales"] == 1);
                TEST_ASSERT(jInvSum["data"]["totalMovements"] >= 1);

                std::cout << "  -> PASSED (Database-side aggregation verified)\n";
            }

            // 10. Inventory Adjustment Contracts Audit (ADDITION, REDUCTION, ADJUSTMENT)
            std::cout << "[RUNNING] 10. Inventory Adjustment Contracts Audit...\n";
            {
                // Create a fresh active product for inventory movement tests
                nlohmann::json newProdReq = {
                    {"sku", "SKU-AUDIT-MILK"},
                    {"name", "Audit Farm Fresh Milk 1L"},
                    {"brandId", brandId},
                    {"categoryId", catId},
                    {"productType", "PERISHABLE"},
                    {"priceInRupees", 65.00},
                    {"stock", 20},
                    {"expiryDate", "2026-12-01"},
                    {"discountType", "NONE"},
                    {"discountValue", 0.0}
                };
                auto resNewProd = makeRequest(server, "POST", "/api/products", newProdReq.dump(), adminToken);
                TEST_ASSERT(resNewProd.code == 201);
                int invProdId = nlohmann::json::parse(resNewProd.body)["data"]["id"].get<int>();

                // 1. ADDITION (+10)
                nlohmann::json addReq = {
                    {"productId", invProdId},
                    {"quantityChange", 10},
                    {"movementType", "ADDITION"},
                    {"reason", "Restock shipment batch #101"}
                };
                auto resAdd = makeRequest(server, "POST", "/api/inventory/adjustments", addReq.dump(), adminToken);
                TEST_ASSERT(resAdd.code == 200);
                auto jAdd = nlohmann::json::parse(resAdd.body);
                TEST_ASSERT(jAdd["data"]["previousStock"] == 20);
                TEST_ASSERT(jAdd["data"]["newStock"] == 30);

                // 2. REDUCTION (-5)
                nlohmann::json redReq = {
                    {"productId", invProdId},
                    {"quantityChange", -5},
                    {"movementType", "REDUCTION"},
                    {"reason", "Damaged container write-off"}
                };
                auto resRed = makeRequest(server, "POST", "/api/inventory/adjustments", redReq.dump(), adminToken);
                TEST_ASSERT(resRed.code == 200);
                auto jRed = nlohmann::json::parse(resRed.body);
                TEST_ASSERT(jRed["data"]["previousStock"] == 30);
                TEST_ASSERT(jRed["data"]["newStock"] == 25);

                // 3. ADJUSTMENT / Direct Physical Count (+3)
                nlohmann::json adjReq = {
                    {"productId", invProdId},
                    {"quantityChange", 3},
                    {"movementType", "ADJUSTMENT"},
                    {"reason", "Physical shelf audit correction"}
                };
                auto resAdj = makeRequest(server, "POST", "/api/inventory/adjustments", adjReq.dump(), adminToken);
                TEST_ASSERT(resAdj.code == 200);
                auto jAdj = nlohmann::json::parse(resAdj.body);
                TEST_ASSERT(jAdj["data"]["previousStock"] == 25);
                TEST_ASSERT(jAdj["data"]["newStock"] == 28);

                // Verify inventory movements log
                auto resMoves = makeRequest(server, "GET", "/api/inventory/movements?limit=10&offset=0");
                TEST_ASSERT(resMoves.code == 200);
                TEST_ASSERT(resMoves.get_header_value("X-Total-Count") != "");

                // Verify summary reflects exact counts
                auto resInvSum2 = makeRequest(server, "GET", "/api/inventory/summary");
                TEST_ASSERT(resInvSum2.code == 200);
                auto jInvSum2 = nlohmann::json::parse(resInvSum2.body);
                TEST_ASSERT(jInvSum2["data"]["totalAdditions"] >= 1);
                TEST_ASSERT(jInvSum2["data"]["totalReductions"] >= 1);
                TEST_ASSERT(jInvSum2["data"]["totalAdjustments"] >= 1);

                std::cout << "  -> PASSED (All movement types contract-compliant)\n";
            }

            // 11. Logout & Invalidation
            std::cout << "[RUNNING] 11. Admin Logout & Session Invalidation...\n";
            {
                auto resLogout = makeRequest(server, "POST", "/api/auth/logout", "", adminToken);
                TEST_ASSERT(resLogout.code == 200);

                // Attempt administrative operation after logout -> 401 or 403 Forbidden
                auto resAfterLogout = makeRequest(server, "POST", "/api/brands", "{\"name\":\"AfterLogoutBrand\"}", adminToken);
                TEST_ASSERT(resAfterLogout.code == 401 || resAfterLogout.code == 403);

                std::cout << "  -> PASSED\n";
            }
        } // server destructs cleanly here, releasing all SQLite file locks

        cleanApiTestDb();

        std::cout << "=====================================================\n";
        std::cout << "        ALL 11 API & AUTH TEST SUITES PASSED!        \n";
        std::cout << "=====================================================\n";
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "FATAL API TEST FAILURE: " << e.what() << "\n";
        cleanApiTestDb();
        return 1;
    }
}
