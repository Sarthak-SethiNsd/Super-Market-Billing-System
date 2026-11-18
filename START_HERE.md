# Evaluator Quick Start Guide (`START_HERE.md`)

Welcome! This guide provides the fastest path to compile, test, and run the **Supermarket Billing & Inventory Management System (ApexMart)** on **Windows 10 / 11**.

> [!NOTE]
> The original academic console submission file at `../Supermarket_billing_System/1.cpp` is preserved completely unmodified.

---

## 1. Prerequisites Checklist

Ensure the following tools are available on your host machine:
- **Visual Studio 2022 Build Tools** (or Community/Professional) with the **Desktop development with C++** workload (MSVC C++17 + Windows SDK).
- **CMake** (3.15 or newer).
- **Node.js** (LTS 18 / 20 / 22 / 24) and **npm**.

*(All third-party C++ dependencies — SQLite3 amalgamation, Crow, Standalone Asio, and nlohmann/json — are bundled directly inside `backend/third_party/`.)*

---

## 2. Compile & Run Automated Tests (One Command)

Open **PowerShell** inside `Supermarket_Management_System/` (or `Supermarket_Submission_Staging/Supermarket_Management_System/`):

```powershell
# On a clean workstation (installs frontend node_modules)
.\build-and-test.ps1 -InstallDependencies

# On subsequent runs (runs offline; executes all 5 C++ test suites and Vite build)
.\build-and-test.ps1
```

This script:
1. Detects CMake, MSVC (`cl.exe`), Node.js, and npm.
2. Compiles the C++ backend in Release mode.
3. Executes all **5 CTest test suites** (39/39 passing test cases).
4. Installs frontend dependencies and verifies the TypeScript production build (`tsc -b && vite build`).

---

## 3. Seed Demonstration Dataset (If Fresh Database)

The application uses the canonical database location:
$$\mathbf{backend/data/supermarket.db}$$

The database already comes pre-seeded with **25 representative Indian retail products** across **7 categories** and a demonstration staff account (password: `Staff@123` or `admin123`).

If you ever wish to re-seed or verify the database, run:
```powershell
cd backend\build\Release
.\supermarket_seeder.exe
cd ..\..\..
```
*(The seeder is 100% idempotent: running it against an already-seeded database safely skips existing records.)*

---

## 4. Launch the Application (One Command)

From `Supermarket_Management_System/` in PowerShell:

```powershell
.\start-app.ps1
```

### What Happens:
1. The script detects `backend/data/supermarket.db` and launches the C++ backend on port `8080`.
2. Starts the React + Vite frontend on port `5173`.
3. Opens your default web browser automatically to `http://localhost:5173`.

> **To stop the application:** Press **`Ctrl+C`** in the PowerShell window. Both child processes will terminate cleanly without deleting database records.

---

## 5. Quick Walkthrough for Evaluators

1. **Public Customer Website (`/`):**
   - The browser opens to the public homepage for **ApexMart**.
   - Notice the customer-focused company presentation, department highlights, and customer commitments.
   - Click the **Staff Mode** button in the top navigation bar to access the management portal (`/dashboard`).
2. **Product Catalog (`/products`):**
   - Inspect the **25 demonstration products** across 7 categories.
   - Note the **Perishable** badges with ISO expiry dates and active percentage/fixed discounts.
   - Notice the **Low Stock** badge on `Fresh Organic Baby Spinach Palak 250g` (stock = 3).
3. **POS Terminal & Checkout (`/billing`):**
   - In the search bar, type `Atta` or `Rice` to test instant reactive search.
   - Click cards to add items to cart; adjust quantities and observe reactive subtotal and discount calculations.
   - Click **Complete Sale & Print**. Verify the instant modal receipt and stock decrement.
4. **Stock Movement Audit Ledger (`/inventory`):**
   - Review the stock movement history table. Verify that the recent sale is recorded as an immutable `SALE` movement with negative quantity.
5. **Authenticate Staff Mode:**
   - In the top header or sidebar, click **Staff Login**.
   - Enter password: `Staff@123` (fallback: `admin123`).
   - The UI activates Staff Mode (purple badge), unlocking full operational dashboard analytics, product creation/editing, brand/category management, and manual stock adjustments.
6. **OOP Concepts Explorer (`/oop-concepts`):**
   - Visit the interactive educational portal to explore class hierarchy diagrams, dynamic polymorphism simulations, object slicing demos, and code excerpts mapped directly to C++ source files.

---

## 6. Comprehensive Documentation Directory

For in-depth architectural, database, and operational documentation, refer to the [`docs/`](./docs/) directory:
- [`docs/PROJECT_OVERVIEW.md`](./docs/PROJECT_OVERVIEW.md) — Problem statement, scope, and objectives.
- [`docs/FEATURES_AND_MODULES.md`](./docs/FEATURES_AND_MODULES.md) — Detailed feature specifications.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — System layers, request lifecycles, and Mermaid diagrams.
- [`docs/OOP_CONCEPTS.md`](./docs/OOP_CONCEPTS.md) — Academic OOP concepts mapped to C++ source files.
- [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) — SQLite schema, foreign keys, paise currency invariant, and backups.
- [`docs/API_REFERENCE.md`](./docs/API_REFERENCE.md) — Complete Crow REST API endpoint documentation.
- [`docs/SETUP_AND_CONFIGURATION.md`](./docs/SETUP_AND_CONFIGURATION.md) — Development prerequisites and environment variables.
- [`docs/DEMO_GUIDE.md`](./docs/DEMO_GUIDE.md) — Step-by-step evaluator demonstration script.
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — Docker build, cloud hosting, and operational constraints.
- [`docs/TESTING_AND_VERIFICATION.md`](./docs/TESTING_AND_VERIFICATION.md) — Automated CTest suites and test results.
- [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) — Resolving port conflicts and common configuration issues.
