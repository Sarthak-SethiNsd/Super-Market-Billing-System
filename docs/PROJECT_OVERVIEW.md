# Project Overview — Supermarket Billing & Inventory Management System

## Table of Contents
- [1. Executive Summary](#1-executive-summary)
- [2. Problem Statement & Motivation](#2-problem-statement-motivation)
- [3. Project Objectives](#3-project-objectives)
- [4. Scope of the System](#4-scope-of-the-system)
- [5. System Architecture & Module Boundaries](#5-system-architecture-module-boundaries)
- [6. User Roles and Workflows](#6-user-roles-and-workflows)
- [7. Operational Constraints & Design Invariants](#7-operational-constraints-design-invariants)

---

## 1. Executive Summary

The **Supermarket Billing & Inventory Management System** (commercially branded as **ApexMart**) is a full-stack, enterprise-grade application developed as the semester capstone for an Object-Oriented Programming (OOP) curriculum in C++. 

The project bridges classical academic OOP paradigms with modern production software engineering practices. It replaces the legacy console-based billing script (`Supermarket_billing_System/1.cpp`) with a robust C++17 microservice backend powered by **Crow** and **SQLite3**, paired with a responsive **React 19 + TypeScript + Vite** frontend.

The application features a clean architectural separation between:
1. **Public Customer Portal (`/`):** A professional corporate website showcasing supermarket facilities, departments, customer commitments, quality standards, and verified store information.
2. **Internal Staff Management Application (`/staff` $\rightarrow$ `/dashboard`, `/billing`, etc.):** An authenticated Point-of-Sale (POS) and inventory administration suite providing atomic checkout, real-time stock decrements, historical invoice snapshotting, and immutable inventory movement ledgers.

---

## 2. Problem Statement & Motivation

Traditional retail operations and academic introductory systems frequently encounter severe operational vulnerabilities:
- **Concurrency & Stock Overselling:** Billing systems without stock reservation or atomic transactions risk overselling scarce products to simultaneous shoppers.
- **Floating-Point Currency Drift:** Storing currency amounts using IEEE 754 floating-point numbers (`float`/`double`) introduces catastrophic rounding errors during tax and discount summations.
- **Historical Record Mutability:** If a product's price or description changes, poorly designed billing systems retroactively alter historical receipts.
- **Payment & Approval Bottlenecks:** Systems relying on third-party payment gateways, QR code webhooks, or manual manager approval queues suffer from checkout latency and failure points.
- **Security Vulnerabilities:** Plaintext credential storage, unauthenticated admin endpoints, and SQL injection flaws.

This system addresses each vulnerability through rigorous software architecture:
- **Integer Paise Representation:** All monetary values are strictly represented and calculated as 64-bit signed integers (`int64_t`) in smallest currency units (paise: ₹1.00 = 100 paise).
- **Multi-Session Reserved Stock System:** 15-minute TTL cart holds (`product_reservations`) isolate stock across concurrent shoppers, calculating available stock dynamically ($\text{available} = \max(0, \text{total} - \text{reserved})$).
- **Atomic Purchase Approval Model:** POS and customer checkouts execute directly as an atomic purchase approval model inside ACID-compliant SQLite transactions (`Transaction` RAII class) that guarantee all-or-nothing execution without third-party network latency.
- **Multi-Batch FEFO Stock Deduction:** Automatically deducts from earliest-expiring unexpired batches first for perishable inventory.
- **Polymorphic Domain Exception Hierarchy:** Custom exceptions in `Exceptions.hpp` map cleanly to standard library hierarchies and translate to deterministic HTTP 400/409 codes.
- **Immutable Invoice Snapshots:** Line items in completed transactions capture a frozen copy of product name, brand, original unit price, discount strategy, and line total at the exact moment of sale.
- **Cryptographic Security:** Passwords are hashed using PBKDF2-HMAC-SHA256 with 100,000 iterations and 128-bit cryptographically secure random salts.

---

## 3. Project Objectives

1. **Practical OOP Demonstration:** Demonstrate real-world applications of encapsulation, inheritance, runtime polymorphism, diamond virtual inheritance, the Strategy pattern, RAII resource management, operator overloading, and generic templates in modern C++17.
2. **Reliable Billing & POS:** Deliver a high-throughput, keyboard-friendly Point-of-Sale interface with instant search, reactive totals, and receipt generation.
3. **Auditable Inventory Control:** Maintain a complete, immutable audit trail of every stock addition, reduction, sale, and administrative adjustment.
4. **Cross-Platform Portability:** Support native Windows compilation using MSVC and Windows CNG, alongside containerized Linux deployment via Docker and OpenSSL 3.x.
5. **Zero External Runtime Dependencies:** Embed all third-party C++ libraries (SQLite3 amalgamation, Crow, Asio standalone, nlohmann/json) directly in the repository.

---

## 4. Scope of the System

### Implemented Modules

| Module | Core Capabilities | Primary Endpoints |
| :--- | :--- | :--- |
| **Public Portal** | Corporate overview, department showcases, store contact placeholders, Staff Portal gateway. | `/` |
| **Authentication & RBAC** | Single-administrator authentication, session validation, secure logout, role-based route guard. | `/api/auth/*` |
| **Brand & Category Management** | Admin-managed taxonomies for product grouping and POS navigation. | `/api/brands`, `/api/categories` |
| **Product Catalog** | Perishable and non-perishable inventory management, pricing, discount assignment, stock levels. | `/api/products/*` |
| **Point-of-Sale (POS) Billing** | Barcode/SKU scanning, live cart calculation, polymorphic discount evaluation, atomic checkout. | `/api/bills` |
| **Transaction & Receipts** | Historical invoice ledger, receipt inspection, printable formatted receipt isolation. | `/api/bills/*` |
| **Inventory & Audit Movement** | Reorder alert monitoring, manual stock adjustments with mandatory reason codes, movement log. | `/api/inventory/*` |
| **Sales Analytics** | Aggregate revenue, transaction volume, top-selling items, category distribution. | `/api/bills/summary`, `/api/products/summary` |
| **OOP Concepts Explorer** | Interactive educational walkthrough of C++ design patterns, class diagrams, and live simulations. | `/oop-concepts` |

---

## 5. System Architecture & Module Boundaries

```
[ Browser Client (React + TypeScript + Vite) ]
        |
        | HTTP / REST (JSON)
        v
[ C++17 Crow Multithreaded HTTP Server ]
        |
        +---> [ Auth Middleware & RBAC (Bearer Tokens / Session RAM) ]
        |
        +---> [ Controllers (Product, Bill, Inventory, Brand, Category, Auth) ]
                    |
                    +---> [ Domain Models (Product, Perishable, Bill, StockInfo) ]
                    |
                    +---> [ Strategy Engine (IDiscountStrategy) ]
                    |
                    +---> [ Repositories (RAII Prepared Statements) ]
                                |
                                v
                    [ Embedded SQLite3 Engine (WAL Mode) ]
                                |
                                v
                    [ backend/data/supermarket.db ]
```

---

## 6. User Roles and Workflows

### Role Definitions (Strict Two-Mode Operating Architecture)

1. **Public Customer Mode:**
   - Visits `/` for corporate store showcase, department highlights, and verified amenities.
   - Browses catalog with dynamic category filters ("All Categories" + dynamic departments).
   - Places temporary 15-minute stock holds via the Multi-Session Reserved Stock System (`/api/cart`).
   - Executes atomic self-service checkout (`POST /api/bills`) with customer name & phone entry.
   - Generates instant 80mm thermal receipts.
   - **Restricted:** Zero access to internal revenue metrics, stock adjustment tools, product CRUD, or staff credential management.

2. **Staff Mode (Password-Authenticated):**
   - Authenticated via `POST /api/auth/staff/login` with PBKDF2-HMAC-SHA256 (`Staff@123`).
   - Receives an in-memory 64-character bearer token.
   - Full access to the operational dashboard featuring 5 real-time KPI summary cards.
   - Product catalog management with intelligent duplicate restock logic and soft deactivation.
   - Multi-batch tracking with FEFO (First-Expired, First-Out) stock deduction and nearest-expiry date synchronization.
   - Daily price and discount auditing via `price_history`.
   - Inventory management (`/inventory`) with manual stock additions, write-offs, and an immutable audit ledger (`inventory_movements`).
   - Category and brand taxonomy management (`category_brands`).
   - Complete historical billing audit register (`/transactions`).

---

## 7. Operational Constraints & Design Invariants

- **Single Canonical Database:** All components (the launcher script `start-app.ps1`, the C++ seeder, the Python seeder, and the backend server) operate on `backend/data/supermarket.db`.
- **In-Memory Token Lifetime:** Admin session tokens exist only in backend RAM and expire after 3,600 seconds (1 hour). Restarting the backend server immediately invalidates all active sessions.
- **Non-Destructive Product Deactivation:** Products with existing transaction history cannot be deleted via foreign key cascades; they are soft-deactivated (`is_active = 0`) to preserve historical integrity.
- **Untouched Academic Reference:** The root file `Supermarket_billing_System/1.cpp` is preserved in its original academic state without modification.
