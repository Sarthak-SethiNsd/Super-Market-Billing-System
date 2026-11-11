# Project Submission Checklist

Final verification checklist for college submission and demonstration of the **Supermarket Billing & Inventory Management System**.

---

## 1. Required Submission Files

Confirm the following directories and files are present and complete inside `Supermarket_Management_System/` (plus the untouched original academic reference file):

- [ ] **Original Reference File**: `../Supermarket_billing_System/1.cpp` preserved untouched in its original location.
- [ ] **Documentation & Scripts**:
  - `README.md`
  - `START_HERE.md`
  - `PROJECT_SUBMISSION_CHECKLIST.md`
  - `.gitignore`
  - `start-app.ps1`
  - `build-and-test.ps1`
- [ ] **Backend Source, Tests & Bundled Dependencies (`backend/`)**:
  - `CMakeLists.txt` and `.env.example`
  - `include/` (headers across `auth/`, `controllers/`, `database/`, `models/`, `repositories/`, `server/`, `strategies/`, `utils/`)
  - `src/` (`main.cpp`, `server_main.cpp`, and implementations across `auth/`, `database/`, `models/`, `repositories/`)
  - `tests/` (`CMakeLists.txt`, `test_api.cpp`, `test_billing.cpp`, `test_database.cpp`, `test_discounts.cpp`, `test_inventory.cpp`)
  - `third_party/` (bundled `asio/`, `crow/`, `nlohmann/`, `sqlite/`)
