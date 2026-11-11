#pragma once
#include "controllers/ControllerUtils.hpp"
#include "repositories/BillRepository.hpp"
#include "repositories/ProductRepository.hpp"
#include "models/Bill.hpp"
#include <chrono>
#include <sstream>
#include <iomanip>
#include <atomic>
#include <unordered_map>

class BillController {
public:
    static std::string generateBillNumber() {
        auto now = std::chrono::system_clock::now();
        auto timeT = std::chrono::system_clock::to_time_t(now);
        std::tm tmNow{};
#ifdef _WIN32
        localtime_s(&tmNow, &timeT);
#else
        localtime_r(&timeT, &tmNow);
#endif
        auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count() % 1000;
        static std::atomic<uint64_t> seq{0};
        uint64_t nextSeq = ++seq % 1000;

        std::ostringstream ss;
        ss << "INV-"
           << std::put_time(&tmNow, "%Y%m%d%H%M%S")
           << "-" << std::setfill('0') << std::setw(3) << ms
           << "-" << std::setfill('0') << std::setw(3) << nextSeq;
        return ss.str();
    }

    static nlohmann::json billToJson(const BillRecord& b) {
        nlohmann::json itemsArr = nlohmann::json::array();
        for (const auto& item : b.items) {
            itemsArr.push_back({
                {"id", item.id},
                {"productId", item.productId.has_value() ? nlohmann::json(*item.productId) : nlohmann::json(nullptr)},
                {"productName", item.productName},
                {"brandName", item.brandName},
                {"unitPricePaise", item.unitPricePaise},
                {"unitPriceInRupees", static_cast<double>(item.unitPricePaise) / 100.0},
                {"discountType", item.discountType},
                {"discountValue", item.discountValue},
                {"unitDiscountPaise", item.unitDiscountPaise},
                {"unitDiscountInRupees", static_cast<double>(item.unitDiscountPaise) / 100.0},
                {"finalUnitPricePaise", item.finalUnitPricePaise},
                {"finalUnitPriceInRupees", item.getFinalUnitPriceInRupees()},
                {"quantity", item.quantity},
                {"lineTotalPaise", item.lineTotalPaise},
                {"lineTotalInRupees", item.getLineTotalInRupees()}
            });
        }

        return nlohmann::json{
            {"id", b.id},
            {"billNumber", b.billNumber},
            {"subtotalPaise", b.subtotalPaise},
            {"subtotalInRupees", b.getSubtotalInRupees()},
            {"totalDiscountPaise", b.totalDiscountPaise},
            {"totalDiscountInRupees", b.getTotalDiscountInRupees()},
            {"finalAmountPaise", b.finalAmountPaise},
            {"finalAmountInRupees", b.getFinalAmountInRupees()},
            {"createdAt", b.createdAt},
            {"itemCount", b.items.size()},
            {"items", itemsArr}
        };
    }

    static void registerRoutes(ControllerUtils::CrowApp& app, DatabaseConnection& db, const std::string& allowedOrigin) {
        // GET /api/bills/summary (Must be before /api/bills/<int>)
        CROW_ROUTE(app, "/api/bills/summary").methods("GET"_method, "OPTIONS"_method)(
            [&db, allowedOrigin](const crow::request& req) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                BillRepository billRepo(db);
                auto summary = billRepo.getSummary();

                nlohmann::json data = {
                    {"totalBills", summary.totalBills},
                    {"totalGrossPaise", summary.totalGrossPaise},
                    {"totalGrossInRupees", summary.getTotalGrossInRupees()},
                    {"totalDiscountPaise", summary.totalDiscountPaise},
                    {"totalDiscountInRupees", summary.getTotalDiscountInRupees()},
                    {"totalNetPaise", summary.totalNetPaise},
                    {"totalNetInRupees", summary.getTotalNetInRupees()},
                    {"totalUnitsSold", summary.totalUnitsSold}
                };

                return ControllerUtils::successResponse(data, "Bills summary retrieved", allowedOrigin);
            }
        );

