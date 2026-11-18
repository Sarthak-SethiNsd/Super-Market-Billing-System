#pragma once
#include <stdexcept>
#include <string>

/**
 * @brief Base domain exception interface for the Supermarket Management System.
 * Demonstrates OOP Exception Hierarchy, Abstraction, and Polymorphism.
 */
class ISupermarketException {
public:
    virtual ~ISupermarketException() = default;
    virtual const char* what() const noexcept = 0;
};

/**
 * @brief Base domain exception class inheriting from std::runtime_error and ISupermarketException.
 * Demonstrates multiple inheritance and OOP domain exception architecture.
 */
class SupermarketException : public std::runtime_error, public ISupermarketException {
public:
    explicit SupermarketException(const std::string& message)
        : std::runtime_error(message) {}

    const char* what() const noexcept override {
        return std::runtime_error::what();
    }
};

/**
 * @brief Thrown when an invalid quantity (<= 0, negative, or invalid type) is provided.
 * Inherits from std::invalid_argument (which inherits from std::logic_error -> std::exception).
 */
class InvalidQuantityException : public std::invalid_argument, public ISupermarketException {
public:
    explicit InvalidQuantityException(const std::string& message = "Invalid quantity: must be positive")
        : std::invalid_argument(message) {}

    const char* what() const noexcept override {
        return std::invalid_argument::what();
    }
};

/**
 * @brief Thrown when requested purchase/deduction quantity exceeds available inventory stock.
 * Inherits from std::runtime_error (which inherits from std::exception).
 */
class InsufficientStockException : public std::runtime_error, public ISupermarketException {
private:
    int requested = 0;
    int available = 0;
    std::string productName;

public:
    InsufficientStockException(int req, int avail, const std::string& prodName = "")
        : std::runtime_error(
            "Requested quantity " + std::to_string(req) +
            " exceeds available stock " + std::to_string(avail) +
            (prodName.empty() ? "" : " for product '" + prodName + "'")
          ),
          requested(req),
          available(avail),
          productName(prodName) {}

    const char* what() const noexcept override {
        return std::runtime_error::what();
    }

    int getRequested() const noexcept { return requested; }
    int getAvailable() const noexcept { return available; }
    const std::string& getProductName() const noexcept { return productName; }
};

/**
 * @brief Thrown when an invalid discount configuration (negative, >100%, invalid type) is provided.
 * Inherits from std::invalid_argument (which inherits from std::logic_error -> std::exception).
 */
class InvalidDiscountException : public std::invalid_argument, public ISupermarketException {
public:
    explicit InvalidDiscountException(const std::string& message)
        : std::invalid_argument(message) {}

    const char* what() const noexcept override {
        return std::invalid_argument::what();
    }
};
