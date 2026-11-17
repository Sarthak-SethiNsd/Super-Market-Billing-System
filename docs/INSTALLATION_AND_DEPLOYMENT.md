# Installation & Deployment Guide: Supermarket Management System

**Target Platforms:** Windows 10/11 (Primary Academic Target) & Linux Debian/Ubuntu (Docker Container)
**Toolchains:** MSVC C++17, CMake 3.15+, Node.js LTS, npm, Docker

---

## 1. Prerequisites Checklist

Ensure the following tools are installed on your host workstation before building:

### Windows Workstation
- **Visual Studio 2022 Build Tools** (or Community/Professional) with the **Desktop development with C++** workload (MSVC `cl.exe` C++17 compiler + Windows 10/11 SDK).
- **CMake** (v3.15 or newer) added to `PATH`.
- **Node.js** (LTS v18, v20, v22, or v24) and **npm** added to `PATH`.
- **Git** for version control.

> **Bundled Dependencies:** All third-party C++ libraries (SQLite 3.46.1 amalgamation, Crow v1.3.4, Standalone Asio v1.30.2, nlohmann/json v3.11.3) are bundled inside `backend/third_party/`. No external package manager (e.g., vcpkg or conan) is required.

---

## 2. Windows Local Setup & One-Command Build

### Step 2.1 Clone or Navigate to the Repository
```powershell
cd C:\Users\LENOVO\Desktop\OOPS-Sem-III-Lab\Supermarket_Submission_Staging\Supermarket_Management_System
```

### Step 2.2 Execute Automated Build & Test Script
Run the automated verification script:

```powershell
# First-time execution (installs frontend node_modules and compiles backend)
.\build-and-test.ps1 -InstallDependencies

# Subsequent runs (compiles backend, runs all 5 CTest suites, builds Vite bundle)
.\build-and-test.ps1
```

### What `build-and-test.ps1` Executes:
1. Detects CMake, MSVC compiler (`cl.exe`), Node.js, and npm.
2. Configures the CMake build directory at `backend/build/`.
3. Builds all backend binaries in `Release` configuration via MSBuild:
   - `sqlite3_lib.lib`
   - `supermarket_domain.lib`
   - `supermarket_server.exe`
   - `supermarket_seeder.exe`
   - 5 CTest test executables (`test_discounts.exe`, `test_inventory.exe`, `test_billing.exe`, `test_database.exe`, `test_api.exe`)
4. Executes all **5 CTest test suites** (34/34 passing test cases).
5. Runs the frontend production build: `tsc -b && vite build` (outputs to `frontend/dist/`).

---

## 3. Database Initialization & Seeding

The application stores all data in a single local SQLite database at:
$$\mathbf{backend/data/supermarket.db}$$

The database already comes pre-seeded with 25 Indian supermarket products, 7 categories, 19 brands, and a demonstration staff account (`admin123`).

If you ever wish to re-seed or verify the database idempotently:
```powershell
cd backend\build\Release
.\supermarket_seeder.exe
cd ..\..\..
```
*(The seeder is 100% idempotent: running it against an existing database skips existing records without throwing errors.)*

---

## 4. Starting the Application

### 4.1 One-Command Launcher (Recommended)
```powershell
.\start-app.ps1
```
This script launches `supermarket_server.exe` on port `8080`, starts the Vite frontend on port `5173`, and opens `http://localhost:5173` in your default browser.

### 4.2 Manual Startup (Two Terminal Windows)

#### Terminal 1 — Backend C++ Microservice:
```powershell
cd backend\build\Release
.\supermarket_server.exe
```
*Output: `Crow/1.3.4 server is running on http://0.0.0.0:8080`*

#### Terminal 2 — Frontend Development Server:
```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
*Output: `Local: http://127.0.0.1:5173/`*

---

## 5. Environment Variables & Configuration

The application works out of the box with default settings. Optional environment variables include:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` / `SERVER_PORT` | `8080` | Port for the C++ Crow REST server |
| `DB_PATH` | `data/supermarket.db` | Relative or absolute path to SQLite file |
| `STAFF_PASSWORD` | `admin123` | Password used to bootstrap staff account if fresh DB |
| `STAFF_INITIAL_PASSWORD` | `admin123` | Fallback alias for initial staff bootstrap |
| `VITE_API_URL` | `http://localhost:8080` | Backend API URL used by the frontend |

---

## 6. Docker & Linux Container Deployment

The repository includes a multi-stage `Dockerfile` (`backend/Dockerfile`) for containerized Linux deployments:

### 6.1 Multi-Stage Dockerfile Overview
1. **Builder Stage (`debian:bookworm-slim`):**
   - Installs `build-essential`, `cmake`, and `libssl-dev`.
   - Compiles the C++17 backend with OpenSSL 3.x PBKDF2 cryptography (`CryptoUtils.cpp`).
   - Seeds the demonstration database via `supermarket_seeder`.
2. **Runtime Stage (`debian:bookworm-slim`):**
   - Copies only the compiled `supermarket_server` binary, OpenSSL runtime shared libraries, and the pre-seeded `supermarket.db`.
   - Exposes port `8080`.
   - Runs as a lightweight, unprivileged container image.

### 6.2 Building & Running Container Locally
```bash
# Build backend image
docker build -t apexmart-backend -f backend/Dockerfile backend/

# Run container exposing port 8080
docker run -d -p 8080:8080 --name apexmart-api apexmart-backend
```

---

## 7. Cloud Deployment (Render / Cloud Hosts)

### Architecture on Cloud Platforms:
To deploy the application to cloud platforms such as **Render**:
1. **Backend Web Service:**
   - **Environment:** Docker
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Context:** `backend/`
   - **Port:** Configured via `PORT` environment variable (Crow reads `PORT` from environment).
   - **Disk:** Attach a persistent disk mount at `/app/data` to ensure `supermarket.db` persists across container restarts.
2. **Frontend Static Site:**
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `frontend/dist`
   - **Environment Variable:** `VITE_API_URL=https://your-backend-service.onrender.com`

---

## 8. Deployment Limitations & Considerations

1. **Ephemeral File Storage:** Cloud platforms without persistent volume mounts will reset SQLite database files on redeploy or container restart. Always configure persistent storage or run on a dedicated VM.
2. **Local Machine Ports:** If ports `8080` or `5173` are occupied by other software (e.g. IIS, Tomcat, or previous orphaned runs), terminate them using PowerShell:
   ```powershell
   Get-Process supermarket_server -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
3. **Cross-Origin Configuration:** In production, restrict the backend CORS origin header from `*` to the exact public frontend domain.
