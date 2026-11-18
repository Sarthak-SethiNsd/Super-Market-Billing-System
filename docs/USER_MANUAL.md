# User Manual: Supermarket Billing & Inventory Management System (ApexMart)

**System:** Supermarket Billing & Inventory Management System  
**Interface:** Responsive Web Single-Page Application (SPA)  
**Operating Modes:** Exactly Two Modes:
1. **Customer Mode:** Public product browsing, shelf prices, multi-session cart reservation, and self-service checkout.
2. **Staff Mode:** Password-authenticated complete supermarket management portal.

---

## 1. Starting the Application

### 1.1 One-Command Launch (Windows PowerShell)
Open PowerShell in the project directory (`Supermarket_Management_System/`) and run:

```powershell
.\start-app.ps1
```

### What Happens Automatically:
1. The script verifies that the SQLite database exists at `backend/data/supermarket.db`.
2. It launches the C++17 Crow backend server on port `8080`.
3. It launches the React + Vite frontend server on port `5173`.
4. Your default browser opens automatically to `http://localhost:5173`.

> **To Stop the Application:** Press **`Ctrl+C`** in the PowerShell window. Both server processes will terminate cleanly.

---

## 2. Customer Mode Workflow

Upon navigating to `http://localhost:5173`, the application opens in **Customer Mode**. No login is required.

```text
┌────────────────────────────────────────────────────────┐
│  CUSTOMER MODE (Public)                                │
│                                                        │
│  [ Browse Departments ] -> [ Hold Items in Cart ]      │
│          │                         │                   │
│          v                         v                   │
│  [ View Shelf Prices ]      [ 15-Min Cart TTL ]        │
│                                    │                   │
│                                    v                   │
│                         [ Enter Customer Name ]        │
│                                    │                   │
│                                    v                   │
│                         [ Atomic Checkout ]            │
│                                    │                   │
│                                    v                   │
│                       [ Print 80mm Thermal Receipt ]   │
└────────────────────────────────────────────────────────┘
```

### 2.1 Browsing Products & Department Filtering
1. Navigate the public corporate website on the home page (`/`) to review store facilities, customer commitments, and department highlights.
2. Click **Start Shopping** or navigate to **Products** (`/products`) in the navigation bar.
3. Use the **Category Selector** with the `"All Categories"` pill plus dynamic department pills (*Grains & Staples, Dairy & Chilled, Snacks & Confectionery, Beverages, Personal Care, Household Essentials, Fruits & Vegetables*).
4. Perishable goods display **Perishable** badges with future ISO expiry dates (e.g., `Amul Taaza Milk`, `Fresh Spinach`).
5. Products with promotional discounts display original and discounted prices (e.g., `5% OFF`, `₹20 OFF`).

### 2.2 Multi-Session Cart Holds & Available Stock
1. On `/billing` or catalog cards, click **Add to Cart**.
2. Adding an item places a temporary 15-minute hold on the stock in `product_reservations`.
3. The catalog dynamically reflects available stock:
   $$\text{availableStock} = \max\bigl(0,\, \text{totalStock} - \text{reservedStock}\bigr)$$
4. This guarantees that other concurrent shoppers cannot claim your reserved items while you complete your shopping.

### 2.3 Atomic Purchase Approval & Checkout Execution
The checkout operates as an **Atomic Purchase Approval Model**:
- **Zero Bottlenecks:** There is no third-party payment gateway, no QR code scanning delay, and no admin approval queue.
- **Customer Name & Phone Entry:** In the checkout modal, enter your customer name and optional contact phone number (defaults to "Walk-in Customer").
- Click **"Confirm & Pay"** or **"Complete Sale & Print"**.
- The backend executes the checkout inside an atomic SQLite transaction:
  1. Validates quantities and live stock.
  2. Generates formatted invoice number (`INV-YYYYMMDDHHMMSS-mmm-seq`).
  3. Snapshots immutable line item details into `bill_items`.
  4. Automatically deducts multi-batch stock using FEFO (First-Expired, First-Out).
  5. Records `SALE` inventory movement.
  6. Releases cart reservations for your session.
- An 80mm thermal receipt modal appears instantly. Click **Print Receipt** to send the cleanly styled receipt to any thermal printer.

---

## 3. Entering Staff Mode (Authentication)

Staff Mode grants full access to operational analytics, product catalog modifications, and stock adjustments.

```text
┌──────────────────────────────────────────────────────────┐
│  STAFF MODE TRANSITION                                   │
│                                                          │
│  1. Click "Staff Login" in top header or sidebar         │
│  2. Enter Staff Password: "Staff@123" (or "admin123")    │
│  3. Click "Authenticate"                                 │
│  4. Purple "STAFF" badge activates                       │
│  5. Full management tools unlocked across all routes     │
└──────────────────────────────────────────────────────────┘
```

