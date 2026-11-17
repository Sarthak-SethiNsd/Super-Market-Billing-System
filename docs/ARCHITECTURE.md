# Architecture Specification — Supermarket Management System

## Table of Contents
- [1. Architectural Overview](#1-architectural-overview)
- [2. System Topology & Layers](#2-system-topology-layers)
- [3. Backend C++ Engine Architecture](#3-backend-c-engine-architecture)
- [4. Repository & Database Interaction Pattern](#4-repository-database-interaction-pattern)
- [5. Request Lifecycle & Controller Responsibilities](#5-request-lifecycle-controller-responsibilities)
- [6. Authentication & Session Lifecycle](#6-authentication-session-lifecycle)
- [7. Frontend Architecture (React + Vite)](#7-frontend-architecture-react-vite)
- [8. Concurrency & Transactional Safety](#8-concurrency-transactional-safety)

---

## 1. Architectural Overview

The Supermarket Billing & Inventory Management System follows a **decoupled client-server architecture**:
- **Presentation Layer:** A single-page application (SPA) built with React 19, TypeScript, Tailwind CSS, and Vite.
- **Application & API Layer:** A multithreaded RESTful microservice built in C++17 utilizing the Crow web framework and Asio standalone networking.
- **Domain & Persistence Layer:** Domain-Driven Design (DDD) domain entities, Strategy pattern discount evaluators, RAII database wrappers, and an embedded SQLite3 engine operating in Write-Ahead Logging (WAL) mode.

---

## 2. System Topology & Layers

```mermaid
flowchart TD
    subgraph Client["Client Tier (Browser)"]
        UI["React 19 SPA (Vite)"]
        AxiosClient["Axios HTTP Service (api.ts)"]
        AuthCtx["AuthContext (In-Memory Token)"]
        CartCtx["CartContext (Reactive POS)"]
        UI --> AuthCtx
        UI --> CartCtx
        AuthCtx --> AxiosClient
        CartCtx --> AxiosClient
    end

    subgraph Server["Server Tier (C++17 Crow Microservice)"]
        CrowApp["Crow HTTP Engine (crow_all.h)"]
        CORS["CORS Middleware"]
        AuthMiddleware["ControllerUtils::requireAdmin"]
        Controllers["Controllers (Product, Bill, Inventory, Auth, Brand, Category)"]
        
        AxiosClient -->|"HTTP JSON / REST (Port 8080)"| CrowApp
        CrowApp --> CORS
        CORS --> AuthMiddleware
        AuthMiddleware --> Controllers
    end

    subgraph Domain["Domain & Service Tier"]
        DomainModels["Models (Product, Perishable, NonPerishable, Bill)"]
        Strategy["IDiscountStrategy (None, Percentage, Fixed)"]
        AuthService["AuthService (PBKDF2-HMAC-SHA256)"]
        
        Controllers --> DomainModels
        Controllers --> Strategy
        Controllers --> AuthService
    end

    subgraph Data["Persistence Tier (SQLite3)"]
        Repositories["Repositories (ProductRepo, BillRepo, InvRepo, etc.)"]
        RAIIWrappers["DatabaseConnection, PreparedStatement, Transaction"]
        SQLite["Embedded SQLite3 Engine (WAL Mode)"]
        DBFile[("backend/data/supermarket.db")]
        
        Controllers --> Repositories
        Repositories --> RAIIWrappers
        RAIIWrappers --> SQLite
        SQLite --> DBFile
    end
```

---

## 3. Backend C++ Engine Architecture

### Key Subsystems

1. **`server/` (`AppServer.hpp`, `ServerConfig.hpp`):**
   - Encapsulates the Crow HTTP daemon.
   - Binds to `HOST` (default `0.0.0.0`) and `PORT` (default `8080`).
   - Automatically resolves the canonical database path (`backend/data/supermarket.db`).
   - Registers all modular controller routes on startup.

2. **`auth/` (`AuthService.hpp`, `CryptoUtils.hpp`):**
   - Manages administrator credentials using PBKDF2-HMAC-SHA256 (100,000 iterations, 16-byte random salt).
   - Generates 64-character hexadecimal session tokens using cryptographically secure random bytes (`BCryptGenRandom` on Windows, `RAND_bytes` on Linux).
   - Implements constant-time memory comparisons to prevent timing attacks.

3. **`models/` & `strategies/`:**
   - Pure C++ domain entities enforcing business invariants.
   - `Product` encapsulates private `StockInfo`.
   - `Perishable` and `NonPerishable` inherit from `Product` with polymorphic virtual dispatch (`isExpired()`, `getProductType()`).
   - `IDiscountStrategy` defines the polymorphic contract for discount computations.

---

## 4. Repository & Database Interaction Pattern

The persistence layer isolates SQL query compilation and execution behind the **Repository Pattern**:

```mermaid
sequenceDiagram
    participant Ctrl as BillController
    participant Repo as BillRepository
    participant Tx as Transaction (RAII)
    participant Stmt as PreparedStatement (RAII)
    participant DB as SQLite3 Engine

    Ctrl->>Repo: createBill(items, cashierId, paymentMethod)
    Repo->>Tx: Transaction(db) [BEGIN]
    
    loop For Each Line Item
        Repo->>Stmt: PreparedStatement("SELECT stock FROM products WHERE id=?")
        Stmt->>DB: sqlite3_step()
        DB-->>Stmt: stock count
        Note over Repo: Validate stock >= requested quantity
        Repo->>Stmt: PreparedStatement("UPDATE products SET stock=stock-? WHERE id=?")
        Stmt->>DB: sqlite3_step()
        Repo->>Stmt: PreparedStatement("INSERT INTO inventory_movements...")
        Stmt->>DB: sqlite3_step()
        Repo->>Stmt: PreparedStatement("INSERT INTO bill_items...")
        Stmt->>DB: sqlite3_step()
    end
    
    Repo->>Stmt: PreparedStatement("INSERT INTO bills...")
    Stmt->>DB: sqlite3_step()
    
    Repo->>Tx: tx.commit() [COMMIT]
    Note over Tx: If exception occurs, ~Transaction() auto-rolls back [ROLLBACK]
    Repo-->>Ctrl: BillRecord object
```

### RAII Classes (`database/`)
- **`DatabaseConnection`:** Wraps `sqlite3*`. Opens with `SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX`. Configures `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON`.
- **`PreparedStatement`:** Wraps `sqlite3_stmt*`. Handles argument binding (`bindInt`, `bindText`, `bindInt64`), execution (`step()`), and automated `sqlite3_finalize` in destructor.
- **`Transaction`:** Manages transactional state. Executes `BEGIN TRANSACTION` on construction and `COMMIT` on `commit()`. If destruction occurs while uncommitted (e.g., due to an uncaught domain exception), it automatically invokes `ROLLBACK`.

---

## 5. Request Lifecycle & Controller Responsibilities

```mermaid
sequenceDiagram
    participant Client as React Client (Axios)
    participant Crow as Crow Router
    participant Util as ControllerUtils
    participant Ctrl as ProductController
    participant Repo as ProductRepository
    
    Client->>Crow: POST /api/products (JSON body + Bearer Token)
    Crow->>Util: requireAdmin(req, auth)
    alt Missing or Invalid Token
        Util-->>Client: HTTP 401 Unauthorized
    else Valid Admin Session
        Util-->>Ctrl: Proceed to Route Handler
        Ctrl->>Util: parseJsonObject(req, body)
        Ctrl->>Ctrl: Validate name, SKU, priceInPaise, categoryId
        Ctrl->>Repo: insert(product)
        Repo-->>Ctrl: newProductId
        Ctrl-->>Client: HTTP 201 Created (JSON ApiResponse)
    end
```

---

## 6. Authentication & Session Lifecycle

```mermaid
sequenceDiagram
    participant Admin as Store Administrator
    participant UI as AdminUnlockModal (React)
    participant AuthCtrl as AuthController
    participant AuthSvc as AuthService
    participant UserRepo as UserRepository

    Admin->>UI: Enter master password ("admin123")
    UI->>AuthCtrl: POST /api/auth/admin/unlock {"password": "..."}
    AuthCtrl->>AuthSvc: authenticateAdmin(password)
    AuthSvc->>UserRepo: findByUsername("admin")
    UserRepo-->>AuthSvc: UserRecord (hash, salt, iterations)
    AuthSvc->>AuthSvc: PBKDF2-HMAC-SHA256(input, salt, 100000)
    AuthSvc->>AuthSvc: CryptoUtils::constantTimeCompare(derived, stored)
    alt Passwords Match
        AuthSvc->>AuthSvc: Generate 64-char hex session token
        AuthSvc->>AuthSvc: Store token in RAM map (expires in 3600s)
        AuthCtrl-->>UI: HTTP 200 {"token": "...", "expiresIn": 3600}
        UI->>UI: Store token in AuthContext memory
    else Invalid Password
        AuthCtrl-->>UI: HTTP 401 {"error": "Invalid administrative password"}
    end
```

---

## 7. Frontend Architecture (React + Vite)

The frontend is structured according to domain feature encapsulation:

```text
frontend/src/
├── components/          # Reusable presentation components
│   ├── auth/            # AdminUnlockModal
│   ├── billing/         # POS Catalog, Cart, InvoiceReceiptModal
│   ├── common/          # ErrorBoundary, ConfirmationModal
│   ├── layout/          # Header, Sidebar, Layout wrapper
│   └── ui/              # Button, Card, Badge, Table primitives
├── context/             # Global application state
│   ├── AuthContext.tsx  # In-memory admin session state & timer
│   └── CartContext.tsx  # POS cart line items, calculations, discounts
├── pages/               # Route components
│   ├── HomePage.tsx     # Public corporate website (ApexMart)
│   ├── DashboardPage.tsx
│   ├── BillingPage.tsx  # POS Terminal
│   ├── ProductsPage.tsx
│   ├── InventoryPage.tsx
│   ├── TransactionsPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── AdminPage.tsx
│   └── OopConceptsPage.tsx
├── services/            # Backend communication
│   └── api.ts           # Axios instance with Authorization interceptors
├── styles/              # Global Tailwind CSS definitions
└── types/               # TypeScript data transfer contracts
```

---

## 8. Concurrency & Transactional Safety

1. **SQLite WAL Mode (`PRAGMA journal_mode = WAL`):** Enables non-blocking concurrent readers while a write transaction executes.
2. **Serial Writes via SQLite Mutex:** Database connections use `SQLITE_OPEN_FULLMUTEX` ensuring thread-safe access from Crow's worker thread pool.
3. **Atomic Stock Decrement:** In `BillRepository::createBill`, stock validation and deduction happen inside the same transaction as invoice creation. If any line item has insufficient stock, the transaction aborts and rolls back completely, ensuring shelf counts are never corrupted.
