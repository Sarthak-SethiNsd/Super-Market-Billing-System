# Project Submission & Evaluation Checklist

This checklist verifies all submission requirements for the **Supermarket Billing & Inventory Management System (ApexMart)** for the semester OOP academic evaluation.

---

## 1. Academic Source & Reference Boundaries

- [x] **Original Academic File Preserved:** `Supermarket_billing_System/1.cpp` remains untouched and unmodified at the workspace root.
- [x] **Repository Separation:**
  - `Supermarket_Management_System/` serves as the primary development and build directory.
  - `Supermarket_Submission_Staging/Supermarket_Management_System/` serves as the clean, Git-connected submission repository.
- [x] **Canonical Database Isolated:** Runtime SQLite databases (`backend/data/supermarket.db`, `*.db-wal`, `*.db-shm`) are excluded from Git commits via `.gitignore`.
- [x] **Zero Plaintext Secrets:** No passwords, private tokens, or session secrets are committed to Git.

---

## 2. Comprehensive Documentation Verification

All technical documentation files are authored, verified against the actual codebase, and accessible in the repository:

| Document | Location | Status | Verified Description |
| :--- | :--- | :---: | :--- |
| **Project Readme** | `README.md` | Complete | Project overview, tech stack, quick start, and documentation navigation. |
| **Evaluator Start Guide** | `START_HERE.md` | Complete | Fast-track evaluator setup and verification walkthrough. |
| **Submission Checklist** | `PROJECT_SUBMISSION_CHECKLIST.md` | Complete | This verification document. |
| **Project Overview** | `docs/PROJECT_OVERVIEW.md` | Complete | Retail problem statement, project scope, and user roles. |
| **Features & Modules** | `docs/FEATURES_AND_MODULES.md` | Complete | Specifications for Public Site, POS, Catalog, Inventory, and Analytics. |
| **System Architecture** | `docs/ARCHITECTURE.md` | Complete | Topology, request lifecycles, and Mermaid sequence diagrams. |
| **OOP Concepts Guide** | `docs/OOP_CONCEPTS.md` | Complete | Mapping of OOP mechanisms (Inheritance, Polymorphism, RAII, Templates) to C++ code. |
| **Database Schema** | `docs/DATABASE_SCHEMA.md` | Complete | SQLite table definitions, foreign keys, paise currency invariant, and backups. |
| **REST API Reference** | `docs/API_REFERENCE.md` | Complete | Crow HTTP endpoints, request/response DTOs, and status codes. |
| **Setup & Configuration** | `docs/SETUP_AND_CONFIGURATION.md` | Complete | Build toolchain requirements and environment variables. |
| **Demo Guide** | `docs/DEMO_GUIDE.md` | Complete | Step-by-step evaluation script for live demonstration. |
| **Deployment Guide** | `docs/DEPLOYMENT.md` | Complete | Docker build, OpenSSL support, and cloud hosting constraints. |
| **Testing & Verification** | `docs/TESTING_AND_VERIFICATION.md` | Complete | CTest test suites, coverage summary, and manual verification results. |
| **Troubleshooting Guide** | `docs/TROUBLESHOOTING.md` | Complete | Operational resolution for port collisions and configuration errors. |

---

## 3. Build & Automated Test Verification

Run from `Supermarket_Management_System/`:

```powershell
.\build-and-test.ps1 -InstallDependencies
```

### Verification Criteria
- [x] **Compiler & Toolchain:** Visual Studio 2022 MSVC C++17 compiler (`cl.exe`), CMake `3.15+`, Node.js LTS, and npm detected.
- [x] **Backend Targets Compiled (Release):**
  - `sqlite3_lib.lib` (Amalgamation 3.46.1)
  - `supermarket_domain.lib` (Core business logic and repositories)
  - `supermarket_server.exe` (Crow HTTP REST daemon)
  - `supermarket_seeder.exe` (Standalone C++ demo seeder)
- [x] **CTest Automated Test Suites (34/34 Passing):**
  - [x] `DiscountSuite` — 5 / 5 PASSED
  - [x] `InventorySuite` — 5 / 5 PASSED
  - [x] `BillingSuite` — 6 / 6 PASSED
  - [x] `DatabaseSuite` — 6 / 6 PASSED
  - [x] `ApiSuite` — 12 / 12 PASSED
- [x] **Frontend Production Build:** `tsc -b && vite build` succeeds cleanly with 0 errors and outputs `frontend/dist/`.

---

## 4. Canonical Database & Demonstration Dataset

- [x] **Canonical Database Location:** `backend/data/supermarket.db`.
- [x] **Seeded Dataset Integrity:**
  - 25 representative Indian supermarket products.
  - 7 core retail categories.
  - 19 brand manufacturers.
  - Perishable products with ISO future expiry dates.
  - Low-stock alert demonstration item (`Fresh Organic Baby Spinach Palak 250g`, stock = 3 $\le 5$).
- [x] **Seeder Idempotency:** Both `supermarket_seeder.exe` and `python scripts/seed_demo_data.py` safely detect existing records on repeated runs (0 inserted, 25 skipped).
- [x] **Pre-Seeded Administrator:** `admin` / `admin123` available for evaluation.

---

## 5. Live Functional Demonstration Flow

Launch via `.\start-app.ps1`:
- [x] **Public Customer Portal (`/`):** Renders ApexMart branding, department showcases, and customer commitments without internal inventory or revenue metrics.
- [x] **Staff Portal Transition (`/staff`):** Navigation pill directs staff to internal `/dashboard`.
- [x] **Product Catalog (`/products`):** Full 25-item catalog displays with perishable badges, expiry dates, and stock tags.
- [x] **POS Terminal & Checkout (`/billing`):** Reactive search finds products; cart computes percentage and fixed discounts; stock guards prevent overselling.
- [x] **Atomic Checkout Execution:** `POST /api/bills` generates an immutable invoice, decrements stock atomically, and logs a `SALE` entry in `inventory_movements`.
- [x] **Printable Thermal Receipt:** Immediate invoice modal isolates receipt layout for 80mm thermal printing (`@media print`).
- [x] **Stock Movement Ledger (`/inventory`):** Audit table reflects historical sales and manual intake adjustments.
- [x] **Sales Analytics (`/analytics`):** Real-time revenue, transaction volume, and category distribution charts update accurately.
- [x] **Admin Unlock Modal:** Enforces PBKDF2 password authentication and grants privileged access.
- [x] **OOP Concepts Explorer (`/oop-concepts`):** Interactive visualizer displays C++ class hierarchies, dynamic dispatch simulator, and object slicing demonstrations.
- [x] **Restart & Persistence:** Stopping and restarting the server preserves all completed transactions and decremented stock levels in SQLite.
