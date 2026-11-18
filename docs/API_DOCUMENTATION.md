# REST API Documentation: Supermarket Management System (ApexMart)

**Base URL:** `http://localhost:8080`  
**Transport:** HTTP/1.1  
**Content-Type:** `application/json`  
**Security Model:** Two-Tier Role Architecture:
- **Public (Customer Mode):** Accessible without authentication. Supports product discovery, real-time stock reservations, and atomic self-service checkout.
- **Staff Mode (Protected):** Requires HTTP header: `Authorization: Bearer <sms_staff_token>`.

---

## 1. Authentication & Session Management

### 1.1 Staff Login (Mode Transition)
Authenticates a staff member and provides a 64-character bearer token.

- **Method / Route:** `POST /api/auth/staff/login` *(Alias: `POST /api/auth/admin/unlock`)*
- **Access Level:** Public (Anyone with the staff password)
- **Request Body:**
  ```json
  {
    "password": "Staff@123"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Staff privileges unlocked successfully",
    "data": {
      "unlocked": true,
      "token": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "role": "STAFF",
      "expiresIn": 86400
    }
  }
  ```
- **Error Response (`401 Unauthorized`):**
  ```json
  {
    "success": false,
    "error": "Invalid staff credentials"
  }
  ```

---

### 1.2 Inspect Current Session
Inspects the caller's active session role.

- **Method / Route:** `GET /api/auth/session`
- **Access Level:** Public
- **Headers:** Optional `Authorization: Bearer <token>`
- **Response (Customer / Unauthenticated) (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Customer session",
    "data": {
      "authenticated": false,
      "role": "CUSTOMER"
    }
  }
  ```
- **Response (Staff / Authenticated) (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Session is active",
    "data": {
      "authenticated": true,
      "role": "STAFF",
      "expiresIn": 86400
    }
  }
  ```

---

### 1.3 Staff Logout
Invalidates the current staff session and reverts the caller to Customer Mode.

- **Method / Route:** `POST /api/auth/logout`
- **Access Level:** Staff
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## 2. Health & Diagnostics

### 2.1 Health Probe
System health check for container readiness and frontend connectivity.

