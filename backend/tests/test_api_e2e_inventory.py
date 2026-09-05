"""Complete End-to-End (E2E) API workflow test for Calibo Inventory Management.

Tests the entire lifecycle through live FastAPI HTTP endpoints using an isolated
in-memory SQLite database via FastAPI dependency override:
1. Authenticate as Admin via POST /api/auth/login.
2. Create product category via POST /api/categories.
3. Create vendor/supplier via POST /api/suppliers.
4. Create catalog item via POST /api/items.
5. Create warehouse location via POST /api/locations.
6. Create Opening Stock (qty=100, cost=10.00) via POST /api/opening-stock.
7. Verify available stock = 100 via GET /api/stock/{item_id}.
8. Create Inward receipt (qty=50, cost=12.00) via POST /api/inward.
9. Verify available stock = 150 and verify WAC calculation (10.67).
10. Create Outward dispatch (qty=20) via POST /api/outward.
11. Verify available stock = 130.
12. Create Distribution against that Outward (qty=10) via POST /api/distributions.
13. Verify available stock is STILL 130 (no double deduction).
14. Verify Distribution did NOT create a separate stock movement.
15. Create Return (qty=5) via POST /api/returns.
16. Verify available stock = 135.
17. Create Admin Stock Adjustment (adjusted_quantity=-5) via POST /api/adjustments.
18. Verify final available stock = 130.
19. Query stock movements and verify expected types: OPENING, INWARD, OUTWARD, RETURN, ADJUSTMENT.
20. Verify every movement record contains a non-null integer reference_id.
21. Verify Dashboard summary KPIs via GET /api/dashboard/summary.
22. Verify Stock audit report via GET /api/reports/stock.
23. Verify Movement audit report via GET /api/reports/movements.
"""

from decimal import Decimal
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import Role, User
from app.services.user_service import UserService

