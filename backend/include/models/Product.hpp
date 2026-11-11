#pragma once
#include "strategies/IDiscountStrategy.hpp"
#include <string>
#include <memory>
#include <iostream>
#include <stdexcept>
#include <cstdint>

class Bill;

enum class ProductType {
    NON_PERISHABLE,
    PERISHABLE
};

/**
 * @brief Base Product class representing an inventory item.
 * Demonstrates:
 *  - Encapsulation (private state, validated public methods)
 *  - Nested Class (Product::StockInfo)
 *  - Static Members & Static Methods for inventory tracking
 *  - Constructor Overloading
 *  - Rule of Five (Safe copy/move semantics synchronized with static tracking)
 *  - Virtual Destructor for polymorphic lifecycle management
 *  - Friend Class & Friend Functions
 *  - Modern C++ smart pointer ownership for Discount Strategy
 */
class Product {
private:
    int id;
    std::string sku;
    std::string name;
    int brandId;
    int categoryId;
    int64_t priceInPaise;
    int stock;
    std::shared_ptr<IDiscountStrategy> discountStrategy;

public:
    /**
     * @brief Nested class encapsulating stock partitioning.
     * Demonstrates nested class syntax and access rules.
     */
    class StockInfo {
    private:
        int reserved;
        int available;

    public:
        StockInfo(int r, int a);
        void display() const;
        int getReserved() const;
        int getAvailable() const;
        int getTotal() const;
    };

    // Static inventory telemetry counters
    static int totalProducts;
    static int totalStockUnits;

    static int getTotalProducts();
    static int getTotalStockUnits();

    // Default Constructor
    Product();

    // Comprehensive Constructor
    Product(int id,
            const std::string& sku,
            const std::string& name,
            int brandId,
            int categoryId,
            int64_t priceInPaise,
            int initialStock,
            std::shared_ptr<IDiscountStrategy> discount = nullptr);

    // Backwards-Compatible Legacy Constructor (for lab compatibility)
    Product(const std::string& name, double priceInRupees, int initialStock);

    // Virtual Destructor
    virtual ~Product();

    // Rule of Five implementations
    Product(const Product& other);
    Product& operator=(const Product& other);
    Product(Product&& other) noexcept;
    Product& operator=(Product&& other) noexcept;

    // Getters and Business Methods
    int getId() const;
    std::string getSku() const;
    std::string getName() const;
    int getBrandId() const;
    int getCategoryId() const;
    int64_t getPriceInPaise() const;
    double getPrice() const; // In Rupees (preserves original interface)
    int getStock() const;

    int64_t getDiscountedPriceInPaise() const;
    double getDiscountedPriceInRupees() const;

    void setDiscount(std::shared_ptr<IDiscountStrategy> strategy);
    std::shared_ptr<IDiscountStrategy> getDiscount() const;

    void setPriceInPaise(int64_t newPriceInPaise);
    void setPriceInRupees(double newPriceInRupees);

    // Inventory operations with strict invariant checks
    void reduceStock(int quantity);
    void addStock(int quantity);

    StockInfo getStockInfo() const;

    // Polymorphic display
    virtual void display() const;
    virtual ProductType getType() const;
    virtual std::string getProductTypeString() const;

    // Friends for encapsulation exceptions
    friend class Bill;
    friend bool operator==(const Product& p1, const Product& p2);
    friend std::ostream& operator<<(std::ostream& out, const Product& p);
};
