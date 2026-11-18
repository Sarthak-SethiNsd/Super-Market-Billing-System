# Viva Preparation & Technical Defense Guide: Supermarket Management System

**Course:** Object-Oriented Programming in C++ (CS201 / Sem III Lab)
**Project:** Supermarket Billing & Inventory Management System (ApexMart)

---

## Table of Contents
1. [2–3 Minute Project Summary (Elevator Pitch)](#1-23-minute-project-summary-elevator-pitch)
2. [Section 1: C++ OOP Questions (Based on Source Code)](#2-section-1-c-oop-questions-based-on-source-code)
3. [Section 2: Database & SQL Persistence Questions](#3-section-2-database--sql-persistence-questions)
4. [Section 3: API & Client-Server Architecture Questions](#4-section-3-api--client-server-architecture-questions)
5. [Section 4: Authentication & Security Questions](#5-section-4-authentication--security-questions)
6. [Section 5: Billing, Currency & Inventory Logic Questions](#6-section-5-billing-currency--inventory-logic-questions)
7. [Section 6: Architectural Decision Defense (10 "Why" Questions)](#7-section-6-architectural-decision-defense-10-why-questions)

---

## 1. 2–3 Minute Project Summary (Elevator Pitch)

> *"Good morning, examiners. Our project is the **Supermarket Billing and Inventory Management System (ApexMart)**. It bridges classical Object-Oriented Programming in C++17 with an enterprise web architecture.
>
> The project addresses the major flaws of legacy academic billing programs: data corruption from non-transactional text files, rounding errors from floating-point arithmetic, and monolithic console lock-in.
>
> We engineered the system as a decoupled client-server application. The backend is a high-performance **C++17 microservice** built on the **Crow web framework** and **Standalone Asio**, with an embedded **SQLite3** persistence engine running in Write-Ahead Logging mode. The frontend is a responsive **React 19, TypeScript 5, and Tailwind CSS Single-Page Application**.
>
> The system operates under **strictly two user modes**:
> 1. **Customer Mode:** An open, unauthenticated public portal where customers browse active retail products, view live shelf prices, add items to a self-service shopping cart, perform atomic checkouts, and print 80mm thermal receipts.
> 2. **Staff Mode:** A password-protected operational portal secured by **PBKDF2-HMAC-SHA256 cryptography**. Authenticated staff have full access to an operational KPI dashboard, product catalog management, manual stock adjustments with audit logging, and historical transaction ledgers.
>
> All core OOP principles are deeply embedded in real business logic:
> - **Polymorphism** and the **Strategy Pattern** dynamically compute percentage and fixed promotional discounts without modifying product classes.
> - **Virtual Inheritance** resolves the Diamond Problem when modeling organizational roles like `Manager`, who inherits from both `Employee` and `Customer`.
> - **RAII** guarantees transaction safety through our `Transaction` class, which automatically rolls back SQLite operations if an exception occurs during checkout.
> - **Operator Overloading** simplifies shopping cart aggregation with `operator+=` and stream receipt formatting with `operator<<`.
> - Financial calculations strictly use **64-bit integer paise**, completely eliminating floating-point drift.
>
> All 39 automated CTest test cases across 5 test suites pass at 100%, and the frontend builds cleanly with zero TypeScript errors. The original academic console file at `Supermarket_billing_System/1.cpp` remains untouched as our baseline."*

---

## 2. Section 1: C++ OOP Questions (Based on Source Code)

### Q1: How is Encapsulation implemented in your project?
**Answer:** Encapsulation is implemented across all domain models, notably in `Product.hpp` and `StockInfo.hpp`. Data members (`id_`, `sku_`, `priceInPaise_`, `quantity_`) are `private`. State mutations occur strictly through public member functions (`setPriceInPaise`, `decreaseQuantity`) that validate business invariants. For example, `StockInfo::decreaseQuantity(int amount)` checks if `amount < 0` or if `quantity_ < amount`, throwing an exception rather than allowing invalid or negative stock states.

### Q2: What is the difference between Abstraction and Encapsulation in your codebase?
**Answer:** Encapsulation hides internal data and bundles it with methods (e.g., `Product` wrapping `priceInPaise_` and validating bounds). Abstraction hides *implementation complexity* by defining interface contracts using pure virtual functions. For example, `IDiscountStrategy.hpp` defines an abstract interface `calculateDiscount(int64_t)` without exposing whether the calculation uses percentage math, fixed deductions, or promo rules.

### Q3: Where did you use dynamic polymorphism and virtual functions?
**Answer:** In `Product.hpp`, the methods `virtual bool isExpired() const = 0` and `virtual ProductType getProductType() const = 0` are pure virtual. The derived classes `Perishable` and `NonPerishable` override them. When calling `product->isExpired()` on an `std::shared_ptr<Product>`, dynamic dispatch through the vtable executes `Perishable::isExpired()` (which checks the calendar expiry date) or `NonPerishable::isExpired()` (which always returns false).

### Q4: Why do your abstract base classes have virtual destructors?
**Answer:** In classes like `Product` and `IDiscountStrategy`, we declare `virtual ~Product() = default;`. If a derived object (e.g., `Perishable`) is allocated on the heap and deleted via a base class pointer (`std::unique_ptr<Product>`), a non-virtual destructor would invoke only the base class destructor, leaking derived class members. A virtual destructor ensures the derived destructor executes first, followed by base class cleanup.

### Q5: What is the Diamond Problem and how did you resolve it?
**Answer:** The Diamond Problem occurs in multiple inheritance when a class inherits from two classes that share a common base class. In our store model (`Manager.hpp`), `Manager` inherits from both `Employee` and `Customer`, both of which inherit from `Person`. Without virtual inheritance, `Manager` would contain two separate instances of `Person`, causing compiler ambiguity when calling `person->getName()`. We resolved this using **virtual inheritance**:
`class Employee : virtual public Person` and `class Customer : virtual public Person`. This guarantees that `Manager` contains only a single shared instance of `Person`.

### Q6: How is the Strategy Design Pattern implemented?
**Answer:** In `IDiscountStrategy.hpp` and `Discount.hpp`. The abstract strategy interface `IDiscountStrategy` declares `calculateDiscount(int64_t unitPrice)`. Three concrete strategy classes implement it: `NoDiscount`, `PercentageDiscount`, and `FixedDiscount`. Every `Product` holds an `std::unique_ptr<IDiscountStrategy>`. When a promotion changes, we simply swap the strategy pointer at runtime without altering the `Product` class or recompiling.

### Q7: Which operators did you overload and why?
**Answer:** In `Bill.hpp` and `BillItem.hpp`:
- `Bill::operator+=`: Appends a `BillItem` to the bill, automatically adding line totals to `subtotalPaise_`, updating discounts, and recalculating `finalAmountPaise_`.
- `Bill::operator+`: Combines two customer bills into a consolidated invoice.
- `Bill::operator==`: Compares invoices by bill number and ID.
- `Bill::operator<`: Compares bills by net transaction value (enabling `std::sort`).
- `operator<<`: Overloaded friend stream insertion operator that formats and prints an itemized thermal receipt directly to `std::cout` or a file stream.

### Q8: What is RAII and where is it used?
**Answer:** RAII stands for *Resource Acquisition Is Initialization*. It binds resource lifecycles to object scope. We use it in:
1. `Transaction.hpp`: Acquires an SQLite transaction (`BEGIN TRANSACTION;`) in the constructor. If `commit()` is not explicitly called before the destructor runs (e.g., during exception stack unwinding), the destructor automatically executes `ROLLBACK;`.
2. `PreparedStatement.hpp`: Allocates an SQLite statement handle in the constructor and calls `sqlite3_finalize()` in the destructor.
3. Smart pointers (`std::unique_ptr`, `std::shared_ptr`): Automatically delete heap-allocated memory when out of scope.

### Q9: How do you handle exceptions in C++?
**Answer:** We use standard C++ exception hierarchies (`<stdexcept>`). Input errors throw `std::invalid_argument` (e.g., negative prices, zero quantities). Operational failures throw `std::runtime_error` (e.g., stock depletion, SQLite constraint violations). Controllers wrap operations in `try-catch` blocks, catch these exceptions, and translate them to meaningful HTTP error responses (400 Bad Request, 409 Conflict, 500 Internal Error) without crashing the server.

### Q10: Where did you use C++ templates?
**Answer:** In `Repository.hpp`, where `IRepository<T>` defines generic CRUD operations (`findById`, `getAll`, `insert`) parameterized over entity type `T`. Also in `ApiResponse<T>` to standardize JSON response wrappers across different payload data types.

---

## 3. Section 2: Database & SQL Persistence Questions

### Q11: Why did you choose SQLite over raw text files?
**Answer:** Text files provide zero concurrency, lack transaction isolation, and risk complete corruption if a crash occurs mid-write. SQLite provides full ACID compliance, atomic multi-statement transactions, relational integrity with foreign keys, index-accelerated query performance, and Write-Ahead Logging (WAL) for concurrent read access.

### Q12: What is Write-Ahead Logging (WAL) mode?
**Answer:** By executing `PRAGMA journal_mode = WAL;`, changes are appended to a separate `-wal` file instead of directly modifying the main database file. This allows multiple concurrent readers (e.g., customers browsing products) to access the database without waiting for or blocking an active write transaction (e.g., checkout).

### Q13: Explain the `bill_items` table snapshot architecture.
**Answer:** In retail databases, products change over time—prices increase, names change, or products are discontinued. If `bill_items` only stored a foreign key `product_id`, looking up an old invoice would display current prices rather than what the customer paid. Therefore, `bill_items` takes an immutable historical snapshot: it stores `product_name`, `brand_name`, `unit_price_paise`, `discount_type`, and `final_unit_price_paise` frozen at the exact second of purchase.

### Q14: How does your database prevent negative stock levels?
**Answer:** We use two independent layers of protection:
1. **Application Layer:** `StockInfo::decreaseQuantity()` validates available stock before writing to SQLite and throws an exception if requested units exceed stock.
2. **Database Layer:** The `products` table defines an SQLite table constraint: `stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)`. If any concurrent process attempts to reduce stock below zero, SQLite rejects the query with a constraint violation.

### Q15: How does database migration work in your project?
**Answer:** In `DatabaseMigrator.cpp`, we inspect SQLite's internal version register using `PRAGMA user_version`. If the version is less than 4, it executes sequential forward migrations (creating base tables $\to$ users table $\to$ customers table $\to$ category_brands junction table) inside an atomic `Transaction` and increments `PRAGMA user_version`. This guarantees safe, automatic schema upgrades without data loss.

### Q16: What is the purpose of the `category_brands` junction table?
**Answer:** A category can feature multiple brands (e.g., "Dairy" includes Amul, Mother Dairy, Britannia), and a brand can produce items across multiple categories (e.g., Amul produces Milk, Butter, Ice Cream). The `category_brands` table implements a normalized Many-to-Many ($M:N$) relationship with foreign keys and a `UNIQUE(category_id, brand_id)` constraint.

---

## 4. Section 3: API & Client-Server Architecture Questions

### Q17: What framework powers your backend REST API?
**Answer:** The **Crow C++ microframework** (`v1.3.4`). Crow is a header-only C++17 web framework inspired by Python's Flask. It utilizes Standalone Asio for event-driven asynchronous I/O and non-blocking socket handling, making it lightweight and fast.

### Q18: How does the frontend communicate with the C++ backend?
**Answer:** The React frontend makes asynchronous HTTP requests using `axios` over port `8080`. Payloads are formatted as standard JSON. The C++ Crow backend parses incoming JSON using `nlohmann::json` and serializes C++ domain models back into JSON responses.

### Q19: What is Cross-Origin Resource Sharing (CORS) and how did you configure it?
**Answer:** CORS is a browser security mechanism that restricts a web application at one origin (`http://localhost:5173`) from making requests to a different origin (`http://localhost:8080`). We configured CORS middleware in Crow (`AppServer.hpp`) to send `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers` headers.

### Q20: What are the two operating modes in your system?
**Answer:**
1. **CUSTOMER MODE:** Default unauthenticated mode. Customers can browse active products, inspect shelf prices, manage a shopping cart, perform checkout, and print receipts. They cannot access management analytics, inventory adjustments, or catalog CRUD.
2. **STAFF MODE:** Password-authenticated mode. Entering the staff password unlocks the complete management dashboard, inventory intake/write-offs, product creation/editing, and historical transaction ledgers.

---

## 5. Section 4: Authentication & Security Questions

### Q21: What cryptographic algorithm did you use for password hashing?
**Answer:** We implemented **PBKDF2-HMAC-SHA256** (Password-Based Key Derivation Function 2) with **100,000 iterations** and a **128-bit cryptographically secure random salt**. It is implemented using Windows CNG (`<bcrypt.h>`) on Windows and OpenSSL 3.x (`EVP_PBE_scrypt` / `PKCS5_PBKDF2_HMAC`) on Linux.

### Q22: Why is PBKDF2 superior to MD5 or plain SHA-256?
**Answer:** MD5 and single-iteration SHA-256 are extremely fast, making them vulnerable to rainbow table attacks and brute-force GPU cracking. PBKDF2 applies 100,000 iterations of HMAC-SHA256 with a unique random salt, deliberately increasing computational cost and completely neutralizing precomputed rainbow tables.

### Q23: How are staff sessions managed?
**Answer:** Upon successful password verification at `POST /api/auth/staff/login`, `AuthService` generates a random session token string (prefixed with `sms_staff_`) and stores it in an in-memory session map with a 24-hour expiration timestamp. The frontend stores this token in browser session storage and transmits it in the HTTP `Authorization: Bearer <token>` header for management requests.

### Q24: What happens if an unauthenticated customer calls a staff endpoint?
**Answer:** The controller utility function `requireStaff(req, authService)` intercepts the request. If the `Authorization` header is missing or the token is invalid/expired, it immediately aborts request execution and returns **HTTP 401 Unauthorized** with `{"error": "Staff authentication required"}`.

### Q25: How does logging out work?
**Answer:** The staff member clicks "Exit Staff", sending a request to `POST /api/auth/logout`. The backend invalidates the token in `AuthService`, and the frontend removes the token from storage, immediately switching the interface back to Customer Mode.

---

## 6. Section 5: Billing, Currency & Inventory Logic Questions

### Q26: Why do you store currency in integer paise instead of floating-point rupees?
**Answer:** Binary floating-point numbers (`float`, `double`) cannot accurately represent decimal fractions like $0.10$ or $0.20$ due to base-2 IEEE-754 representation ($0.1 + 0.2 = 0.30000000000000004$). In retail systems handling thousands of transactions, fractional rounding errors accumulate into significant financial discrepancies. Storing all prices, discounts, and totals as 64-bit signed integers in paise ($\text{INR } 1.00 = 100\text{ paise}$) guarantees mathematical precision with zero rounding drift.

### Q27: How does an atomic checkout work during Point-of-Sale billing?
**Answer:** In `BillingService::createBill()`:
1. An explicit `Transaction tx(dbConnection)` is instantiated.
2. The system queries each requested item, validates active status, and confirms current stock $\ge$ requested quantity.
3. If stock is insufficient, an exception is thrown, immediately triggering the `Transaction` RAII destructor to roll back.
4. If valid, the invoice header is inserted into `bills`.
5. For each item, a snapshot is inserted into `bill_items`, store stock is decremented in `products`, and an audit entry is logged in `inventory_movements`.
6. `tx.commit()` commits all operations permanently.

### Q28: What is the `inventory_movements` table and why is it append-only?
**Answer:** `inventory_movements` provides an immutable audit trail for inventory compliance. It records every stock shift with `movement_type` (`ADDITION`, `REDUCTION`, `SALE`, `ADJUSTMENT`), `quantity_change`, `previous_stock`, `new_stock`, and a timestamp. Records are strictly inserted and never updated or deleted, providing complete traceability for loss prevention and inventory audits.

### Q29: What is the difference between soft delete and hard delete in product management?
**Answer:** Hard delete (`DELETE FROM products WHERE id = ?`) destroys the row. If historical invoices reference that `product_id`, foreign keys break or historical reporting fails. Instead, we use **soft delete**: setting `is_active = 0`. The product disappears from the customer-facing catalog and POS terminal, but historical bills retain their relational integrity.

### Q30: How are perishable products handled differently from non-perishable products?
**Answer:** Perishable products inherit from `Product` via `Perishable.hpp` and store an `expiryDate_`. The frontend highlights them with **Perishable** badges and displays expiry countdowns. In inventory audits, staff can identify expired batches and execute a manual `REDUCTION` stock adjustment with the reason `"Expired stock write-off"`.

---

## 7. Section 6: Architectural Decision Defense (10 "Why" Questions)

### Q31: Why did you separate the system into a C++ backend and a React frontend instead of keeping it as a monolithic C++ GUI (e.g., Qt) or console app?
**Answer:** Monolithic desktop apps require local platform compilation and installation on every terminal. A decoupled web architecture allows the C++ backend to run as a high-performance native service (on a central store server or cloud container) while multiple browser terminals—cashier POS registers, mobile customer browsers, and manager tablets—can access it simultaneously without client installation.

### Q32: Why did you decide on strictly TWO modes (Customer and Staff) rather than three (Customer, Cashier, Admin)?
**Answer:** Real-world retail operations demonstrated that separating Cashier from Admin added redundant password prompts and permission barriers without operational benefit for a single-store supermarket. A clean two-mode architecture provides the exact required distinction: public self-service customer access vs. full management staff operations.

### Q33: Why did you preserve the original `Supermarket_billing_System/1.cpp` unmodified?
**Answer:** Preserving `1.cpp` untouched at the workspace root maintains academic integrity. It allows examiners to directly inspect the original console submission baseline and verify the contrast with the modern enterprise system engineered in `Supermarket_Management_System/`.

### Q34: Why did you implement your own SQLite wrapper classes (`DatabaseConnection`, `PreparedStatement`, `Transaction`) instead of using an ORM?
**Answer:** Heavy C++ ORMs introduce substantial external dependencies, obscure SQL execution, and complicate compilation. Authoring our own lightweight RAII wrappers demonstrated direct mastery of C++ resource management, statement finalization, and explicit transaction control while keeping build times fast.

### Q35: Why did you use `std::unique_ptr` for discount strategies rather than raw pointers?
**Answer:** Raw pointers require manual `delete` calls, risking memory leaks if exceptions occur or if developers forget cleanup. `std::unique_ptr` enforces exclusive ownership and automatically frees heap-allocated strategy objects as soon as the enclosing `Product` is destroyed.

### Q36: Why did you choose CMake over proprietary IDE project files (e.g., `.vcxproj`)?
**Answer:** CMake is the cross-platform industry standard for C++. A single `CMakeLists.txt` file allows the project to be compiled identically under Visual Studio MSVC on Windows and GCC/Clang on Linux, enabling containerized Docker deployment without maintaining multiple IDE configurations.

### Q37: Why did you use Tailwind CSS instead of raw CSS or heavyweight component libraries?
**Answer:** Tailwind CSS provides utility-first styling with zero runtime overhead. It allowed us to design a responsive, mobile-first supermarket interface with compact KPI cards, custom receipt print styling (`@media print`), and clean dark/light UI accents while compiling into a minified, lightweight CSS bundle.

### Q38: Why do you store the staff token in browser memory / session storage rather than an insecure long-lived cookie?
**Answer:** Session storage isolates the token to the active browser tab session. Closing the browser window automatically revokes management access on the client side, preventing unauthorized access on shared supermarket terminal computers.

### Q39: Why did you include automated CTest suites in an academic OOP project?
**Answer:** Manual testing is subjective and error-prone. Automated CTest suites provide mathematical proof of system correctness, executing 39 unit and integration assertions across discount bounds, stock underflow prevention, domain exception handling, and REST API access controls in under 4 seconds.

### Q40: Why is integer division postponed until UI formatting?
**Answer:** Performing division early (e.g., calculating unit prices as rupees with decimals) introduces fractional remainders that accumulate over multi-item multiplications. Keeping all arithmetic in integer paise until the final display string generation ensures exact integer mathematical precision throughout the entire calculation pipeline.

---

## 8. Section 7: Recent Advanced Architecture & Feature Defenses

### Q41: How is the Polymorphic C++ Domain Exception Hierarchy designed and how does it map to core OOP concepts?
**Answer:** In `backend/include/utils/Exceptions.hpp`, we defined a custom exception taxonomy:
- **Abstraction:** Pure virtual base interface `ISupermarketException` declaring `virtual const char* what() const noexcept = 0;` and a virtual destructor.
- **Multiple Inheritance:** Concrete exceptions inherit from standard library exception classes (`std::invalid_argument` for input/contract failures, `std::runtime_error` for runtime/stock failures) AND `ISupermarketException`.
- **Polymorphism:** Catch blocks in API controllers can catch by `const ISupermarketException&`, invoking dynamic dispatch on `what()` across `InvalidQuantityException`, `InsufficientStockException`, and `InvalidDiscountException`.
- **Encapsulation:** `InsufficientStockException` privately encapsulates `requested`, `available`, and `productName`, exposing them via public const getters (`.getRequested()`, `.getAvailable()`, `.getProductName()`).

### Q42: What is the Multi-Session Reserved Stock System and how does it prevent race conditions between concurrent shoppers?
**Answer:** In multi-user retail environments, multiple customers might simultaneously place the last 2 units of an item into their carts. We introduced the `product_reservations` SQLite table (Migration v6) with a 15-minute TTL. Adding an item to a cart creates a reservation hold. Available stock is dynamically computed as:
$$\text{availableStock} = \max\bigl(0,\, \text{totalStock} - \text{reservedStock}\bigr)$$
If a customer attempts to reserve more units than available, the server returns HTTP 409 Conflict. When checkout executes (`POST /api/bills`), reservations for that session are automatically and atomically cleared within the checkout database transaction.

### Q43: Why does your POS checkout operate as an Atomic Purchase Approval model instead of integrating an external payment gateway or admin approval queue?
**Answer:** In commercial physical supermarkets and high-volume POS systems, cashiers and self-checkout kiosks cannot stall waiting for external banking webhooks, third-party network gateways, or manual manager approval queues. The POS purchase operates on an atomic purchase approval model: once confirmed, the system immediately validates live stock, inserts immutable bill snapshots, updates inventory via FEFO, records movement logs, and commits the transaction in an atomic ACID SQLite transaction.

### Q44: How does Multi-Batch Tracking with FEFO (First-Expired, First-Out) stock deduction work for perishable goods?
**Answer:** Table `product_batches` (Migration v5) tracks individual supplier shipment batches with their respective expiry dates. During sales checkouts, `ProductBatchRepository::deductStockFEFO()` executes a two-pass algorithm: it depletes units from the earliest-expiring unexpired batches first (`ORDER BY expiry_date ASC`). It then automatically updates the parent `products.expiry_date` column to reflect the nearest active batch's expiration date.

### Q45: How does Intelligent Duplicate Item Restock Logic work when adding items with the same barcode/SKU?
**Answer:** When staff creates a product via `POST /api/products`, the backend checks if an active product already exists with that SKU. If the normalized name and category match, rather than rejecting the barcode or creating duplicate catalog rows, it automatically performs a **Restock**: increments existing shelf stock, adds a new batch if perishable, logs an `ADDITION` movement, and returns HTTP 200 with message `"Existing item detected. Stock successfully increased by X units."`

### Q46: How does the Daily Price & Discount History Auditing system (`price_history`) work?
**Answer:** Table `price_history` (Migration v5) records an immutable audit log whenever staff edits a product's price or promotional discount via `PUT /api/products/:id`. It captures `old_price_paise`, `new_price_paise`, `old_discount_type`, `new_discount_type`, `old_discount_value`, `new_discount_value`, manager notes, and a timestamp. This guarantees full regulatory compliance and price auditability.
