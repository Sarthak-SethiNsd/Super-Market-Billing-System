# Features and Modules Specification — Supermarket Management System (ApexMart)

## Table of Contents
- [1. Operating Modes & Two-Tier Security Architecture](#1-operating-modes--two-tier-security-architecture)
- [2. Public Customer Portal & Showcase (`/`)](#2-public-customer-portal--showcase-)
- [3. Multi-Session Reserved Stock System](#3-multi-session-reserved-stock-system)
- [4. Point-of-Sale (POS) & Self-Checkout (`/billing`)](#4-point-of-sale-pos--self-checkout-billing)
- [5. Purchase Approval & Confirmation Engine (Atomic Model)](#5-purchase-approval--confirmation-engine-atomic-model)
- [6. Polymorphic C++ OOP Exception Hierarchy](#6-polymorphic-c-oop-exception-hierarchy)
- [7. Strict Boundary & Exception Validations](#7-strict-boundary--exception-validations)
- [8. Product Catalog & Multi-Batch Management (`/products`)](#8-product-catalog--multi-batch-management-products)
- [9. Inventory Control, FEFO Pipeline & Movement Ledger (`/inventory`)](#9-inventory-control-fefo-pipeline--movement-ledger-inventory)
- [10. Daily Price & Discount Auditing (`price_history`)](#10-daily-price--discount-auditing-price_history)
- [11. Categories & Brands Taxonomy (`/admin`)](#11-categories--brands-taxonomy-admin)
- [12. Customer Directory & CRM (`/admin`)](#12-customer-directory--crm-admin)
- [13. Transaction Register & Printable Receipts (`/transactions`)](#13-transaction-register--printable-receipts-transactions)
- [14. Operational Dashboard & Sales Analytics (`/dashboard` & `/analytics`)](#14-operational-dashboard--sales-analytics-dashboard--analytics)
- [15. Interactive OOP Concepts Explorer (`/oop-concepts`)](#15-interactive-oop-concepts-explorer-oop-concepts)

---

## 1. Operating Modes & Two-Tier Security Architecture

ApexMart enforces a strict separation of concerns through a two-tier operational model:

1. **Customer Mode (Public / Unauthenticated):**
   - Public corporate site browsing and brand discovery.
   - Live catalog search with dynamic category filters ("All Categories" + dynamic departments).
   - Real-time cart reservations preventing race conditions (`POST /api/cart/reserve`).
   - Self-service POS atomic checkout (`POST /api/bills`) with thermal receipt printing.
   - *Restrictions:* Zero access to store KPIs, inventory adjustments, product mutations, or staff credentials.
2. **Staff Mode (Protected / Authenticated):**
   - Protected routes (`/dashboard`, `/inventory`, `/transactions`, `/admin`) guarded by `StaffProtectedRoute.tsx`.
   - Authenticated via `POST /api/auth/staff/login` using **PBKDF2-HMAC-SHA256** (100,000 iterations, 128-bit salt).
   - Default credentials: password `Staff@123` (fallback: `admin123`).
   - Complete operational dashboard, manual stock adjustment ledger, multi-batch intake, perishable expiry date synchronization, and catalog CRUD with duplicate item restock logic.

---

## 2. Public Customer Portal & Showcase (`/`)

The default landing route (`/`) serves an elegant customer-facing retail showcase:
- **Corporate Branding:** Emerald green theme with modern cards, badges, and responsive navigation.
- **Dynamic Category Selector:** Features an "All Categories" pill plus dynamic categories loaded live from `/api/categories`.
- **Search & Filter Matrix:** Reactive text search matching name and SKU, combined with category filters, price range sliders, and in-stock toggles.
- **Customer Services Overview:** Information regarding store weigh-scales, digital payments, and quality guarantees.
- **Staff Access Trigger:** Unobtrusive staff login button in header leading to `/staff` or opening the login modal.

---

## 3. Multi-Session Reserved Stock System

### Problem Solved
In retail supermarkets and concurrent web ordering systems, multiple customers may concurrently place the same limited-inventory item into their shopping carts. Without a reservation mechanism:
- Customers experience checkout failures at the final payment step.
- Unsynchronized concurrent checkouts risk causing negative stock balances.

### Architectural Solution
- **Reservation Table (`product_reservations` - Migration v6):** Holds stock units tied to a `session_id`, `product_id`, and Unix timestamp `expires_at` with a 15-minute Time-To-Live (TTL).
- **Dynamic Available Stock Calculation:**
  $$\text{reservedStock} = \sum_{\text{active holds}} \text{quantity}$$
  $$\text{availableStock} = \max\bigl(0,\, \text{totalStock} - \text{reservedStock}\bigr)$$
- **REST Endpoints:**
  - `POST /api/cart/reserve`: Allocates reservation units. Returns HTTP 409 Conflict if requested quantity exceeds available stock.
  - `POST /api/cart/release`: Releases a specific product reservation.
  - `POST /api/cart/clear`: Clears all active reservations for the session.
  - `GET /api/cart`: Returns active session holds with remaining TTL in seconds.
- **Automatic Checkout Clearance:** When `POST /api/bills` is invoked with `sessionId`, the reservations are automatically cleared atomically within the checkout database transaction.

---

## 4. Point-of-Sale (POS) & Self-Checkout (`/billing`)

A cashier and self-checkout terminal engineered for rapid transactions:
- **Dual Catalog & Cart Interface:** Responsive split view with catalog search on the left and live checkout cart on the right.
- **Customer Name & Phone Entry:** Inputs for customer name and optional phone number during checkout, defaulting cleanly to "Walk-in Customer".
- **Dynamic Stock Limits:** Cart quantities are capped at live `availableStock`.
- **Real-Time Financial Breakdown:** Line-item prices in integer paise, applied promotional discounts, subtotal, total savings, and net amount payable.
- **Immediate Post-Sale Receipt:** Generates an 80mm thermal receipt modal upon checkout confirmation.

---

## 5. Purchase Approval & Confirmation Engine (Atomic Model)

### Design Rationale: Zero-Bottleneck Architecture
In commercial physical supermarkets and high-efficiency POS systems:
- There is **no external payment gateway dependency** (no third-party network outages or timeouts).
- There are **no QR code scanning delays** or external webhook verifications.
- There is **no manual administrative approval bottleneck** (cashiers/customers do not wait for an admin to accept or decline transactions).

### Atomic Transaction Execution
When the customer or cashier clicks **"Confirm & Pay"** (`POST /api/bills`):
1. **Validation:** Verifies that all line-item quantities are positive ($q > 0$) and physical stock is sufficient.
2. **Invoice Number Generation:** Generates `INV-YYYYMMDDHHMMSS-mmm-seq`.
3. **Immutable Snapshots:** Inserts into `bill_items` capturing product name, brand name, original unit price in paise, discount type & value, and final unit price.
4. **FEFO Multi-Batch Deduction:** Deducts inventory from earliest-expiring batches in `product_batches` first.
5. **Inventory Movement Ledger:** Writes a `SALE` entry into `inventory_movements`.
6. **Cart Reservation Release:** Automatically clears all held stock for `sessionId`.
7. **ACID Commit:** SQLite commits the transaction (`tx.commit()`), ensuring complete atomicity.

---

## 6. Polymorphic C++ OOP Exception Hierarchy

Domain exceptions are structured in a custom hierarchy in `backend/include/utils/Exceptions.hpp`:

- **`ISupermarketException`:** Pure virtual interface with `virtual const char* what() const noexcept = 0;` and virtual destructor. Demonstrates **Abstraction** and **Polymorphism**.
- **`SupermarketException`:** Base concrete exception inheriting from `std::runtime_error` and `ISupermarketException`.
- **`InvalidQuantityException`:** Inherits from `std::invalid_argument` and `ISupermarketException`. Thrown on non-positive or invalid quantities.
- **`InsufficientStockException`:** Inherits from `std::runtime_error` and `ISupermarketException`. Fully encapsulates `requested`, `available`, and `productName` with getters: `.getRequested()`, `.getAvailable()`, and `.getProductName()`.
- **`InvalidDiscountException`:** Inherits from `std::invalid_argument` and `ISupermarketException`. Thrown when discount percentages are outside $[0.0\%, 100.0\%]$ or fixed amounts are negative.

---

## 7. Strict Boundary & Exception Validations

The domain layer enforces strict mathematical boundaries across all business operations:
1. **Quantity Guards:**
   - Non-positive quantities ($q \le 0$) are rejected with `InvalidQuantityException` (HTTP 400 Bad Request).
   - Quantities exceeding live available stock throw `InsufficientStockException` (HTTP 400 Bad Request or HTTP 409 Conflict).
2. **Discount Boundary Checks:**
   - Percentage discounts must fall strictly within $[0.0\%, 100.0\%]$.
   - Fixed cash discounts must be non-negative ($\ge 0$).
3. **Price Clamping Guarantee:**
   - Final discounted unit prices are clamped at zero:
     $$\text{finalUnitPricePaise} = \max\bigl(0\text{ paise},\, \text{unitPricePaise} - \text{discountPaise}\bigr)$$
   - Selling prices and line totals can **never become negative**.

---

## 8. Product Catalog & Multi-Batch Management (`/products`)

Tabular management view for staff:
- **Duplicate Item Restock Logic:**
  - When staff adds a product via `POST /api/products`, the system checks for existing products matching SKU and normalized name/category.
  - If a match is detected, the system automatically treats this as a restock: increments stock, logs an `ADDITION` movement, appends an inventory batch (if perishable), and returns HTTP 200 without creating duplicate database rows.
- **Perishable Product Expiry Date Editing:**
  - Staff can modify expiry dates dynamically via `PUT /api/products/:id` or batch management.
  - Preserves existing expiry date if omitted during partial edits.
- **Soft Deactivation:** Soft-deactivates items (`is_active = 0`) to preserve historical invoice integrity.

---

## 9. Inventory Control, FEFO Pipeline & Movement Ledger (`/inventory`)

- **FEFO (First-Expired, First-Out) Stock Deduction:**
  - Table `product_batches` (Migration v5) tracks individual supply batches with expiry dates.
  - During sales, the system automatically deducts units from the earliest-expiring unexpired batches first.
  - Synchronizes `products.expiry_date` to reflect the nearest active batch's expiration date.
- **Manual Stock Adjustments:**
  - Movement types: `ADDITION` (intake), `REDUCTION` (damage/write-off), `ADJUSTMENT` (physical count correction).
  - Mandatory audit reason string.
- **Immutable Movement Ledger:** Append-only log recording every stock change with previous stock, new stock, delta, reason, and timestamps.

---

## 10. Daily Price & Discount Auditing (`price_history`)

- **Table `price_history` (Migration v5):**
  - Logs every change to base prices or promotional discount strategies made via `PUT /api/products/:id`.
  - Records `old_price_paise`, `new_price_paise`, `old_discount_type`, `new_discount_type`, `old_discount_value`, `new_discount_value`, audit notes, and timestamps.
- **Audit Compliance:** Provides a complete audit trail for store managers to verify price changes and promotional compliance.

---

## 11. Categories & Brands Taxonomy (`/admin`)

- **Brand Management:** Add, edit, or delete manufacturers (*Amul, Aashirvaad, Tata, Britannia*, etc.).
- **Category Management:** Manage store departments (*Grains & Staples, Dairy & Chilled, Snacks & Confectionery, Beverages, Personal Care, Household Essentials, Fruits & Vegetables*).
- **Category-Brand Associations:** `category_brands` junction table associates brands with relevant categories for clean customer filtering.

---

## 12. Customer Directory & CRM (`/admin`)

- **Customer Profiles:** Tracks customer loyalty code, full name, phone number, and email.
- **Lifetime Spending Metrics:** Calculates total purchases count and lifetime spent in rupees directly from sales records.
- **Historical Invoice Linkage:** Views all past sales invoices linked to a customer.

---

## 13. Transaction Register & Printable Receipts (`/transactions`)

- **Searchable Invoice Register:** Displays invoice number (`INV-YYYYMMDDHHMMSS-mmm-seq`), date/time, customer name, line item count, gross subtotal, total discount, and net total.
- **Immutable Receipt Details Modal:** Renders itemized snapshots captured at checkout.
- **80mm Thermal Print Media Layout:** Dedicated CSS print stylesheet isolates the receipt container, stripping navigation menus for clean point-of-sale thermal printing.

---

## 14. Operational Dashboard & Sales Analytics (`/dashboard` & `/analytics`)

- **5 Core KPI Summary Cards:**
  1. Today's Net Sales Revenue (in formatted rupees).
  2. Today's Total Invoices Count.
  3. Total Active Products in Catalog.
  4. Low Stock Alerts count ($\le 5$ units).
  5. Out of Stock count ($0$ units).
- **Recharts Visualizations:** Time-series revenue trends and department sales breakdown pie charts.
- **Top-Selling SKUs Table:** Ranks items by total units sold and net revenue generated.

---

## 15. Interactive OOP Concepts Explorer (`/oop-concepts`)

Academic showcase demonstrating how textbook C++ OOP principles solve retail domain problems:
- **Interactive Concept Cards:** Encapsulation, Polymorphism, Inheritance, Virtual Inheritance, Strategy Pattern, Templates, Operator Overloading, and RAII.
- **Class Hierarchy Visualizer:** Interactive SVG diagrams illustrating class structures.
- **Live Strategy Simulator:** Evaluators can select products and discount algorithms to observe runtime polymorphic calculations.
- **Object Slicing Demonstration:** Explains pass-by-value slicing vs. pass-by-reference polymorphic dispatch.
- **Interactive OOP Quiz:** Comprehensive self-test for university viva examination preparation.
