# Supermarket Billing & Inventory Management System (ApexMart)

A modern, enterprise-grade **Supermarket Billing & Inventory Management System** built for a college Object-Oriented Programming (OOP) curriculum in C++.

The project couples a high-performance **C++17 / Crow REST API** microservice and an embedded **SQLite3** persistence layer with a responsive **React 19 + TypeScript + Vite** frontend. It features a strict architectural separation between an unauthenticated **Customer Mode** (public corporate site, product discovery, self-service cart, and checkout) and an authenticated **Staff Mode** (complete operational management portal with KPI analytics, inventory adjustments, and catalog CRUD). There is **no separate Admin operating mode**.

> [!NOTE]
> The original academic console submission file at `../Supermarket_billing_System/1.cpp` has been preserved completely unmodified.

---

## Operating Modes (Exactly Two Modes)

The system enforces a clean, two-mode operating model:

1. **CUSTOMER MODE (Public):**
   - Public customer-facing corporate showcase and catalog browsing (`/`).
   - Dynamic department category selector ("All Categories" + dynamic category pills) with real-time text search and price filters.
   - **Multi-Session Reserved Stock System:** Cart holds with 15-minute TTL (`product_reservations`) isolate stock and prevent race conditions among concurrent shoppers.
   - **Atomic Purchase Approval Model:** Self-service atomic checkout (`POST /api/bills`) with customer name & phone entry, instant stock deduction via FEFO, and 80mm thermal receipt generation (no external payment gateway or admin approval bottleneck).
   - *Restricted:* Customer Mode has zero access to internal sales analytics, stock adjustment tools, product CRUD, or staff credential management.

2. **STAFF MODE (Password-Authenticated):**
   - Password-protected management access (`POST /api/auth/staff/login`) secured via PBKDF2-HMAC-SHA256 (`Staff@123`).
   - Full operational dashboard (`/dashboard`) featuring 5 real-time KPI summary cards (Today's Net Sales, Today's Invoices, Total Products, Low Stock Alerts, Out of Stock Count).
   - Real-time sales trend graphs and recent transaction feeds.
   - Product catalog management with **Intelligent Duplicate Restock Logic** (matching SKU and normalized name).
   - **Multi-Batch FEFO (First-Expired, First-Out) Tracking:** Individual batch management with dynamic nearest-expiry date synchronization.
   - **Daily Price & Discount History Auditing:** Immutable audit trail in `price_history`.
   - Inventory management (`/inventory`) with manual stock additions, write-offs, and an immutable audit ledger (`inventory_movements`).
   - Category and brand taxonomy management (`category_brands` junction table).
   - Complete historical billing audit register (`/transactions`).

---

## Key Features

- **Decoupled Client-Server Architecture:** High-speed C++17 Crow REST microservice communicating over JSON with a React 19 Single-Page Application.
- **Integer Currency Representation:** All financial calculations strictly utilize signed 64-bit integer paise (`int64_t`, $1\text{ INR} = 100\text{ paise}$), eliminating floating-point rounding drift.
- **Atomic Purchase Approval & ACID Transactions:** Multi-item purchases, stock decrements, and inventory movement logs execute inside atomic database transactions (`Transaction` RAII class) without third-party gateway latency or manual approval queues.
- **Multi-Session Reserved Stock System:** Cart holds with a 15-minute TTL in SQLite table `product_reservations` calculate available stock dynamically ($\text{available} = \max(0, \text{total} - \text{reserved})$) and clear atomically on checkout.
- **Polymorphic C++ OOP Exception Hierarchy:** Custom domain exception architecture (`backend/include/utils/Exceptions.hpp`) with `ISupermarketException` (pure virtual `what()`), `SupermarketException`, `InvalidQuantityException`, `InsufficientStockException`, and `InvalidDiscountException`, mapping to core OOP tenets (Inheritance, Polymorphism, Encapsulation, Abstraction).
- **Strict Boundary & Exception Validations:** Non-positive quantities ($q \le 0$) rejected with HTTP 400; quantities exceeding stock throw `InsufficientStockException`; discount percentages strictly bounded $[0.0\%, 100.0\%]$; unit prices clamped never to fall below zero.
- **Intelligent Inventory Management & FEFO:** Duplicate barcode restock detection, multi-batch expiry tracking with FEFO stock deduction, and daily price/discount change auditing (`price_history`).
- **Immutable Historical Invoices:** Sales transactions snapshot line item names, brands, unit prices, discounts, and line totals at the exact second of checkout (`bill_items`).
- **Audit Movement Ledger (`/inventory`):** Append-only audit trail logging stock additions, write-offs, physical adjustments, and checkout sales.
- **PBKDF2-HMAC-SHA256 Cryptography:** Secure password hashing (100,000 iterations, 128-bit random salt) via Windows CNG on Windows and OpenSSL 3.x on Linux.
- **Polymorphic Discount Strategies:** Strategy Design Pattern implementing `NoDiscount`, `PercentageDiscount`, and `FixedAmountDiscount` algorithms without modifying product definitions.
- **Interactive OOP Concepts Explorer (`/oop-concepts`):** Academic demonstration module with interactive class hierarchy diagrams, live discount strategy simulator, and object slicing demo.

