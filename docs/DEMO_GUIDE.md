# Evaluator Demonstration Guide — ApexMart Supermarket System

## Table of Contents
- [1. Demonstration Prerequisites & Environment](#1-demonstration-prerequisites-environment)
- [2. Step 1: Launch Application & Verify Default State](#2-step-1-launch-application-verify-default-state)
- [3. Step 2: Public Corporate Website vs. Staff Mode](#3-step-2-public-corporate-website-vs-staff-mode)
- [4. Step 3: Product Catalog & Demonstration Dataset](#4-step-3-product-catalog-demonstration-dataset)
- [5. Step 4: POS Billing Terminal & Live Checkout](#5-step-4-pos-billing-terminal-live-checkout)
- [6. Step 5: Transaction Receipt & Print Isolation](#6-step-5-transaction-receipt-print-isolation)
- [7. Step 6: Inventory Ledger & Stock Decrement Verification](#7-step-6-inventory-ledger-stock-decrement-verification)
- [8. Step 7: Administrative Authentication & Privileged Actions](#8-step-7-administrative-authentication-privileged-actions)
- [9. Step 8: Sales Analytics & Reporting](#9-step-8-sales-analytics-reporting)
- [10. Step 9: Server Restart & Persistence Verification](#10-step-9-server-restart-persistence-verification)
- [11. Local Demo Credentials Note](#11-local-demo-credentials-note)

---

## 1. Demonstration Prerequisites & Environment

Before beginning the evaluation walkthrough:
1. Ensure the canonical database `backend/data/supermarket.db` is present and seeded with the 25 demonstration products.
2. If the database is missing, seed it via:
   ```powershell
   cd backend\build\Release
   .\supermarket_seeder.exe
   ```
3. Launch the complete application from `Supermarket_Management_System/`:
   ```powershell
   .\start-app.ps1
   ```

---

## 2. Step 1: Launch Application & Verify Default State

1. The browser automatically navigates to `http://localhost:5173`.
2. Observe the terminal output:
   - Backend API healthy at `http://127.0.0.1:8080/api/health`.
   - Existing SQLite database detected at `backend\data\supermarket.db`.
   - Stored admin credentials preserved without re-prompting.

---

## 3. Step 2: Public Corporate Website vs. Staff Mode

1. **Observe Customer Landing Page (`/`):**
   - Professional **ApexMart** branding and hero banner.
   - Company introduction, core values, and department showcases.
   - Note that internal inventory quantities, wholesale margins, and sales numbers are strictly absent from the public page.
2. **Access Staff Portal:**
   - In the top navigation bar, click the **Staff Mode** pill.
   - The application smoothly transitions to the authenticated internal dashboard (`/dashboard`).

---

## 4. Step 3: Product Catalog & Demonstration Dataset

1. In the sidebar, click **Products** (`/products`).
2. Verify the presence of **25 representative Indian retail products** across **7 categories**:
   - *Grains & Staples:* Aashirvaad Atta, India Gate Basmati Rice, Tata Toor Dal, Fortune Oil.
   - *Dairy & Chilled:* Amul Milk, Amul Butter, Amul Paneer, Mother Dairy Dahi.
   - *Snacks:* Haldiram's Aloo Bhujia, Gulab Jamun, Britannia Cookies, Parle-G.
   - *Beverages:* Tata Tea, Bru Coffee, Real Fruit Juice.
   - *Personal Care:* Dettol Soap, Colgate Toothpaste, Head & Shoulders Shampoo.
   - *Household Essentials:* Surf Excel, Vim Gel, Harpic Cleaner.
   - *Produce:* Fresh Apples, Bananas, Tomatoes, Organic Baby Spinach.
3. Observe the **Perishable** badges displaying ISO expiry dates (e.g., Milk: `2026-12-05`).
4. Notice that **Organic Baby Spinach** shows an orange **Low Stock** alert (initial stock: 3 units $\le 5$).

---

## 5. Step 4: POS Billing Terminal & Live Checkout

1. In the sidebar, click **Billing** (`/billing`).
2. **Test Real-Time Search:**
   - In the search bar, type `Atta` or `SKU-GRAIN-001`. Observe the immediate client-side filtering.
   - Click the product card to add **Aashirvaad Atta** to the cart.
3. **Test Discount Handling:**
   - Search for `Rice` (`India Gate Basmati Rice Classic 5kg`). Notice the **10% OFF** discount badge.
   - Add to cart. Notice that the cart displays:
     - Unit Price: `₹625.00`
     - Applied Discount: `10.0% off` (`- ₹62.50/unit`)
     - Net Unit Price: `₹562.50`
4. **Test Quantity Adjustments & Stock Guards:**
   - Increase Atta quantity to `2`.
   - Notice the reactive calculation updates subtotal, discount, and total.
5. **Execute Sale:**
   - Click the green **Complete Sale & Print** button.
   - An atomic `POST /api/bills` request executes.

---

## 6. Step 5: Transaction Receipt & Print Isolation

1. Immediately upon checkout completion, an **Invoice Receipt Modal** surfaces.
2. Verify the printed attributes:
   - Unique Invoice Number: `INV-YYYYMMDDHHMMSS-XXX-XXX`.
   - Immutable line items, unit prices, discounts, and line totals.
   - Gross Subtotal, Total Discounts, and Net Amount Paid.
3. Click the **Print Receipt** button:
   - Observe that the print dialog isolates the receipt container and strips all web navigation elements.

---

## 7. Step 6: Inventory Ledger & Stock Decrement Verification

1. Navigate to **Inventory** (`/inventory`).
2. **Stock Decrement:** Locate `Aashirvaad Atta` and verify stock decreased by exactly 2 units.
3. **Movement Ledger:** Scroll to the **Stock Movement History** table:
   - Locate the topmost entry marked with the badge `SALE`.
   - Verify:
     - `Movement Type`: `SALE`
     - `Quantity Change`: `-2`
     - `Reason`: `Checkout sale for invoice: INV-...`
     - `Reference ID`: Matching the generated invoice number.

---

## 8. Step 7: Administrative Authentication & Privileged Actions

1. In the top-right corner of the header, notice the status indicates **Staff Mode**.
2. Click **Unlock Admin**.
3. In the modal, enter the demonstration administrator password:
   $$\mathbf{admin123}$$
4. Click **Unlock Admin Privileges**:
   - Status badge turns golden-amber: **Admin Mode**.
   - Admin management options become active.
5. Navigate to **Admin** (`/admin`):
   - Add a test Brand (e.g., `Organic India`). Verify instant addition.
6. Navigate to **Inventory** (`/inventory`):
   - Click **Manual Stock Adjustment**.
   - Select a product, choose `ADDITION`, enter `10` units, type Reason `Demonstration restock`, and submit.
   - Verify stock increases by 10 and an `ADDITION` movement is recorded.

---

## 9. Step 8: Sales Analytics & Reporting

1. Navigate to **Analytics** (`/analytics`).
2. Verify aggregate KPIs:
   - **Total Revenue** accurately reflects completed transactions.
   - **Transaction Count** matches the number of generated bills.
   - **Category Distribution Chart** shows sales proportion across departments.
   - **Top Selling Products** lists Atta and Rice with accurate volume counts.

---

## 10. Step 9: Server Restart & Persistence Verification

To verify that all operational data is stored in SQLite and persists across application restarts:
1. In the PowerShell terminal running `start-app.ps1`, press `Ctrl+C` to stop both servers.
2. Re-launch the application:
   ```powershell
   .\start-app.ps1
   ```
3. Navigate to **Transactions** (`/transactions`):
   - Verify your completed invoice is still present with full line item details.
4. Navigate to **Inventory** (`/inventory`):
   - Verify stock levels remain at their decremented values.

---

## 11. Local Demo Credentials Note

> [!IMPORTANT]
> The credential `admin` / `admin123` is configured strictly for **local evaluation and demonstration**. 
> - On fresh, unseeded production databases, `start-app.ps1` prompts for a user-chosen master password via a secure masked prompt.
> - Passwords are never stored in plaintext; they are hashed with PBKDF2-HMAC-SHA256 (100,000 iterations, 128-bit random salt).
> - Never deploy demonstration databases or default passwords to public production hosts.
