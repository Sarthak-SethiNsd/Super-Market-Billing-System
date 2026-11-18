# Object-Oriented Programming (OOP) Implementation Guide

**Course:** Object-Oriented Programming in C++ (CS201 / Sem III Lab)<br/>
**Project:** Supermarket Billing & Inventory Management System (ApexMart)<br/>
**Standard:** ISO C++17

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Classes and Objects](#2-classes-and-objects)
3. [Encapsulation & Data Hiding](#3-encapsulation--data-hiding)
4. [Abstraction & Interface Contracts](#4-abstraction--interface-contracts)
5. [Inheritance & Class Hierarchies](#5-inheritance--class-hierarchies)
6. [Polymorphism (Dynamic & Static)](#6-polymorphism-dynamic--static)
7. [Virtual Functions & Abstract Classes](#7-virtual-functions--abstract-classes)
8. [Function and Operator Overloading](#8-function-and-operator-overloading)
9. [Virtual Inheritance & The Diamond Problem](#9-virtual-inheritance--the-diamond-problem)
10. [Strategy Design Pattern](#10-strategy-design-pattern)
11. [Repository Pattern](#11-repository-pattern)
12. [Generic Programming with Templates](#12-generic-programming-with-templates)
13. [Resource Acquisition Is Initialization (RAII)](#13-resource-acquisition-is-initialization-raii)
14. [Exception Handling Architecture](#14-exception-handling-architecture)
15. [Run-Time Type Information (RTTI)](#15-run-time-type-information-rtti)
16. [Static Members & Encapsulated Utilities](#16-static-members--encapsulated-utilities)
17. [Friend Functions & Stream Insertion](#17-friend-functions--stream-insertion)

---

## 1. Introduction

The **Supermarket Billing & Inventory Management System (ApexMart)** is engineered to serve as a textbook-grade demonstration of Object-Oriented Programming in modern C++17. Every OOP mechanism implemented in this codebase serves an authentic operational function in the retail supermarket domain.

---

## 2. Classes and Objects

### Implementation
- **Files:**
  - [`backend/include/models/Product.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Product.hpp)
  - [`backend/include/models/Bill.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Bill.hpp)
  - [`backend/include/models/Brand.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Brand.hpp)
  - [`backend/include/models/Category.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Category.hpp)

### Mechanism & Domain Contribution
A **Class** serves as an extensible program-code-template for creating objects, providing initial values for state (member variables) and implementations of behavior (member functions). In this system:
- `Product` encapsulates individual store inventory items.
- `Bill` represents an active or finalized customer sales invoice.
- Instances (Objects) are instantiated dynamically or on the stack with deterministic lifecycles.

```cpp
// Instantiating a Perishable product object on the heap
auto milk = std::make_unique<Perishable>(
    1, "AMUL-MLK-001", "Amul Taaza Toned Milk 1L", 1, 2,
    6400, // 64.00 INR stored as 6400 paise
    50,   // initial stock units
    "2026-12-01", // expiry date string
    std::make_unique<PercentageDiscount>(5.0)
);
```

---

## 3. Encapsulation & Data Hiding

### Implementation
- **File:** [`backend/include/models/Product.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Product.hpp)
- **Classes:** `Product`, `StockInfo`

### Mechanism & Domain Contribution
Encapsulation bundles data attributes with the methods that validate and manipulate them, hiding internal state behind a strict private access barrier:
- In `Product`, the attributes `id_`, `sku_`, `name_`, `brandId_`, `categoryId_`, and `priceInPaise_` are strictly `private`.
- Price mutations must pass through `setPriceInPaise(int64_t)`, which validates that currency values are strictly non-negative ($p \ge 0$).
- **Object Composition:** Stock tracking is delegated to a dedicated private component class, `StockInfo`. `StockInfo` encapsulates `quantity_` and `reservedQuantity_`, guarding against negative inventory levels:
```cpp
class StockInfo {
private:
    int quantity_ = 0;
    int reservedQuantity_ = 0;
public:
    void decreaseQuantity(int amount) {
        if (amount < 0) throw std::invalid_argument("Deduction amount cannot be negative");
        if (quantity_ < amount) throw std::runtime_error("Insufficient stock available");
        quantity_ -= amount;
    }
};
```

---

## 4. Abstraction & Interface Contracts

### Implementation
- **Files:**
  - [`backend/include/strategies/IDiscountStrategy.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/strategies/IDiscountStrategy.hpp)
  - [`backend/include/models/Person.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Person.hpp)

### Mechanism & Domain Contribution
Abstraction separates *what* a class does from *how* it achieves it by declaring pure virtual functions (`= 0`):
- `IDiscountStrategy` defines an abstract contract for promotional calculations without committing to a concrete mathematical formula:
```cpp
class IDiscountStrategy {
public:
    virtual ~IDiscountStrategy() = default;
    virtual int64_t calculateDiscount(int64_t unitPriceInPaise) const = 0;
    virtual DiscountType getType() const = 0;
    virtual double getValue() const = 0;
    virtual std::string getDescription() const = 0;
};
```
- Any controller or billing algorithm can compute product discounts through this abstract interface, completely decoupled from specific promotional logic.

---

## 5. Inheritance & Class Hierarchies

### Implementation
- **Files:**
  - Base: [`backend/include/models/Product.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Product.hpp)
  - Derived: [`backend/include/models/Perishable.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Perishable.hpp)
  - Derived: [`backend/include/models/NonPerishable.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/NonPerishable.hpp)

### Mechanism & Domain Contribution
Enables specialized derived classes to inherit shared attributes and behaviors from a generalized base class:
- `Product` encapsulates shared supermarket attributes (`id`, `sku`, `name`, `price`, `stock`, `discount`).
- `Perishable` extends `Product` with an `expiryDate_` string (e.g., milk, fresh produce) and specialized expiry validation.
- `NonPerishable` extends `Product` for shelf-stable goods (e.g., canned foods, staples, cleaning items).

```cpp
class Perishable : public Product {
private:
    std::string expiryDate_;
public:
    Perishable(int id, std::string sku, std::string name, ..., std::string expiryDate)
        : Product(id, std::move(sku), std::move(name), ...), expiryDate_(std::move(expiryDate)) {}

    bool isExpired() const override {
        // Date evaluation logic comparing expiryDate_ against current system timestamp
        return DateUtils::isDatePast(expiryDate_);
    }
};
```

---

## 6. Polymorphism (Dynamic & Static)

### Implementation
- **Dynamic Polymorphism (Virtual Dispatch):** `Product::isExpired() const` and `Product::getProductType() const`
- **Static Polymorphism (Function Overloading):** Multiple constructors on `Product`, `Perishable`, and `BillItem`.

### Mechanism & Domain Contribution
- The base class `Product` declares pure virtual methods:
  ```cpp
  virtual bool isExpired() const = 0;
  virtual ProductType getProductType() const = 0;
  ```
- When iterating through a collection of products via `std::shared_ptr<Product>`, calling `prod->isExpired()` automatically dispatches to `Perishable::isExpired()` or `NonPerishable::isExpired()` at runtime via the virtual method table (vtable).

---

## 7. Virtual Functions & Abstract Classes

### Implementation
- **Files:**
  - [`backend/include/models/Product.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Product.hpp)
  - [`backend/include/strategies/IDiscountStrategy.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/strategies/IDiscountStrategy.hpp)

### Mechanism & Domain Contribution
- An **Abstract Class** is a class that has at least one pure virtual function (`virtual returnType funcName(...) = 0;`). Abstract classes cannot be instantiated directly; they enforce derived classes to implement required interfaces.
- **Virtual Destructors:** The base classes declare `virtual ~Product() = default;` and `virtual ~IDiscountStrategy() = default;`. This guarantees that when a derived object is deleted through a base class pointer (`delete basePtr;`), the complete derived destructor executes, preventing memory and resource leaks.

---

## 8. Function and Operator Overloading

### Implementation
- **Files:**
  - [`backend/include/models/Bill.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Bill.hpp)
  - [`backend/include/models/BillItem.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/BillItem.hpp)

### Overloaded Operators

| Operator | Signature | Domain Functionality |
| :--- | :--- | :--- |
| `Bill::operator+=` | `Bill& operator+=(const BillItem& item)` | Appends a line item to the bill and recalculates total paise. |
| `Bill::operator+` | `Bill operator+(const Bill& other) const` | Combines two customer bills into a consolidated transaction. |
| `Bill::operator==` | `bool operator==(const Bill& other) const` | Tests invoice equality based on unique identifier and bill number. |
| `Bill::operator<` | `bool operator<(const Bill& other) const` | Compares bills by net transaction value (enables `std::sort`). |
| `BillItem::operator+` | `BillItem operator+(const BillItem& other)` | Merges quantities of identical products in the POS cart. |
| `operator<<` | `std::ostream& operator<<(std::ostream&, const Bill&)` | Serializes a thermal-style printed receipt directly to any output stream. |

```cpp
// Example: operator+= in Bill.cpp
Bill& Bill::operator+=(const BillItem& item) {
    items_.push_back(item);
    subtotalPaise_ += item.getLineTotalPaise();
    totalDiscountPaise_ += item.getUnitDiscountPaise() * item.getQuantity();
    finalAmountPaise_ = subtotalPaise_ - totalDiscountPaise_;
    return *this;
}
```

---

## 9. Virtual Inheritance & The Diamond Problem

### Implementation
- **Files:**
  - Base: [`backend/include/models/Person.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Person.hpp)
  - Virtual Branch 1: [`backend/include/models/Employee.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Employee.hpp)
  - Virtual Branch 2: [`backend/include/models/Customer.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Customer.hpp)
  - Derived Apex: [`backend/include/models/Manager.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Manager.hpp)

### Mechanism & Domain Contribution
In retail organizations, a `Manager` is an `Employee` (having staff payroll and shift records) and also a `Customer` (having loyalty club points and purchase privileges). Both inherit from `Person`:

```
        Person (Base: id, name, email)
        /    \
       /      \
  virtual    virtual
  Employee   Customer
       \      /
        \    /
        Manager (Resolved single Person instance)
```

Without **`virtual public Person`**, a `Manager` instance would inherit two conflicting copies of `Person` (leading to compiler ambiguity errors when referencing `getName()`). Virtual inheritance ensures exactly one subobject of `Person` exists inside `Manager`.

---

## 10. Strategy Design Pattern

### Implementation
- **Files:**
  - Interface: [`backend/include/strategies/IDiscountStrategy.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/strategies/IDiscountStrategy.hpp)
  - Concrete: [`backend/include/models/Discount.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Discount.hpp)

### Concrete Strategies Implemented
1. **`NoDiscount`:**
   $$\text{discount} = 0$$
2. **`PercentageDiscount`:**
   $$\text{discount} = \mathrm{round}\left(\text{unitPrice} \times \frac{\text{percentage}}{100.0}\right)$$
3. **`FixedDiscount`:**
   $$\text{discount} = \min(\text{fixedPaise}, \text{unitPrice})$$

Every `Product` holds an `std::unique_ptr<IDiscountStrategy>`. When promotional rules change, the strategy object can be swapped at runtime without altering the `Product` class or recompiling the application.

---

## 11. Repository Pattern

### Implementation
- **Files:**
  - [`backend/include/repositories/ProductRepository.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/repositories/ProductRepository.hpp)
  - [`backend/include/repositories/BillRepository.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/repositories/BillRepository.hpp)
  - [`backend/include/repositories/InventoryRepository.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/repositories/InventoryRepository.hpp)

### Mechanism & Domain Contribution
The **Repository Pattern** mediates between the domain logic layer and the data mapping layer using a collection-like interface for accessing domain objects:
- Controllers and services do not write SQL.
- `ProductRepository::findById(int)` returns an `std::shared_ptr<Product>`.
- Allows future database changes (e.g. migrating from SQLite to PostgreSQL) without changing a single line of business logic.

---

## 12. Generic Programming with Templates

### Implementation
- **Files:**
  - [`backend/include/utils/Repository.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/utils/Repository.hpp)
  - [`backend/include/utils/ApiResponse.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/utils/ApiResponse.hpp)

### Mechanism & Domain Contribution
- **`Repository<T>`:** Defines a generic CRUD interface contract for domain entities:
  ```cpp
  template <typename T>
  class IRepository {
  public:
      virtual ~IRepository() = default;
      virtual std::optional<T> findById(int id) = 0;
      virtual std::vector<T> getAll() = 0;
      virtual int insert(const T& entity) = 0;
  };
  ```
- **`ApiResponse<T>`:** Standardizes REST API response payloads:
  ```cpp
  template <typename T>
  struct ApiResponse {
      bool success;
      std::string message;
      T data;
  };
  ```

---

## 13. Resource Acquisition Is Initialization (RAII)

### Implementation
- **Files:**
  - [`backend/include/database/DatabaseConnection.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/database/DatabaseConnection.hpp)
  - [`backend/include/database/PreparedStatement.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/database/PreparedStatement.hpp)
  - [`backend/include/database/Transaction.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/database/Transaction.hpp)

### Mechanism & Domain Contribution
RAII guarantees that operating system resources and database handles are acquired in constructors and deterministically released in destructors, even during stack unwinding caused by unexpected exceptions:
```cpp
class Transaction {
    DatabaseConnection& db_;
    bool committed_ = false;
public:
    explicit Transaction(DatabaseConnection& db) : db_(db) { db_.execute("BEGIN TRANSACTION;"); }
    void commit() { db_.execute("COMMIT;"); committed_ = true; }
    ~Transaction() {
        if (!committed_) {
            try { db_.execute("ROLLBACK;"); } catch (...) {}
        }
    }
};
```
If a stock deduction fails or an exception is thrown mid-checkout, `~Transaction()` executes `ROLLBACK` automatically, preventing database corruption.

---

## 14. Exception Handling Architecture & Polymorphic Domain Hierarchy

### Implementation
- **Header:** [`backend/include/utils/Exceptions.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/utils/Exceptions.hpp)
- **Applied In:**
  - [`backend/include/models/Discount.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Discount.hpp) & [`backend/src/models/Discount.cpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/src/models/Discount.cpp)
  - [`backend/include/models/Product.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Product.hpp) & [`backend/src/models/Product.cpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/src/models/Product.cpp)
  - [`backend/src/repositories/BillRepository.cpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/src/repositories/BillRepository.cpp)
  - [`backend/src/repositories/ProductBatchRepository.cpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/src/repositories/ProductBatchRepository.cpp)
  - [`backend/include/controllers/CartController.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/controllers/CartController.hpp)
  - [`backend/include/controllers/BillController.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/controllers/BillController.hpp)
  - [`backend/include/controllers/ProductController.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/controllers/ProductController.hpp)

---

### Class Hierarchy & Multiple Inheritance Diagram

The system employs a custom **Polymorphic Domain Exception Hierarchy** that seamlessly bridges standard C++ runtime/logic exceptions with an abstract domain interface:

```text
                     std::exception
                      ▲          ▲
                      │          │
        std::logic_error        std::runtime_error       ISupermarketException
              ▲                        ▲                  (Abstract Interface)
              │                        │                  [virtual what() = 0]
      std::invalid_argument            │                           ▲
         ▲              ▲              │                           │
         │              │              │                           │
         │   ┌──────────┴──────────────┼───────────────────────────┤
         │   │                         │                           │
         │   │              SupermarketException ──────────────────┘
         │   │
         │   └────── InvalidDiscountException ─────────────────────┐
         │                                                         │
         └────────── InvalidQuantityException ─────────────────────┤
                                                                   │
                            InsufficientStockException ────────────┘
```

```cpp
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
 * Inherits from std::invalid_argument (logic error) and ISupermarketException.
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
 * Inherits from std::runtime_error and ISupermarketException.
 * Fully encapsulates state: requested units, available units, and target product name.
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
 * Inherits from std::invalid_argument and ISupermarketException.
 */
class InvalidDiscountException : public std::invalid_argument, public ISupermarketException {
public:
    explicit InvalidDiscountException(const std::string& message)
        : std::invalid_argument(message) {}

    const char* what() const noexcept override {
        return std::invalid_argument::what();
    }
};
```

---

### Mapping to Core OOP Tenets

1. **Abstraction:**
   - `ISupermarketException` serves as a pure abstract contract (`interface`).
   - It specifies the pure virtual signature `virtual const char* what() const noexcept = 0;` and a virtual destructor `virtual ~ISupermarketException() = default;`, requiring all concrete domain exceptions to provide an explanatory error message without mandating specific internal member variables.

2. **Multiple Inheritance:**
   - Concrete exceptions like `InvalidQuantityException` and `InsufficientStockException` use C++ multiple inheritance:
     $$\text{InvalidQuantityException} \to (\text{std::invalid\_argument},\, \text{ISupermarketException})$$
     $$\text{InsufficientStockException} \to (\text{std::runtime\_error},\, \text{ISupermarketException})$$
   - This architectural choice ensures backward compatibility with standard STL exception handlers (`catch (const std::exception& e)`) while simultaneously allowing fine-grained, domain-specific polymorphic catches (`catch (const ISupermarketException& e)`).

3. **Polymorphism & Dynamic Dispatch:**
   - Handlers in Crow REST API controllers leverage dynamic dispatch via vtables. Catching by base reference invokes the correct overridden `what()` method:
   ```cpp
   try {
       // Domain operations (cart reserve, bill checkout, batch intake)
   } catch (const InsufficientStockException& e) {
       // Access rich encapsulated telemetry
       logTelemetry(e.getProductName(), e.getRequested(), e.getAvailable());
       return ControllerUtils::errorResponse(400, e.what(), allowedOrigin);
   } catch (const ISupermarketException& e) {
       // Polymorphic catch for any supermarket domain exception
       return ControllerUtils::errorResponse(400, e.what(), allowedOrigin);
   } catch (const std::exception& e) {
       // Catch-all for standard runtime/logic exceptions
       return ControllerUtils::errorResponse(500, e.what(), allowedOrigin);
   }
   ```

4. **Encapsulation:**
   - In `InsufficientStockException`, the attributes `requested`, `available`, and `productName` are declared strictly `private`.
   - External callers and telemetry middleware query state exclusively via immutable const member functions: `getRequested()`, `getAvailable()`, and `getProductName()`. The internal formatting of the diagnostic string remains completely decoupled from caller logic.

---

### Strict Boundary & Exception Validations

The domain layer enforces strict mathematical boundaries across all business operations:

1. **Strict Quantity Bounds:**
   - Zero or negative quantities ($q \le 0$) are strictly prohibited in `CartController`, `ProductController`, `BillRepository`, and `ProductBatchRepository`.
   - Any attempt to add $\le 0$ items to a cart or invoice instantly throws `InvalidQuantityException`, mapped to HTTP `400 Bad Request`.
2. **Available Stock Protection:**
   - Before any deduction occurs, `ProductRepository` and `BillRepository` check:
     $$\text{requested} \le \text{availableStock}$$
   - If stock is insufficient, an `InsufficientStockException` is thrown, aborting the transaction before any database mutations occur.
3. **Discount Bounds & Price Clamping:**
   - Percentage discounts must satisfy:
     $$0.0\% \le \text{discountPercent} \le 100.0\%$$
     Values outside this range throw `InvalidDiscountException`.
   - Fixed cash discounts must satisfy:
     $$\text{discountPaise} \ge 0$$
   - **Clamping Guarantee:** The final discounted unit price is mathematically clamped at zero:
     $$\text{finalUnitPricePaise} = \max\bigl(0\text{ paise},\, \text{unitPricePaise} - \text{discountPaise}\bigr)$$
     Unit prices and invoice totals can **never become negative**, even if a fixed promotional coupon exceeds the item's base shelf price.

---

## 15. Run-Time Type Information (RTTI)

### Implementation
- **Files:**
  - [`backend/src/repositories/ProductRepository.cpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/src/repositories/ProductRepository.cpp)
  - [`backend/include/controllers/ProductController.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/controllers/ProductController.hpp)

### Mechanism & Domain Contribution
When persisting or serializing a generic `Product` reference, `dynamic_cast` safely inspects the underlying concrete type:
```cpp
const auto* perishable = dynamic_cast<const Perishable*>(&product);
if (perishable) {
    expiryDate = perishable->getExpiry();
}
```
If the instance is not a `Perishable` product, `dynamic_cast` evaluates safely to `nullptr` without crashing.

---

## 16. Static Members & Encapsulated Utilities

### Implementation
- `DatabaseMigrator::migrate(DatabaseConnection&)` in [`backend/include/database/DatabaseMigrator.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/database/DatabaseMigrator.hpp)
- `ServerConfig::loadFromEnvironment()` in [`backend/include/server/ServerConfig.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/server/ServerConfig.hpp)
- `ControllerUtils::successResponse(...)` in [`backend/include/controllers/ControllerUtils.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/controllers/ControllerUtils.hpp)

Static methods provide stateless domain utilities without requiring object instantiation.

---

## 17. Friend Functions & Stream Insertion

### Implementation
- Declared in [`backend/include/models/Bill.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Bill.hpp)
- Declared in [`backend/include/models/BillItem.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/BillItem.hpp)

### Mechanism & Domain Contribution
Stream insertion operators (`operator<<`) are declared as friends of `Bill` and `BillItem`, granting the non-member stream function direct access to private financial totals and line-item vectors for formatted receipt printing.
