# Evaluator Quick Start (`START_HERE.md`)

Welcome! Follow these steps to build, test, and run the **Supermarket Billing & Inventory Management System** on **Windows 10 / 11**.

> The original academic console submission at `../Supermarket_billing_System/1.cpp` has been preserved completely unmodified.

---

## 1. Prerequisites

Ensure the following tools are installed on your Windows machine:
- **Visual Studio 2022 Build Tools** (or Visual Studio Community) with **Desktop development with C++** (MSVC C++17 + Windows SDK) and **CMake**
- **Node.js 20 or newer** (`20+` / `22+` / `24+`) and **npm** *(Node.js 20 or newer is required; React 18 remains in use and React Router 7 is installed)*

*(All C++ third-party libraries — SQLite3, Crow, Standalone Asio, and nlohmann/json — are already bundled under `backend/third_party/`.)*

---

## 2. Build & Verify Everything

Open **PowerShell** inside `Supermarket_Management_System/` and run:

```powershell
.\build-and-test.ps1 -InstallDependencies
```

This configures CMake, compiles the Release C++ binaries, runs all **5 C++ CTest suites**, installs frontend packages via `npm ci`, and verifies the React + TypeScript production build.

*(If `frontend/node_modules/` is already installed, omit `-InstallDependencies`.)*

---

## 3. Launch the Application (One Command)

From `Supermarket_Management_System/`, run:

```powershell
.\start-app.ps1
```

On first launch (fresh SQLite database at `backend/data/supermarket.db`):
1. The script prompts securely (hidden input) for an initial **Administrator password** (`ADMIN_INITIAL_PASSWORD`, minimum 6 characters).
2. Both the C++ REST API (`http://localhost:8080`) and React frontend (`http://localhost:5173`) start automatically.
3. Your default browser opens at `http://localhost:5173`.

Press **`Ctrl+C`** in the PowerShell window when done to cleanly stop both servers. Your SQLite database is preserved across restarts.

---

## 4. Suggested Demo Walkthrough

1. **Staff POS Default:** Notice the header opens in **Staff Mode (POS)**. Operations like **Product Creation**, **Brand/Category Management**, and **Stock Adjustments** are protected (`401` on backend) until unlocked.
2. **Unlock Admin Mode:** Click **Unlock Admin** in the top header and enter the administrator password you chose at startup.
3. **Create Catalog Items:** Add Brands/Categories under **Admin Management**, then create Perishable & Non-Perishable products with Percentage or Fixed discounts under **Product Catalog**.
4. **Test POS Checkout:** Go to **Billing / POS**, add items to the cart, complete checkout, and inspect the formatted receipt & **Transaction History** snapshot.
5. **Explore C++ Architecture:** Visit **OOP Concepts Explorer** (`/oop-concepts`) for live class diagrams, code excerpts mapped to real `backend/` files, an interactive Discount Strategy simulator, Object Slicing demo, and quiz.

---

## 5. Important Notes

- **Admin Password Persistence:** Once initialized in SQLite, subsequent runs keep the stored PBKDF2 hash and do **not** overwrite it from `ADMIN_INITIAL_PASSWORD`. No built-in password-reset mechanism exists; if you need a clean reset, stop the server, back up/move `backend/data/supermarket.db*` (including `-wal`/`-shm` sidecars), or pass a new `-DbPath` to `.\start-app.ps1`.
- **Sessions After Restart:** Admin bearer tokens are held in backend memory only. Restarting the backend logs out active Admin sessions, and Staff simply re-unlocks Admin Mode in the header.
- **Frontend Dependencies & Offline Operation:** React 18 remains in use with React Router 7 installed (requiring Node.js 20 or newer). First dependency installation (`.\build-and-test.ps1 -InstallDependencies` or `npm ci` when `frontend/node_modules/` is missing) may require internet or cached npm packages. The application runs offline after dependencies are installed (all C++ dependencies are bundled under `backend/third_party/`, and font links in `frontend/index.html` fall back to system fonts).
- **Windows Requirement:** Backend PBKDF2 cryptography uses Windows CNG (`bcrypt.h`), so the server builds and runs on Windows only.

---

## 6. Troubleshooting

- **Port `8080` or `5173` Already in Use:** Stop the conflicting listener (`Get-NetTCPConnection -LocalPort 8080,5173 -State Listen`) or launch the backend on a different port with `.\start-app.ps1 -Port 8081` (Vite uses strict port `5173` to match default CORS).
- **Admin Unlock Returns HTTP `503` on Fresh Database:** Happens if `supermarket_server.exe` was started manually against a new database without setting `$env:ADMIN_INITIAL_PASSWORD` (minimum `6` characters; `.env` files are not auto-read). Stop the backend, set `ADMIN_INITIAL_PASSWORD` in PowerShell, or launch with `.\start-app.ps1`.
- **Changing `ADMIN_INITIAL_PASSWORD` Does Not Update Login:** The stored database hash cannot be overwritten via environment variable, and there is no reset mechanism. Back up/move the existing `.db*` files before initializing a new database.
- **`Admin Mode` Relocked After Server Restart:** Restarting the backend clears in-memory session tokens; click **Unlock Admin** in the header to sign in again.
- **`npm ci` Fails Offline:** Connect to the internet once or ensure required npm packages from `frontend/package-lock.json` are already in the local npm cache (`.\build-and-test.ps1` skips `npm ci` automatically whenever `frontend/node_modules/` already exists).
