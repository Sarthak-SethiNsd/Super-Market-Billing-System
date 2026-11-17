# User Manual: Supermarket Billing & Inventory Management System (ApexMart)

**System:** Supermarket Billing & Inventory Management System
**Interface:** Responsive Web Single-Page Application (SPA)
**Operating Modes:** Exactly Two Modes:
1. **Customer Mode:** Public product browsing, shelf prices, and self-service checkout.
2. **Staff Mode:** Password-authenticated complete supermarket management portal.

---

## 1. Starting the Application

### 1.1 One-Command Launch (Windows PowerShell)
Open PowerShell in the project directory (`Supermarket_Management_System/` or `Supermarket_Submission_Staging/Supermarket_Management_System/`) and run:

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

```
┌──────────────────────────────────────────────────────────┐
│  CUSTOMER MODE (Public)                                  │
│                                                          │
│  [ Browse Departments ] -> [ Add Items to Cart ]         │
│          │                               │               │
│          v                               v               │
│  [ View Shelf Prices ]    [ Enter Details (Optional) ]   │
│                                          │               │
│                                          v               │
│                               [ Execute Checkout ]       │
│                                          │               │
│                                          v               │
│                            [ Print Thermal Receipt ]     │
└──────────────────────────────────────────────────────────┘
```

### 2.1 Browsing Products & Departments
1. Navigate the public corporate website on the home page (`/`) to review store facilities, customer commitments, and department highlights.
2. Click **Start Shopping** or navigate to **Products** (`/products`) in the navigation bar.
3. Browse the 25 pre-seeded retail products categorized across 7 departments:
   - *Grains & Staples, Dairy & Chilled, Snacks & Confectionery, Beverages, Personal Care, Household Essentials, Fruits & Vegetables*.
4. Perishable goods display **Perishable** badges with future ISO expiry dates (e.g., `Amul Taaza Milk`, `Fresh Spinach`).
5. Products with promotional discounts display original and discounted prices (e.g., `5% OFF`, `₹20 OFF`).

### 2.2 Adding Items to Cart & Self-Service Checkout
1. On `/billing` (or the customer checkout view), browse or search products by name or SKU.
2. Click any product card to add it to your shopping cart.
3. Adjust quantities using the `+` and `-` controls. The system guards against overselling: you cannot increment beyond available store stock.
4. Review the reactive cart summary:
   - **Subtotal:** Gross sum of items before savings.
   - **Promotional Savings:** Total discounted paise.
   - **Final Amount:** Net payable total.
5. (Optional) Enter your Customer Name and Phone Number for invoice record-keeping.
6. Click **Complete Sale & Print**.
7. The atomic checkout executes, your receipt modal appears instantly, and store inventory decrements automatically.

### 2.3 Printing Your Receipt
- The receipt modal displays the unique invoice number (e.g., `BILL-20261118-0014`), date, itemized product lines with unit prices, discounts, and total.
- Click **Print Receipt** to open the browser print dialog formatted for standard 80mm thermal receipt rolls (`@media print`).

---

## 3. Entering Staff Mode (Authentication)

Staff Mode grants full access to operational analytics, product catalog modifications, and stock adjustments.

```
┌──────────────────────────────────────────────────────────┐
│  STAFF MODE TRANSITION                                   │
│                                                          │
│  1. Click "Staff Login" in top header or sidebar         │
│  2. Enter Staff Password: "admin123"                     │
│  3. Click "Authenticate"                                 │
│  4. Purple "STAFF" badge activates                       │
│  5. Full management tools unlocked across all routes     │
└──────────────────────────────────────────────────────────┘
```

1. In the top navigation bar or sidebar, click the **Staff Login** button.
2. In the modal, enter the staff password:
   - **Pre-seeded demonstration password:** `admin123`
3. Click **Authenticate**.
4. Upon successful validation, the system issues an authenticated bearer token.
5. The header badge switches from green `CUSTOMER` to purple `STAFF`, and the management navigation items unlock.

---

## 4. Staff Management Dashboard (`/dashboard`)

The **Dashboard Overview** serves as the operational command center for store managers:

### 4.1 Key Performance Indicator (KPI) Cards
At the top of the dashboard, five real-time operational cards summarize the day's performance:
1. **Today's Sales:** Total gross revenue earned today (formatted in INR).
2. **Today's Bills:** Total number of customer checkout transactions completed today.
3. **Total Products:** Total number of active catalog items in the database.
4. **Low Stock Alerts:** Count of items with $\text{stock} \le 5$ units requiring replenishment.
5. **Out of Stock:** Count of catalog items with $0$ units on shelves.