- [ ] **Frontend Source & Configuration (`frontend/`)**:
  - `package.json`, `package-lock.json`, `index.html`
  - `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `.env.example`
  - `src/` (`App.tsx`, `main.tsx`, `vite-env.d.ts`, `components/`, `context/`, `data/`, `pages/`, `services/`, `styles/`, `types/`)
- [ ] **Exclusions Verified Before Creating Submission Copy/Archive**:
  - Exclude `backend/build/`, `frontend/node_modules/`, `frontend/dist/` (unless prebuilt static bundle is explicitly requested), `frontend/.env`, `frontend/*.tsbuildinfo`, `frontend/vite.config.js`, `frontend/vite.config.d.ts`, and any test/runtime `*.db`, `*.db-wal`, `*.db-shm`, `*.log` files.

---

## 2. Build Verification

Run from `Supermarket_Management_System/` in Windows PowerShell:

```powershell
.\build-and-test.ps1
```

*(Pass `-InstallDependencies` on a fresh machine where `frontend/node_modules/` does not yet exist.)*

- [ ] **Host Prerequisites Detected**: CMake (`>= 3.15`), CTest, MSVC C++17 (`cl.exe`), Node.js, and npm.
- [ ] **Backend Release Build**: Zero errors across `sqlite3_lib`, `supermarket_domain`, `supermarket_demo`, `supermarket_server`, and all 5 test binaries.
- [ ] **Frontend Production Build**: `tsc -b && vite build` succeeds cleanly with zero TypeScript errors and outputs `frontend/dist/`.

---

## 3. Automated Test Verification

- [ ] **C++ Unit & Integration Suites (`ctest --test-dir build -C Release --output-on-failure`)**:
  - [ ] `DiscountSuite` — Passed
  - [ ] `InventorySuite` — Passed
  - [ ] `BillingSuite` — Passed
  - [ ] `DatabaseSuite` — Passed
  - [ ] `ApiSuite` — Passed
- [ ] **Launcher Smoke Check (`.\start-app.ps1`)**:
  - [ ] Clean launch prompts securely for `ADMIN_INITIAL_PASSWORD` (min 6 chars) when database is fresh.
  - [ ] Both `supermarket_server.exe` (`http://localhost:8080/api/health`) and Vite (`http://localhost:5173`) become healthy cleanly.
  - [ ] Pressing `Ctrl+C` stops both servers cleanly without deleting `.db` files.

---

## 4. Functional Demonstration Checklist

- [ ] **Default Staff Mode**: Confirm application opens in `STAFF` mode; Staff can browse products, run POS checkout, view receipts, inspect transactions, view inventory movements, and view analytics, while Admin mutations return HTTP `401`/`403`.
- [ ] **Admin Authentication**: Click **Unlock Admin** in the header and unlock using the initialized administrator password (`POST /api/auth/admin/unlock`).
- [ ] **Brand & Category Setup (`/admin`)**: Create a brand and category; verify persistence and duplicate protection.
- [ ] **Product Catalog (`/products`)**: Create both a **Perishable** item (with `expiryDate`) and a **Non-Perishable** item; test **Percentage** and **Fixed** discounts and active search/filters.
- [ ] **POS Terminal Checkout (`/billing`)**: Scan SKU or click catalog item, adjust cart quantities, attempt invalid over-stock quantity (verify rejection), and complete transactional checkout (`POST /api/bills`).
- [ ] **Receipt Printing & Immutable History (`/transactions`)**: Verify formatted per-unit discount (`- ₹X.XX/unit`), test receipt print layout isolation, edit a product price afterwards, and confirm historical invoice snapshots in `/transactions` remain unchanged.
- [ ] **Inventory Auditing (`/inventory`)**: Perform stock addition/reduction/adjustment with reason and verify immutable `inventory_movements` audit entries.
- [ ] **Analytics Dashboard (`/analytics`)**: Verify database-side all-time summary metrics, charts, and date filters.
- [ ] **OOP Concepts Explorer (`/oop-concepts`)**: Demonstrate concept cards linked to real `backend/` files, Class Hierarchy Diagrams, Discount Strategy Simulator, Object Slicing Demo, and Concept Quiz.

---

## 5. OOP Concepts Verification Checklist (Code-Verified)

- [ ] **Encapsulation & Composition**: `Product` with private `StockInfo` validation (`backend/include/models/Product.hpp`).
- [ ] **Abstraction & Strategy Pattern**: Abstract interface `IDiscountStrategy` and concrete strategies `NoDiscountStrategy`, `PercentageDiscountStrategy`, `FixedDiscountStrategy` (`backend/include/strategies/IDiscountStrategy.hpp`, `backend/include/models/Discount.hpp`).
- [ ] **Inheritance & Runtime Polymorphism**: Abstract `isExpired()` / `getProductType()` virtual dispatch across `Product` -> `Perishable` & `NonPerishable` (`backend/include/models/`).
- [ ] **Virtual Inheritance (Diamond Problem Resolution)**: `Person` -> `virtual public Employee` & `virtual public Customer` -> `Manager` (`backend/include/models/Person.hpp`, `Employee.hpp`, `Customer.hpp`, `Manager.hpp`).
- [ ] **Operator Overloading**: `Bill` (`operator+=`, `operator+`, `operator==`, `operator<`, `operator<<`) and `BillItem` (`operator+`, `operator==`, `operator<<`) (`backend/include/models/Bill.hpp`, `BillItem.hpp`).
- [ ] **Generic Templates**: `Repository<T>` and `ApiResponse<T>` (`backend/include/utils/Repository.hpp`, `ApiResponse.hpp`).
- [ ] **RAII Resource & Transaction Management**: `DatabaseConnection`, `PreparedStatement`, and `Transaction` auto-rollback on destruction if uncommitted (`backend/include/database/`).
- [ ] **RTTI (`dynamic_cast`)**: Safe downcasting in `ProductRepository` when persisting derived `Perishable` expiry dates (`backend/src/repositories/ProductRepository.cpp`).

---

## 6. Security Considerations

- [ ] **No Hardcoded or Leaked Passwords**: Never include `.env` files, plain passwords, session bearer tokens, or test credentials in the submitted folder.
- [ ] **PBKDF2-HMAC-SHA256 Storage**: Passwords hashed via 100,000 iterations with per-user 128-bit random salt (`BCryptGenRandom` via Windows CNG); constant-time equality checks used for digests and tokens.
- [ ] **Strict Backend RBAC**: All mutating endpoints (`POST`/`PUT`/`DELETE` on brands, categories, products; `POST` stock adjustments) verify bearer token server-side regardless of UI state.
- [ ] **First-Launch Guard**: Omitting `ADMIN_INITIAL_PASSWORD` on a fresh database creates zero admin accounts and returns HTTP `503` on unlock until configured properly.
- [ ] **In-Memory Sessions & CORS**: Admin bearer tokens are held solely in RAM (invalidated on restart); Crow CORS middleware restricts `Access-Control-Allow-Origin` to the configured frontend origin.

---

## 7. Database & Data Integrity Considerations

- [ ] **Exact Monetary Arithmetic**: Prices, discounts, and totals stored in `int64_t` integer paise (no floating-point currency drift).
- [ ] **ACID Checkout & WAL**: `BillRepository::saveBill` executes inside RAII `Transaction` with `UPDATE ... WHERE stock >= ? AND is_active = 1` guards and `PRAGMA foreign_keys = ON`.
- [ ] **SQLite Sidecar Safety (`-wal` / `-shm`)**: Never copy or archive a SQLite `.db` while servers are running, and **never delete `-wal` or `-shm` files independently of a live `.db` without checkpointing first**, as uncheckpointed data in `-wal` would be lost.
- [ ] **Clean Submission DB State**: For evaluator submission, package an empty `backend/data/` folder (do not include developer/QA databases or orphan WAL/SHM artifacts) so `start-app.ps1` initializes a clean schema cleanly on first launch.

---

## 8. Final Original-File Integrity Check

Before creating your final submission package, verify that `Supermarket_billing_System/1.cpp` matches these exact values:

- **Expected Size**: `12551` bytes
- **Expected SHA-256**: `9726D67DB15404B2619B157353E220BD3589A7515402AB4C4878A0355E13592C`

Verification command (run from `OOPS-Sem-III-Lab/` in PowerShell):

```powershell
Get-FileHash .\Supermarket_billing_System\1.cpp -Algorithm SHA256
(Get-Item .\Supermarket_billing_System\1.cpp).Length
```