- **Method / Route:** `GET /api/health`
- **Access Level:** Public (Customer & Staff)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "ok",
    "service": "supermarket-management-backend",
    "version": "1.0.0"
  }
  ```

---

## 3. Multi-Session Cart Reservation Endpoints (`/api/cart/*`)

The multi-session cart reservation subsystem prevents race conditions and stock conflicts across concurrent shoppers.

- **Storage:** `product_reservations` SQLite table (Migration v6).
- **Default TTL:** 900 seconds (15 minutes).
- **Dynamic Formula:**
  $$\text{availableStock} = \max(0, \text{totalStock} - \text{reservedStock})$$
- **Automatic Clearance:** Reservations are automatically released atomically upon invoice creation (`POST /api/bills` with `sessionId`).

### 3.1 Get Active Cart Reservations
- **Method / Route:** `GET /api/cart`
- **Access Level:** Public
- **Query Parameters:** `sessionId` (or `X-Session-ID` header)
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Active cart reservations retrieved",
    "data": {
      "sessionId": "sess_8f3a91bc_m1c3",
      "totalReservedUnits": 2,
      "itemCount": 1,
      "items": [
        {
          "id": 1,
          "sessionId": "sess_8f3a91bc_m1c3",
          "productId": 4,
          "productName": "Tata Tea Gold 500g",
          "sku": "SKU-BEV-001",
          "quantity": 2,
          "expiresAt": 1731908400,
          "remainingSeconds": 875
        }
      ]
    }
  }
  ```

### 3.2 Reserve Cart Stock
- **Method / Route:** `POST /api/cart/reserve`
- **Access Level:** Public
- **Request Body:**
  ```json
  {
    "sessionId": "sess_8f3a91bc_m1c3",
    "productId": 4,
    "quantity": 2,
    "ttlSeconds": 900
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Stock reservation updated successfully",
    "data": {
      "sessionId": "sess_8f3a91bc_m1c3",
      "productId": 4,
      "productName": "Tata Tea Gold 500g",
      "quantity": 2,
      "totalStock": 45,
      "reservedStock": 2,
      "availableStock": 43,
      "ttlSeconds": 900
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `InvalidQuantityException` if `quantity <= 0`.
  - `409 Conflict`: `InsufficientStockException` if requested reservation exceeds available stock.

### 3.3 Release Single Item Reservation
- **Method / Route:** `POST /api/cart/release`
- **Access Level:** Public
- **Request Body:**
  ```json
  {
    "sessionId": "sess_8f3a91bc_m1c3",
    "productId": 4
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Reservation released successfully",
    "data": {
      "sessionId": "sess_8f3a91bc_m1c3",
      "productId": 4,
      "released": true
    }
  }
  ```

### 3.4 Clear Session Cart
- **Method / Route:** `POST /api/cart/clear`
- **Access Level:** Public
- **Request Body:**
  ```json
  {
    "sessionId": "sess_8f3a91bc_m1c3"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Cart reservations cleared successfully",
    "data": {
      "sessionId": "sess_8f3a91bc_m1c3",
      "clearedReservations": 1
    }
  }
  ```

---

## 4. Product Catalog & Batch Endpoints (`/api/products/*`)

### 4.1 Get Product Catalog
- **Method / Route:** `GET /api/products`
- **Access Level:** Public
- **Query Parameters:** `q`, `brandId`, `categoryId`, `productType`, `minPrice`, `maxPrice`, `inStockOnly`, `limit`, `offset`
- **Success Response (`200 OK`):** Paginated array of products with calculated available stock and reserved quantities.

### 4.2 Get Product Details
- **Method / Route:** `GET /api/products/<int:id>`
- **Access Level:** Public
- **Success Response (`200 OK`):** Single product JSON record.

### 4.3 Add Product or Duplicate Restock
- **Method / Route:** `POST /api/products`
- **Access Level:** Staff (`Authorization: Bearer <token>`)
- **Behavior:** If SKU and normalized name/category match an existing product, it restocks the item automatically and logs an `ADDITION` movement.
- **Request Body:**
  ```json
  {
    "sku": "SKU-BEV-001",
    "name": "Tata Tea Gold 500g",
    "brandId": 3,
    "categoryId": 4,
    "productType": "NON_PERISHABLE",
    "priceInPaise": 36000,
    "stock": 25,
    "discount": {
      "type": "FIXED",
      "value": 50.0
    }
  }
  ```
- **Success Response (`200 OK` - Restocked):**
  ```json
  {
    "success": true,
    "message": "Existing item detected. Stock successfully increased by 25 units.",
    "data": { "id": 4, "currentStock": 70 }
  }
  ```

### 4.4 Update Product & Audit Price/Discount
- **Method / Route:** `PUT /api/products/<int:id>`
- **Access Level:** Staff (`Authorization: Bearer <token>`)
- **Behavior:** Updates product attributes. Any modification to price or discount strategy automatically generates an immutable audit entry in `price_history`.

### 4.5 Product Batches (FEFO Tracking)
- **Method / Route:** `GET /api/products/<int:id>/batches` (List FEFO batches)
- **Method / Route:** `POST /api/products/<int:id>/batches` (Add new batch with expiry date)
- **Access Level:** Staff (`Authorization: Bearer <token>`)

---

## 5. Billing & Purchase Approval Endpoints (`/api/bills/*`)

### 5.1 Purchase Approval & Checkout Execution
- **Method / Route:** `POST /api/bills`
- **Access Level:** Public / Staff
- **Architecture:** Atomic purchase approval model. Does not require external gateway or admin confirmation.
- **Request Body:**
  ```json
  {
    "sessionId": "sess_8f3a91bc_m1c3",
    "customerName": "Rahul Verma",
    "customerPhone": "9876543210",
    "items": [
      { "productId": 1, "quantity": 2 },
      { "productId": 4, "quantity": 1 }
    ]
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Invoice created successfully",
    "data": {
      "id": 16,
      "billNumber": "INV-20261118023045-812-001",
      "customerName": "Rahul Verma",
      "customerPhone": "9876543210",
      "subtotalPaise": 95000,
      "subtotalInRupees": 950.0,
      "totalDiscountPaise": 5000,
      "totalDiscountInRupees": 50.0,
      "finalAmountPaise": 90000,
      "finalAmountInRupees": 900.0,
      "createdAt": "2026-11-18 02:30:45",
      "itemCount": 2,
      "items": [ ... ]
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `InvalidQuantityException` if `quantity <= 0`.
  - `400 Bad Request`: `InsufficientStockException` if requested quantity exceeds inventory.

### 5.2 Get Invoice Receipt Snapshot
- **Method / Route:** `GET /api/bills/<int:id>`
- **Access Level:** Public / Staff
- **Success Response (`200 OK`):** Complete immutable invoice snapshot.

### 5.3 Get Sales Analytics Summary
- **Method / Route:** `GET /api/bills/summary`
- **Access Level:** Staff (`Authorization: Bearer <token>`)
- **Success Response (`200 OK`):** Aggregate net revenue, gross revenue, discounts, and total units sold.

---

## 6. Inventory & Stock Management (`/api/inventory/*`)

### 6.1 Inventory Summary Metrics
- **Method / Route:** `GET /api/inventory/summary`
- **Access Level:** Staff (`Authorization: Bearer <token>`)

### 6.2 Immutable Stock Movement Audit Ledger
- **Method / Route:** `GET /api/inventory/movements`
- **Access Level:** Staff (`Authorization: Bearer <token>`)

### 6.3 Manual Stock Adjustments
- **Method / Route:** `POST /api/inventory/adjustments`
- **Access Level:** Staff (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "productId": 1,
    "movementType": "ADDITION",
    "quantityChange": 20,
    "reason": "Supplier shipment intake Batch #B2026-11"
  }
  ```

---

## 7. Category, Brand, and Customer Endpoints

| Endpoint | Method | Access Level | Description |
| :--- | :---: | :---: | :--- |
| `/api/categories` | `GET` | Public | List categories with product counts |
| `/api/categories` | `POST` | Staff | Create new category |
| `/api/categories/<id>/brands` | `GET` | Public | List authorized brands for category |
| `/api/categories/<id>/brands` | `POST` | Staff | Associate brand to category |
| `/api/brands` | `GET` | Public | List manufacturer brands |
| `/api/brands` | `POST` | Staff | Register new brand |
| `/api/customers` | `GET` | Staff | List registered customers |
| `/api/customers` | `POST` | Staff | Register customer profile |
| `/api/customers/<id>` | `GET` | Staff | View customer profile and lifetime spend |