# Isolated in-memory SQLite engine for the E2E lifecycle test
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestInventoryE2EWorkflow(unittest.TestCase):
    """End-to-End test suite executing the complete Calibo inventory lifecycle via APIs."""

    @classmethod
    def setUpClass(cls):
        """Create database tables and seed Admin role and user for login."""
        Base.metadata.create_all(test_engine)
        db = TestingSessionLocal()
        try:
            # Seed Admin Role
            admin_role = Role(role_id=1, role_name="admin")
            db.add(admin_role)
            db.flush()

            # Seed Admin User with hashed password
            admin_user = User(
                user_id=1,
                username="admin_e2e",
                email="admin_e2e@calibo.com",
                password_hash=UserService.hash_password("AdminSecurePass123!"),
                role_id=admin_role.role_id,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
        finally:
            db.close()

    def setUp(self):
        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

    def test_complete_inventory_e2e_lifecycle(self):
        """Execute the full 23-step Calibo inventory E2E API workflow."""

        # ------------------------------------------------------------------
        # 1. Authenticate as Admin
        # ------------------------------------------------------------------
        login_resp = self.client.post(
            "/api/auth/login",
            json={"username": "admin_e2e", "password": "AdminSecurePass123!"},
        )
        self.assertEqual(login_resp.status_code, 200, f"Login failed: {login_resp.text}")
        login_data = login_resp.json()
        self.assertIn("access_token", login_data)
        admin_token = login_data["access_token"]
        self.assertEqual(login_data["role"], "admin")

        # Set default Bearer authorization header for subsequent API calls
        auth_headers = {"Authorization": f"Bearer {admin_token}"}

        # ------------------------------------------------------------------
        # 2. Create Category
        # ------------------------------------------------------------------
        cat_resp = self.client.post(
            "/api/categories",
            headers=auth_headers,
            json={
                "category_name": "Network Hardware",
                "description": "Enterprise switches, routers, and optics",
            },
        )
        self.assertEqual(cat_resp.status_code, 201, f"Create category failed: {cat_resp.text}")
        category_id = cat_resp.json()["id"]
        self.assertEqual(cat_resp.json()["category_name"], "Network Hardware")

        # ------------------------------------------------------------------
        # 3. Create Supplier
        # ------------------------------------------------------------------
        supp_resp = self.client.post(
            "/api/suppliers",
            headers=auth_headers,
            json={
                "supplier_name": "Allied Fiber & Optic Supply",
                "contact_person": "Jane Doe",
                "email": "supplies@alliedfiber.com",
                "phone": "+1-800-555-0199",
                "address": "450 Industrial Parkway, Austin, TX",
            },
        )
        self.assertEqual(supp_resp.status_code, 201, f"Create supplier failed: {supp_resp.text}")
        supplier_id = supp_resp.json()["id"]
        self.assertEqual(supp_resp.json()["supplier_name"], "Allied Fiber & Optic Supply")

        # ------------------------------------------------------------------
        # 4. Create Item
        # ------------------------------------------------------------------
        item_resp = self.client.post(
            "/api/items",
            headers=auth_headers,
            json={
                "item_code": "NET-SFP-10G",
                "item_name": "10G SFP+ Optical Transceiver",
                "category_id": category_id,
                "unit": "pcs",
                "minimum_level": 15,
                "default_unit_cost": 10.00,
            },
        )
        self.assertEqual(item_resp.status_code, 201, f"Create item failed: {item_resp.text}")
        item_id = item_resp.json()["id"]
        self.assertEqual(item_resp.json()["item_code"], "NET-SFP-10G")

        # ------------------------------------------------------------------
        # 5. Create Location
        # ------------------------------------------------------------------
        loc_resp = self.client.post(
            "/api/locations",
            headers=auth_headers,
            json={
                "location_name": "Central Distribution Hub",
                "code": "CDH-01",
                "description": "Primary staging and distribution warehouse",
            },
        )
        self.assertEqual(loc_resp.status_code, 201, f"Create location failed: {loc_resp.text}")
        location_id = loc_resp.json()["id"]
        self.assertEqual(loc_resp.json()["location_name"], "Central Distribution Hub")

        # ------------------------------------------------------------------
        # 6. Create Opening Stock (qty=100, unit_cost=10.00)
        # ------------------------------------------------------------------
        op_resp = self.client.post(
            "/api/opening-stock",
            headers=auth_headers,
            json={
                "item_id": item_id,
                "location_id": location_id,
                "quantity": 100.0,
                "unit_cost": 10.00,
                "remarks": "Initial baseline stock intake",
            },
        )
        self.assertEqual(op_resp.status_code, 201, f"Create opening stock failed: {op_resp.text}")
        op_data = op_resp.json()
        self.assertEqual(op_data["transaction_type"], "opening_stock")
        self.assertEqual(Decimal(str(op_data["quantity"])), Decimal("100.00"))

        # ------------------------------------------------------------------
        # 7. Verify Available Stock = 100
        # ------------------------------------------------------------------
        stk_resp1 = self.client.get(f"/api/stock/{item_id}", headers=auth_headers)
        self.assertEqual(stk_resp1.status_code, 200, f"Get stock failed: {stk_resp1.text}")
        stk_data1 = stk_resp1.json()
        self.assertEqual(Decimal(str(stk_data1["current_quantity"])), Decimal("100.00"))
        self.assertEqual(Decimal(str(stk_data1["average_unit_cost"])), Decimal("10.00"))

        # ------------------------------------------------------------------
        # 8. Create Inward (qty=50, unit_cost=12.00)
        # ------------------------------------------------------------------
        inw_resp = self.client.post(
            "/api/inward",
            headers=auth_headers,
            json={
                "item_id": item_id,
                "location_id": location_id,
                "supplier_id": supplier_id,
                "quantity": 50.0,
                "unit_cost": 12.00,
                "inward_no": "INW-E2E-001",
                "invoice_no": "INV-ALLIED-9871",
                "remarks": "Replenishment batch from Allied",
            },
        )
        self.assertEqual(inw_resp.status_code, 201, f"Create inward failed: {inw_resp.text}")
        inw_data = inw_resp.json()
        self.assertEqual(inw_data["transaction_type"], "inward")
        self.assertEqual(Decimal(str(inw_data["quantity"])), Decimal("50.00"))

        # ------------------------------------------------------------------
        # 9. Verify Available Stock = 150 & Verify WAC calculation:
        #    (100 * 10.00 + 50 * 12.00) / 150 = 1600 / 150 = 10.6667 -> 10.67
        # ------------------------------------------------------------------
        stk_resp2 = self.client.get(f"/api/stock/{item_id}", headers=auth_headers)
        self.assertEqual(stk_resp2.status_code, 200, f"Get stock failed: {stk_resp2.text}")
        stk_data2 = stk_resp2.json()
        self.assertEqual(Decimal(str(stk_data2["current_quantity"])), Decimal("150.00"))
        # Verify WAC rounded with ROUND_HALF_UP to 2 decimals is exactly 10.67
        expected_wac = Decimal("10.67")
        self.assertEqual(Decimal(str(stk_data2["average_unit_cost"])), expected_wac)

        # ------------------------------------------------------------------
        # 10. Create Outward (qty=20, issued_to="Data Center Ops")
        # ------------------------------------------------------------------
        out_resp = self.client.post(
            "/api/outward",
            headers=auth_headers,
            json={
                "item_id": item_id,
                "location_id": location_id,
                "quantity": 20.0,
                "issued_to": "Data Center Infrastructure Team",
                "outward_no": "OUT-E2E-001",
                "purpose": "Server rack network expansion",
                "remarks": "Urgent provisioning ticket #8421",
            },
        )
        self.assertEqual(out_resp.status_code, 201, f"Create outward failed: {out_resp.text}")
        out_data = out_resp.json()
        self.assertEqual(out_data["transaction_type"], "outward")
        self.assertEqual(Decimal(str(out_data["quantity"])), Decimal("20.00"))
        outward_id = out_data["id"]

        # ------------------------------------------------------------------
        # 11. Verify Available Stock = 130
        # ------------------------------------------------------------------
        stk_resp3 = self.client.get(f"/api/stock/{item_id}", headers=auth_headers)
        self.assertEqual(stk_resp3.status_code, 200)
        self.assertEqual(Decimal(str(stk_resp3.json()["current_quantity"])), Decimal("130.00"))

        # ------------------------------------------------------------------
        # 12. Create Distribution against that Outward (qty=10)
        # ------------------------------------------------------------------
        dist_resp = self.client.post(
            "/api/distributions",
            headers=auth_headers,
            json={
                "outward_id": outward_id,
                "quantity": 10.0,
                "recipient": "Rack Cluster B-East",
                "batch": "LOT-2026-09A",
                "department": "Infrastructure Engineering",
                "purpose": "ToR Switch uplinks",
                "remarks": "Segment 1 allocation",
            },
        )
        self.assertEqual(dist_resp.status_code, 201, f"Create distribution failed: {dist_resp.text}")
        dist_data = dist_resp.json()
        self.assertEqual(dist_data["transaction_type"], "distribution")
        self.assertEqual(Decimal(str(dist_data["quantity"])), Decimal("10.00"))

        # ------------------------------------------------------------------
        # 13. Verify Available Stock is STILL 130 (no double deduction)
        # ------------------------------------------------------------------
        stk_resp4 = self.client.get(f"/api/stock/{item_id}", headers=auth_headers)
        self.assertEqual(stk_resp4.status_code, 200)
        self.assertEqual(
            Decimal(str(stk_resp4.json()["current_quantity"])),
            Decimal("130.00"),
            "Distribution caused a duplicate stock deduction!",
        )

        # ------------------------------------------------------------------
        # 14. Verify Distribution did NOT create a separate stock movement
        # ------------------------------------------------------------------
        mov_resp1 = self.client.get("/api/stock/movements", headers=auth_headers)
        self.assertEqual(mov_resp1.status_code, 200)
        mov_list1 = mov_resp1.json()
        # Exactly 3 ledger movements so far: OPENING, INWARD, OUTWARD
        self.assertEqual(len(mov_list1), 3)
        movement_types1 = [m["movement_type"] for m in mov_list1]
        self.assertNotIn("DISTRIBUTION", movement_types1)
        self.assertEqual(set(movement_types1), {"OPENING", "INWARD", "OUTWARD"})

        # ------------------------------------------------------------------
        # 15. Create Return (qty=5)
        # ------------------------------------------------------------------
        ret_resp = self.client.post(
            "/api/returns",
            headers=auth_headers,
            json={
                "item_id": item_id,
                "location_id": location_id,
                "quantity": 5.0,
                "source": "Rack Cluster B-East",
                "reason": "Excess transceiver modules unboxed but unused",
                "return_type": "customer",
                "remarks": "Checked and tested by QA",
            },
        )
        self.assertEqual(ret_resp.status_code, 201, f"Create return failed: {ret_resp.text}")
        ret_data = ret_resp.json()
        self.assertEqual(ret_data["transaction_type"], "return")
        self.assertEqual(Decimal(str(ret_data["quantity"])), Decimal("5.00"))

        # ------------------------------------------------------------------
        # 16. Verify Available Stock = 135 (130 + 5)
        # ------------------------------------------------------------------
        stk_resp5 = self.client.get(f"/api/stock/{item_id}", headers=auth_headers)
        self.assertEqual(stk_resp5.status_code, 200)
        self.assertEqual(Decimal(str(stk_resp5.json()["current_quantity"])), Decimal("135.00"))

        # ------------------------------------------------------------------
        # 17. Create Admin Stock Adjustment (adjusted_quantity=-5)
        # ------------------------------------------------------------------
        adj_resp = self.client.post(
            "/api/adjustments",
            headers=auth_headers,
            json={
                "item_id": item_id,
                "location_id": location_id,
                "adjusted_quantity": -5.0,
                "reason": "Damaged optics damaged in handling write-off",
                "remarks": "Audit physical inventory reconciliation",
            },
        )
        self.assertEqual(adj_resp.status_code, 201, f"Create adjustment failed: {adj_resp.text}")
        adj_data = adj_resp.json()
        self.assertEqual(adj_data["transaction_type"], "adjustment")
        self.assertEqual(Decimal(str(adj_data["quantity"])), Decimal("-5.00"))

        # ------------------------------------------------------------------
        # 18. Verify Final Available Stock = 130 (135 - 5)
        # ------------------------------------------------------------------
        stk_resp6 = self.client.get(f"/api/stock/{item_id}", headers=auth_headers)
        self.assertEqual(stk_resp6.status_code, 200)
        self.assertEqual(Decimal(str(stk_resp6.json()["current_quantity"])), Decimal("130.00"))

        # ------------------------------------------------------------------
        # 19. Query stock movements and verify expected types:
        #     OPENING, INWARD, OUTWARD, RETURN, ADJUSTMENT
        # ------------------------------------------------------------------
        mov_resp2 = self.client.get("/api/stock/movements", headers=auth_headers)
        self.assertEqual(mov_resp2.status_code, 200)
        mov_list2 = mov_resp2.json()
        self.assertEqual(len(mov_list2), 5)
        observed_types = set(m["movement_type"] for m in mov_list2)
        expected_types = {"OPENING", "INWARD", "OUTWARD", "RETURN", "ADJUSTMENT"}
        self.assertEqual(observed_types, expected_types)
        self.assertNotIn("DISTRIBUTION", observed_types)

        # ------------------------------------------------------------------
        # 20. Verify every returned movement has a non-null integer reference_id
        # ------------------------------------------------------------------
        for m in mov_list2:
            ref_id = m.get("reference_id")
            self.assertIsNotNone(
                ref_id,
                f"Movement record {m.get('id')} has null reference_id: {m}",
            )
            self.assertIsInstance(
                ref_id,
                int,
                f"Movement record {m.get('id')} reference_id is not an int: {ref_id}",
            )
            self.assertGreater(
                ref_id,
                0,
                f"Movement record {m.get('id')} reference_id must be a positive integer: {ref_id}",
            )

        # ------------------------------------------------------------------
        # 21. Check Dashboard Summary
        # ------------------------------------------------------------------
        dash_resp = self.client.get("/api/dashboard/summary", headers=auth_headers)
        self.assertEqual(dash_resp.status_code, 200, f"Dashboard summary failed: {dash_resp.text}")
        dash_data = dash_resp.json()
        self.assertGreaterEqual(dash_data["total_items"], 1)
        self.assertEqual(Decimal(str(dash_data["total_stock_units"])), Decimal("130.00"))
        self.assertGreaterEqual(dash_data["total_categories"], 1)
        self.assertIn("total_stock_value", dash_data)
        self.assertIn("low_stock_count", dash_data)
        self.assertIn("out_of_stock_count", dash_data)

        # ------------------------------------------------------------------
        # 22. Check Stock Report
        # ------------------------------------------------------------------
        rpt_stk_resp = self.client.get("/api/reports/stock", headers=auth_headers)
        self.assertEqual(rpt_stk_resp.status_code, 200, f"Stock report failed: {rpt_stk_resp.text}")
        stock_report = rpt_stk_resp.json()
        self.assertGreaterEqual(len(stock_report), 1)
        matched_item = next((r for r in stock_report if r["item_id"] == item_id), None)
        self.assertIsNotNone(matched_item, f"Item {item_id} not found in stock report")
        self.assertEqual(Decimal(str(matched_item["quantity_on_hand"])), Decimal("130.00"))
        self.assertEqual(matched_item["stock_status"], "IN_STOCK")
        self.assertEqual(Decimal(str(matched_item["wac"])), Decimal("10.67"))

        # ------------------------------------------------------------------
        # 23. Check Movement Report
        # ------------------------------------------------------------------
        rpt_mov_resp = self.client.get("/api/reports/movements", headers=auth_headers)
        self.assertEqual(rpt_mov_resp.status_code, 200, f"Movement report failed: {rpt_mov_resp.text}")
        mov_report = rpt_mov_resp.json()
        self.assertEqual(len(mov_report), 5)
        for mr in mov_report:
            self.assertIn(mr["movement_type"], expected_types)
            self.assertIsNotNone(mr["reference_id"])
            self.assertIsInstance(mr["reference_id"], int)


if __name__ == "__main__":
    unittest.main()
