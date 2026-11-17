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
- **Concurrency & Stock Overselling:** Billing systems without atomic database transactions risk selling products beyond physical warehouse availability.
- **Floating-Point Currency Drift:** Storing currency amounts using IEEE 754 floating-point numbers (`float`/`double`) introduces catastrophic rounding errors during tax and discount summations.
- **Historical Record Mutability:** If a product's price or description changes, poorly designed billing systems retroactively alter historical receipts.
- **Security Vulnerabilities:** Plaintext credential storage, unauthenticated admin endpoints, and SQL injection flaws.

This system addresses each vulnerability through rigorous software architecture:
- **Integer Paise Representation:** All monetary values are strictly represented and calculated as 64-bit signed integers (`int64_t`) in smallest currency units (paise: ₹1.00 = 100 paise).
- **Atomic Database Transactions:** Multi-item checkouts and stock deductions execute within ACID-compliant SQLite transactions (`Transaction` RAII class) that guarantee all-or-nothing execution.
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

### Role Definitions

1. **Public Customer:**
   - Visits `/` to view store hours, department offerings, and company information.
   - Cannot view internal sales metrics, transaction records, or stock adjustment tools.

2. **Cashier / Staff Member (Default Internal Mode):**
   - Accesses internal application via `/staff` or direct navigation.
   - Can search products, build cart items, apply discounts, and complete sales checkouts.
   - Can inspect historical receipts and view real-time inventory counts.
   - **Restricted:** Cannot create or edit products, delete categories, modify master prices, or perform arbitrary stock adjustments.

3. **Administrator:**
   - Unlocks administrative privileges by clicking **Unlock Admin** and providing the master password.
   - Receives an in-memory bearer token stored in client memory.
   - Can create, update, and deactivate products, brands, and categories.
   - Can execute arbitrary inventory adjustments with mandatory reason codes.

---

## 7. Operational Constraints & Design Invariants

- **Single Canonical Database:** All components (the launcher script `start-app.ps1`, the C++ seeder, the Python seeder, and the backend server) operate on `backend/data/supermarket.db`.
- **In-Memory Token Lifetime:** Admin session tokens exist only in backend RAM and expire after 3,600 seconds (1 hour). Restarting the backend server immediately invalidates all active sessions.
- **Non-Destructive Product Deactivation:** Products with existing transaction history cannot be deleted via foreign key cascades; they are soft-deactivated (`is_active = 0`) to preserve historical integrity.
- **Untouched Academic Reference:** The root file `Supermarket_billing_System/1.cpp` is preserved in its original academic state without modification.