### 4.2 Sales Overview Chart & Recent Transactions
- **Sales Trend:** Graphical weekly revenue visualization.
- **Recent Transactions:** Live feed of the latest completed customer invoices with invoice number, timestamp, customer name, and total.

---

## 5. Product Management (`/products`)

In Staff Mode, the catalog page displays operational management controls:

### 5.1 Adding a New Product
1. Click the **+ Add Product** button.
2. Fill in the required fields:
   - **SKU:** Unique barcode/SKU code (e.g., `BRIT-BRD-003`).
   - **Name:** Commercial product description.
   - **Brand:** Select from existing brand manufacturers.
   - **Category:** Select department.
   - **Type:** Choose `Non-Perishable` (shelf-stable) or `Perishable` (fresh).
   - **Expiry Date:** Required if perishable.
   - **Price:** Retail shelf price in Rupees (automatically stored in integer paise).
   - **Initial Stock:** Units received on shelf.
   - **Discount:** Select `None`, `Percentage (%)`, or `Fixed Amount (₹)`.
3. Click **Create Product**. The new item appears instantly in both Customer and Staff views.

### 5.2 Editing & Deactivating Products
- **Edit:** Click the pencil icon on any product card to update pricing, stock, or promotional discounts.
- **Deactivate (Soft Delete):** Click the trash icon to deactivate an item. Deactivated items are hidden from customers but preserved for historical billing records.

---

## 6. Inventory & Stock Management (`/inventory`)

### 6.1 Low Stock Alerts
The inventory page highlights products at or below the reorder threshold ($\text{stock} \le 5$) with an amber warning badge (e.g., `Fresh Organic Baby Spinach Palak 250g`).

### 6.2 Manual Stock Intake & Write-Offs
1. Click **Adjust Stock** on any inventory row.
2. Select the movement type:
   - **ADDITION:** Received fresh supplier shipment (increases stock).
   - **REDUCTION:** Damaged, spoiled, or expired goods write-off (decreases stock).
   - **ADJUSTMENT:** Physical inventory audit count correction.
3. Enter the quantity and audit justification reason (e.g., `Supplier Shipment PO-9912`).
4. Click **Save Adjustment**. The stock balance updates immediately, and an immutable entry is logged in the `inventory_movements` audit ledger.

---

## 7. Point-of-Sale (POS) Terminal (`/billing`)

Staff members can use the POS billing terminal for high-speed counter checkout:
- **Instant Search:** Type any portion of a product name or SKU to filter items in real time.
- **Customer Linking:** Search registered customers or type customer phone numbers to associate sales.
- **Keyboard Friendly:** Add items, modify quantities, and press **Enter** or click **Complete Sale** to finalize transactions.

---

## 8. Transaction Audit Ledger (`/transactions`)

- Displays the complete chronological history of every customer invoice.
- Click any bill row to open its full invoice snapshot.
- Displays line-item product names, brands, unit prices, applied discounts, and totals frozen at the exact second the sale was finalized.

---

## 9. Analytics & Reporting (`/analytics`)

- **Revenue Breakdown:** Interactive charts displaying sales volume across different departments.
- **Top Selling Products:** Ranked table of top performers by revenue and units sold.
- **Category Distribution:** Pie chart illustrating department share of total revenue.

---

## 10. Logging Out of Staff Mode

1. In the top navigation header, click the purple **Exit Staff** button.
2. The session token is cleared from browser storage and invalidated on the backend (`POST /api/auth/logout`).
3. The interface immediately returns to **Customer Mode** (green badge). All management buttons, stock adjustment tools, and internal analytics are hidden.

---

## 11. Common Troubleshooting

| Symptom / Issue | Probable Cause | Resolution |
| :--- | :--- | :--- |
| **"Staff authentication required" (HTTP 401)** | Attempted management action without logging in or session expired. | Click **Staff Login** in the header and enter `admin123`. |
| **"Insufficient stock" during checkout** | Requested item quantity exceeds physical store inventory. | Reduce quantity in cart or perform a stock intake in `/inventory`. |
| **Port 8080 or 5173 collision** | A previous instance of the server is still running. | Open PowerShell and kill lingering processes: `Get-Process supermarket_server, node \| Stop-Process -Force`. |
| **Backend connection offline banner** | Backend C++ server (`supermarket_server.exe`) is not running. | Run `.\start-app.ps1` or run `backend\build\Release\supermarket_server.exe`. |
