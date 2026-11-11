# Supermarket Billing & Inventory Management System

A full-stack **Supermarket Billing & Inventory Management System** built for an Object-Oriented Programming (OOP) curriculum. It combines a **C++17 / Crow REST API** backend and **embedded SQLite3** persistence layer with an interactive **React + TypeScript + Vite** POS and management web application.

> Note: The original academic console reference file at `../Supermarket_billing_System/1.cpp` is preserved completely unmodified.

---

## Architecture Overview

- **C++17 Domain Engine (`backend/include/models/`, `strategies/`, `utils/`)**:
  - `Product` base class with polymorphic derived `Perishable` and `NonPerishable` types, 64-bit integer paise (`int64_t`) pricing, and encapsulated `StockInfo`.
  - Strategy Pattern (`IDiscountStrategy`) with `NoDiscountStrategy`, `PercentageDiscountStrategy`, and `FixedDiscountStrategy`.
  - Virtual inheritance resolving diamond inheritance (`Person` -> virtual `Employee` & `Customer` -> `Manager`).
  - Generic templates (`Repository<T>`, `ApiResponse<T>`) and operator overloading (`Bill::operator+=`, `BillItem::operator+`, comparisons, stream formatting).
- **SQLite3 Persistence (`backend/include/database/`, `repositories/`)**:
  - Statically compiled SQLite3 amalgamation with RAII wrappers (`DatabaseConnection`, `PreparedStatement`, `Transaction`).
  - Versioned schema migrations (`DatabaseMigrator` V1 + V2), WAL journal mode, foreign keys enforced (`PRAGMA foreign_keys = ON`), and atomic checkout/stock deduction inside `BillRepository`.
- **Crow C++17 REST API & Security (`backend/include/controllers/`, `auth/`, `server/`)**:
  - Standalone Asio multithreaded HTTP server with strict single-origin CORS middleware and Role-Based Access Control (`STAFF` default vs `ADMIN` bearer sessions).
  - PBKDF2-HMAC-SHA256 (`100,000` iterations, random 128-bit salt via Windows CNG `BCryptGenRandom`) and constant-time digest verification.
- **React + TypeScript Frontend (`frontend/src/`)**:
  - 8 routes: Dashboard (`/`), Product Catalog (`/products`), Billing / POS Terminal (`/billing`), Transaction History (`/transactions`), Inventory Management (`/inventory`), Sales Analytics (`/analytics`), Admin Management (`/admin`), and interactive C++ **OOP Concepts Explorer** (`/oop-concepts`).

---

## Verified Prerequisites & Bundled Dependencies

### Host Requirements (Install Separately on Windows)
- **Operating System:** Windows 10 / 11 (64-bit; targets `_WIN32_WINNT=0x0601`).
- **C++ Compiler:** Microsoft Visual Studio 2022 Build Tools with MSVC C++17 toolset & Windows SDK (`bcrypt.lib`, `ws2_32.lib`, `mswsock.lib`). Tested with MSVC `14.44.35207`.
- **CMake:** `3.15` or newer. Tested with CMake `3.31.6-msvc6`.
- **Node.js & npm:** **Node.js 20 or newer is required** (`v24.12.0` tested) and npm (`11.6.2` tested).

### Bundled in Repository (`backend/third_party/`, no external download required)
- **SQLite3 Amalgamation:** `3.46.1`
- **Standalone Asio:** `1.30.2`
- **Crow C++ Web Framework:** `1.3.4` (`crow_all.h`)
- **nlohmann/json:** `3.11.3`

Frontend dependencies are declared in `frontend/package.json` and pinned via `frontend/package-lock.json`: **React 18** (`react`, `react-dom`) remains in use with **React Router 7** (`react-router-dom`) installed, alongside `axios`, `recharts`, `lucide-react`, `tailwindcss`, `vite`, and `typescript`. First dependency installation may require internet or cached npm packages; the application runs offline after dependencies are installed.

---

## Directory Structure

