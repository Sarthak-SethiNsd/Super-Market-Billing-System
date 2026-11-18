import subprocess
import time
import requests
import os
import sys
import json
import shutil

SERVER_EXE = r"c:\Users\LENOVO\Desktop\OOPS-Sem-III-Lab\Supermarket_Submission_Staging\Supermarket_Management_System\backend\build\Release\supermarket_server.exe"
TEST_PORT = 8999
BASE_URL = f"http://127.0.0.1:{TEST_PORT}"
TEST_DB = r"c:\Users\LENOVO\Desktop\OOPS-Sem-III-Lab\Supermarket_Submission_Staging\Supermarket_Management_System\backend\build\Release\e2e_verify.db"

session = requests.Session()
session.trust_env = False

def clean_db():
    for f in [TEST_DB, TEST_DB + "-wal", TEST_DB + "-shm"]:
        if os.path.exists(f):
            try:
                os.remove(f)
            except Exception as e:
                print(f"Warning: could not delete {f}: {e}")

def run_tests():
    clean_db()
    
    env = os.environ.copy()
    env["PORT"] = str(TEST_PORT)
    env["HOST"] = "127.0.0.1"
    env["DB_PATH"] = TEST_DB
    env["STAFF_PASSWORD"] = "Staff@123"

    print(f"Starting server on port {TEST_PORT} with DB {TEST_DB}...")
    backend_dir = r"c:\Users\LENOVO\Desktop\OOPS-Sem-III-Lab\Supermarket_Submission_Staging\Supermarket_Management_System\backend"
    proc = subprocess.Popen([SERVER_EXE, str(TEST_PORT)], env=env, cwd=backend_dir)
    
    # Wait for server to come up
    server_ready = False
    for i in range(25):
        if proc.poll() is not None:
            print(f"Server exited early with code {proc.returncode}!", flush=True)
            break
        try:
            r = session.get(f"{BASE_URL}/api/health", timeout=1)
            if r.status_code == 200 and r.json().get("success"):
                server_ready = True
                print("Server is UP and ready!", flush=True)
                break
        except Exception as e:
            time.sleep(0.5)

    if not server_ready:
        proc.kill()
        raise RuntimeError("Server failed to start within timeout.")

    try:
        # =========================================================================
        # 5. STAFF AUTHENTICATION & OPERATIONS
        # =========================================================================
        print("\n--- TEST SUITE 5: Staff Authentication & Operations ---")
        # 5.1 Staff login with PBKDF2 credentials (Staff@123)
        login_res = session.post(f"{BASE_URL}/api/auth/staff/login", json={"password": "Staff@123"})
        assert login_res.status_code == 200, f"Expected 200 on staff login, got {login_res.status_code}: {login_res.text}"
        login_data = login_res.json()
        assert login_data["success"] is True
        staff_token = login_data["data"]["token"]
        assert staff_token, "Staff token is empty"
        print(" [PASS] 5.1 Staff login with PBKDF2 credentials (Staff@123)")

        headers = {"Authorization": f"Bearer {staff_token}", "Content-Type": "application/json"}

        # Fetch initial seeded categories and brands
        cats_res = session.get(f"{BASE_URL}/api/categories")
        categories = cats_res.json()["data"]
        cat_map = {c["name"]: c["id"] for c in categories}
        print(f" Seeded categories: {list(cat_map.keys())}")
        dairy_cat_id = cat_map.get("Dairy & Chilled") or cat_map.get("Dairy") or categories[0]["id"]

        brands_res = session.get(f"{BASE_URL}/api/brands")
        brands = brands_res.json()["data"]
        brand_map = {b["name"]: b["id"] for b in brands}
        print(f" Seeded brands: {list(brand_map.keys())}")
        amul_brand_id = brand_map.get("Amul") or brands[0]["id"]

        # 5.2 Add product with duplicate barcode/name/category -> adds to existing stock instead of duplicate record
        prod_payload = {
            "sku": "99001",
            "name": "Organic A2 Gir Cow Milk 1L",
            "brandId": amul_brand_id,
            "brandName": "Amul",
            "categoryId": dairy_cat_id,
            "productType": "PERISHABLE",
            "priceInRupees": 85.00,
            "stock": 10,
            "expiryDate": "2026-12-15",
            "discountType": "PERCENTAGE",
            "discountValue": 5.0
        }
        res_p1 = session.post(f"{BASE_URL}/api/products", json=prod_payload, headers=headers)
        assert res_p1.status_code == 201, f"Expected 201 on new product, got {res_p1.status_code}: {res_p1.text}"
        p1_id = res_p1.json()["data"]["id"]
        assert res_p1.json()["data"]["stock"] == 10

        # Now submit duplicate product with same barcode, name, category, and +15 stock
        dup_payload = {
            "sku": "99001",
            "name": "Organic A2 Gir Cow Milk 1L",
            "brandId": amul_brand_id,
            "brandName": "Amul",
            "categoryId": dairy_cat_id,
            "productType": "PERISHABLE",
            "priceInRupees": 85.00,
            "stock": 15,
            "expiryDate": "2026-12-20",
            "discountType": "PERCENTAGE",
            "discountValue": 5.0
        }
        res_dup = session.post(f"{BASE_URL}/api/products", json=dup_payload, headers=headers)
        assert res_dup.status_code == 200, f"Expected 200 on duplicate restock, got {res_dup.status_code}: {res_dup.text}"
        dup_data = res_dup.json()["data"]
        assert dup_data["isRestocked"] is True
        assert dup_data["previousStock"] == 10
        assert dup_data["addedQuantity"] == 15
        assert dup_data["currentStock"] == 25
        assert dup_data["id"] == p1_id, "Duplicate item created a new record instead of restocking existing record!"
        print(" [PASS] 5.2 Adding product with duplicate barcode/name/category adds to existing stock without creating duplicate")

        # 5.3 Editing an existing product (price, discount, stock, and especially expiry date) -> verify persistence in product_batches and products
        edit_payload = {
            "sku": "99001",
            "name": "Organic A2 Gir Cow Milk 1L - Premium",
            "brandId": amul_brand_id,
            "categoryId": dairy_cat_id,
            "productType": "PERISHABLE",
            "priceInRupees": 95.00,
            "stock": 30,
            "expiryDate": "2027-01-10",
            "discountType": "FIXED",
            "discountValue": 10.0
        }
        res_edit = session.put(f"{BASE_URL}/api/products/{p1_id}", json=edit_payload, headers=headers)
        assert res_edit.status_code == 200, f"Expected 200 on edit, got {res_edit.status_code}: {res_edit.text}"
        
        # Verify persistence in GET /api/products/{id}
        res_p_get = session.get(f"{BASE_URL}/api/products/{p1_id}")
        assert res_p_get.status_code == 200
        p_updated = res_p_get.json()["data"]
        assert p_updated["name"] == "Organic A2 Gir Cow Milk 1L - Premium"
        assert p_updated["priceInRupees"] == 95.00
        assert p_updated["stock"] == 30
        assert p_updated["discount"]["type"] == "FIXED"
        assert p_updated["discount"]["value"] == 10.0
        assert p_updated["expiryDate"] == "2027-01-10", f"Expected expiryDate 2027-01-10, got {p_updated.get('expiryDate')}"
        assert len(p_updated.get("batches", [])) > 0, "No batches found in product payload"
        assert p_updated["batches"][0]["expiryDate"] == "2027-01-10", f"Batch expiry date not updated in product_batches: {p_updated['batches']}"
        print(" [PASS] 5.3 Editing existing product (price, discount, stock, expiry date) persisted in product and product_batches")

        # =========================================================================
        # 1. CUSTOMER BROWSING & CATALOG
        # =========================================================================
        print("\n--- TEST SUITE 1: Customer Browsing & Catalog ---")
        # 1.1 Category filtering ("All Categories" + specific category)
        res_all_cats = session.get(f"{BASE_URL}/api/products")
        assert res_all_cats.status_code == 200
        all_prods = res_all_cats.json()["data"]["products"]
        assert len(all_prods) >= 1

        res_spec_cat = session.get(f"{BASE_URL}/api/products?categoryId={dairy_cat_id}")
        assert res_spec_cat.status_code == 200
        dairy_prods = res_spec_cat.json()["data"]["products"]
        for dp in dairy_prods:
            assert dp["categoryId"] == dairy_cat_id, f"Product {dp['name']} categoryId {dp['categoryId']} != {dairy_cat_id}"
        print(f" [PASS] 1.1 Category filtering: All ({len(all_prods)} items) vs Category {dairy_cat_id} ({len(dairy_prods)} items)")

        # 1.2 Product search across name, brand, SKU
        # Search by SKU
        res_s_sku = session.get(f"{BASE_URL}/api/products?q=99001")
        assert len(res_s_sku.json()["data"]["products"]) == 1
        assert res_s_sku.json()["data"]["products"][0]["id"] == p1_id
        
        # Search by Product Name
        res_s_name = session.get(f"{BASE_URL}/api/products?q=Organic%20A2")
        assert len(res_s_name.json()["data"]["products"]) >= 1
        assert any(p["id"] == p1_id for p in res_s_name.json()["data"]["products"])

        # Search by Brand Name ("Amul")
        res_s_brand = session.get(f"{BASE_URL}/api/products?q=Amul")
        assert len(res_s_brand.json()["data"]["products"]) >= 1, "Searching by brand name returned 0 results!"
        assert any(p["id"] == p1_id for p in res_s_brand.json()["data"]["products"])
        print(" [PASS] 1.2 Product search successfully searched across name, brand, and SKU")

        # 1.3 Available stock vs reserved stock display
        prod_check = res_s_sku.json()["data"]["products"][0]
        assert "availableStock" in prod_check
        assert "reservedStock" in prod_check
        assert "totalStock" in prod_check
        assert prod_check["availableStock"] == 30
        assert prod_check["reservedStock"] == 0
        assert prod_check["totalStock"] == 30
        print(" [PASS] 1.3 Available stock vs reserved stock fields verified")

        # 1.4 Price, discount, and batch expiry display
        assert prod_check["priceInRupees"] == 95.00
        assert prod_check["discount"]["type"] == "FIXED"
        assert prod_check["discount"]["value"] == 10.0
        assert prod_check["discount"]["discountedPriceInRupees"] == 85.00
        assert prod_check["expiryDate"] == "2027-01-10"
        print(" [PASS] 1.4 Price, discount, and batch expiry display verified")

        # =========================================================================
        # 2. MULTI-SESSION RESERVED STOCK
        # =========================================================================
        print("\n--- TEST SUITE 2: Multi-Session Reserved Stock ---")
        # Session 1 reserves 10 units
        res_r1 = session.post(f"{BASE_URL}/api/cart/reserve", json={
            "sessionId": "session_alpha",
            "productId": p1_id,
            "quantity": 10
        })
        assert res_r1.status_code == 200, f"Session 1 reserve failed: {res_r1.text}"
        assert res_r1.json()["data"]["reservedStock"] == 10
        assert res_r1.json()["data"]["availableStock"] == 20

        # Session 2 inspects product -> sees available stock reduced to 20
        res_s2_browse = session.get(f"{BASE_URL}/api/products/{p1_id}")
        assert res_s2_browse.json()["data"]["availableStock"] == 20
        assert res_s2_browse.json()["data"]["reservedStock"] == 10
        assert res_s2_browse.json()["data"]["totalStock"] == 30
        print(" [PASS] 2.1 Session 1 reserves 10 units -> Session 2 sees available stock reduced from 30 to 20")

        # Session 2 cannot reserve more than remaining available stock (e.g. tries to reserve 25 units)
        res_r2_over = session.post(f"{BASE_URL}/api/cart/reserve", json={
            "sessionId": "session_beta",
            "productId": p1_id,
            "quantity": 25
        })
        assert res_r2_over.status_code in [400, 409], f"Expected 400/409 on excess reserve, got {res_r2_over.status_code}: {res_r2_over.text}"
        print(" [PASS] 2.2 Session 2 cannot reserve more than remaining available stock (rejected with conflict/error)")

        # Session 1 releases reservation / clears cart -> available stock restored to 30
        res_clear = session.post(f"{BASE_URL}/api/cart/clear", json={"sessionId": "session_alpha"})
        assert res_clear.status_code == 200
        res_after_clear = session.get(f"{BASE_URL}/api/products/{p1_id}")
        assert res_after_clear.json()["data"]["availableStock"] == 30
        assert res_after_clear.json()["data"]["reservedStock"] == 0
        print(" [PASS] 2.3 Session 1 clears cart -> available stock restored to 30")

        # =========================================================================
        # 3. EXCEPTION & BOUNDARY VALIDATIONS
        # =========================================================================
        print("\n--- TEST SUITE 3: Exception & Boundary Validations ---")
        # 3.1 Submitting negative quantity (e.g. -1, -10) -> rejects with 400 Bad Request & "Invalid quantity: must be positive"
        res_neg1 = session.post(f"{BASE_URL}/api/bills", json={
            "sessionId": "session_test",
            "items": [{"productId": p1_id, "quantity": -5}],
            "customerName": "Test Customer"
        })
        assert res_neg1.status_code == 400, f"Expected 400 on negative bill qty, got {res_neg1.status_code}: {res_neg1.text}"
        assert "Invalid quantity: must be positive" in res_neg1.text, f"Unexpected error message: {res_neg1.text}"

        res_neg_cart = session.post(f"{BASE_URL}/api/cart/reserve", json={
            "sessionId": "session_test",
            "productId": p1_id,
            "quantity": -10
        })
        assert res_neg_cart.status_code == 400, f"Expected 400 on negative cart qty, got {res_neg_cart.status_code}: {res_neg_cart.text}"
        assert "Invalid quantity: must be positive" in res_neg_cart.text, f"Unexpected error message: {res_neg_cart.text}"
        print(" [PASS] 3.1 Submitting negative quantity (-5, -10) rejects with 400 Bad Request & 'Invalid quantity: must be positive'")

        # 3.2 Submitting 0 quantity -> rejects with 400 Bad Request
        res_zero_bill = session.post(f"{BASE_URL}/api/bills", json={
            "sessionId": "session_test",
            "items": [{"productId": p1_id, "quantity": 0}],
            "customerName": "Test Customer"
        })
        assert res_zero_bill.status_code == 400, f"Expected 400 on 0 bill qty, got {res_zero_bill.status_code}: {res_zero_bill.text}"
        assert "Invalid quantity: must be positive" in res_zero_bill.text

        res_zero_cart = session.post(f"{BASE_URL}/api/cart/reserve", json={
            "sessionId": "session_test",
            "productId": p1_id,
            "quantity": 0
        })
        assert res_zero_cart.status_code == 400, f"Expected 400 on 0 cart qty, got {res_zero_cart.status_code}: {res_zero_cart.text}"
        assert "Invalid quantity: must be positive" in res_zero_cart.text
        print(" [PASS] 3.2 Submitting 0 quantity rejects with 400 Bad Request")

        # 3.3 Submitting quantity > available stock -> rejects with 400 Bad Request & descriptive error
        res_over_bill = session.post(f"{BASE_URL}/api/bills", json={
            "sessionId": "session_test",
            "items": [{"productId": p1_id, "quantity": 9999}],
            "customerName": "Test Customer"
        })
        assert res_over_bill.status_code == 400, f"Expected 400 on excess checkout qty, got {res_over_bill.status_code}: {res_over_bill.text}"
        assert "exceeds available stock" in res_over_bill.text, f"Descriptive error missing: {res_over_bill.text}"
        print(f" [PASS] 3.3 Submitting quantity > available stock rejects with 400 Bad Request & descriptive error: {res_over_bill.json().get('error')}")

        # 3.4 Submitting invalid discounts:
        # a) Negative percentage
        res_d_neg_pct = session.post(f"{BASE_URL}/api/products", json={
            "sku": "99002",
            "name": "Invalid Disc Product A",
            "categoryId": dairy_cat_id,
            "priceInRupees": 50.0,
            "discountType": "PERCENTAGE",
            "discountValue": -10.0
        }, headers=headers)
        assert res_d_neg_pct.status_code == 400, f"Expected 400 on negative percentage, got {res_d_neg_pct.status_code}"

        # b) Percentage > 100%
        res_d_over_pct = session.post(f"{BASE_URL}/api/products", json={
            "sku": "99003",
            "name": "Invalid Disc Product B",
            "categoryId": dairy_cat_id,
            "priceInRupees": 50.0,
            "discountType": "PERCENTAGE",
            "discountValue": 125.0
        }, headers=headers)
        assert res_d_over_pct.status_code == 400, f"Expected 400 on percentage > 100, got {res_d_over_pct.status_code}"

        # c) Negative flat discount
        res_d_neg_flat = session.post(f"{BASE_URL}/api/products", json={
            "sku": "99004",
            "name": "Invalid Disc Product C",
            "categoryId": dairy_cat_id,
            "priceInRupees": 50.0,
            "discountType": "FIXED",
            "discountValue": -5.0
        }, headers=headers)
        assert res_d_neg_flat.status_code == 400, f"Expected 400 on negative flat discount, got {res_d_neg_flat.status_code}"

        # d) Flat discount > unit price
        res_d_over_flat = session.post(f"{BASE_URL}/api/products", json={
            "sku": "99005",
            "name": "Invalid Disc Product D",
            "categoryId": dairy_cat_id,
            "priceInRupees": 50.0,
            "discountType": "FIXED",
            "discountValue": 75.0
        }, headers=headers)
        assert res_d_over_flat.status_code == 400, f"Expected 400 on flat discount > unit price, got {res_d_over_flat.status_code}: {res_d_over_flat.text}"
        print(" [PASS] 3.4 Invalid discount validations (negative %, % > 100, negative flat, flat > price) all reject with 400")

        # =========================================================================
        # 4. PURCHASE APPROVAL WORKFLOW
        # =========================================================================
        print("\n--- TEST SUITE 4: Purchase Approval Workflow ---")
        # 4.1 Reserve items under session_buyer
        res_r_buyer = session.post(f"{BASE_URL}/api/cart/reserve", json={
            "sessionId": "session_buyer_77",
            "productId": p1_id,
            "quantity": 5
        })
        assert res_r_buyer.status_code == 200

        # Verify active cart holds 5 units
        cart_check = session.get(f"{BASE_URL}/api/cart?sessionId=session_buyer_77").json()["data"]
        assert cart_check["totalReservedUnits"] == 5

        # 4.2 Submit checkout (POST /api/bills) with sessionId and customer name
        checkout_payload = {
            "sessionId": "session_buyer_77",
            "items": [{"productId": p1_id, "quantity": 5}],
            "customerName": "Jane Doe"
        }
        res_checkout = session.post(f"{BASE_URL}/api/bills", json=checkout_payload)
        assert res_checkout.status_code == 201, f"Expected 201 on checkout, got {res_checkout.status_code}: {res_checkout.text}"
        inv = res_checkout.json()["data"]

        # 4.3 Verify invoice fields
        assert inv["billNumber"].startswith("INV-")
        assert inv["customerName"] == "Jane Doe"
        assert len(inv["items"]) == 1
        line_item = inv["items"][0]
        assert line_item["productName"] == "Organic A2 Gir Cow Milk 1L - Premium"
        assert line_item["quantity"] == 5
        assert line_item["unitPriceInRupees"] == 95.00
        assert line_item["unitDiscountInRupees"] == 10.00
        assert line_item["finalUnitPriceInRupees"] == 85.00
        assert line_item["lineTotalInRupees"] == 425.00
        assert inv["subtotalInRupees"] == 475.00
        assert inv["totalDiscountInRupees"] == 50.00
        assert inv["finalAmountInRupees"] == 425.00

        # 4.4 Verify cart reservation cleared
        cart_after = session.get(f"{BASE_URL}/api/cart?sessionId=session_buyer_77").json()["data"]
        assert cart_after["totalReservedUnits"] == 0
        assert cart_after["itemCount"] == 0

        # 4.5 Verify physical stock was deducted via FEFO (from 30 to 25)
        p1_after_sale = session.get(f"{BASE_URL}/api/products/{p1_id}").json()["data"]
        assert p1_after_sale["stock"] == 25
        assert p1_after_sale["availableStock"] == 25
        assert p1_after_sale["totalStock"] == 25
        assert p1_after_sale["reservedStock"] == 0
        print(f" [PASS] 4.1-4.5 Purchase Approved: Bill {inv['billNumber']} generated for {inv['customerName']}, stock deducted via FEFO to {p1_after_sale['stock']}, reservation cleared")

        # =========================================================================
        # 5.4 DASHBOARD KPIS & SALES ANALYTICS
        # =========================================================================
        print("\n--- TEST SUITE 5.4: Dashboard KPIs & Sales Analytics ---")
        # Dashboard KPIs: Today's Sales, Today's Bills, Total Products, Low Stock
        # Bill summary
        sum_res = session.get(f"{BASE_URL}/api/bills/summary", headers=headers)
        assert sum_res.status_code == 200
        b_sum = sum_res.json()["data"]
        assert b_sum["totalBills"] >= 1
        assert b_sum["totalNetInRupees"] >= 425.00
        assert b_sum["totalUnitsSold"] >= 5

        # Product summary
        prod_sum_res = session.get(f"{BASE_URL}/api/products/summary")
        assert prod_sum_res.status_code == 200
        p_sum = prod_sum_res.json()["data"]
        assert p_sum["totalActiveProducts"] >= 1
        assert p_sum["totalStockUnits"] >= 25
        assert "lowStockCount" in p_sum

        # Transactions list
        bills_list_res = session.get(f"{BASE_URL}/api/bills?limit=10&offset=0", headers=headers)
        assert bills_list_res.status_code == 200
        bills_list = bills_list_res.json()["data"]
        assert len(bills_list) >= 1
        assert any(b["billNumber"] == inv["billNumber"] for b in bills_list)
        print(" [PASS] 5.4 Dashboard KPIs (Sales, Bills, Total Products, Low Stock) and Transactions ledger verified")

        print("\n" + "="*70)
        print(" ALL VERIFICATION CHECKS ACROSS TEST SCOPE 1-5 PASSED PERFECTLY! ")
        print("="*70 + "\n")

    finally:
        print("Terminating test server...")
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()
        clean_db()

if __name__ == "__main__":
    run_tests()