        // POST /api/bills & GET /api/bills
        CROW_ROUTE(app, "/api/bills").methods("GET"_method, "POST"_method, "OPTIONS"_method)(
            [&db, allowedOrigin](const crow::request& req) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                BillRepository billRepo(db);

                // 1. GET /api/bills
                if (req.method == "GET"_method) {
                    int limit = 50;
                    int offset = 0;
                    if (req.url_params.get("limit")) {
                        try { limit = (std::max)(1, std::stoi(req.url_params.get("limit"))); } catch (...) {}
                    }
                    if (req.url_params.get("offset")) {
                        try { offset = (std::max)(0, std::stoi(req.url_params.get("offset"))); } catch (...) {}
                    }

                    int totalCount = billRepo.getTotalCount();
                    auto bills = billRepo.getRecentBills(limit, offset);
                    nlohmann::json list = nlohmann::json::array();
                    for (const auto& b : bills) {
                        list.push_back(billToJson(b));
                    }
                    return ControllerUtils::successResponseWithPagination(list, "Bills retrieved", allowedOrigin, totalCount, limit, offset);
                }

                // 2. POST /api/bills (Create new Bill & Checkout)
                if (req.method == "POST"_method) {
                    try {
                        nlohmann::json body;
                        crow::response parseErr;
                        if (!ControllerUtils::parseJsonObject(req, body, allowedOrigin, parseErr)) {
                            return parseErr;
                        }

                        if (!body.contains("items") || !body["items"].is_array() || body["items"].empty()) {
                            return ControllerUtils::errorResponse(400, "Bill must contain at least one line item in 'items' array", allowedOrigin);
                        }

                        std::string billNumber;
                        if (body.contains("billNumber") && !body["billNumber"].is_null()) {
                            if (!body["billNumber"].is_string()) {
                                return ControllerUtils::errorResponse(400, "billNumber must be a string", allowedOrigin);
                            }
                            billNumber = ControllerUtils::trimCopy(body["billNumber"].get<std::string>());
                            if (billNumber.size() > 64) {
                                return ControllerUtils::errorResponse(400, "billNumber cannot exceed 64 characters", allowedOrigin);
                            }
                        }
                        if (billNumber.empty()) {
                            billNumber = generateBillNumber();
                        }

                        // Pre-validate item schema & types before acquiring DB lock
                        for (const auto& it : body["items"]) {
                            if (!it.is_object() || !it.contains("productId") || !it.contains("quantity")) {
                                return ControllerUtils::errorResponse(400, "Each item must be an object with 'productId' and 'quantity'", allowedOrigin);
                            }
                            int prodIdTmp = 0;
                            int qtyTmp = 0;
                            std::string fieldErr;
                            if (!ControllerUtils::parseStrictIntField(it, "productId", 1, 1000000000, prodIdTmp, fieldErr)) {
                                return ControllerUtils::errorResponse(400, fieldErr, allowedOrigin);
                            }
                            if (!ControllerUtils::parseStrictIntField(it, "quantity", 1, 100000, qtyTmp, fieldErr)) {
                                return ControllerUtils::errorResponse(400, fieldErr, allowedOrigin);
                            }
                        }

                        // Serialize full check-and-commit checkout across concurrent Crow threads
                        auto dbLock = db.lock();

                        // Check if billNumber already exists
                        if (billRepo.findByBillNumber(billNumber).has_value()) {
                            return ControllerUtils::errorResponse(409, "Invoice with number '" + billNumber + "' already exists", allowedOrigin);
                        }

                        ProductRepository prodRepo(db);
                        Bill domainBill;
                        std::unordered_map<int, int> cumulativeQty;

                        // Add items and validate cumulative stock in C++ domain model
                        for (const auto& it : body["items"]) {
                            int prodId = it["productId"].get<int>();
                            int quantity = it["quantity"].get<int>();

                            auto prodOpt = prodRepo.findById(prodId);
                            if (!prodOpt.has_value()) {
                                return ControllerUtils::errorResponse(404, "Product with ID " + std::to_string(prodId) + " not found", allowedOrigin);
                            }
                            if (!prodRepo.isActive(prodId)) {
                                return ControllerUtils::errorResponse(409, "Cannot sell inactive or deleted product '" + (*prodOpt)->getName() + "'", allowedOrigin);
                            }

                            cumulativeQty[prodId] += quantity;
                            auto product = *prodOpt;
                            if (product->getStock() < cumulativeQty[prodId]) {
                                return ControllerUtils::errorResponse(
                                    409,
                                    "Insufficient stock for '" + product->getName() +
                                    "'. Available: " + std::to_string(product->getStock()) +
                                    ", Requested: " + std::to_string(cumulativeQty[prodId]),
                                    allowedOrigin
                                );
                            }

                            // Add to domain bill applying its configured discount strategy
                            domainBill.addItem(*product, quantity);
                        }

                        // Save Bill atomically to SQLite with stock deduction & snapshots
                        int newBillId = billRepo.saveBill(billNumber, domainBill);

                        auto createdRecord = billRepo.findById(newBillId);
                        if (!createdRecord.has_value()) {
                            return ControllerUtils::errorResponse(500, "Failed to load newly created invoice", allowedOrigin);
                        }

                        return ControllerUtils::successResponse(billToJson(*createdRecord), "Invoice created successfully", allowedOrigin, 201);
                    } catch (const nlohmann::json::exception&) {
                        return ControllerUtils::errorResponse(400, "Malformed or invalid JSON request", allowedOrigin);
                    } catch (const std::exception& e) {
                        return ControllerUtils::errorResponse(409, "Transaction rejected: " + std::string(e.what()), allowedOrigin);
                    }
                }

                return ControllerUtils::errorResponse(405, "Method Not Allowed", allowedOrigin);
            }
        );

        // GET /api/bills/{id}
        CROW_ROUTE(app, "/api/bills/<int>").methods("GET"_method, "OPTIONS"_method)(
            [&db, allowedOrigin](const crow::request& req, int id) {
                if (req.method == "OPTIONS"_method) {
                    return ControllerUtils::corsPreflight(allowedOrigin);
                }

                BillRepository repo(db);
                auto record = repo.findById(id);
                if (!record.has_value()) {
                    return ControllerUtils::errorResponse(404, "Bill not found", allowedOrigin);
                }

                return ControllerUtils::successResponse(billToJson(*record), "Bill retrieved", allowedOrigin);
            }
        );
    }
};
