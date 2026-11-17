# REST API Reference — Supermarket Management System

## Table of Contents
- [1. Overview & Base URL](#1-overview-base-url)
- [2. Standard Response Envelope](#2-standard-response-envelope)
- [3. Authentication & RBAC Policy](#3-authentication-rbac-policy)
- [4. Health Endpoint](#4-health-endpoint)
- [5. Authentication Endpoints (`/api/auth/*`)](#5-authentication-endpoints-apiauth)
- [6. Brands Endpoints (`/api/brands/*`)](#6-brands-endpoints-apibrands)
- [7. Categories Endpoints (`/api/categories/*`)](#7-categories-endpoints-apicategories)
- [8. Products Endpoints (`/api/products/*`)](#8-products-endpoints-apiproducts)
- [9. Billing Endpoints (`/api/bills/*`)](#9-billing-endpoints-apibills)
- [10. Inventory Endpoints (`/api/inventory/*`)](#10-inventory-endpoints-apiinventory)
- [11. HTTP Status Code Conventions](#11-http-status-code-conventions)

---

## 1. Overview & Base URL

The backend API is implemented in C++17 using the **Crow** microframework and binds to:
$$\mathbf{http://localhost:8080}$$

- **Content-Type:** `application/json`
- **CORS Allowed Origin:** Configured via `CORS_ALLOWED_ORIGIN` (default: `http://localhost:5173`).

---

## 2. Standard Response Envelope

All API responses follow a uniform JSON schema (`ApiResponse<T>`):

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Paginated Success Response
```json
{
  "success": true,
  "message": "Products retrieved",
  "data": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "products": [ ... ]
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description message"
}
```

---

## 3. Authentication & RBAC Policy

- **Public / Staff Access:** All read endpoints (`GET /api/products`, `GET /api/inventory/movements`, `GET /api/bills`) and POS checkouts (`POST /api/bills`) require no token.
- **Admin Access:** All mutating catalog and inventory endpoints (`POST`/`PUT`/`DELETE` on products, brands, categories; `POST` stock adjustments) require a Bearer token:
  ```http
  Authorization: Bearer <64-character-hex-session-token>
  ```

---

## 4. Health Endpoint

### `GET /api/health`
Checks server responsiveness.
- **Access:** Public
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "version": "1.0.0",
    "service": "supermarket-management-backend"
  }
  ```

---

## 5. Authentication Endpoints (`/api/auth/*`)

### `POST /api/auth/admin/unlock`
Authenticates the store administrator and issues a temporary session token.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "password": "admin123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Administrator privileges unlocked successfully",
    "data": {
      "unlocked": true,
      "token": "a1b2c3d4e5f6...",
      "expiresIn": 3600
    }
  }
  ```
- **Error Codes:** `400` (Malformed), `401` (Invalid password), `503` (Admin not initialized).

### `GET /api/auth/session`
Validates the current session token.
- **Access:** Bearer Token
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Session is active",
    "data": {
      "valid": true,
      "role": "ADMIN",
      "expiresIn": 3420
    }
  }
  ```

### `POST /api/auth/logout`
Invalidates the current session token in backend RAM.
- **Access:** Bearer Token
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## 6. Brands Endpoints (`/api/brands/*`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/brands` | Staff / Public | Lists all active manufacturer brands. |
| `POST` | `/api/brands` | Admin Only | Creates a new brand (`{"name": "Amul"}`). |
| `PUT` | `/api/brands/{id}` | Admin Only | Renames an existing brand (`{"name": "New Name"}`). |
| `DELETE` | `/api/brands/{id}` | Admin Only | Deletes a brand (fails if products reference it). |

---

## 7. Categories Endpoints (`/api/categories/*`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Staff / Public | Lists all product categories. |
| `POST` | `/api/categories` | Admin Only | Creates a category (`{"name": "Dairy & Chilled"}`). |
| `PUT` | `/api/categories/{id}` | Admin Only | Renames an existing category. |
| `DELETE` | `/api/categories/{id}` | Admin Only | Deletes a category (fails if products reference it). |

---

## 8. Products Endpoints (`/api/products/*`)

### `GET /api/products`
Retrieves products with optional filtering.
- **Query Parameters:**
  - `q` (string): Search query matching product name or SKU.
  - `brandId` (int): Filter by brand ID.
  - `categoryId` (int): Filter by category ID.
  - `activeOnly` (bool, default `true`): Exclude soft-deactivated products.
  - `limit` (int, default `50`): Page size.
  - `offset` (int, default `0`): Pagination offset.
- **Response (200 OK):**
  ```json
  {
    "success": true,
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
Returns aggregate catalog metrics.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalActiveProducts": 25,
      "totalStockUnits": 850,
      "lowStockCount": 1,
      "outOfStockCount": 0
    }
  }
  ```

### `POST /api/products`
Creates a new product record.
- **Access:** Admin Only
- **Request Body:**
  ```json
  {
    "sku": "SKU-SAMPLE-001",
    "name": "Sample Organic Tea 250g",
    "brandId": 1,
    "categoryId": 4,
    "productType": "NON_PERISHABLE",
    "priceInPaise": 15000,
    "stock": 50,
    "expiryDate": null,
    "discount": {
      "type": "PERCENTAGE",
      "value": 10.0
    }
  }
  ```
- **Response (201 Created):** Returns the created product object.

### `PUT /api/products/{id}`
Updates an existing product's details or discount rules.
- **Access:** Admin Only

### `DELETE /api/products/{id}`
Soft-deactivates an active product (`is_active = 0`).
- **Access:** Admin Only

---

## 9. Billing Endpoints (`/api/bills/*`)

### `POST /api/bills`
Executes an atomic sales transaction: validates stock, creates invoice snapshot, records inventory movements, and deducts shelf inventory.
- **Access:** Staff / Public
- **Request Body:**
  ```json
  {
    "items": [
      { "productId": 1, "quantity": 2 },
      { "productId": 6, "quantity": 1 }
    ],
    "paymentMethod": "CASH"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Invoice created successfully",
    "data": {
      "id": 5,
      "billNumber": "INV-20261116221956-916-001",
      "subtotalPaise": 86500,
      "subtotalInRupees": 865.0,
      "totalDiscountPaise": 1375,
      "totalDiscountInRupees": 13.75,
      "finalAmountPaise": 85125,
      "finalAmountInRupees": 851.25,
      "createdAt": "2026-11-16 22:19:56",
      "itemCount": 2,
      "items": [
        {
          "id": 10,
          "productId": 1,
          "productName": "Aashirvaad Superior MP Sharbati Whole Wheat Atta 5kg",
          "brandName": "Aashirvaad",
          "unitPricePaise": 29500,
          "discountType": "NONE",
          "discountValue": 0.0,
          "unitDiscountPaise": 0,
          "finalUnitPricePaise": 29500,
          "finalUnitPriceInRupees": 295.0,
          "quantity": 2,
          "lineTotalPaise": 59000,
          "lineTotalInRupees": 590.0
        }
      ]
    }
  }
  ```
- **Error Codes:** `400` (Empty cart / invalid quantity), `409` (Insufficient stock available).

### `GET /api/bills`
Lists historical customer bills with pagination.
- **Query Parameters:** `limit` (default `50`), `offset` (default `0`).

### `GET /api/bills/{id}`
Retrieves a single historical bill with all line item snapshots.

### `GET /api/bills/summary`
Returns database-side sales metrics (`totalBills`, `totalRevenuePaise`, `totalRevenueInRupees`, `averageBillPaise`).

---

## 10. Inventory Endpoints (`/api/inventory/*`)

### `GET /api/inventory/movements`
Retrieves the append-only stock movement audit ledger.
- **Query Parameters:** `limit` (default `50`), `offset` (default `0`), `productId` (optional).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 31,
        "productId": 1,
        "movementType": "SALE",
        "quantityChange": -2,
        "previousStock": 34,
        "newStock": 32,
        "reason": "Checkout sale for invoice: INV-20261116221956-916-001",
        "referenceId": "INV-20261116221956-916-001",
        "createdAt": "2026-11-16 22:19:56"
      }
    ]
  }
  ```

### `POST /api/inventory/adjustments`
Executes an administrative stock adjustment.
- **Access:** Admin Only
- **Request Body:**
  ```json
  {
    "productId": 1,
    "movementType": "ADDITION",
    "quantityChange": 20,
    "reason": "Vendor shipment intake Batch #B2026-11"
  }
  ```
- **Movement Types:** `ADDITION`, `REDUCTION`, `ADJUSTMENT`.
- **Response (200 OK):** Returns the logged movement entry.

---

## 11. HTTP Status Code Conventions

| Status Code | Meaning | Context |
| :--- | :--- | :--- |
| `200 OK` | Success | Normal read or update operations. |
| `201 Created` | Created | Product creation (`POST /api/products`), Invoice finalized (`POST /api/bills`). |
| `400 Bad Request` | Validation Error | Negative prices, missing required fields, malformed JSON. |
| `401 Unauthorized` | Authentication Missing | Missing or expired Bearer token on administrative routes. |
| `403 Forbidden` | Access Denied | Invalid role or permissions. |
| `404 Not Found` | Resource Missing | Non-existent product ID or bill ID. |
| `409 Conflict` | Domain Conflict | Insufficient stock for checkout; duplicate SKU/Brand name. |
| `500 Server Error` | Unhandled Error | Unexpected SQLite query failure. |
| `503 Unavailable` | Service Not Configured | Admin unlock attempted on a database without an admin account. |
