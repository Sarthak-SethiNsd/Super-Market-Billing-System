# Comprehensive Testing Report: Supermarket Management System

**Test Framework:** CMake / CTest Test Driver
**Target Environment:** Windows 10/11 (MSVC C++17 Release)
**Execution Timestamp:** Automated CTest Verification Suite
**Overall Result:** **34 / 34 Test Cases PASSED (100% Coverage)**

---

## 1. Automated Backend CTest Suites

The backend contains **5 dedicated automated CTest test suites** comprising **34 discrete unit and integration test assertions**.

```powershell
ctest --test-dir backend/build -C Release --output-on-failure
```

### Summary of Results:
```
    Start 1: DiscountSuite
1/5 Test #1: DiscountSuite ....................   Passed    0.16 sec
    Start 2: InventorySuite
2/5 Test #2: InventorySuite ...................   Passed    0.04 sec
    Start 3: BillingSuite
3/5 Test #3: BillingSuite .....................   Passed    0.04 sec
    Start 4: DatabaseSuite
4/5 Test #4: DatabaseSuite ....................   Passed    0.53 sec
    Start 5: ApiSuite
5/5 Test #5: ApiSuite .........................   Passed    2.56 sec

100% tests passed, 0 tests failed out of 5
Total Test time (real) = 3.40 sec
```

---

## 2. Test Suite Details & Verifications

### 2.1 Suite 1: `DiscountSuite` (`tests/test_discounts.cpp`)
Verifies promotional discount calculations in integer paise using the Strategy Pattern.
- **Pass Rate:** **5 / 5 PASSED (100%)**

| Test Case | Scope & Input Values | Expected Behavior | Result |
| :--- | :--- | :--- | :---: |
| `PercentageDiscountValid` | Unit price: 50,000 paise (₹500), Rate: 10.0% | Discount = 5,000 paise (₹50). Net = 45,000 paise. | **PASS** |
| `PercentageDiscountZero` | Unit price: 25,000 paise, Rate: 0.0% | Discount = 0 paise. Net = 25,000 paise. | **PASS** |
| `PercentageDiscountFull` | Unit price: 10,000 paise, Rate: 100.0% | Discount = 10,000 paise. Net = 0 paise. | **PASS** |
| `FixedDiscountValid` | Unit price: 10,000 paise (₹100), Fixed: 2,000 paise (₹20) | Discount = 2,000 paise. Net = 8,000 paise. | **PASS** |
| `StrategySelectionAndPolymorphism` | Runtime swap of `IDiscountStrategy` pointer | Polymorphic dynamic dispatch computes correct rate without recompilation. | **PASS** |

---

### 2.2 Suite 2: `InventorySuite` (`tests/test_inventory.cpp`)
Validates stock arithmetic, encapsulation in `StockInfo`, and underflow prevention.
- **Pass Rate:** **5 / 5 PASSED (100%)**

| Test Case | Scope & Input Values | Expected Behavior | Result |
| :--- | :--- | :--- | :---: |
| `InitialStock` | Initialized with 100 units | Returns `stock == 100`. | **PASS** |
| `StockAddition` | Add 50 units to stock | Returns `stock == 150`. | **PASS** |
| `StockReductionSuccess` | Deduct 40 units from 150 | Returns `stock == 110`. | **PASS** |
| `StockReductionInsufficientThrows` | Attempt to deduct 200 units from 110 | Throws `std::runtime_error("Insufficient stock available")`. | **PASS** |
| `NegativeQuantityThrows` | Attempt to add/deduct -10 units | Throws `std::invalid_argument("Deduction amount cannot be negative")`. | **PASS** |

---

### 2.3 Suite 3: `BillingSuite` (`tests/test_billing.cpp`)
Verifies invoice mathematical integrity, operator overloading, and diamond inheritance.
- **Pass Rate:** **6 / 6 PASSED (100%)**

| Test Case | Scope & Input Values | Expected Behavior | Result |
| :--- | :--- | :--- | :---: |
| `EmptyBillCalculations` | Initialized empty bill | Subtotal = 0, Discount = 0, Final Amount = 0 paise. | **PASS** |
| `AddItemCalculatesSubtotal` | Add 2 items (price: 10,000 paise each) | Subtotal = 20,000 paise. | **PASS** |
| `DiscountApplicationOnBill` | Add item with 10% discount | Line total deducts promotional paise accurately. | **PASS** |
| `OperatorOverloadingCompoundAdd` | Test `bill += item` syntax | Line item appended and financial totals updated in place. | **PASS** |
| `OperatorOverloadingStreamOutput` | Test `os << bill` stream formatting | Serializes thermal-style receipt string with totals and timestamps. | **PASS** |
| `DiamondInheritancePolymorphism` | Instantiate `Manager` derived virtually from `Employee` & `Customer` via `Person` | Unambiguous single `Person` subobject resolution; polymorphic dispatch succeeds. | **PASS** |

---

