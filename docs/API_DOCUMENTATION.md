# REST API Documentation: Supermarket Management System

**Base URL:** `http://localhost:8080`
**Transport:** HTTP/1.1
**Content-Type:** `application/json`
**Security Model:** Two-Mode Role Architecture:
- **Public (Customer Mode):** Accessible without authentication.
- **Staff Mode (Protected):** Requires HTTP header: `Authorization: Bearer <sms_staff_token>`.

---

## 1. Authentication & Session Management

### 1.1 Staff Login (Mode Transition)
Authenticates a staff member and provides a bearer token.

- **Method / Route:** `POST /api/auth/staff/login` *(Alias: `POST /api/auth/admin/unlock`)*
- **Access Level:** Public (Anyone with the staff password)
- **Request Body:**
  ```json
  {
    "password": "admin123"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "token": "sms_staff_a1b2c3d4e5f6...",
    "role": "STAFF",
    "expiresIn": 86400
  }
  ```
- **Error Response (`401 Unauthorized`):**
  ```json
  {
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
    "authenticated": false,
    "role": "CUSTOMER"
  }
  ```
- **Response (Staff / Authenticated) (`200 OK`):**
  ```json
  {
    "authenticated": true,
    "role": "STAFF"
  }
  ```

---

### 1.3 Staff Logout
Invalidates the current staff session and reverts the caller to Customer Mode.

- **Method / Route:** `POST /api/auth/logout`
- **Access Level:** Public / Staff
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
    "service": "supermarket_server",
    "version": "1.0.0"
  }
  ```

---

## 3. Product Catalog Endpoints

### 3.1 List Products
Fetches supermarket products with optional search and filters.

- **Method / Route:** `GET /api/products`
- **Access Level:** Public (Customer & Staff)
- **Query Parameters:**
  - `active_only`: `true` (default) or `false`
  - `category_id`: Integer category filter
  - `brand_id`: Integer brand filter
  - `search`: String matching name or SKU
- **Success Response (`200 OK`):**
  ```json
  [
    {
      "id": 1,
      "sku": "AASH-ATT-001",
      "name": "Aashirvaad Superior MP Sharbati Atta 5kg",
      "brandId": 1,
      "brandName": "Aashirvaad",
      "categoryId": 1,
      "categoryName": "Grains & Staples",
      "productType": "NON_PERISHABLE",
      "priceInPaise": 34900,
      "priceFormatted": "₹349.00",
      "stock": 45,
      "expiryDate": null,
      "discountType": "PERCENTAGE",
      "discountValue": 5.0,
      "isActive": true
    }
  ]
  ```

---

### 3.2 Get Product by ID
Retrieves details for a single product.

- **Method / Route:** `GET /api/products/<int:id>`
- **Access Level:** Public (Customer & Staff)
- **Success Response (`200 OK`):** Single product JSON object.
- **Error Response (`404 Not Found`):** `{"error": "Product not found"}`

---

### 3.3 Create Product
Registers a new product in the store catalog.

- **Method / Route:** `POST /api/products`
- **Access Level:** **STAFF ONLY** (`requireStaff`)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "sku": "TAT-TEA-002",
    "name": "Tata Tea Premium 500g",
    "brandId": 2,
    "categoryId": 4,
    "productType": "NON_PERISHABLE",
    "priceInPaise": 28000,
    "stock": 60,
    "discountType": "NONE",
    "discountValue": 0.0
  }
  ```
- **Success Response (`201 Created`):** `{"id": 26, "sku": "TAT-TEA-002", ...}`
- **Error Response (`401 Unauthorized`):** `{"error": "Staff authentication required"}`

---

### 3.4 Update Product
Modifies an existing product's metadata, pricing, or discount.

- **Method / Route:** `PUT /api/products/<int:id>`
- **Access Level:** **STAFF ONLY** (`requireStaff`)
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (`200 OK`):** Updated product JSON object.

---

### 3.5 Deactivate Product (Soft Delete)
Sets `is_active = 0` to prevent future purchases while preserving historical invoice links.

- **Method / Route:** `DELETE /api/products/<int:id>`
- **Access Level:** **STAFF ONLY** (`requireStaff`)
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (`200 OK`):** `{"success": true, "message": "Product deactivated"}`

---

## 4. Point-of-Sale & Billing Endpoints

### 4.1 Execute Checkout (Create Bill)
Executes an atomic checkout. Validates stock, calculates integer paise discounts, writes historical invoice snapshots, decrements inventory, and logs audit movements.