```text
Supermarket_Management_System/
├── .gitignore
├── PROJECT_SUBMISSION_CHECKLIST.md # Final submission & verification checklist
├── README.md
├── START_HERE.md                  # Quick-start guide for first-time evaluators
├── build-and-test.ps1             # Build backend & frontend + run CTest and Vite build
├── start-app.ps1                  # One-command interactive launcher (Windows PowerShell)
├── backend/
│   ├── .env.example               # Backend environment variable documentation
│   ├── CMakeLists.txt             # C++17 CMake build definition
│   ├── data/                      # Default runtime SQLite folder (created/populated at runtime)
│   ├── include/                   # Headers: auth/, controllers/, database/, models/, repositories/, server/, strategies/, utils/
│   ├── src/                       # Implementations + main.cpp (OOP demo) + server_main.cpp (REST server)
│   ├── tests/                     # 5 CTest executables (test_discounts, test_inventory, test_billing, test_database, test_api)
│   └── third_party/               # Bundled asio, crow, nlohmann/json, sqlite3
└── frontend/
    ├── .env.example               # Frontend Vite env template
    ├── index.html
    ├── package.json & package-lock.json
    ├── vite.config.ts, tsconfig*.json, tailwind.config.js, postcss.config.js
    └── src/                       # components/, context/, data/, pages/, services/, styles/, types/
```

---

## Quick Start (Recommended on Windows)

See [`START_HERE.md`](./START_HERE.md) for the shortest evaluator walkthrough, or run directly from `Supermarket_Management_System/`:

1. **Build & Run All Automated C++ + Frontend Checks:**
   ```powershell
   .\build-and-test.ps1
   ```
   *(Pass `-InstallDependencies` if `frontend/node_modules/` has not been installed yet.)*

2. **Start Both Backend & Frontend with One Command:**
   ```powershell
   .\start-app.ps1
   ```
   The script verifies tools, prompts securely for `ADMIN_INITIAL_PASSWORD` when initializing a fresh database, sets required process environment variables (`DB_PATH`, `PORT`, `CORS_ALLOWED_ORIGIN`, `SESSION_DURATION_SECONDS`), launches `supermarket_server.exe` and Vite, opens `http://localhost:5173`, and cleanly stops both processes on `Ctrl+C`.

---

## Manual Build, Test & Startup Commands

### Backend (from `Supermarket_Management_System/backend`)
```powershell
cmake -B build -S .
cmake --build build --config Release
ctest --test-dir build -C Release --output-on-failure
```

To launch the API server manually on Windows PowerShell:
```powershell
$env:PORT = "8080"
$env:HOST = "127.0.0.1"
$env:CORS_ALLOWED_ORIGIN = "http://localhost:5173"
$env:DB_PATH = "data/supermarket.db"
$env:SESSION_DURATION_SECONDS = "3600"
$env:ADMIN_INITIAL_PASSWORD = "YourStrongPassword123!"   # Required on fresh DB (min 6 chars)

.\build\Release\supermarket_server.exe
```

### Frontend (from `Supermarket_Management_System/frontend`)
```powershell
npm ci
npm run build
npm run dev
```

---

## Environment, First-Launch Security & Database Behavior

1. **`.env` Files Are Not Auto-Loaded by C++:** `ServerConfig` and `AuthService` read **process environment variables** (`std::getenv`), not `.env` files on disk. Always set variables in your shell or run `start-app.ps1`.
2. **First-Launch Admin Password (`ADMIN_INITIAL_PASSWORD`):**
   - Must be at least **6 characters** (`AuthService::createOrUpdateAdmin`).
   - Required when initializing a fresh database where no `ADMIN` row exists in `users`. If omitted on a fresh database, no admin account is created and `POST /api/auth/admin/unlock` returns HTTP `503`.
   - Once an admin account exists in the SQLite `users` table, changing `ADMIN_INITIAL_PASSWORD` on subsequent restarts does **not** overwrite the stored password hash, and no CLI/HTTP password-reset backdoor exists.
3. **In-Memory Admin Sessions:** Bearer tokens (`64`-character hex via `BCryptGenRandom`) are stored exclusively in backend RAM and expire after `SESSION_DURATION_SECONDS` (default `3600` seconds). **Restarting the backend immediately invalidates all active admin sessions**, requiring re-unlock in the UI.
4. **Database Schema & Atomic Persistence:** On first open, SQLite creates missing parent folders automatically, enables WAL mode and foreign keys, and applies Schema V1 (`brands`, `categories`, `products`, `bills`, `bill_items`, `inventory_movements`) and Schema V2 (`users`). Completed checkout invoices store immutable line-item snapshots.

---

## REST API Endpoints Summary