---

## Technology Stack

| Tier | Technologies |
| :--- | :--- |
| **Backend Microservice** | C++17, Crow Web Framework (`v1.3.4`), Standalone Asio (`v1.30.2`), nlohmann/json (`v3.11.3`) |
| **Cryptography** | Windows Cryptography API: Next Generation (CNG / `<bcrypt.h>`) on Windows; OpenSSL 3.x on Linux |
| **Database & Persistence** | Embedded SQLite 3.46.1 amalgamation, Write-Ahead Logging (WAL), foreign key constraints |
| **Frontend Single-Page App** | React 19, TypeScript 5, Vite 6, Tailwind CSS 3, Lucide React icons, Recharts |
| **Build & Tooling** | CMake 3.15+, MSVC C++17 (VS 2022), CTest, Node.js LTS, Docker multi-stage build |

---

## Project Structure

```text
Supermarket_Management_System/
├── .gitignore
├── PROJECT_SUBMISSION_CHECKLIST.md # Final submission & verification checklist
├── README.md                      # Primary project overview (this file)
├── START_HERE.md                  # Quick-start evaluator guide
├── build-and-test.ps1             # One-command automated build & CTest runner
├── start-app.ps1                  # One-command application launcher
├── backend/
│   ├── .dockerignore              # Container build exclusions
│   ├── .env.example               # Environment variable documentation
│   ├── CMakeLists.txt             # C++17 CMake project definition
│   ├── Dockerfile                 # Multi-stage Linux Debian runtime container
│   ├── data/                      # Runtime SQLite storage (supermarket.db)
│   ├── include/                   # C++ headers (auth, controllers, database, models, etc.)
│   ├── src/                       # Implementations (server_main.cpp, seeder_main.cpp, etc.)
│   ├── tests/                     # 5 CTest suites (34 automated test cases)
│   └── third_party/               # Bundled dependencies (asio, crow, nlohmann, sqlite)
├── frontend/
│   ├── package.json & lock        # Pinned React dependencies
│   ├── vite.config.ts             # Strict-port Vite configuration
│   └── src/                       # React components, pages, context, and services
├── docs/                          # Comprehensive academic submission documentation
│   ├── PROJECT_REPORT.md          # Complete formal academic project report
│   ├── SYSTEM_ARCHITECTURE.md     # Architecture diagrams, layers & request flows
│   ├── DATABASE_DESIGN.md         # SQLite schema, ER diagram, migrations & transactions
│   ├── API_DOCUMENTATION.md       # Crow REST API endpoints reference & examples
│   ├── OOP_CONCEPTS.md            # C++17 OOP concepts mapped to real source files
│   ├── USER_MANUAL.md             # End-to-end user manual (Customer & Staff modes)
│   ├── INSTALLATION_AND_DEPLOYMENT.md # Setup, build, test, Docker & cloud deployment
│   ├── TESTING_REPORT.md          # 34 CTest test cases, results & verification
│   ├── VIVA_PREPARATION.md        # 40 viva questions, 10 design decisions & pitch
│   ├── PROJECT_OVERVIEW.md        # Problem statement, retail motivation, and objectives
│   ├── FEATURES_AND_MODULES.md    # Detailed module breakdown
│   ├── DEMO_GUIDE.md              # Evaluator live demonstration script
│   └── TROUBLESHOOTING.md         # Resolving common operational issues
└── scripts/
    └── seed_demo_data.py          # Standalone fallback Python seeder
```

---

## Quick Start (Windows)

See [`START_HERE.md`](./START_HERE.md) for the shortest evaluator walkthrough, or run from PowerShell:

```powershell
# 1. Compile backend and verify all 5 C++ test suites + frontend build
.\build-and-test.ps1 -InstallDependencies

# 2. Launch both backend (port 8080) and frontend (port 5173) with one command
.\start-app.ps1
```

The script detects the pre-seeded SQLite database at `backend/data/supermarket.db`, spins up both servers, and opens `http://localhost:5173` in your default browser.

To stop the application cleanly, press **`Ctrl+C`** in the PowerShell window.

---

## Canonical Database Path & Demonstration Data

The application operates on a single canonical local SQLite database:
$$\mathbf{backend/data/supermarket.db}$$

