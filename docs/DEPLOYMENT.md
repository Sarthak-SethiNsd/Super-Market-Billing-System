# Deployment and Hosting Guide

## Table of Contents
- [1. Deployment Architecture](#1-deployment-architecture)
- [2. Multi-Stage Docker Build (`backend/Dockerfile`)](#2-multi-stage-docker-build-backenddockerfile)
- [3. Container Execution & Port Binding](#3-container-execution-port-binding)
- [4. Frontend Static Hosting (Vite + Nginx / Cloudflare Pages)](#4-frontend-static-hosting-vite-nginx-cloudflare-pages)
- [5. Environment Variables & Cross-Origin Resource Sharing (CORS)](#5-environment-variables-cross-origin-resource-sharing-cors)
- [6. Health Checks & Monitoring](#6-health-checks-monitoring)
- [7. Operational Constraints of Cloud Deployment](#7-operational-constraints-of-cloud-deployment)
  - [7.1 Ephemeral Container Storage](#71-ephemeral-container-storage)
  - [7.2 Free-Tier Sleep Latency](#72-free-tier-sleep-latency)
  - [7.3 In-Memory Session Invalidation](#73-in-memory-session-invalidation)
- [8. Security & Secret Protection](#8-security-secret-protection)

---

## 1. Deployment Architecture

The application can be hosted in production or staging environments as a decoupled modern web application:
- **Backend Service:** Linux-based container running `supermarket_server` compiled with GCC/Clang and linked dynamically against OpenSSL 3.x (`libssl3`).
- **Database Storage:** SQLite3 embedded database persisted on a persistent volume mount (`/app/data/supermarket.db`).
- **Frontend SPA:** Production static assets (`frontend/dist/`) hosted on any static web host or CDN (e.g., Cloudflare Pages, Netlify, Vercel, or Nginx).

---

## 2. Multi-Stage Docker Build (`backend/Dockerfile`)

The backend includes an optimized multi-stage `Dockerfile`:

### Stage 1: Builder (`debian:bookworm-slim`)
- Installs `build-essential`, `cmake`, `pkg-config`, and `libssl-dev`.
- Copies source code, headers, and bundled dependencies.
- Executes:
  ```bash
  cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
  cmake --build build --config Release --target supermarket_server -j1
  ```

### Stage 2: Runtime (`debian:bookworm-slim`)
- Installs minimal runtime libraries: `libssl3`, `libstdc++6`, `ca-certificates`.
- Creates a dedicated non-root system user (`appuser`).
- Creates `/app/data` with ownership assigned to `appuser`.
- Copies only the stripped `supermarket_server` binary from the builder stage.
- Sets environment variables:
  ```dockerfile
  ENV HOST=0.0.0.0
  ENV DB_PATH=/app/data/supermarket.db
  ENV SESSION_DURATION_SECONDS=3600
  EXPOSE 8080
  USER appuser
  CMD ["./supermarket_server"]
  ```

---

## 3. Container Execution & Port Binding

### Building the Image
From `Supermarket_Management_System/backend/`:
```bash
docker build -t supermarket-backend:latest .
```

### Running the Container with Persistent Storage
```bash
docker run -d \
  --name supermarket-api \
  -p 8080:8080 \
  -v supermarket_data:/app/data \
  -e CORS_ALLOWED_ORIGIN="https://your-frontend-domain.com" \
  -e ADMIN_INITIAL_PASSWORD="YourSecureProductionPassword123!" \
  supermarket-backend:latest
```

*Volume Mount:* `-v supermarket_data:/app/data` guarantees that `supermarket.db` survives container restarts and upgrades.

---

## 4. Frontend Static Hosting (Vite + Nginx / Cloudflare Pages)

### Build Static Assets
From `Supermarket_Management_System/frontend/`:
```bash
# Configure API base URL for production
export VITE_API_BASE_URL="https://your-api-domain.com"

npm ci
npm run build
```
The compiled output is generated in `frontend/dist/`.

### Nginx SPA Routing Configuration
Because the frontend utilizes client-side routing via React Router, any non-asset route (e.g., `/products`, `/billing`, `/staff`) must rewrite to `/index.html`:
```nginx
server {
    listen 80;
    server_name your-frontend-domain.com;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## 5. Environment Variables & Cross-Origin Resource Sharing (CORS)

The backend enforces strict single-origin CORS matching `CORS_ALLOWED_ORIGIN`:
- Preflight `OPTIONS` requests receive `Access-Control-Allow-Origin: <origin>`, `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`, and `Access-Control-Allow-Headers: Content-Type, Authorization`.
- Ensure `CORS_ALLOWED_ORIGIN` matches the exact scheme, domain, and port of the deployed frontend (e.g., `https://apexmart.example.com`).

---

## 6. Health Checks & Monitoring

The backend exposes a lightweight health check endpoint that does not touch database locks:
```http
GET /api/health HTTP/1.1
Host: localhost:8080
```
**Expected Response (200 OK):**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "service": "supermarket-management-backend"
}
```
Use `/api/health` for Docker `HEALTHCHECK`, Kubernetes liveness probes, or cloud platform health pings.

---

## 7. Operational Constraints of Cloud Deployment

Evaluators and operators should note the following real-world operational constraints:

### 7.1 Ephemeral Container Storage
Deploying on free or serverless container platforms (e.g., Render, Railway, Fly.io) without an explicit persistent volume will store `/app/data/supermarket.db` on the container's ephemeral root filesystem. If the container restarts or re-deploys, an unmounted SQLite database will reset to zero records. Always attach a persistent volume to `/app/data`.

### 7.2 Free-Tier Sleep Latency
Free-tier hosting platforms often put inactive containers to sleep after 15 minutes of inactivity. When a customer or cashier visits the application after sleep, the first HTTP request may experience a cold-start delay of 30–50 seconds while the container initializes. Subsequent requests respond in sub-millisecond time.

### 7.3 In-Memory Session Invalidation
Administrator bearer tokens are kept strictly in backend RAM. Whenever the backend process restarts (due to sleep, scaling, or redeployment), all active admin sessions are instantly invalidated. The user must simply click **Unlock Admin** to re-authenticate.

---

## 8. Security & Secret Protection

- **Never Commit Secrets:** Do not commit `.env` files, production passwords, or bearer tokens to source control.
- **Pass Credentials via Process Environment:** Supply `ADMIN_INITIAL_PASSWORD` securely via container environment variables or secrets managers.
- **Constant-Time Verification:** Passwords and tokens are validated in constant-time to prevent timing side-channel attacks.
