# Setup and Configuration Guide

## Table of Contents
- [1. Host Environment Prerequisites](#1-host-environment-prerequisites)
- [2. Bundled Third-Party Dependencies](#2-bundled-third-party-dependencies)
- [3. Environment Variables Reference](#3-environment-variables-reference)
- [4. Automated One-Command Build & Test (`build-and-test.ps1`)](#4-automated-one-command-build-test-build-and-testps1)
- [5. Automated Application Launch (`start-app.ps1`)](#5-automated-application-launch-start-appps1)
- [6. Manual Step-by-Step Compilation](#6-manual-step-by-step-compilation)
  - [6.1 Backend C++ Compilation](#61-backend-c-compilation)
  - [6.2 Frontend React Setup](#62-frontend-react-setup)
- [7. Canonical Database Setup & Demo Seeding](#7-canonical-database-setup-demo-seeding)
- [8. Stopping and Cleaning Up](#8-stopping-and-cleaning-up)

---

## 1. Host Environment Prerequisites

### Windows Development Workstation
- **Operating System:** Windows 10 or Windows 11 (64-bit).
- **C++ Compiler:** Visual Studio 2022 Build Tools (or Community/Professional) with the **Desktop development with C++** workload.
  - Requires MSVC C++17 compiler (`cl.exe`, tested on version `14.44.35207`).
  - Windows SDK (provides `bcrypt.lib`, `ws2_32.lib`, `mswsock.lib`).
- **Build System:** CMake `3.15` or newer (tested on `3.31.6`).
- **Node.js Environment:** Node.js LTS (tested on `v24.12.0`) and npm (tested on `11.6.2`).
- **Shell:** Windows PowerShell 5.1 or PowerShell Core 7+.

---

## 2. Bundled Third-Party Dependencies

To guarantee complete offline reproducibility without dependency download failures during academic evaluation, all core C++ libraries are bundled directly inside `backend/third_party/`:
- **SQLite3 Amalgamation:** Version `3.46.1` (`sqlite3.h`, `sqlite3.c`).
- **Crow C++ Microframework:** Version `1.3.4` (`crow_all.h`).
- **Asio Standalone Networking:** Version `1.30.2`.
- **nlohmann/json:** Version `3.11.3` (`json.hpp`).

Frontend dependencies are declared in `frontend/package.json` and locked via `frontend/package-lock.json`.

---

## 3. Environment Variables Reference

The C++ backend reads **process environment variables** (`std::getenv`), NOT `.env` files on disk. The launcher `start-app.ps1` sets these automatically.

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | Port for the backend HTTP REST API daemon. |
| `HOST` | `0.0.0.0` | Network interface address to bind. |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173` | Allowed browser client origin for Cross-Origin Resource Sharing. |
| `DB_PATH` | `backend/data/supermarket.db` | Path to the canonical SQLite database file. |
| `SESSION_DURATION_SECONDS` | `3600` | In-memory lifetime for administrator bearer tokens (1 hour). |
| `ADMIN_INITIAL_PASSWORD` | *(None)* | Password used ONLY on first-time creation of the SQLite database. |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Client-side API root consumed by Vite and Axios. |

---

## 4. Automated One-Command Build & Test (`build-and-test.ps1`)

From `Supermarket_Management_System/` in PowerShell:

```powershell
# First time on a clean machine (installs frontend node_modules)
.\build-and-test.ps1 -InstallDependencies

# Subsequent runs (offline, runs all 5 C++ test suites and Vite build)
.\build-and-test.ps1
```

### Script Execution Flow:
1. Detects CMake, MSVC (`cl.exe`), CTest, Node.js, and npm.
2. Configures and builds the backend in `Release` mode using CMake.
3. Executes all 5 CTest suites (`DiscountSuite`, `InventorySuite`, `BillingSuite`, `DatabaseSuite`, `ApiSuite`).
4. Runs `npm ci` in `frontend/` (if `-InstallDependencies` passed or `node_modules` missing).
5. Runs `npm run build` (`tsc -b && vite build`) to verify zero TypeScript errors.

---

## 5. Automated Application Launch (`start-app.ps1`)

From `Supermarket_Management_System/` in PowerShell:

```powershell
.\start-app.ps1
```

### Script Execution Flow:
1. Verifies prerequisites and compiles missing binaries if necessary.
2. Inspects canonical database path: `backend/data/supermarket.db`.
   - If an existing database is found, it reports existing credentials preserved.
   - If a fresh database is being initialized, it prompts securely for an initial admin password (input hidden).
3. Spawns `supermarket_server.exe` with process environment variables set.
4. Waits for `http://127.0.0.1:8080/api/health` to return HTTP `200`.
5. Spawns Vite development server (`npm run dev`) on `http://localhost:5173`.
6. Opens the default browser to `http://localhost:5173`.
7. Monitors child processes and cleanly terminates both trees on `Ctrl+C`.

---

## 6. Manual Step-by-Step Compilation

If you prefer building each tier manually without PowerShell scripts:

### 6.1 Backend C++ Compilation
```powershell
cd backend
cmake -B build -S .
cmake --build build --config Release

# Run automated tests
ctest --test-dir build -C Release --output-on-failure

# Launch the server
$env:PORT = "8080"
$env:CORS_ALLOWED_ORIGIN = "http://localhost:5173"
$env:DB_PATH = "data/supermarket.db"
.\build\Release\supermarket_server.exe
```

### 6.2 Frontend React Setup
```powershell
cd frontend
npm ci
npm run build
npm run dev
```

---

## 7. Canonical Database Setup & Demo Seeding

The application uses `backend/data/supermarket.db`. To seed the 25-product demonstration dataset:

### Option A: Native C++ Seeder (Primary)
```powershell
cd backend\build\Release
.\supermarket_seeder.exe
```

### Option B: Standalone Python Seeder (Fallback)
```powershell
python scripts\seed_demo_data.py
```

*Both seeders are strictly idempotent and transactional: re-running them detects existing records and skips them without creating duplicate inventory movements.*

---

## 8. Stopping and Cleaning Up

- **Stopping the App:** Press `Ctrl+C` in the PowerShell window running `start-app.ps1`.
- **Port Release:** If a port remains held by an orphaned background process:
  ```powershell
  # Check port 8080
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8080 -State Listen).OwningProcess | Stop-Process -Force
  
  # Check port 5173
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5173 -State Listen).OwningProcess | Stop-Process -Force
  ```
- **Resetting Database Cleanly:** If you wish to test a completely blank database from scratch:
  1. Stop `supermarket_server.exe`.
  2. Move or back up `backend/data/supermarket.db`, `supermarket.db-wal`, and `supermarket.db-shm`.
  3. Re-run `.\start-app.ps1` to trigger first-time interactive setup.
