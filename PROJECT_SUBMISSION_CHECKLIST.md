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
| **Formal Project Report** | `docs/PROJECT_REPORT.md` | Complete | Academic report with abstract, requirements, architecture, results, and limitations. |
| **System Architecture** | `docs/SYSTEM_ARCHITECTURE.md` | Complete | Multi-tier topology, Mermaid sequence diagrams, and concurrency design. |
| **Database Design** | `docs/DATABASE_DESIGN.md` | Complete | 11 SQLite table schemas, ER diagram, migrations (v1-v6), transactions, batches & cart holds. |
| **REST API Documentation** | `docs/API_DOCUMENTATION.md` | Complete | Crow REST endpoints, request/response DTOs, cart reservations, and role-based access. |
| **OOP Concepts Guide** | `docs/OOP_CONCEPTS.md` | Complete | Detailed C++17 OOP concepts (vtable, RAII, strategy pattern, templates, polymorphic exceptions). |
| **User Manual** | `docs/USER_MANUAL.md` | Complete | Step-by-step user manual for Customer Mode shopping and Staff Mode management. |
| **Installation & Deployment** | `docs/INSTALLATION_AND_DEPLOYMENT.md` | Complete | Local setup, CTest verification, Docker containerization, and Render deployment. |
| **Testing Report** | `docs/TESTING_REPORT.md` | Complete | 39 CTest test cases across 5 suites, test coverage, and build verification. |
| **Viva Defense Guide** | `docs/VIVA_PREPARATION.md` | Complete | 46 source-mapped viva questions, 10 architectural decisions defended, and elevator pitch. |
| **Project Overview** | `docs/PROJECT_OVERVIEW.md` | Complete | Retail problem statement, project scope, and user roles. |
| **Features & Modules** | `docs/FEATURES_AND_MODULES.md` | Complete | Specifications for Public Site, POS, Catalog, Inventory, and Analytics. |
| **Demo Guide** | `docs/DEMO_GUIDE.md` | Complete | Step-by-step evaluation script for live demonstration. |
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
- [x] **CTest Automated Test Suites (39/39 Passing):**
  - [x] `DiscountSuite` — 6 / 6 PASSED
  - [x] `InventorySuite` — 6 / 6 PASSED
  - [x] `BillingSuite` — 6 / 6 PASSED
  - [x] `DatabaseSuite` — 8 / 8 PASSED
  - [x] `ApiSuite` — 13 / 13 PASSED
- [x] **Frontend Production Build:** `tsc -b && vite build` succeeds cleanly with 0 errors and outputs `frontend/dist/`.

---

## 4. Canonical Database & Demonstration Dataset

- [x] **Canonical Database Location:** `backend/data/supermarket.db`.
- [x] **Seeded Dataset Integrity:**
  - 25 representative Indian supermarket products.
  - 7 core retail categories.
  - 19 brand manufacturers.
  - Perishable products with ISO future expiry dates and FEFO batches.
  - Low-stock alert demonstration item (`Fresh Organic Baby Spinach Palak 250g`, stock = 3 $\le 5$).
- [x] **Seeder Idempotency:** Both `supermarket_seeder.exe` and `python scripts/seed_demo_data.py` safely detect existing records on repeated runs (0 inserted, 25 skipped).
- [x] **Pre-Seeded Staff Account:** `Staff@123` (fallback: `admin123`) available for evaluation.

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
- [x] **Staff Login Modal:** Enforces PBKDF2 password authentication and grants full operational management access.
- [x] **OOP Concepts Explorer (`/oop-concepts`):** Interactive visualizer displays C++ class hierarchies, dynamic dispatch simulator, and object slicing demonstrations.
- [x] **Restart & Persistence:** Stopping and restarting the server preserves all completed transactions and decremented stock levels in SQLite.