| Domain | Endpoints | Access |
|---|---|---|
| **Health** | `GET /api/health` | Public |
| **Auth** | `POST /api/auth/admin/unlock`, `GET /api/auth/session`, `POST /api/auth/logout` | Public / Token |
| **Brands & Categories** | `GET /api/brands`, `GET /api/categories` (Staff); `POST`/`PUT`/`DELETE` (Admin) | Staff / Admin |
| **Products** | `GET /api/products`, `GET /api/products/summary`, `GET /api/products/{id}` (Staff); `POST`/`PUT`/`DELETE` (Admin) | Staff / Admin |
| **Inventory** | `GET /api/inventory/movements`, `GET /api/inventory/summary`, `GET /api/inventory/products/{id}/movements` (Staff); `POST /api/inventory/adjustments` (Admin) | Staff / Admin |
| **Billing** | `POST /api/bills`, `GET /api/bills`, `GET /api/bills/summary`, `GET /api/bills/{id}` | Staff / Admin |

---

## Verified Capabilities vs. Known Limitations

### Verified
- All 5 C++ CTest suites (`DiscountSuite`, `InventorySuite`, `BillingSuite`, `DatabaseSuite`, `ApiSuite`) and full backend/security E2E checks (RBAC enforcement, PBKDF2 auth, SQL injection prevention, concurrent checkout & stock-adjustment safety, SQLite WAL/FK integrity, CORS origin restriction).
- TypeScript + Vite production build (`tsc -b && vite build`) and live multi-viewport UI QA (`1440x900`, `1280x800`, `768x1024`, `375x812`) across all 8 pages and printable receipts.

### Known Portability & Design Limitations
- **Windows-Only Backend Build:** `CryptoUtils.cpp` implements PBKDF2-HMAC-SHA256 and cryptographic RNG via Windows CNG (`<bcrypt.h>`), throwing an exception for PBKDF2 on non-`_WIN32` targets, and `CMakeLists.txt` links `bcrypt`, `ws2_32`, and `mswsock`. Linux/macOS builds are not supported without replacing crypto/link dependencies.
- **Offline Operation:** First-time npm dependency installation (`npm ci` / `.\build-and-test.ps1 -InstallDependencies` when `frontend/node_modules/` is absent) requires internet access or cached npm packages. Once dependencies are installed, the application runs fully offline. (`frontend/index.html` links Google Fonts for `Inter`/`JetBrains Mono` when online and gracefully falls back to system fonts offline.)
- **No Built-In Multi-User Management or Password Reset Tool:** Authentication is single-admin (`admin` role vs default unauthenticated `STAFF` POS mode), and no CLI or UI password-reset feature exists.

---

## Troubleshooting

- **Port `8080` already in use:** Inspect or stop the existing listener (`Get-NetTCPConnection -LocalPort 8080 -State Listen`), or run `.\start-app.ps1 -Port 8081` (which also forwards `VITE_API_BASE_URL=http://localhost:8081` to the Vite dev server). If launching manually, set `$env:PORT` and matching `VITE_API_BASE_URL`.
- **Port `5173` already in use:** `frontend/vite.config.ts` sets `port: 5173` with `strictPort: true` to match the default `CORS_ALLOWED_ORIGIN`. Find the process holding `5173` (`Get-NetTCPConnection -LocalPort 5173 -State Listen`) and stop any previous Vite/dev process before restarting.
- **Fresh database returns HTTP `503` on Admin unlock:** `supermarket_server.exe` does not auto-read `.env` files. If started manually on a fresh database without `$env:ADMIN_INITIAL_PASSWORD` (minimum `6` characters), no admin row is created in `users` and `/api/auth/admin/unlock` returns HTTP `503`. Stop the backend, set `$env:ADMIN_INITIAL_PASSWORD` in PowerShell before relaunching, or use `.\start-app.ps1` which prompts securely on first database initialization.
- **Changing `ADMIN_INITIAL_PASSWORD` does not reset an existing Admin password:** Once an `ADMIN` row exists in SQLite `users`, subsequent restarts preserve the stored PBKDF2-HMAC-SHA256 hash and ignore `ADMIN_INITIAL_PASSWORD`. No password reset mechanism exists; to start with a new Admin credential, stop the server, back up and move the existing `.db` (including `-wal`/`-shm` sidecars) or specify a separate database path (`.\start-app.ps1 -DbPath data\new_demo.db`), then initialize cleanly.
- **Backend restart invalidates Admin session (`401`/`403`):** Admin bearer tokens are held strictly in backend RAM. Restarting `supermarket_server.exe` invalidates all active tokens; click **Unlock Admin** in the header to re-authenticate.
- **`npm ci` fails offline without cached packages:** Running `npm ci` (or `.\build-and-test.ps1 -InstallDependencies`) requires either internet access or all packages from `frontend/package-lock.json` present in the local npm cache. When `frontend/node_modules/` is already installed, `.\build-and-test.ps1` skips `npm ci` automatically and runs fully offline.
