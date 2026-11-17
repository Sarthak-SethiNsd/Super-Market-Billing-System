# Supermarket Billing & Inventory Management System (ApexMart)

A modern, enterprise-grade **Supermarket Billing & Inventory Management System** built for a college Object-Oriented Programming (OOP) curriculum in C++.

The project couples a high-performance **C++17 / Crow REST API** microservice and an embedded **SQLite3** persistence layer with a responsive **React 19 + TypeScript + Vite** frontend. It features a strict architectural separation between a **public customer-facing corporate website** and an authenticated **internal staff supermarket management application**.

> [!NOTE]
> The original academic console submission file at `../Supermarket_billing_System/1.cpp` has been preserved completely unmodified.

---

## Key Features

- **Public Corporate Website (`/`):** Professional customer-facing landing page featuring brand values, department showcases, store facilities, customer commitments, and store contact placeholders.
- **Cashier POS Billing Terminal (`/billing`):** Fast, keyboard-friendly Point-of-Sale interface with instant reactive product search, live stock guards, and polymorphic discount calculations.
- **Atomic Checkout & Decrement:** Multi-item purchases and stock deductions execute within ACID-compliant database transactions (`Transaction` RAII class) to prevent overselling.
- **Integer Currency Representation:** All financial calculations strictly utilize signed 64-bit integer paise (`int64_t`), eliminating floating-point rounding drift.
- **Immutable Historical Invoices:** Sales transactions snapshot line item names, brands, unit prices, discounts, and line totals at the exact moment of checkout.
- **Audit Movement Ledger (`/inventory`):** Complete append-only audit trail logging stock additions, reductions, write-offs, and checkout sales.
- **Role-Based Access Control (RBAC):** Clean two-mode operational architecture separating unauthenticated **Customer Mode** (product discovery, catalog browsing, and self-checkout) from password-protected **Staff Mode** (full operational dashboard, inventory management, product CRUD, and sales analytics).
- **PBKDF2-HMAC-SHA256 Cryptography:** Secure password hashing (100,000 iterations, 128-bit random salt) via Windows CNG on Windows and OpenSSL 3.x on Linux.
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
├── docs/                          # Comprehensive technical documentation
│   ├── PROJECT_OVERVIEW.md        # Problem statement, scope, and objectives
│   ├── FEATURES_AND_MODULES.md    # Detailed module breakdown
│   ├── ARCHITECTURE.md            # Architecture diagrams and request lifecycles
│   ├── OOP_CONCEPTS.md            # Academic OOP concepts mapped to source files
│   ├── DATABASE_SCHEMA.md         # Schema definitions, ER diagrams, and storage guide
│   ├── API_REFERENCE.md           # Crow REST API endpoints reference
│   ├── SETUP_AND_CONFIGURATION.md # Compilation and configuration guide
│   ├── DEMO_GUIDE.md              # Evaluator live demonstration script
│   ├── DEPLOYMENT.md              # Docker build and cloud hosting guide
│   ├── TESTING_AND_VERIFICATION.md# Test suite coverage and E2E results
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
  - **Password:** `admin123` (or configured via environment variable `STAFF_INITIAL_PASSWORD` / `STAFF_PASSWORD`)

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
| **DiscountSuite** | `tests/test_discounts.cpp` | Percentage & fixed discounts, bounds checking, negative guards | **5 / 5 PASS** |
| **InventorySuite** | `tests/test_inventory.cpp` | Stock decrement, negative stock prevention, nested StockInfo | **5 / 5 PASS** |
| **BillingSuite** | `tests/test_billing.cpp` | Bill calculations, operator overloading, diamond inheritance | **6 / 6 PASS** |
| **DatabaseSuite** | `tests/test_database.cpp` | SQLite persistence, repository CRUD, transaction rollbacks | **6 / 6 PASS** |
| **ApiSuite** | `tests/test_api.cpp` | Health, Crow REST routes, RBAC guards, PBKDF2 cryptography | **12 / 12 PASS** |
| **Total Test Coverage** | | | **34 / 34 (100% PASS)** |

---

## Documentation Navigation

Detailed documentation is available in the [`docs/`](./docs/) directory:

- 📋 [**Project Overview**](./docs/PROJECT_OVERVIEW.md) — Problem statement, retail motivation, and objectives.
- 📦 [**Features & Modules**](./docs/FEATURES_AND_MODULES.md) — Public portal, POS, inventory, analytics, and admin tools.
- 🏛️ [**System Architecture**](./docs/ARCHITECTURE.md) — Decoupled layers, sequence diagrams, and concurrency design.
- 🎓 [**OOP Concepts Implementation**](./docs/OOP_CONCEPTS.md) — Inheritance, polymorphism, RAII, templates, operator overloading, and design patterns.
- 🗄️ [**Database Schema & Storage**](./docs/DATABASE_SCHEMA.md) — Tables, foreign keys, paise currency invariant, and WAL mode.
- 🌐 [**REST API Reference**](./docs/API_REFERENCE.md) — Crow HTTP routes, request/response DTOs, and status codes.
- ⚙️ [**Setup & Configuration**](./docs/SETUP_AND_CONFIGURATION.md) — Toolchain prerequisites and environment variables.
- 🚀 [**Demonstration Guide**](./docs/DEMO_GUIDE.md) — Step-by-step evaluator script for live demonstration.
- 🐳 [**Deployment Guide**](./docs/DEPLOYMENT.md) — Docker containerization, OpenSSL, and cloud hosting constraints.
- 🧪 [**Testing & Verification**](./docs/TESTING_AND_VERIFICATION.md) — Automated CTest suites and manual E2E workflows.
- 🔧 [**Troubleshooting Guide**](./docs/TROUBLESHOOTING.md) — Resolving port collisions, database path, and CORS issues.
