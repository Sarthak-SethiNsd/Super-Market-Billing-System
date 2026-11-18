# REST API Reference — Supermarket Management System (ApexMart)

**Base URL:** `http://localhost:8080`  
**Protocol:** HTTP/1.1  
**Default Content-Type:** `application/json`  
**CORS Origin:** Configurable via `CORS_ALLOWED_ORIGIN` (default: `http://localhost:5173`)

---

## Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Standard Response Envelopes](#2-standard-response-envelopes)
3. [Authentication & RBAC Security Model](#3-authentication--rbac-security-model)
4. [Domain Exception Hierarchy & Error Mapping](#4-domain-exception-hierarchy--error-mapping)
5. [Health & Diagnostics](#5-health--diagnostics)
6. [Authentication Endpoints (`/api/auth/*`)](#6-authentication-endpoints-apiauth)
7. [Multi-Session Cart Reservation Endpoints (`/api/cart/*`)](#7-multi-session-cart-reservation-endpoints-apicart)
8. [Product Catalog & Batch Endpoints (`/api/products/*`)](#8-product-catalog--batch-endpoints-apiproducts)
9. [Billing & Purchase Approval Endpoints (`/api/bills/*`)](#9-billing--purchase-approval-endpoints-apibills)
10. [Inventory Management & Ledger Endpoints (`/api/inventory/*`)](#10-inventory-management--ledger-endpoints-apiinventory)
11. [Category & Taxonomy Endpoints (`/api/categories/*`)](#11-category--taxonomy-endpoints-apicategories)
12. [Brand Endpoints (`/api/brands/*`)](#12-brand-endpoints-apibrands)
13. [Customer Endpoints (`/api/customers/*`)](#13-customer-endpoints-apicustomers)
14. [HTTP Status Code & Error Summary](#14-http-status-code--error-summary)

---

## 1. Overview & Architecture

The Supermarket Management System backend is engineered in **ISO C++17** on top of the **Crow Web Framework** and an embedded **SQLite3** database engine configured with Write-Ahead Logging (WAL) and foreign key constraints.

All financial calculations strictly utilize signed 64-bit integer paise (`int64_t`, $1\text{ INR} = 100\text{ paise}$), completely preventing floating-point rounding errors across line-item discounts, subtotals, taxations, and grand totals.

---

## 2. Standard Response Envelopes

Every JSON payload returned by the server conforms to the standardized `ApiResponse<T>` envelope:

### 2.1 Standard Success Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### 2.2 Paginated Success Envelope
```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "products": [ ... ]
  }
}
```

### 2.3 Error Envelope
```json
{
  "success": false,
  "error": "Descriptive reason for failure"
}
```

---

## 3. Authentication & RBAC Security Model

The system operates under a strict two-tier access architecture:

| Role | Access Scope | Authentication Header |
| :--- | :--- | :--- |
| **Customer (Public)** | Catalog browsing, category filtering, search, cart stock reservations, self-service POS checkout, bill viewing. | None required. |
| **Staff (Protected)** | Dashboard KPI analytics, catalog CRUD, duplicate restock, multi-batch tracking, expiry editing, inventory adjustments, sales ledger summaries. | `Authorization: Bearer <64-hex-token>` |

- **Staff Password Cryptography:** PBKDF2-HMAC-SHA256 (100,000 iterations, 128-bit cryptographically secure random salt).
- **Default Staff Credentials:** `Staff@123` (fallback: `admin123`).

---

## 4. Domain Exception Hierarchy & Error Mapping

The backend catches and translates domain exceptions defined in [`backend/include/utils/Exceptions.hpp`](file:///C:/Users/LENOVO/Desktop/OOPS-Sem-III-Lab/Supermarket_Submission_Staging/Supermarket_Management_System/backend/include/utils/Exceptions.hpp) into deterministic HTTP error status codes:

| C++ Exception Class | Base Hierarchy | HTTP Status | Trigger Condition |
| :--- | :--- | :---: | :--- |
| `InvalidQuantityException` | `std::invalid_argument`, `ISupermarketException` | `400 Bad Request` | Quantity $\le 0$, negative quantities, or non-integer values. |
| `InsufficientStockException` | `std::runtime_error`, `ISupermarketException` | `400 Bad Request` / `409 Conflict` | Requested checkout quantity exceeds available physical or unreserved stock. |
| `InvalidDiscountException` | `std::invalid_argument`, `ISupermarketException` | `400 Bad Request` | Percentage discount $< 0\%$ or $> 100\%$; fixed discount $< 0$; non-finite values. |
| `SupermarketException` | `std::runtime_error`, `ISupermarketException` | `400` / `500` | General supermarket domain operational failures. |
| `std::invalid_argument` | `std::logic_error`, `std::exception` | `400 Bad Request` | Malformed inputs, missing parameters, invalid types. |
| `nlohmann::json::exception` | `std::exception` | `400 Bad Request` | Malformed JSON syntax or schema mismatch. |

---

## 5. Health & Diagnostics

### `GET /api/health`
Checks server responsiveness and container health.
- **Access:** Public (Customer & Staff)
- **Response (`200 OK`):**
  ```json
  {
    "status": "ok",
    "service": "supermarket-management-backend",
    "version": "1.0.0"
  }
  ```

---

## 6. Authentication Endpoints (`/api/auth/*`)

### `POST /api/auth/staff/login`
*(Alias: `POST /api/auth/admin/unlock`)*  
Authenticates staff and generates a 64-character hex session bearer token.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "password": "Staff@123"
  }
  ```
- **Response (`200 OK`):**
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
- **Error Responses:** `400 Bad Request` (Missing password), `401 Unauthorized` (Incorrect password).

### `GET /api/auth/session`
Inspects active authentication status.
- **Access:** Public (Reads `Authorization: Bearer <token>` if present)
- **Response (`200 OK` - Authenticated):**
  ```json
  {
    "success": true,
    "message": "Session is active",
    "data": {
      "authenticated": true,
      "role": "STAFF",
      "expiresIn": 85200
    }
  }
  ```
- **Response (`200 OK` - Unauthenticated Customer):**
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

### `POST /api/auth/logout`
Invalidates active session bearer token.
- **Access:** Staff (`Authorization: Bearer <token>`)
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## 7. Multi-Session Cart Reservation Endpoints (`/api/cart/*`)

The multi-session cart reservation subsystem prevents race conditions and cart conflicts across concurrent shoppers by placing a temporary hold on stock items.

- **Storage:** `product_reservations` SQLite table (Migration v6).
- **Default TTL:** 900 seconds (15 minutes).
- **Dynamic Formula:**
  $$\text{availableStock} = \max(0, \text{totalStock} - \text{reservedStock})$$
- **Automatic Cleanup:** Holds automatically clear on checkout invoice generation or explicit release/clear.

### `GET /api/cart`
Fetches active stock reservations for a shopping session.
- **Access:** Public
- **Query Parameter:** `sessionId` (or `X-Session-ID` header)
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Active cart reservations retrieved",
    "data": {
      "sessionId": "sess_8f3a91bc_m1c3",
      "totalReservedUnits": 3,
      "itemCount": 2,
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
        },
        {
          "id": 2,
          "sessionId": "sess_8f3a91bc_m1c3",
          "productId": 12,
          "productName": "Amul Pure Ghee 1L",
          "sku": "SKU-DAIRY-003",
          "quantity": 1,
          "expiresAt": 1731908400,
          "remainingSeconds": 875
        }
      ]
    }
  }
  ```

### `POST /api/cart/reserve`
Reserves stock units for a specific product and session.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "sessionId": "sess_8f3a91bc_m1c3",
    "productId": 4,
    "quantity": 2,
    "ttlSeconds": 900
  }
  ```
- **Response (`200 OK`):**
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
  - `404 Not Found`: Product not found.
  - `409 Conflict`: Requested quantity exceeds available unreserved inventory.

### `POST /api/cart/release`
Releases a single reserved product hold back into available stock.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "sessionId": "sess_8f3a91bc_m1c3",
    "productId": 4
  }
  ```
- **Response (`200 OK`):**
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

### `POST /api/cart/clear`
Clears all active reservations for a session.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "sessionId": "sess_8f3a91bc_m1c3"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Cart reservations cleared successfully",
    "data": {
      "sessionId": "sess_8f3a91bc_m1c3",
      "clearedReservations": 2
    }
  }
  ```

---

## 8. Product Catalog & Batch Endpoints (`/api/products/*`)

### `GET /api/products`
Retrieves a paginated list of catalog products with dynamic available stock and reservation metrics.
- **Access:** Public
- **Query Parameters:**
  - `q` / `search` (string): Search query matching product name or SKU.
  - `brandId` (int): Filter by brand ID.
  - `categoryId` / `category` (int / string): Filter by category ID or slug.
  - `productType` / `type` (string): Filter by `PERISHABLE` or `NON_PERISHABLE`.
  - `minPrice` / `maxPrice` (double / int): Filter price range in rupees or paise.
  - `inStockOnly` (bool): If true, returns only items with `availableStock > 0`.
  - `activeOnly` (bool, default `true`): Exclude soft-deleted products.
  - `limit` (int, default `50`): Page size.
  - `offset` (int, default `0`): Pagination offset.
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Products retrieved",
    "data": {
      "total": 25,
      "limit": 50,
      "offset": 0,
      "products": [
        {
          "id": 1,
          "sku": "SKU-GRAIN-001",
          "name": "Aashirvaad Superior MP Sharbati Whole Wheat Atta 5kg",
          "brandId": 1,
          "brandName": "Aashirvaad",
          "categoryId": 1,
          "categoryName": "Grains & Staples",
          "productType": "NON_PERISHABLE",
          "priceInPaise": 29500,
          "priceInRupees": 295.0,
          "stock": 38,
          "totalStock": 38,
          "reservedStock": 0,
          "expiryDate": "",
          "discount": {
            "type": "NONE",
            "value": 0.0,
            "description": "No Discount",
            "discountedPriceInPaise": 29500,
            "discountedPriceInRupees": 295.0
          }
        }
      ]
    }
  }
  ```

### `GET /api/products/summary`
Returns aggregate catalog metrics for the operational dashboard.
- **Access:** Public / Staff
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Product summary retrieved",
    "data": {
      "totalActiveProducts": 25,
      "totalStockUnits": 850,
      "lowStockCount": 1,
      "outOfStockCount": 0
    }
  }
  ```

### `GET /api/products/<int:id>`
Retrieves a single product by primary key.
- **Access:** Public
- **Response (`200 OK`):** Product object as detailed above.
- **Error Response:** `404 Not Found` if ID does not exist.

### `POST /api/products`
Creates a new product record **OR** executes intelligent **Duplicate Restock**:
- **Duplicate Restock Logic:** If the SKU/barcode and normalized product name/category match an existing active product, the system automatically treats this as a restock: increments existing stock, adds an inventory batch (if perishable), logs an `ADDITION` movement, and returns HTTP 200 without creating duplicate records.
- **Barcode Conflict:** If the SKU exists but points to a different product name, it returns HTTP 409 Conflict.
- **Access:** Staff (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "sku": "SKU-DAIRY-004",
    "name": "Amul Taaza Homogenised Toned Milk 1L",
    "brandId": 2,
    "categoryId": 2,
    "productType": "PERISHABLE",
    "priceInPaise": 7200,
    "stock": 50,
    "expiryDate": "2026-12-15",
    "batchNumber": "BATCH-AMUL-202612",
    "discount": {
      "type": "PERCENTAGE",
      "value": 5.0
    }
  }
  ```
- **Response (`201 Created` - New Item):**
  ```json
  {
    "success": true,
    "message": "Product created successfully",
    "data": { "id": 26, "sku": "SKU-DAIRY-004", "stock": 50, ... }
  }
  ```
- **Response (`200 OK` - Duplicate Restocked):**
  ```json
  {
    "success": true,
    "message": "Existing item detected. Stock successfully increased by 50 units.",
    "data": { "id": 2, "currentStock": 95, ... }
  }
  ```

### `PUT /api/products/<int:id>`
Updates an existing product's pricing, discount strategy, stock, or perishable expiry date.
- **Price & Discount Auditing:** If `priceInPaise` or discount configuration changes, an immutable entry is logged in the `price_history` audit table.
- **Access:** Staff (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "name": "Amul Taaza Homogenised Toned Milk 1L",
    "priceInPaise": 7400,
    "discount": {
      "type": "PERCENTAGE",
      "value": 10.0
    },
    "expiryDate": "2026-12-20"
  }
  ```
- **Response (`200 OK`):** Updated product object.

### `DELETE /api/products/<int:id>`
Soft-deactivates a product (`is_active = 0`).
- **Access:** Staff (`Authorization: Bearer <token>`)
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Product deactivated successfully"
  }
  ```

### `GET /api/products/<int:id>/batches`
Lists all inventory batches for a perishable product ordered by First-Expired, First-Out (`expiry_date ASC`).
- **Access:** Staff (`Authorization: Bearer <token>`)
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Batches retrieved",
    "data": [
      {
        "id": 1,
        "productId": 2,
        "batchNumber": "BATCH-2-20261201",
        "quantity": 20,
        "expiryDate": "2026-12-01",
        "isExpired": false,
        "daysUntilExpiry": 13,
        "status": "VALID",
        "createdAt": "2026-11-18 02:00:00"
      },
      {
        "id": 2,
        "productId": 2,
        "batchNumber": "BATCH-2-20261215",
        "quantity": 30,
        "expiryDate": "2026-12-15",
        "isExpired": false,
        "daysUntilExpiry": 27,
        "status": "VALID",
        "createdAt": "2026-11-18 02:00:00"
      }
    ]
  }
  ```

### `POST /api/products/<int:id>/batches`
Adds a new inventory batch and automatically synchronizes the product's nearest expiry date.
- **Access:** Staff (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "quantity": 25,
    "expiryDate": "2026-12-25",
    "batchNumber": "BATCH-2-20261225"
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Batch added successfully",
    "data": {
      "batchId": 3,
      "batchNumber": "BATCH-2-20261225",
      "quantity": 25,
      "expiryDate": "2026-12-25",
      "newTotalStock": 75
    }
  }
  ```

---

## 9. Billing & Purchase Approval Endpoints (`/api/bills/*`)

The checkout subsystem operates as an **Atomic Purchase Approval Model**:
- No external payment gateway latency, no third-party network failures, and no admin approval queue bottleneck.
- When POS or self-checkout submits `POST /api/bills`, the transaction executes atomically inside an SQLite `Transaction` (RAII):
  1. Validates all line-item quantities ($q > 0$).
  2. Verifies that cumulative product quantities do not exceed current physical stock.
  3. Deducts stock from `products` and dispatches multi-batch deductions via **FEFO (First-Expired, First-Out)**.
  4. Records `SALE` entries in `inventory_movements`.
  5. Snapshots immutable line item details into `bill_items` (brand, product name, unit price, applied discount, final unit price, line total).
  6. Generates formatted invoice number (`INV-YYYYMMDDHHMMSS-mmm-seq`).
  7. Clears any reserved cart holds linked to `sessionId`.

### `POST /api/bills`
Approves and finalizes a customer purchase transaction.
- **Access:** Public / Staff
- **Request Body:**
  ```json
  {
    "sessionId": "sess_8f3a91bc_m1c3",
    "customerName": "Rahul Verma",
    "customerPhone": "9876543210",
    "customerId": null,
    "items": [
      { "productId": 1, "quantity": 2 },
      { "productId": 4, "quantity": 1 }
    ]
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Invoice created successfully",
    "data": {
      "id": 16,
      "billNumber": "INV-20261118023045-812-001",
      "customerId": null,
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
      "items": [
        {
          "id": 25,
          "productId": 1,
          "productName": "Aashirvaad Superior MP Sharbati Atta 5kg",
          "brandName": "Aashirvaad",
          "unitPricePaise": 29500,
          "unitPriceInRupees": 295.0,
          "discountType": "NONE",
          "discountValue": 0.0,
          "unitDiscountPaise": 0,
          "unitDiscountInRupees": 0.0,
          "finalUnitPricePaise": 29500,
          "finalUnitPriceInRupees": 295.0,
          "quantity": 2,
          "lineTotalPaise": 59000,
          "lineTotalInRupees": 590.0
        },
        {
          "id": 26,
          "productId": 4,
          "productName": "Tata Tea Gold 500g",
          "brandName": "Tata",
          "unitPricePaise": 36000,
          "unitPriceInRupees": 360.0,
          "discountType": "FIXED",
          "discountValue": 50.0,
          "unitDiscountPaise": 5000,
          "unitDiscountInRupees": 50.0,
          "finalUnitPricePaise": 31000,
          "finalUnitPriceInRupees": 310.0,
          "quantity": 1,
          "lineTotalPaise": 31000,
          "lineTotalInRupees": 310.0
        }
      ]
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `InvalidQuantityException` if `quantity <= 0`, empty items array, or malformed JSON.
  - `400 Bad Request`: `InsufficientStockException` if requested units exceed physical inventory.

### `GET /api/bills`
Lists historical sales invoices with pagination.
- **Access:** Public / Staff
- **Query Parameters:** `limit` (default `50`), `offset` (default `0`).
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Bills retrieved",
    "data": {
      "total": 16,
      "limit": 50,
      "offset": 0,
      "bills": [ ... ]
    }
  }
  ```

### `GET /api/bills/<int:id>`
Retrieves a single historical invoice snapshot by ID.
- **Access:** Public / Staff
- **Response (`200 OK`):** Full invoice object matching the checkout response.
- **Error Response:** `404 Not Found` if invoice does not exist.

### `GET /api/bills/summary`
Calculates internal financial sales metrics across all historical invoices.
- **Access:** Staff (`Authorization: Bearer <token>`)
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Bills summary retrieved",
    "data": {
      "totalBills": 16,
      "totalGrossPaise": 1540000,
      "totalGrossInRupees": 15400.0,
      "totalDiscountPaise": 120000,
      "totalDiscountInRupees": 1200.0,
      "totalNetPaise": 1420000,
      "totalNetInRupees": 14200.0,
      "totalUnitsSold": 48
    }
  }
  ```

---

## 10. Inventory Management & Ledger Endpoints (`/api/inventory/*`)

### `GET /api/inventory/summary`
Returns high-level inventory metrics including store stock valuation.
- **Access:** Staff (`Authorization: Bearer <token>`)
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Inventory summary retrieved",
    "data": {
      "totalProducts": 25,
      "totalStockUnits": 850,
      "lowStockCount": 1,
      "outOfStockCount": 0,
      "totalValuationPaise": 18500000,
      "totalValuationInRupees": 185000.0
    }
  }
  ```

### `GET /api/inventory/movements`
Retrieves the append-only inventory movement audit trail.
- **Access:** Staff (`Authorization: Bearer <token>`)
- **Query Parameters:** `limit` (default `50`), `offset` (default `0`), `productId` (optional).
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Inventory movements retrieved",
    "data": [
      {
        "id": 45,
        "productId": 1,
        "productName": "Aashirvaad Superior MP Sharbati Atta 5kg",
        "movementType": "SALE",
        "quantityChange": -2,
        "previousStock": 38,
        "newStock": 36,
        "reason": "Checkout sale for invoice: INV-20261118023045-812-001",
        "relatedBillId": 16,
        "createdAt": "2026-11-18 02:30:45"
      }
    ]
  }
  ```

### `POST /api/inventory/adjustments`
Performs an administrative manual inventory adjustment.
- **Access:** Staff (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "productId": 1,
    "movementType": "ADDITION",
    "quantityChange": 20,
    "reason": "Intake from supplier distributor shipment"
  }
  ```
- **Valid Movement Types:** `ADDITION`, `REDUCTION`, `ADJUSTMENT`.
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Inventory adjusted successfully",
    "data": {
      "id": 46,
      "productId": 1,
      "movementType": "ADDITION",
      "quantityChange": 20,
      "previousStock": 36,
      "newStock": 56
    }
  }
  ```

---

## 11. Category & Taxonomy Endpoints (`/api/categories/*`)

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | Lists all product categories with product counts. |
| `POST` | `/api/categories` | Staff | Creates a new category (`{"name": "Beverages"}`). |
| `PUT` | `/api/categories/<id>` | Staff | Renames a category. |
| `DELETE` | `/api/categories/<id>` | Staff | Deletes category (fails if active products reference it). |
| `GET` | `/api/categories/<id>/brands` | Public | Lists brands authorized for a category. |
| `POST` | `/api/categories/<id>/brands` | Staff | Associates brand to category (`{"brandId": 2}`). |
| `DELETE` | `/api/categories/<id>/brands/<bid>` | Staff | Removes brand-category association. |

---

## 12. Brand Endpoints (`/api/brands/*`)

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/brands` | Public | Lists all retail manufacturer brands with product counts. |
| `POST` | `/api/brands` | Staff | Registers a new brand (`{"name": "Amul"}`). |
| `PUT` | `/api/brands/<id>` | Staff | Renames an existing brand. |
| `DELETE` | `/api/brands/<id>` | Staff | Deletes brand (fails if products reference it). |

---

## 13. Customer Endpoints (`/api/customers/*`)

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customers` | Staff | Lists customers with query filtering (`q`, `limit`, `offset`). |
| `POST` | `/api/customers` | Staff | Registers a customer (`customerCode`, `fullName`, `phone`, `email`). |
| `GET` | `/api/customers/<id>` | Staff | Fetches customer profile, lifetime spent, and purchases count. |
| `PUT` | `/api/customers/<id>` | Staff | Updates customer profile details. |
| `GET` | `/api/customers/<id>/bills` | Staff | Lists historical bills associated with the customer. |

---

## 14. HTTP Status Code & Error Summary

| Status Code | Standard Name | Trigger Scenario |
| :---: | :--- | :--- |
| `200 OK` | OK | Successful fetch, update, release, or duplicate restock. |
| `201 Created` | Created | Product created, batch added, invoice finalized. |
| `400 Bad Request` | Bad Request | `InvalidQuantityException`, `InvalidDiscountException`, malformed JSON, negative prices, missing fields. |
| `401 Unauthorized` | Unauthorized | Missing or invalid Bearer token on staff-protected routes. |
| `404 Not Found` | Not Found | Non-existent product ID, category ID, brand ID, or invoice ID. |
| `409 Conflict` | Conflict | `InsufficientStockException` (cart reservation or checkout exceeding available stock), duplicate barcode pointing to different item. |
| `500 Internal Error` | Internal Server Error | Unhandled SQLite or operating system failure. |
