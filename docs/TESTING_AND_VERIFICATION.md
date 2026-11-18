# Testing and Verification Guide

## Table of Contents
- [1. Testing Strategy Overview](#1-testing-strategy-overview)
- [2. Automated C++ Test Suites (CTest)](#2-automated-c-test-suites-ctest)
  - [2.1 DiscountSuite (`test_discounts.cpp`)](#21-discountsuite-test_discountscpp)
  - [2.2 InventorySuite (`test_inventory.cpp`)](#22-inventorysuite-test_inventorycpp)
  - [2.3 BillingSuite (`test_billing.cpp`)](#23-billingsuite-test_billingcpp)
  - [2.4 DatabaseSuite (`test_database.cpp`)](#24-databasesuite-test_databasecpp)
  - [2.5 ApiSuite (`test_api.cpp`)](#25-apisuite-test_apicpp)
- [3. Frontend Automated Compilation & Type Checks](#3-frontend-automated-compilation-type-checks)
- [4. Commands to Run Automated Tests](#4-commands-to-run-automated-tests)
- [5. Test Coverage & Verified Scope Summary](#5-test-coverage-verified-scope-summary)
- [6. Manual E2E Workflows Verified](#6-manual-e2e-workflows-verified)

---

## 1. Testing Strategy Overview

The system employs a multi-layered verification strategy:
1. **Unit Testing:** Individual domain logic, mathematical correctness of discount strategies, and class invariants.
2. **Integration Testing:** SQLite persistence, schema migrations, transactional rollbacks, and concurrent stock safety.
3. **API & End-to-End Testing:** Mocked and live HTTP Crow endpoints, PBKDF2 cryptography, RBAC guards, and token sessions.
4. **Static Analysis & Type Checking:** TypeScript compilation (`tsc -b`) and strict MSVC warnings (`/W4`).
5. **Cross-Viewport Visual QA:** Automated responsive validation across desktop, tablet, and mobile breakpoints.

---

## 2. Automated C++ Test Suites (CTest)

The C++ backend includes **5 dedicated test executables** comprising **39 automated test cases**:

### 2.1 DiscountSuite (`test_discounts.cpp`)
- **Scope:** 6 Test Cases (100% Pass)
- `testPercentageDiscount`: Verifies exact integer paise calculations for fractional discounts.
- `testFixedAmountDiscount`: Verifies flat deductions in paise.
- `testInvalidPercentageRejection`: Rejects percentages $< 0\%$ or $> 100\%$.
- `testNegativeFixedDiscountRejection`: Rejects negative discount amounts.
- `testFixedDiscountExceedingProductPrice`: Ensures discount cannot exceed base unit price (price cannot drop below ₹0.00).
- `testCustomExceptionHierarchyAndPolymorphism`: Verifies polymorphic catching via `const ISupermarketException&` and `std::exception&`.

### 2.2 InventorySuite (`test_inventory.cpp`)
- **Scope:** 6 Test Cases (100% Pass)
- `testStockReductionValid`: Verifies stock decreases accurately.
- `testInsufficientStockRejection`: Verifies `InsufficientStockException` is thrown when decrement exceeds available inventory.
- `testNegativeStockPrevention`: Guards against negative stock parameters.
- `testProductIdentityBasedOnId`: Verifies domain object equality based on unique identifiers.
- `testStockInfoNestedClass`: Verifies encapsulation of the internal `StockInfo` class.
- `testQuantityExceptionsAndStockBoundaries`: Verifies `InvalidQuantityException` derivation and rejection of zero/negative quantities.

### 2.3 BillingSuite (`test_billing.cpp`)
- **Scope:** 6 Test Cases (100% Pass)
- `testBillingCalculations`: Verifies gross subtotal, aggregate discounts, and final payable amount.
- `testInvalidQuantityRejection`: Rejects zero or negative line item quantities.
- `testHistoricalSnapshotImmutability`: Proves that modifying a product's price does not alter existing bill items.
- `testOperatorOverloads`: Tests `Bill::operator+=`, `operator+`, `operator==`, and `operator<`.
- `testDiamondInheritance`: Validates virtual inheritance resolving `Person` via `Manager`.
- `testGenericTemplates`: Verifies instantiation and type safety of `Repository<T>` and `ApiResponse<T>`.

### 2.4 DatabaseSuite (`test_database.cpp`)
- **Scope:** 8 Test Cases (100% Pass)
- `testDatabaseInitialization`: Verifies tables, WAL mode, foreign keys, and migration versions up to v6.
- `testBrandAndCategoryRepositories`: Verifies CRUD and unique constraint checks.
- `testProductRepositoryCrudAndPolymorphism`: Verifies persistence of `Perishable` and `NonPerishable` records.
- `testBillingPersistenceAndStockSafety`: Verifies atomic invoice creation with stock deduction.
- `testTransactionRollbackOnStockFailure`: Injects a failure into a multi-item bill and proves the entire transaction rolls back cleanly.
- `testFailureRecoveryAndTransactionRollback`: Tests database stability under simulated connection interruptions.
- `testCustomerRepository`: Verifies CRM customer creation, spending calculations, and loyalty lookups.
- `testProductReservationRepository`: Verifies multi-session cart stock hold reservations and TTL expiration.

### 2.5 ApiSuite (`test_api.cpp`)
- **Scope:** 13 Test Cases (100% Pass)
- 1. Health Endpoint Test (`/api/health`).
- 2. Staff Authentication & Session Management.
- 3. RBAC Route Protection (verifies unauthenticated mutations return `401`/`403`).
- 4. Brands & Categories Management.
- 5. Product Creation & Filtering.
- 6. Inventory Management & Movement Tracking.
- 7. Transactional Billing Checkout & Invoice Snapshot.
- 8. Historical Invoice Snapshot Immutability Verification.
- 9. Database Summary Aggregates & Pagination Metadata.
- 10. Inventory Adjustment Contracts Audit.
- 11. Admin Logout & Session Invalidation.
- 12. Cross-Platform PBKDF2-HMAC-SHA256 Compatibility (Windows CNG vs. OpenSSL test vectors).
- 13. Multi-Session Cart Reservation & Reserved Stock Isolation.

---

## 3. Frontend Automated Compilation & Type Checks

From `Supermarket_Management_System/frontend/`:
```bash
npm run build
```
Executes:
1. `tsc -b`: Strict TypeScript compiler check across all components, contexts, hooks, and types.
2. `vite build`: Tree-shakes, bundles, and emits minified production assets into `dist/`.

*Result: Zero TypeScript errors, zero unresolved imports.*

---

## 4. Commands to Run Automated Tests

### One-Command Runner (Backend + Frontend)
From `Supermarket_Management_System/`:
```powershell
.\build-and-test.ps1
```

### Direct CTest Command
From `Supermarket_Management_System/backend/`:
```powershell
ctest --test-dir build -C Release --output-on-failure
```

### Individual Test Binaries
From `Supermarket_Management_System/backend/build/tests/Release/`:
```powershell
.\test_discounts.exe
.\test_inventory.exe
.\test_billing.exe
.\test_database.exe
.\test_api.exe
```

---

## 5. Test Coverage & Verified Scope Summary

| Test Suite | Total Cases | Passed | Failed | Status |
| :--- | :---: | :---: | :---: | :---: |
| **DiscountSuite** | 6 | 6 | 0 | **PASS** |
| **InventorySuite** | 6 | 6 | 0 | **PASS** |
| **BillingSuite** | 6 | 6 | 0 | **PASS** |
| **DatabaseSuite** | 8 | 8 | 0 | **PASS** |
| **ApiSuite** | 13 | 13 | 0 | **PASS** |
| **Frontend TypeScript Build** | N/A | Pass | 0 | **PASS** |
| **Total Automated Coverage** | **39** | **39** | **0** | **100% PASS** |

---

## 6. Manual E2E Workflows Verified

In addition to automated unit tests, the following live workflows have been verified against the running application:
1. **Public vs. Staff Boundary:** Verified that visiting `/` renders only the customer corporate website, while `/staff` transitions to the management suite.
2. **Catalog Integrity:** Verified that 25 representative Indian retail products appear across 7 categories with correct ₹ pricing and expiry dates.
3. **POS Checkout Flow:** Added Atta (2x) and Butter (1x) to cart, verified live reactive totals with 5% discount, executed checkout, and verified stock decreased from 34 $\rightarrow$ 32 and 29 $\rightarrow$ 28.
4. **Movement Audit Trail:** Verified that `inventory_movements` logged movement `#31` with `movementType = SALE`, `quantityChange = -2`, and the invoice number in `reason`.
5. **Printable Receipt:** Verified that clicking **Print Receipt** opens a dedicated print dialog showing clean 80mm receipt isolation without web navigation.
6. **Admin Unlock Flow:** Unlocked administrative privileges using `admin123`, created a test brand, and executed a manual stock intake.
7. **Local Persistence Across Restart:** Stopped `supermarket_server.exe`, restarted it, and confirmed that decremented stock levels and completed invoices were fully preserved in SQLite.
