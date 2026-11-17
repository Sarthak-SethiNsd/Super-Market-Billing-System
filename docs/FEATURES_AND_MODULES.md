# Features and Modules — Supermarket Management System

## Table of Contents
- [1. Public Customer Website (`/`)](#1-public-customer-website-)
- [2. Staff Dashboard (`/dashboard`)](#2-staff-dashboard-dashboard)
- [3. Point-of-Sale (POS) Billing Terminal (`/billing`)](#3-point-of-sale-pos-billing-terminal-billing)
- [4. Product Catalog Management (`/products`)](#4-product-catalog-management-products)
- [5. Categories and Brands Taxonomy (`/admin`)](#5-categories-and-brands-taxonomy-admin)
- [6. Polymorphic Discount Engine](#6-polymorphic-discount-engine)
- [7. Inventory Control & Movement Audit Ledger (`/inventory`)](#7-inventory-control-movement-audit-ledger-inventory)
- [8. Transaction History & Printable Receipts (`/transactions`)](#8-transaction-history-printable-receipts-transactions)
- [9. Sales Analytics & Reporting (`/analytics`)](#9-sales-analytics-reporting-analytics)
- [10. Authentication & Role-Based Access Control (RBAC)](#10-authentication-role-based-access-control-rbac)
- [11. Interactive OOP Concepts Explorer (`/oop-concepts`)](#11-interactive-oop-concepts-explorer-oop-concepts)

---

## 1. Public Customer Website (`/`)

The default root path (`/`) serves a customer-facing corporate showcase for **ApexMart**:
- **Branding & Identity:** Features the emerald green retail palette with clean typography and badges.
- **Hero & Value Proposition:** Highlights core commitments (farm-to-shelf freshness, verified quality, price transparency).
- **Department Showcases:** Highlights product categories (Fresh Produce, Dairy & Pantry, Household Essentials, Beverages) without exposing internal inventory counts or wholesale pricing.
- **Customer Services:** Details store amenities (in-store customer assistance, verified weigh-scales, digital payments).
- **Store Location & Hours:** Displays editable store address and opening hours placeholders (`[Store Address]`, `[Contact Number]`).
- **Staff Mode Portal:** Subtle, secure navigation pill in the header directing authorized supermarket employees to `/staff`.

---

## 2. Staff Dashboard (`/dashboard`)

The central internal hub provides operational visibility for store staff:
- **Real-Time Stat Cards:**
  - Active Catalog SKUs
  - Total Stock Units
  - Low Stock Alerts ($\le 5$ units)
  - All-Time Transactions & Revenue
- **Low Stock Warning Banner:** Dynamically lists items requiring immediate supplier reorders (e.g., `Fresh Organic Baby Spinach Palak 250g`).
- **Quick-Access Action Grid:** Instant shortcuts to POS Terminal, Product Catalog, Inventory Adjustments, and Analytics.
- **Responsive Layout:** Automatically adapts across mobile (`375px`), tablet (`768px`), and desktop (`1440px`) viewports without content clipping.

---

## 3. Point-of-Sale (POS) Billing Terminal (`/billing`)

A fast, cashier-optimized checkout interface designed for high-throughput retail operations:
- **Dual Catalog & Cart Interface:** Responsive split view with catalog search on the left and live checkout cart on the right.
- **Instant Product Search:** Live client-side text filtering by SKU, product name, or category.
- **Live Stock Indicators:** Visual tags distinguish in-stock items from low-stock items; out-of-stock items are automatically disabled.
- **Quantity Validation:** Automatically prevents adding quantities exceeding current shelf stock.
- **Reactive Financial Breakdown:**
  - Line-by-line unit price, discount description, and net line total.
  - Subtotal (gross price sum in integer paise).
  - Total discount savings.
  - Net amount payable.
- **Atomic Checkout Execution:** Single-click **Complete Sale & Print** button calls `POST /api/bills` to commit the transaction and decrement stock atomically.
- **Immediate Post-Sale Modal:** Surfaces a formatted, printable invoice receipt immediately upon checkout success.

---

## 4. Product Catalog Management (`/products`)

A tabular administration view for managing the store's SKU master records:
- **Filtering & Search:** Real-time search by name/SKU, category dropdown filter, and brand dropdown filter.
- **Perishable vs. Non-Perishable Distinction:** Perishable goods display a distinctive badge and format their stored expiry date (`YYYY-MM-DD`).
- **Pricing & Discounts Display:** Displays base unit price alongside calculated net selling price and applied discount type.
- **Stock & Low-Stock Alerts:** Color-coded badges highlight items requiring reordering.
- **Admin Mutation Actions (Admin Only):**
  - **Add Product:** Form validating SKU uniqueness, positive integer pricing, category/brand selection, and optional expiry dates.
  - **Edit Product:** Update price, discount strategy, stock, or active state.
  - **Deactivate Product:** Soft-deactivates products (`is_active = 0`) to preserve historical invoice referential integrity.

---

## 5. Categories and Brands Taxonomy (`/admin`)

Administrative configuration screen for managing store classification taxonomies:
- **Brand Registry:** Manage product manufacturers (e.g., *Amul, Aashirvaad, Tata, Britannia, Dettol*).
- **Category Registry:** Manage departmental classifications (*Grains & Staples, Dairy & Chilled, Snacks & Confectionery, Beverages, Personal Care, Household Essentials, Fruits & Vegetables*).
- **Integrity Enforcement:** Deletion of brands or categories actively referenced by existing products is strictly prevented by foreign key constraints.

---

## 6. Polymorphic Discount Engine

The backend implements the **Strategy Design Pattern** (`IDiscountStrategy`) to support diverse promotional schemes:
1. **No Discount (`NONE`):** Zero deduction; selling price equals base unit price.
2. **Percentage Discount (`PERCENTAGE`):** Deducts a specified percentage ($0\% - 100\%$) from the unit price.
   $$\text{discountPaise} = \mathrm{round}\left(\text{unitPricePaise} \times \frac{\text{value}}{100.0}\right)$$
3. **Fixed Amount Discount (`FIXED`):** Deducts a flat amount in paise.
   $$\text{discountPaise} = \min(\text{fixedPaise}, \text{unitPricePaise})$$

*Discount amounts are calculated on individual unit prices before line multiplication, preventing floating-point rounding discrepancies.*

---

## 7. Inventory Control & Movement Audit Ledger (`/inventory`)

Comprehensive warehouse and stock tracking module:
- **Summary Metrics:** Total SKUs, total units across all categories, low-stock count, and out-of-stock count.
- **Low Stock Alert Table:** Focuses exclusively on items at or below the reorder threshold ($\le 5$ units).
- **Manual Stock Adjustments (Admin Only):**
  - **Addition (`ADDITION`):** Stock intake / vendor shipment receipt.
  - **Reduction (`REDUCTION`):** Shrinkage, damage, or stock write-off.
  - **Adjustment (`ADJUSTMENT`):** Physical audit correction.
  - *Mandatory Reason Code:* Administrative adjustments require a non-empty explanation string.
- **Immutable Audit Movement Ledger:** Every change (including POS sales marked as `SALE`) logs an immutable entry recording `product_id`, `quantity_change`, `previous_stock`, `new_stock`, `reason`, and timestamp.

---

## 8. Transaction History & Printable Receipts (`/transactions`)

The audit and receipt review portal for historical sales:
- **Transaction Table:** Displays invoice number (`INV-YYYYMMDDHHMMSS-XXX-XXX`), timestamp, item count, subtotal, discount, and final amount paid.
- **Receipt Details Modal:** Clicking any transaction opens a detailed modal rendering the immutable line items, cashier ID, and payment breakdown.
- **Print Layout Isolation:** Includes a dedicated CSS print media stylesheet (`@media print`) that isolates the receipt container, strips web navigation headers/sidebars, and renders clean 80mm thermal receipt styling.
- **Historical Snapshot Immutability:** Line items are stored as independent copies in `bill_items`; subsequent price updates or product deactivations in the catalog never mutate past sales.

---

## 9. Sales Analytics & Reporting (`/analytics`)

Executive summary and data visualization dashboard:
- **Database-Side Aggregations:** Summary KPIs (total revenue, total transactions, average basket size) are computed directly within SQLite via SQL aggregate functions (`SUM`, `AVG`, `COUNT`).
- **Revenue & Transaction Trends:** Visual time-series charts powered by **Recharts**.
- **Category Sales Distribution:** Donut chart illustrating sales proportion across store departments.
- **Top-Selling SKUs:** Ranked table showing volume and revenue generation per product.

---

## 10. Authentication & Role-Based Access Control (RBAC)

Two-tier security model distinguishing daily staff operations from administrative master control:

| Capability | Staff Mode (Default) | Admin Mode (Unlocked) |
| :--- | :---: | :---: |
| Browse Public Corporate Site | Yes | Yes |
| Run POS Terminal & Checkouts | Yes | Yes |
| View Product Catalog & Stock | Yes | Yes |
| View Transaction History & Receipts | Yes | Yes |
| View Inventory Movements & Audits | Yes | Yes |
| View Analytics & Sales Reports | Yes | Yes |
| Create / Edit / Deactivate Products | **No (401/403)** | **Yes** |
| Create / Edit / Delete Brands & Categories | **No (401/403)** | **Yes** |
| Perform Manual Inventory Adjustments | **No (401/403)** | **Yes** |

- **Unlock Workflow:** Clicking **Unlock Admin** in the header opens a secure modal. The user enters the administrator password, verified against stored PBKDF2-HMAC-SHA256 hashes.
- **Session Security:** Successful unlock issues a 64-character cryptographic token stored in client memory. Tokens expire after 3,600 seconds and are immediately invalidated if the backend server restarts.

---

## 11. Interactive OOP Concepts Explorer (`/oop-concepts`)

A dedicated academic demonstration module embedded directly inside the application:
- **Concept Cards:** Interactive cards explaining Encapsulation, Polymorphism, Inheritance, Virtual Inheritance, Strategy Pattern, Templates, Operator Overloading, and RAII.
- **Class Hierarchy Visualizer:** Interactive SVG diagrams displaying class relationships (`Product` $\rightarrow$ `Perishable`, `Person` $\rightarrow$ `Employee`/`Customer` $\rightarrow$ `Manager`).
- **Live Strategy Simulator:** Cashiers and evaluators can select a product, choose a discount strategy, adjust parameters, and observe real-time polymorphic calculations.
- **Object Slicing Demonstration:** Interactive visual explanation contrasting pass-by-value slicing with pass-by-reference polymorphic dispatch.
- **Interactive OOP Quiz:** Self-assessment quiz testing core C++ OOP knowledge.