1. In the top navigation bar or sidebar, click the **Staff Login** button.
2. In the modal, enter the staff password:
   - **Default password:** `Staff@123` (fallback: `admin123`)
3. Click **Authenticate**.
4. Upon successful validation, the system issues an authenticated 64-character bearer token.
5. The header badge switches from green `CUSTOMER` to purple `STAFF`, unlocking `/dashboard`, `/inventory`, `/transactions`, and `/admin`.

---

## 4. Staff Management Dashboard (`/dashboard`)

The **Dashboard Overview** serves as the operational command center for store managers:

### 4.1 Key Performance Indicator (KPI) Cards
At the top of the dashboard, five real-time operational cards summarize store performance:
1. **Today's Net Sales:** Total net sales revenue earned today in INR (paise precision).
2. **Today's Invoices:** Total number of customer checkout transactions completed today.
3. **Total Active Products:** Total number of active catalog items in the database.
4. **Low Stock Alerts:** Count of items with $\text{stock} \le 5$ units requiring replenishment.
5. **Out of Stock:** Count of catalog items with $0$ units on shelves.

### 4.2 Sales Overview Chart & Recent Invoices Feed
- **Sales Trend:** Graphical weekly revenue visualization powered by Recharts.
- **Recent Invoices Feed:** Live feed of completed customer invoices with invoice number, timestamp, customer name, and total.

---

## 5. Product Management & Multi-Batch Tracking (`/products`)

In Staff Mode, the catalog page displays operational management controls:

### 5.1 Adding a Product & Duplicate Restock
1. Click the **+ Add Product** button.
2. Fill in SKU, name, brand, category, type, price in rupees, initial stock, and discount.
3. **Intelligent Duplicate Restock:** If staff enters the barcode/SKU and normalized name of an already existing item, the system automatically detects this as a restock: increments existing stock, appends a batch if perishable, and logs an `ADDITION` movement without creating duplicate rows.

### 5.2 Multi-Batch Management & FEFO Expiry Dates
1. Perishable products display individual delivery batches.
2. Staff can click **View Batches** to inspect batch numbers, remaining quantities, and expiry dates.
3. Staff can add new batches via **+ Add Batch** (`POST /api/products/:id/batches`). The system automatically synchronizes the product's nearest expiry date.
4. During POS sales, stock is automatically decremented from earliest-expiring batches first (FEFO).

### 5.3 Daily Price & Discount History Auditing
- When staff modifies a product's price or promotional discount via **Edit Product**, the system automatically records an entry in the `price_history` audit table.
- Stores old/new prices, old/new discount configurations, and notes for manager auditing.

---

## 6. Inventory & Stock Management (`/inventory`)

### 6.1 Low Stock Alerts
The inventory page highlights products at or below the reorder threshold ($\text{stock} \le 5$) with an amber warning badge (e.g., `Fresh Organic Baby Spinach Palak 250g`).

### 6.2 Manual Stock Intake & Write-Offs
1. Click **Adjust Stock** on any inventory row.
2. Select the movement type:
   - **ADDITION:** Received supplier shipment (increases stock).
   - **REDUCTION:** Damaged, spoiled, or expired goods write-off (decreases stock).
   - **ADJUSTMENT:** Physical inventory audit count correction.
3. Enter the quantity and audit justification reason (e.g., `Supplier Shipment PO-9912`).
4. Click **Save Adjustment**. The stock balance updates immediately, and an immutable entry is logged in the `inventory_movements` audit ledger.

---

## 7. Point-of-Sale (POS) Terminal (`/billing`)

Staff members can use the POS billing terminal for high-speed counter checkout:
- **Instant Search:** Type any portion of a product name or SKU to filter items in real time.
- **Customer Linking:** Search registered customers or type customer phone numbers to associate sales.
- **Fast Execution:** Click **"Confirm & Pay"** to generate an invoice and print an 80mm thermal receipt.

---

## 8. Transaction Audit Ledger (`/transactions`)

- Displays the complete chronological history of every customer invoice.
- Click any bill row to open its full invoice snapshot.
- Displays line-item product names, brands, unit prices, applied discounts, and totals frozen at the exact second the sale was finalized.

---

## 9. Analytics & Reporting (`/analytics`)

- **Revenue Breakdown:** Interactive charts displaying sales volume across different departments.
- **Top Selling Products:** Ranked table of top performers by revenue and units sold.
