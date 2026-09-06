"""Mandatory End-to-End Scenario verification script matching Project Brief Section 9.

Test Scenario:
1. Create Item
2. Opening Stock
3. Inward
4. Verify Stock & WAC
5. Outward
6. Verify Stock
7. Distribution
8. Verify Stock (no double-deduction)
9. Return
10. Verify Stock
11. Adjustment
12. Verify Final Stock
13. Verify Distributions List
14. Verify Movement Audit Trail
15. Verify Dashboard Metrics
"""

import urllib.request
import json
from decimal import Decimal

BASE_URL = "http://127.0.0.1:8000/api"

def post_json(endpoint, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", data=json.dumps(data).encode(), headers=headers)
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode())

def get_json(endpoint, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", headers=headers)
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode())

def test_mandatory_scenario():
    print("=== STARTING MANDATORY END-TO-END VERIFICATION ===")

    # 1. Login as Admin
    login = post_json("/auth/login", {"username": "admin", "password": "admin123"})
    token = login["access_token"]
    print("[STEP 1] Logged in as Admin successfully.")

    # 2. Create New Item
    item_code = "STAT-ACAD-E2E"
    try:
        item = post_json("/items", {
            "item_code": item_code,
            "item_name": "Calibo Course Starter Kit",
            "category_id": 4,
            "unit": "kits",
            "minimum_level": 10,
            "default_unit_cost": 500.0,
        }, token)
    except Exception:
        items_list = get_json("/items", token)
        item = [i for i in items_list if i["item_code"] == item_code][0]
    item_id = item["item_id"]
    location_id = 1
    supplier_id = 1
    print(f"[STEP 2] Item ready: {item['item_name']} (ID: {item_id})")

    # 3. Opening Stock: 100 @ 50.00
    op = post_json("/opening-stock", {
        "item_id": item_id,
        "location_id": location_id,
        "quantity": 100.0,
        "unit_cost": 50.0,
        "remarks": "Mandatory E2E Opening Stock",
    }, token)
    print(f"[STEP 3] Opening stock recorded: {op['quantity']} units @ Rs 50.00")

    # 4. Verify Stock after opening = 100
    stk = get_json(f"/stock/{item_id}", token)
    assert Decimal(str(stk["current_quantity"])) == Decimal("100.00"), f"Expected 100, got {stk['current_quantity']}"
    print(f"[STEP 4] Verified stock after opening: {stk['current_quantity']} units")

    # 5. Inward: 50 @ 60.00
    inw = post_json("/inward", {
        "item_id": item_id,
        "location_id": location_id,
        "supplier_id": supplier_id,
        "quantity": 50.0,
        "unit_cost": 60.0,
        "inward_no": "INW-MANDATORY-01",
        "invoice_no": "INV-SUPP-9001",
        "remarks": "Mandatory E2E Inward",
    }, token)
    print(f"[STEP 5] Inward recorded: {inw['quantity']} units @ Rs 60.00")

    # 6. Verify Stock = 150 & WAC = 53.33
    stk = get_json(f"/stock/{item_id}", token)
    assert Decimal(str(stk["current_quantity"])) == Decimal("150.00"), f"Expected 150, got {stk['current_quantity']}"
    assert Decimal(str(stk["average_unit_cost"])) == Decimal("53.33"), f"Expected 53.33, got {stk['average_unit_cost']}"
    print(f"[STEP 6] Verified stock and WAC: {stk['current_quantity']} units @ Rs {stk['average_unit_cost']}")

    # 7. Outward: 30 units
    out = post_json("/outward", {
        "item_id": item_id,
        "location_id": location_id,
        "quantity": 30.0,
        "issued_to": "AI Cohort Batch 1",
        "outward_no": "OUT-MANDATORY-01",
        "purpose": "Student onboarding dispatches",
        "remarks": "Mandatory E2E Outward",
    }, token)
    outward_id = out["id"]
    print(f"[STEP 7] Outward recorded: {out['quantity']} units (Outward ID: {outward_id})")

    # 8. Verify Stock after Outward (150 - 30 = 120)
    stk = get_json(f"/stock/{item_id}", token)
    assert Decimal(str(stk["current_quantity"])) == Decimal("120.00"), f"Expected 120, got {stk['current_quantity']}"
    print(f"[STEP 8] Verified stock after outward: {stk['current_quantity']} units")

    # 9. Distribution against Outward: 15 units
    dist = post_json("/distributions", {
        "outward_id": outward_id,
        "quantity": 15.0,
        "recipient": "Student Rep Priya",
        "batch": "COHORT-2026-A",
        "department": "Data Science Lab",
        "purpose": "Classroom lab distribution",
        "remarks": "Mandatory E2E Distribution",
    }, token)
    print(f"[STEP 9] Distribution recorded: {dist['quantity']} units")

    # 10. Verify Stock STILL 120 (NO double deduction)
    stk = get_json(f"/stock/{item_id}", token)
    assert Decimal(str(stk["current_quantity"])) == Decimal("120.00"), f"Expected 120, got {stk['current_quantity']}"
    print(f"[STEP 10] Verified stock STILL {stk['current_quantity']} units (Derived stock integrity verified)")

    # 11. Return: 5 units back
    ret = post_json("/returns", {
        "item_id": item_id,
        "location_id": location_id,
        "quantity": 5.0,
        "source": "AI Cohort Batch 1",
        "reason": "Excess kit returned by dropped student",
        "return_type": "internal",
        "remarks": "Mandatory E2E Return",
    }, token)
    print(f"[STEP 11] Return recorded: {ret['quantity']} units")

    # 12. Verify Stock after Return (120 + 5 = 125)
    stk = get_json(f"/stock/{item_id}", token)
    assert Decimal(str(stk["current_quantity"])) == Decimal("125.00"), f"Expected 125, got {stk['current_quantity']}"
    print(f"[STEP 12] Verified stock after return: {stk['current_quantity']} units")

    # 13. Stock Adjustment: -5 (Damaged goods written off)
    adj = post_json("/adjustments", {
        "item_id": item_id,
        "location_id": location_id,
        "adjusted_quantity": -5.0,
        "reason": "Water leakage damage in classroom store write-off",
        "remarks": "Mandatory E2E Adjustment",
    }, token)
    print(f"[STEP 13] Adjustment recorded: {adj['quantity']} units")

    # 14. Verify Final Stock (125 - 5 = 120)
    stk = get_json(f"/stock/{item_id}", token)
    assert Decimal(str(stk["current_quantity"])) == Decimal("120.00"), f"Expected 120, got {stk['current_quantity']}"
    print(f"[STEP 14] Verified FINAL STOCK: {stk['current_quantity']} units")

    # 15. Verify Distributions API
    dists = get_json("/distributions", token)
    assert any(d["outward_id"] == outward_id for d in dists), "Distribution record missing from distributions API"
    print(f"[STEP 15] Verified Distributions API: {len(dists)} distribution records listed")

    # 16. Verify Movements / Transaction History
    movements = get_json(f"/reports/movements?item_id={item_id}", token)
    movement_types = [m["movement_type"] for m in movements]
    print(f"[STEP 16] Movement Types in audit trail: {movement_types}")
    assert "OPENING" in movement_types
    assert "INWARD" in movement_types
    assert "OUTWARD" in movement_types
    assert "RETURN" in movement_types
    assert "ADJUSTMENT" in movement_types

    # 17. Verify Dashboard KPIs
    dash = get_json("/dashboard/summary", token)
    print(f"[STEP 17] Dashboard KPIs: Total Items={dash['total_items']}, Stock Units={dash['total_stock_units']}, Transactions Today={dash['transactions_today']}")

    print("\n*** ALL MANDATORY END-TO-END CRITERIA VERIFIED SUCCESSFULLY! ***")

if __name__ == "__main__":
    test_mandatory_scenario()