- **Method / Route:** `POST /api/bills`
- **Access Level:** Public (Customer Self-Service & Staff POS)
- **Request Body:**
  ```json
  {
    "customerName": "Rohan Sharma",
    "customerPhone": "9876543210",
    "items": [
      {
        "productId": 1,
        "quantity": 2
      },
      {
        "productId": 5,
        "quantity": 1
      }
    ]
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "id": 14,
    "billNumber": "BILL-20261118-0014",
    "customerName": "Rohan Sharma",
    "customerPhone": "9876543210",
    "subtotalPaise": 74800,
    "subtotalFormatted": "₹748.00",
    "totalDiscountPaise": 3490,
    "totalDiscountFormatted": "₹34.90",
    "finalAmountPaise": 71310,
    "finalAmountFormatted": "₹713.10",
    "createdAt": "2026-11-18 02:00:00",
    "items": [
      {
        "productId": 1,
        "productName": "Aashirvaad Superior MP Sharbati Atta 5kg",
        "brandName": "Aashirvaad",
        "unitPricePaise": 34900,
        "discountType": "PERCENTAGE",
        "discountValue": 5.0,
        "unitDiscountPaise": 1745,
        "finalUnitPricePaise": 33155,
        "quantity": 2,
        "lineTotalPaise": 66310
      }
    ]
  }
  ```
- **Error Response (`400 Bad Request`):**
  ```json
  {
    "error": "Insufficient stock for product: Fresh Organic Baby Spinach (requested 4, available 3)"
  }
  ```

---

### 4.2 Get Bill by ID (View Receipt)
Retrieves the immutable invoice snapshot for printing or customer review.

- **Method / Route:** `GET /api/bills/<int:id>`
- **Access Level:** Public (Customer & Staff)
- **Success Response (`200 OK`):** Complete bill object matching the schema above.

---

### 4.3 Get Bill Ledger
Retrieves historical sales invoices.

- **Method / Route:** `GET /api/bills`
- **Access Level:** **STAFF ONLY** (`requireStaff`)
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** `limit` (default 50), `offset` (default 0)
- **Success Response (`200 OK`):** Array of historical bills.
- **Error Response (`401 Unauthorized`):** `{"error": "Staff authentication required"}`

---

### 4.4 Get Sales Analytics Summary
Aggregates sales metrics for the operational dashboard.

- **Method / Route:** `GET /api/bills/summary`
- **Access Level:** **STAFF ONLY** (`requireStaff`)
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (`200 OK`):**
  ```json
  {
    "todaySalesPaise": 1425000,
    "todaySalesFormatted": "₹14,250.00",
    "todayBillsCount": 28,
    "totalProducts": 25,
    "lowStockCount": 1,
    "outOfStockCount": 0,
    "topSellingProducts": [
      {"name": "Amul Butter 500g", "unitsSold": 34, "revenuePaise": 952000}
    ]
  }
  ```

---

## 5. Inventory & Stock Endpoints

### 5.1 Low Stock Alerts
Lists all items where `stock <= 5`.

- **Method / Route:** `GET /api/inventory/low-stock`
- **Access Level:** **STAFF ONLY** (`requireStaff`)
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (`200 OK`):** Array of low stock products.

---

### 5.2 Stock Intake & Audit Adjustment
Records manual stock changes with an audit justification.

- **Method / Route:** `POST /api/inventory/adjust`
- **Access Level:** **STAFF ONLY** (`requireStaff`)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "productId": 1,
    "movementType": "ADDITION",
    "quantityChange": 20,
    "reason": "Supplier shipment received (PO-8821)"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "previousStock": 45,
    "newStock": 65
  }
  ```

---

### 5.3 Inventory Movement Log
Retrieves the immutable audit trail of all historical inventory shifts.

- **Method / Route:** `GET /api/inventory/movements`
- **Access Level:** **STAFF ONLY** (`requireStaff`)
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (`200 OK`):** Array of movement log records.

---

## 6. Category & Brand Taxonomy Endpoints

| Endpoint | Method | Access Level | Description |
| :--- | :---: | :---: | :--- |
| `/api/categories` | `GET` | Public | List all store categories |
| `/api/categories` | `POST` | **Staff** | Create a new retail category |
| `/api/categories/<id>/brands` | `GET` | Public | List authorized brands for category |
| `/api/categories/<id>/brands` | `POST` | **Staff** | Associate brand to category |
| `/api/categories/<id>/brands/<bid>` | `DELETE` | **Staff** | Disassociate brand from category |
| `/api/brands` | `GET` | Public | List all retail brands |
| `/api/brands` | `POST` | **Staff** | Create a new brand record |
