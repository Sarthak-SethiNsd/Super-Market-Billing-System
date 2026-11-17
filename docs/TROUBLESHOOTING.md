# Operational Troubleshooting Guide

## Table of Contents
- [1. Port Conflicts (8080 or 5173 In Use)](#1-port-conflicts-8080-or-5173-in-use)
- [2. Database Path & Missing Catalog Issues](#2-database-path-missing-catalog-issues)
- [3. Authentication & Password Issues](#3-authentication-password-issues)
  - [3.1 Admin Unlock Returns HTTP 503](#31-admin-unlock-returns-http-503)
  - [3.2 Changing Password Variable Does Not Reset Password](#32-changing-password-variable-does-not-reset-password)
  - [3.3 Session Invalidation After Restart](#33-session-invalidation-after-restart)
- [4. Build & Compiler Compilation Errors](#4-build-compiler-compilation-errors)
  - [4.1 CMake Cannot Find MSVC / Visual Studio](#41-cmake-cannot-find-msvc-visual-studio)
  - [4.2 Missing Windows CNG or Socket Libraries](#42-missing-windows-cng-or-socket-libraries)
- [5. Frontend & Network Connectivity Issues](#5-frontend-network-connectivity-issues)
  - [5.1 Cross-Origin Resource Sharing (CORS) Blocked](#51-cross-origin-resource-sharing-cors-blocked)
  - [5.2 Vite Strict Port Error](#52-vite-strict-port-error)
  - [5.3 npm ci Fails Offline](#53-npm-ci-fails-offline)
- [6. Docker & Linux Deployment Issues](#6-docker-linux-deployment-issues)
  - [6.1 OpenSSL Linker Failure](#61-openssl-linker-failure)
  - [6.2 Ephemeral Database Disappears After Restart](#62-ephemeral-database-disappears-after-restart)

---

## 1. Port Conflicts (8080 or 5173 In Use)

### Symptom
`start-app.ps1` fails with:
`[ERROR] Port 8080 is already in use` or `[ERROR] Frontend port 5173 is already in use`.

### Root Cause
A previously running instance of `supermarket_server.exe` or Vite dev server was not terminated cleanly.

### Solution
Identify and terminate the listening processes via PowerShell:
```powershell
# Terminate process holding backend port 8080
$backendConn = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($backendConn) { Stop-Process -Id $backendConn.OwningProcess -Force }

# Terminate process holding frontend port 5173
$frontendConn = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($frontendConn) { Stop-Process -Id $frontendConn.OwningProcess -Force }
```
Alternatively, launch on another port:
```powershell
.\start-app.ps1 -Port 8081
```

---

## 2. Database Path & Missing Catalog Issues

### Symptom
The application launches, but the POS terminal or Product Catalog shows 0 products, or the launcher prompts for an initial administrator password.

### Root Cause
The server is looking for the database at a path different from where the demonstration data was seeded.

### Solution
The system uses the canonical database path:
$$\mathbf{backend/data/supermarket.db}$$

1. Verify that `backend/data/supermarket.db` exists.
2. If missing or empty, seed the canonical database:
   ```powershell
   cd backend\build\Release
   .\supermarket_seeder.exe
   ```
   *The seeder automatically detects and populates `backend/data/supermarket.db`.*

---

## 3. Authentication & Password Issues

### 3.1 Admin Unlock Returns HTTP 503
- **Cause:** The SQLite database was initialized without providing `ADMIN_INITIAL_PASSWORD`, resulting in 0 rows in the `users` table.
- **Fix:** Seed the database using `supermarket_seeder.exe` (which provisions `admin` / `admin123`) or launch via `.\start-app.ps1` which prompts for an initial password.

### 3.2 Changing Password Variable Does Not Reset Password
- **Cause:** `ADMIN_INITIAL_PASSWORD` is only read once during initial database creation. Stored PBKDF2 hashes are never overwritten on subsequent startups.
- **Fix:** No password reset backdoor exists. To start completely fresh, back up and move `backend/data/supermarket.db`, then re-run `.\start-app.ps1`.

### 3.3 Session Invalidation After Restart
- **Cause:** Administrator bearer tokens are kept strictly in backend RAM for maximum security.
- **Fix:** This is normal behavior. Whenever the backend process terminates or restarts, click **Unlock Admin** in the web header to re-authenticate.

---

## 4. Build & Compiler Compilation Errors

### 4.1 CMake Cannot Find MSVC / Visual Studio
- **Cause:** Build tools are missing or the shell is not running in an environment where MSVC tools can be located.
- **Fix:** Install the **Desktop development with C++** workload in Visual Studio Installer. The script `build-and-test.ps1` automatically probes standard Visual Studio 2022 installation paths.

### 4.2 Missing Windows CNG or Socket Libraries
- **Cause:** Linking errors mentioning `BCryptGenRandom`, `WSAStartup`, or `AcceptEx`.
- **Fix:** Ensure `backend/CMakeLists.txt` links Windows system libraries (`bcrypt`, `ws2_32`, `mswsock`):
  ```cmake
  if(WIN32)
      target_link_libraries(supermarket_domain PUBLIC bcrypt ws2_32 mswsock)
  endif()
  ```

---

## 5. Frontend & Network Connectivity Issues

### 5.1 Cross-Origin Resource Sharing (CORS) Blocked
- **Symptom:** Browser console displays `Access-Control-Allow-Origin blocked`.
- **Fix:** Ensure the backend `CORS_ALLOWED_ORIGIN` environment variable exactly matches the frontend URL:
  ```powershell
  $env:CORS_ALLOWED_ORIGIN = "http://localhost:5173"
  ```

### 5.2 Vite Strict Port Error
- **Symptom:** Vite outputs `Port 5173 is in use, trying another one...` and fails.
- **Fix:** `frontend/vite.config.ts` enforces `strictPort: true` so the client port matches the backend CORS configuration. Kill any orphaned node processes holding port 5173.

### 5.3 npm ci Fails Offline
- **Cause:** `npm ci` requires internet access if local package cache is absent.
- **Fix:** If dependencies are already installed in `frontend/node_modules/`, run `.\build-and-test.ps1` without `-InstallDependencies`. It will skip npm package downloading and run completely offline.

---

## 6. Docker & Linux Deployment Issues

### 6.1 OpenSSL Linker Failure
- **Symptom:** `EVP_PKCS5_PBKDF2_HMAC` or `RAND_bytes` undefined reference on Linux.
- **Fix:** Ensure `libssl-dev` is installed in the Docker builder stage and `OpenSSL::Crypto` is linked in `CMakeLists.txt`:
  ```cmake
  find_package(OpenSSL REQUIRED)
  target_link_libraries(supermarket_domain PUBLIC OpenSSL::Crypto)
  ```

### 6.2 Ephemeral Database Disappears After Restart
- **Symptom:** Products or bills disappear when deploying to cloud container hosts.
- **Fix:** Mount a persistent cloud volume to `/app/data` (e.g., `-v my_volume:/app/data`). SQLite database files residing on container root filesystems are ephemeral and reset upon container restarts.