The database includes a pre-seeded demonstration dataset:
- **25 Retail Products** across **7 categories** (*Grains & Staples, Dairy & Chilled, Snacks & Confectionery, Beverages, Personal Care, Household Essentials, Fruits & Vegetables*).
- **19 Popular Indian Brands** (*Amul, Aashirvaad, Tata, Britannia, Dettol, Surf Excel*, etc.).
- **Perishable Stock:** Milk, butter, paneer, and produce with future ISO expiry dates.
- **Low-Stock Alert Item:** `Fresh Organic Baby Spinach Palak 250g` initialized with **3 units** ($\le 5$) for reorder alert demonstrations.
- **Demonstration Staff Account:** Pre-configured credentials:
  - **Role:** `STAFF`
  - **Password:** `Staff@123` (or configured via environment variable `STAFF_INITIAL_PASSWORD` / `STAFF_PASSWORD`; fallback: `admin123`)

To re-seed or verify the database idempotently at any time:
```powershell
cd backend\build\Release
.\supermarket_seeder.exe
```

---

## Automated Test Suites

All 5 backend test suites can be executed via CTest from `backend/`:
```powershell
ctest --test-dir build -C Release --output-on-failure
```

| Test Suite | File | Verified Scope | Result |
| :--- | :--- | :--- | :---: |
| **DiscountSuite** | `tests/test_discounts.cpp` | Percentage & fixed discounts, bounds checking, polymorphic exception hierarchy | **6 / 6 PASS** |
| **InventorySuite** | `tests/test_inventory.cpp` | Stock decrement, negative stock prevention, nested StockInfo, exception boundaries | **6 / 6 PASS** |
| **BillingSuite** | `tests/test_billing.cpp` | Bill calculations, operator overloading, diamond inheritance, generic templates | **6 / 6 PASS** |
| **DatabaseSuite** | `tests/test_database.cpp` | SQLite persistence, repository CRUD, transaction rollbacks, customer & cart repos | **8 / 8 PASS** |
| **ApiSuite** | `tests/test_api.cpp` | Health, Crow REST routes, Staff RBAC, PBKDF2 vectors, multi-session cart holds | **13 / 13 PASS** |
| **Total Test Coverage** | | | **39 / 39 (100% PASS)** |

---

## Complete College Submission Documentation

Comprehensive submission documentation is authored and verified in the [`docs/`](./docs/) directory:

1. 📄 [**Formal Project Report (`PROJECT_REPORT.md`)**](./docs/PROJECT_REPORT.md) — Complete academic project report with abstract, problem statement, requirements, architecture, results, limitations, and future scope.
2. 🏛️ [**System Architecture (`SYSTEM_ARCHITECTURE.md`)**](./docs/SYSTEM_ARCHITECTURE.md) — Multi-tier topology, Mermaid architecture sequence diagrams, domain layer design, and concurrency model.
3. 🗄️ [**Database Design & Schema (`DATABASE_DESIGN.md`)**](./docs/DATABASE_DESIGN.md) — 10 SQLite table schemas, Mermaid ER diagram, indexes, foreign keys, migrations, and ACID transaction safety.
4. 🌐 [**REST API Documentation (`API_DOCUMENTATION.md`)**](./docs/API_DOCUMENTATION.md) — Complete endpoint reference, HTTP methods, request/response JSON payloads, and Customer vs. Staff access matrix.
5. 🎓 [**OOP Concepts Implementation Guide (`OOP_CONCEPTS.md`)**](./docs/OOP_CONCEPTS.md) — Detailed mapping of C++17 OOP principles (Encapsulation, Polymorphism, Virtual Inheritance, Strategy Pattern, Templates, RAII) to source files.
6. 📖 [**User Manual (`USER_MANUAL.md`)**](./docs/USER_MANUAL.md) — Comprehensive guide to Customer Mode shopping, Staff Mode authentication, dashboard analytics, inventory management, and POS billing.
7. ⚙️ [**Installation & Deployment Guide (`INSTALLATION_AND_DEPLOYMENT.md`)**](./docs/INSTALLATION_AND_DEPLOYMENT.md) — Toolchain prerequisites, Windows build, Docker multi-stage build, and cloud hosting guidelines.
8. 🧪 [**Testing & Verification Report (`TESTING_REPORT.md`)**](./docs/TESTING_REPORT.md) — Detailed breakdown of 34 CTest test cases across 5 suites, test coverage, and frontend verification.
9. 🎯 [**Viva Preparation & Defense Guide (`VIVA_PREPARATION.md`)**](./docs/VIVA_PREPARATION.md) — 40 likely viva examination questions with source-mapped answers, 10 architectural decisions defended, and a 2–3 minute elevator pitch.