### 2.4 Suite 4: `DatabaseSuite` (`tests/test_database.cpp`)
Validates SQLite persistence, schema migrations, and ACID transaction rollbacks.
- **Pass Rate:** **6 / 6 PASSED (100%)**

| Test Case | Scope & Input Values | Expected Behavior | Result |
| :--- | :--- | :--- | :---: |
| `ConnectionCreation` | Initialize in-memory / file SQLite | Connects successfully with WAL mode enabled. | **PASS** |
| `MigrationExecution` | Run `DatabaseMigrator::migrate()` | `PRAGMA user_version` advances cleanly to version 4; all 10 tables exist. | **PASS** |
| `ProductRepositoryCRUD` | Insert, retrieve, update, delete product | Persistent records match inserted attributes; soft-delete updates `is_active`. | **PASS** |
| `TransactionCommit` | Execute multiple writes inside `Transaction tx; tx.commit();` | All records committed permanently to disk. | **PASS** |
| `TransactionRollback` | Execute write, throw exception before `tx.commit()` | RAII destructor rolls back; zero partial records written. | **PASS** |
| `ForeignKeyEnforcement` | Attempt to insert product with invalid `brand_id` | SQLite throws `SQLITE_CONSTRAINT_FOREIGNKEY`. | **PASS** |

---

### 2.5 Suite 5: `ApiSuite` (`tests/test_api.cpp`)
Validates Crow HTTP routing, session roles, RBAC access guards, and atomic checkout.
- **Pass Rate:** **12 / 12 PASSED (100%)**

| Test Case | Scope & Tested Endpoint | Expected Behavior | Result |
| :--- | :--- | :--- | :---: |
| `HealthCheckReturns200` | `GET /api/health` | Returns HTTP 200 `{"status": "ok"}`. | **PASS** |
| `SessionReturnsCustomerByDefault` | `GET /api/auth/session` (No token) | Returns `{"authenticated": false, "role": "CUSTOMER"}`. | **PASS** |
| `StaffLoginWithCorrectPassword` | `POST /api/auth/staff/login` (`admin123`) | Returns HTTP 200, valid token, and `role: "STAFF"`. | **PASS** |
| `StaffLoginWithInvalidPassword` | `POST /api/auth/staff/login` (`wrongpass`) | Returns HTTP 401 Unauthorized `{"error": "Invalid staff credentials"}`. | **PASS** |
| `ProtectedRoutesBlockCustomer` | `GET /api/bills`, `POST /api/inventory/adjust`, etc. without token | Returns HTTP 401 Unauthorized `{"error": "Staff authentication required"}`. | **PASS** |
| `ProtectedRoutesAllowStaff` | Protected routes called with `Authorization: Bearer <token>` | Returns HTTP 200 OK and executes management operation. | **PASS** |
| `ProductListPubliclyAccessible` | `GET /api/products` without token | Returns HTTP 200 OK with product catalog. | **PASS** |
| `CheckoutCreatesBillAtomically` | `POST /api/bills` with valid item payload | Returns HTTP 201 Created with unique bill number and snapshot lines. | **PASS** |
| `StockDecrementsAfterCheckout` | Inspect product stock after checkout | Stock count decrements by exact units purchased. | **PASS** |
| `LogoutRevertsSessionToCustomer` | `POST /api/auth/logout` followed by `GET /api/auth/session` | Invalids token; returns `role: "CUSTOMER"`. | **PASS** |
| `InventoryMovementsLogged` | Query `inventory_movements` after sale | Immutable `SALE` record exists with negative quantity delta. | **PASS** |
| `PaiseCurrencyInvariantPreserved` | Validate financial integer balance | $\text{finalAmountPaise} = \text{subtotalPaise} - \text{totalDiscountPaise}$. Zero drift. | **PASS** |

---

## 3. Frontend Production Build Verification

- **Command:** `npm run build` (`tsc -b && vite build`)
- **Compilation Time:** **18.29 seconds**
- **TypeScript Errors:** **0 errors**
- **Output Bundle:**
  - `dist/index.html` (0.85 kB)
  - `dist/assets/index-*.css` (56.01 kB)
  - `dist/assets/index-*.js` (1,034.30 kB)

---

## 4. Known Untested Areas & Testing Limitations

To maintain academic rigor and honesty, the following boundaries are explicitly disclosed:
1. **Physical POS Hardware Testing:** Testing was conducted on virtual keyboard and browser inputs. Physical USB laser barcode scanners and serial RS-232 electronic weigh scales were simulated via standard software payloads rather than live physical serial bus drivers.
2. **Stress / High Concurrency Load Testing:** SQLite with WAL mode supports hundreds of concurrent readers, but writing is sequentially serialized. Stress testing beyond $1,000$ simultaneous writes per second was not benchmarked due to local academic workstation limitations.
3. **Cross-Browser Verification:** Verified on Chromium (Edge, Chrome) and Firefox. WebKit Safari on iOS was verified responsive via mobile viewport emulation ($375 \times 812$) rather than physical Apple hardware.
