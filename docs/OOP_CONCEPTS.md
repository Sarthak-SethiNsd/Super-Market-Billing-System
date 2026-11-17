# Object-Oriented Programming (OOP) Implementation Guide

## Table of Contents
- [1. Introduction](#1-introduction)
- [2. Encapsulation & Information Hiding](#2-encapsulation-information-hiding)
- [3. Abstraction & Interface Contracts](#3-abstraction-interface-contracts)
- [4. Inheritance & Class Hierarchies](#4-inheritance-class-hierarchies)
- [5. Polymorphism (Static & Dynamic)](#5-polymorphism-static-dynamic)
- [6. Virtual Inheritance & The Diamond Problem](#6-virtual-inheritance-the-diamond-problem)
- [7. Strategy Design Pattern](#7-strategy-design-pattern)
- [8. Operator Overloading & Stream Semantics](#8-operator-overloading-stream-semantics)
- [9. Generic Programming with Templates](#9-generic-programming-with-templates)
- [10. Resource Acquisition Is Initialization (RAII)](#10-resource-acquisition-is-initialization-raii)
- [11. Exception Handling Hierarchy](#11-exception-handling-hierarchy)
- [12. Run-Time Type Information (RTTI)](#12-run-time-type-information-rtti)
- [13. Static Members & Utility Encapsulation](#13-static-members-utility-encapsulation)
- [14. Friend Functions & Stream Insertion](#14-friend-functions-stream-insertion)

---

## 1. Introduction

The **Supermarket Billing & Inventory Management System** was engineered to serve as a comprehensive, textbook-grade demonstration of Object-Oriented Programming in C++17. Every OOP mechanism implemented in this codebase serves an authentic operational function in the supermarket domain.

---

## 2. Encapsulation & Information Hiding

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

## 3. Abstraction & Interface Contracts

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

## 4. Inheritance & Class Hierarchies

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

---

## 5. Polymorphism (Static & Dynamic)

### Implementation
- **Dynamic Polymorphism (Virtual Dispatch):** `Product::isExpired() const` and `Product::getProductType() const`
- **Static Polymorphism (Function Overloading):** Multiple constructors on `Product`, `Perishable`, and `BillRecord`.

### Mechanism & Domain Contribution
- The base class `Product` declares:
  ```cpp
  virtual bool isExpired() const = 0;
  virtual ProductType getProductType() const = 0;
  ```
- When iterating through a heterogeneous collection of products via `std::shared_ptr<Product>`, calling `prod->isExpired()` automatically dispatches to `Perishable::isExpired()` (which checks the calendar date against `expiryDate_`) or `NonPerishable::isExpired()` (which always returns `false`) at runtime via the virtual method table (vtable).

---

## 6. Virtual Inheritance & The Diamond Problem

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

## 7. Strategy Design Pattern

### Implementation
- **Files:**  
  - Interface: [`backend/include/strategies/IDiscountStrategy.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/strategies/IDiscountStrategy.hpp)
  - Concrete: [`backend/include/models/Discount.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Discount.hpp)

### Concrete Strategies Implemented
1. **`NoDiscount`:**
   $$\text{discount} = 0$$
2. **`PercentageDiscount`:**
   $$\text{discount} = \mathrm{round}\left(\text{unitPrice} \times \frac{\text{percentage}}{100.0}\right)$$
3. **`FixedAmountDiscount`:**
   $$\text{discount} = \min(\text{fixedPaise}, \text{unitPrice})$$

Every `Product` holds an `std::shared_ptr<IDiscountStrategy>`. When promotional rules change, the strategy object can be swapped at runtime without altering the `Product` class or recompiling the application.

---

## 8. Operator Overloading & Stream Semantics

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

---

## 9. Generic Programming with Templates

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

## 10. Resource Acquisition Is Initialization (RAII)

### Implementation
- **Files:**  
  - [`backend/include/database/DatabaseConnection.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/database/DatabaseConnection.hpp)
  - [`backend/include/database/PreparedStatement.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/database/PreparedStatement.hpp)
  - [`backend/include/database/Transaction.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/database/Transaction.hpp)

### Mechanism & Domain Contribution
RAII guarantees that operating system resources and database handles are acquired in constructors and deterministically released in destructors, even during stack unwinding caused by unexpected exceptions:
- **`Transaction`:**
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

## 11. Exception Handling Hierarchy

### Implementation
The system utilizes standard C++ exception hierarchies (`<stdexcept>`), third-party parsing exceptions (`nlohmann::json::exception`), and RAII transaction guards to guarantee error safety, input contract validation, and clean stack unwinding without custom boilerplate classes:

- **Files:**
  - [`backend/src/models/Product.cpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/src/models/Product.cpp)
  - [`backend/src/models/Bill.cpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/src/models/Bill.cpp)
  - [`backend/src/models/BillItem.cpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/src/models/BillItem.cpp)
  - [`backend/src/models/Discount.cpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/src/models/Discount.cpp)
  - [`backend/src/database/DatabaseConnection.cpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/src/database/DatabaseConnection.cpp)
  - [`backend/src/database/PreparedStatement.cpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/src/database/PreparedStatement.cpp)
  - [`backend/src/repositories/BillRepository.cpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/src/repositories/BillRepository.cpp)
  - [`backend/include/controllers/ProductController.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/controllers/ProductController.hpp)
  - [`backend/include/controllers/BillController.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/controllers/BillController.hpp)

### Exception Taxonomy
```
std::exception (polymorphic base class)
  ├── std::logic_error
  │     └── std::invalid_argument     (Domain contract & input validation failures)
  ├── std::runtime_error             (Operational failures, stock depletion & SQLite errors)
  └── nlohmann::json::exception      (JSON schema parsing & payload deserialization errors)
```

### Mechanism & Domain Contribution
1. **Domain Contract & Precondition Validation (`std::invalid_argument`):**
   - **Inheritance:** Derived from `std::logic_error` $\to$ `std::exception`.
   - **Where Thrown:** Domain constructors and mutators enforce strict business constraints:
     - `Product.cpp`: Thrown when constructing a product with negative price or negative initial stock, or when attempting to mutate price to a negative value.
     - `BillItem.cpp`: Thrown when initializing a line item with non-positive quantity ($q \le 0$) or negative unit price.
     - `Discount.cpp`: Thrown when configuring percentage discount rates outside $[0.0, 100.0]$ or negative fixed discounts.
     - `ProductController.hpp`: Thrown when parsing malformed or out-of-range discount payloads.
   - **Where Handled:** Caught in Crow REST route handlers (`ProductController`, `BillController`, `InventoryController`) and translated to client HTTP 400 Bad Request responses with explanatory error messages.

2. **Operational & State Invariant Protection (`std::runtime_error`):**
   - **Inheritance:** Derived from `std::exception`.
   - **Where Thrown:** Operational checks and persistence layers detect invalid state transitions at runtime:
     - `Product::reduceStock`: Thrown (`"Not enough stock for product: ..."`) when an inventory decrement exceeds currently available units.
     - `BillRepository::createBill`: Thrown (`"Insufficient stock for product ID ..."`) during checkout if available units drop before atomic insertion.
     - `DatabaseConnection.cpp` & `PreparedStatement.cpp`: Thrown (`"Failed to execute query: ..."`) when SQLite database operations fail, wrapping native `sqlite3_errmsg()`.
   - **Where Handled:** Caught in Crow request handlers and translated into HTTP 409 Conflict (e.g., transaction rejected due to concurrent stock depletion) or HTTP 500 Internal Server Error for unrecoverable database failures.

3. **Malformed Request Protection (`nlohmann::json::exception`):**
   - **Inheritance:** Derived from `std::exception`.
   - **Where Handled:** Caught explicitly by Crow controllers when client bodies contain invalid JSON syntax or mismatched field types, returning HTTP 400 Bad Request without terminating the backend process.

4. **Exception Safety & RAII Stack Unwinding:**
   - When an exception propagates during multi-step operations (e.g., creating a bill with several line items), RAII destructors run deterministically during stack unwinding. The `Transaction::~Transaction()` guard guarantees that any uncommitted database transaction rolls back automatically, preventing orphaned financial records or partial stock deductions.

---

## 12. Run-Time Type Information (RTTI)

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

## 13. Static Members & Utility Encapsulation

### Implementation
- `DatabaseMigrator::migrate(DatabaseConnection&)` in [`backend/include/database/DatabaseMigrator.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/database/DatabaseMigrator.hpp)
- `ServerConfig::loadFromEnvironment()` in [`backend/include/server/ServerConfig.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/server/ServerConfig.hpp)
- `ControllerUtils::successResponse(...)` in [`backend/include/controllers/ControllerUtils.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/controllers/ControllerUtils.hpp)

Static methods provide stateless domain utilities without requiring object instantiation.

---

## 14. Friend Functions & Stream Insertion

### Implementation
- Declared in [`backend/include/models/Bill.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/Bill.hpp)
- Declared in [`backend/include/models/BillItem.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/models/BillItem.hpp)

### Mechanism & Domain Contribution
Stream insertion operators (`operator<<`) are declared as friends of `Bill` and `BillItem`, granting the non-member stream function direct access to private financial totals and line-item vectors for formatted receipt printing.
