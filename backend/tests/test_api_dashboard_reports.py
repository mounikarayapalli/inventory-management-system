"""API integration tests for Dashboard and Reports endpoints.

Uses an isolated in-memory SQLite database via FastAPI dependency override.
Tests all dashboard metrics, stock valuations, reports, date filtering, and multi-location isolation.
"""

from datetime import date, timedelta
from decimal import Decimal
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import (
    Category,
    Item,
    Location,
    Role,
    Supplier,
    User,
)

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


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


class TestDashboardAndReportsAPI(unittest.TestCase):
    """Test suite for Dashboard and Reports endpoints under isolated in-memory database."""

    def setUp(self):
        app.dependency_overrides[get_db] = override_get_db
        from app.core.security import create_access_token
        token = create_access_token(subject=1, role="Admin")
        client.headers["Authorization"] = f"Bearer {token}"

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(test_engine)
        db = TestingSessionLocal()
        try:
            # Seed Role and User
            admin_role = Role(role_id=1, role_name="Admin")
            db.add(admin_role)
            db.flush()

            admin_user = User(
                user_id=1,
                username="lead_admin",
                email="lead@calibo.com",
                password_hash="hashed_pw",
                role_id=admin_role.role_id,
                is_active=True,
            )
            db.add(admin_user)

            # Seed Categories
            cat_elec = Category(category_id=1, category_name="Electronics", is_active=True)
            cat_office = Category(category_id=2, category_name="Office Supplies", is_active=True)
            db.add_all([cat_elec, cat_office])
            db.flush()

            # Seed Items
            # Item 1: Mechanical Keyboard (Electronics, min=50)
            item1 = Item(
                item_id=1,
                item_code="ELEC-KB-001",
                item_name="Mechanical Keyboard",
                category_id=cat_elec.category_id,
                unit="pcs",
                minimum_level=50,
                default_unit_cost=Decimal("10.00"),
                is_active=True,
            )
            # Item 2: Optical Mouse (Electronics, min=20)
            item2 = Item(
                item_id=2,
                item_code="ELEC-MOU-002",
                item_name="Optical Mouse",
                category_id=cat_elec.category_id,
                unit="pcs",
                minimum_level=20,
                default_unit_cost=Decimal("20.00"),
                is_active=True,
            )
            # Item 3: A4 Paper (Office Supplies, min=30)
            item3 = Item(
                item_id=3,
                item_code="OFF-PAP-003",
                item_name="A4 Printing Paper",
                category_id=cat_office.category_id,
                unit="ream",
                minimum_level=30,
                default_unit_cost=Decimal("5.00"),
                is_active=True,
            )
            db.add_all([item1, item2, item3])

            # Seed Supplier
            supplier = Supplier(
                supplier_id=1,
                supplier_name="Universal Supply Corp",
                is_active=True,
            )
            db.add(supplier)

            # Seed Locations
            loc_a = Location(location_id=1, location_name="Location A", is_active=True)
            loc_b = Location(location_id=2, location_name="Location B", is_active=True)
            db.add_all([loc_a, loc_b])

            db.commit()
        finally:
            db.close()

    def test_01_empty_state_dashboard_and_reports(self):
        """Verify dashboard and reports respond properly before transactions occur."""
        # Summary
        res = client.get("/api/dashboard/summary")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_items"], 3)
        self.assertEqual(data["total_categories"], 2)
        self.assertEqual(Decimal(data["total_stock_units"]), Decimal("0.00"))
        self.assertEqual(Decimal(data["total_stock_value"]), Decimal("0.00"))
        self.assertEqual(data["low_stock_count"], 0)
        # All 3 items have no movements anywhere -> out of stock
        self.assertEqual(data["out_of_stock_count"], 3)

        # Low stock should be empty
        res = client.get("/api/dashboard/low-stock")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 0)

        # Out of stock should contain all 3 unstocked items
        res = client.get("/api/dashboard/out-of-stock")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 3)

        # Category stock
        res = client.get("/api/dashboard/category-stock")
        self.assertEqual(res.status_code, 200)
        cats = res.json()
        self.assertEqual(len(cats), 2)
        for c in cats:
            self.assertEqual(Decimal(c["total_units"]), Decimal("0.00"))
            self.assertEqual(Decimal(c["total_valuation"]), Decimal("0.00"))

        # Location stock
        res = client.get("/api/dashboard/location-stock")
        self.assertEqual(res.status_code, 200)
        locs = res.json()
        self.assertEqual(len(locs), 2)
        for loc in locs:
            self.assertEqual(Decimal(loc["total_units"]), Decimal("0.00"))
            self.assertEqual(Decimal(loc["total_valuation"]), Decimal("0.00"))

        # Reports should be empty
        res_mov = client.get("/api/reports/movements")
        self.assertEqual(res_mov.status_code, 200)
        self.assertEqual(len(res_mov.json()), 0)

        res_inw = client.get("/api/reports/inward")
        self.assertEqual(res_inw.status_code, 200)
        self.assertEqual(len(res_inw.json()), 0)

        res_out = client.get("/api/reports/outward")
        self.assertEqual(res_out.status_code, 200)
        self.assertEqual(len(res_out.json()), 0)

    def test_02_seed_and_verify_inventory_lifecycle(self):
        """Execute inventory lifecycle from prompt and verify Dashboard and Reports."""
        today = date.today()

        # Step 2: Opening Stock: 100 units at Location A @ 10.00 (Item 1)
        r = client.post(
            "/api/opening-stock",
            json={
                "item_id": 1,
                "location_id": 1,
                "quantity": 100,
                "unit_cost": 10.00,
                "remarks": "Opening stock seed",
                "created_by": 1,
            },
        )
        self.assertEqual(r.status_code, 201)

        # Step 3: Inward: 50 units at Location A @ 16.00 (Item 1)
        r = client.post(
            "/api/inward",
            json={
                "inward_no": "INW-DASH-001",
                "item_id": 1,
                "supplier_id": 1,
                "location_id": 1,
                "quantity": 50,
                "unit_cost": 16.00,
                "total_cost": 800.00,
                "remarks": "Procurement intake",
                "created_by": 1,
            },
        )
        self.assertEqual(r.status_code, 201)

        # Step 4: Verify stock = 150, WAC = 12.00
        r = client.get("/api/stock/1")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(Decimal(data["current_quantity"]), Decimal("150.00"))
        self.assertEqual(Decimal(data["average_unit_cost"]), Decimal("12.00"))

        # Step 6: Outward: 60 units at Location A (Item 1)
        r = client.post(
            "/api/outward",
            json={
                "outward_no": "OUT-DASH-001",
                "item_id": 1,
                "location_id": 1,
                "quantity": 60,
                "issued_to": "Engineering Dept",
                "purpose": "Workstation Setup",
                "remarks": "Batch 1 Issue",
                "created_by": 1,
            },
        )
        self.assertEqual(r.status_code, 201)
        outward_data = r.json()
        outward_id = outward_data["id"]
        # Valuation: 60 * 12.00 = 720.00
        self.assertEqual(Decimal(outward_data["unit_cost"]), Decimal("12.00"))
        self.assertEqual(Decimal(outward_data["total_cost"]), Decimal("720.00"))

        # Step 7: Verify stock = 90
        r = client.get("/api/stock/1")
        self.assertEqual(Decimal(r.json()["current_quantity"]), Decimal("90.00"))

        # Step 9: Try outward of 100 units -> rejected
        r = client.post(
            "/api/outward",
            json={
                "outward_no": "OUT-DASH-EXCEED",
                "item_id": 1,
                "location_id": 1,
                "quantity": 100,
                "issued_to": "Engineering Dept",
                "created_by": 1,
            },
        )
        self.assertEqual(r.status_code, 400)

        # Step 11: Create Distribution of 30 units linked to existing outward
        r = client.post(
            "/api/distributions",
            json={
                "outward_id": outward_id,
                "quantity": 30,
                "recipient": "Team Lead Alpha",
                "department": "Engineering",
                "purpose": "Hardware assignment",
                "created_by": 1,
            },
        )
        self.assertEqual(r.status_code, 201)

        # Step 12: Verify stock remains 90 (no double deduction)
        r = client.get("/api/stock/1")
        self.assertEqual(Decimal(r.json()["current_quantity"]), Decimal("90.00"))

        # Step 14: Return of 10 units at Location A (Item 1)
        r = client.post(
            "/api/returns",
            json={
                "item_id": 1,
                "location_id": 1,
                "quantity": 10,
                "source": "Engineering Dept",
                "reason": "Excess units returned",
                "created_by": 1,
            },
        )
        self.assertEqual(r.status_code, 201)

        # Step 15: Verify stock = 100
        r = client.get("/api/stock/1")
        self.assertEqual(Decimal(r.json()["current_quantity"]), Decimal("100.00"))

        # Step 16: Adjustment of -5 units at Location A (Item 1)
        r = client.post(
            "/api/adjustments",
            json={
                "item_id": 1,
                "location_id": 1,
                "adjusted_quantity": -5,
                "reason": "Damaged goods write-off",
                "created_by": 1,
            },
        )
        self.assertEqual(r.status_code, 201)

        # Step 17: Verify stock = 95
        r = client.get("/api/stock/1")
        self.assertEqual(Decimal(r.json()["current_quantity"]), Decimal("95.00"))

        # Step 18: Verify Location B remains 0 throughout
        loc_details = r.json()["locations"]
        loc_b_entry = next(item for item in loc_details if item["location_id"] == 2)
        self.assertEqual(Decimal(loc_b_entry["quantity"]), Decimal("0.00"))

        # --- SEED ITEM 2 (LOW STOCK CASE) ---
        # Item 2 has minimum_level=20. Receive 10 units @ 20.00 at Location A -> Stock=10 (Low Stock)
        r = client.post(
            "/api/inward",
            json={
                "inward_no": "INW-ITEM2-001",
                "item_id": 2,
                "supplier_id": 1,
                "location_id": 1,
                "quantity": 10,
                "unit_cost": 20.00,
                "total_cost": 200.00,
                "remarks": "Mouse stock",
                "created_by": 1,
            },
        )
        self.assertEqual(r.status_code, 201)

        # --- SEED ITEM 3 (DEPLETED OUT OF STOCK CASE) ---
        # Item 3: Opening 5 at Location B, Outward 5 at Location B -> Depleted to 0
        r = client.post(
            "/api/opening-stock",
            json={
                "item_id": 3,
                "location_id": 2,
                "quantity": 5,
                "unit_cost": 5.00,
                "remarks": "Paper opening",
                "created_by": 1,
            },
        )
        self.assertEqual(r.status_code, 201)

        r = client.post(
            "/api/outward",
            json={
                "outward_no": "OUT-ITEM3-001",
                "item_id": 3,
                "location_id": 2,
                "quantity": 5,
                "issued_to": "HR Office",
                "purpose": "Printing",
                "remarks": "Exhausted all paper",
                "created_by": 1,
            },
        )
        self.assertEqual(r.status_code, 201)

        # ========================================================
        # TASK 2: VERIFY DASHBOARD SUMMARY
        # ========================================================
        # Stock: Item 1 = 95, Item 2 = 10, Item 3 = 0. Total units = 105.00
        # WAC: Item 1 = 12.00 (val: 95*12 = 1140.00)
        #      Item 2 = 20.00 (val: 10*20 = 200.00)
        #      Item 3 = 5.00  (val: 0*5 = 0.00)
        # Total Valuation = 1140.00 + 200.00 = 1340.00
        # Today Inward: Item 1: 50, Item 2: 10 = 60.00
        # Today Outward: Item 1: 60, Item 3: 5 = 65.00
        # Today Distributed: Item 1: 30.00 (NOT double counted)
        # Low stock count: Item 2 (10 < 20) -> 1
        # Out of stock count: Item 3 at Location B (depleted to 0) -> 1
        res = client.get("/api/dashboard/summary")
        self.assertEqual(res.status_code, 200)
        summary = res.json()
        self.assertEqual(summary["total_items"], 3)
        self.assertEqual(summary["total_categories"], 2)
        self.assertEqual(Decimal(summary["total_stock_units"]), Decimal("105.00"))
        self.assertEqual(Decimal(summary["total_stock_value"]), Decimal("1340.00"))
        self.assertEqual(Decimal(summary["today_inward_quantity"]), Decimal("60.00"))
        self.assertEqual(Decimal(summary["today_outward_quantity"]), Decimal("65.00"))
        self.assertEqual(Decimal(summary["today_distributed_quantity"]), Decimal("30.00"))
        self.assertEqual(summary["low_stock_count"], 1)
        self.assertEqual(summary["out_of_stock_count"], 1)
        self.assertGreaterEqual(summary["transactions_today"], 7)

        # ========================================================
        # TASK 3: VERIFY LOW STOCK
        # ========================================================
        res = client.get("/api/dashboard/low-stock")
        self.assertEqual(res.status_code, 200)
        low_items = res.json()
        self.assertEqual(len(low_items), 1)
        self.assertEqual(low_items[0]["item_id"], 2)
        self.assertEqual(Decimal(low_items[0]["current_quantity"]), Decimal("10.00"))
        self.assertEqual(low_items[0]["min_stock_level"], 20)
        self.assertEqual(low_items[0]["location_name"], "Location A")

        # ========================================================
        # TASK 4: VERIFY OUT OF STOCK
        # ========================================================
        res = client.get("/api/dashboard/out-of-stock")
        self.assertEqual(res.status_code, 200)
        out_items = res.json()
        self.assertEqual(len(out_items), 1)
        self.assertEqual(out_items[0]["item_id"], 3)
        self.assertEqual(out_items[0]["location_name"], "Location B")
        self.assertIsNotNone(out_items[0]["last_depleted_at"])

        # ========================================================
        # TASK 5: VERIFY RECENT TRANSACTIONS
        # ========================================================
        res = client.get("/api/dashboard/recent-transactions?limit=10")
        self.assertEqual(res.status_code, 200)
        txs = res.json()
        self.assertGreaterEqual(len(txs), 6)
        valid_types = {"OPENING", "INWARD", "OUTWARD", "RETURN", "ADJUSTMENT"}
        for t in txs:
            self.assertIn(t["transaction_type"], valid_types)
            self.assertNotEqual(t["transaction_type"], "DISTRIBUTION")
            self.assertIsNotNone(t["location_name"])
            self.assertIsNotNone(t["created_by"])

        # ========================================================
        # TASK 6: VERIFY CATEGORY STOCK
        # ========================================================
        res = client.get("/api/dashboard/category-stock")
        self.assertEqual(res.status_code, 200)
        cats = res.json()
        self.assertEqual(len(cats), 2)
        # Electronics (Item 1 + Item 2): 95 + 10 = 105.00 units, 1340.00 valuation
        elec = next(c for c in cats if c["category_id"] == 1)
        self.assertEqual(elec["item_count"], 2)
        self.assertEqual(Decimal(elec["total_units"]), Decimal("105.00"))
        self.assertEqual(Decimal(elec["total_valuation"]), Decimal("1340.00"))
        # Office Supplies (Item 3): 0 units, 0.00 valuation
        office = next(c for c in cats if c["category_id"] == 2)
        self.assertEqual(office["item_count"], 1)
        self.assertEqual(Decimal(office["total_units"]), Decimal("0.00"))
        self.assertEqual(Decimal(office["total_valuation"]), Decimal("0.00"))

        # ========================================================
        # TASK 7: VERIFY LOCATION STOCK
        # ========================================================
        res = client.get("/api/dashboard/location-stock")
        self.assertEqual(res.status_code, 200)
        locs = res.json()
        self.assertEqual(len(locs), 2)
        loc_a_stat = next(l for l in locs if l["location_id"] == 1)
        self.assertEqual(Decimal(loc_a_stat["total_units"]), Decimal("105.00"))
        self.assertEqual(Decimal(loc_a_stat["total_valuation"]), Decimal("1340.00"))

        loc_b_stat = next(l for l in locs if l["location_id"] == 2)
        self.assertEqual(Decimal(loc_b_stat["total_units"]), Decimal("0.00"))
        self.assertEqual(Decimal(loc_b_stat["total_valuation"]), Decimal("0.00"))

        # ========================================================
        # TASK 8: VERIFY STOCK REPORT
        # ========================================================
        res = client.get("/api/reports/stock")
        self.assertEqual(res.status_code, 200)
        report_items = res.json()
        # 3 items * 2 locations = 6 report lines
        self.assertEqual(len(report_items), 6)

        # Check Item 1 at Location A
        item1_loc_a = next(r for r in report_items if r["item_id"] == 1 and r["location_id"] == 1)
        self.assertEqual(Decimal(item1_loc_a["quantity_on_hand"]), Decimal("95.00"))
        self.assertEqual(Decimal(item1_loc_a["wac"]), Decimal("12.00"))
        self.assertEqual(Decimal(item1_loc_a["stock_value"]), Decimal("1140.00"))
        self.assertEqual(item1_loc_a["stock_status"], "IN_STOCK")
        self.assertFalse(item1_loc_a["reorder_recommended"])

        # Check Item 2 at Location A
        item2_loc_a = next(r for r in report_items if r["item_id"] == 2 and r["location_id"] == 1)
        self.assertEqual(Decimal(item2_loc_a["quantity_on_hand"]), Decimal("10.00"))
        self.assertEqual(item2_loc_a["stock_status"], "LOW_STOCK")
        self.assertTrue(item2_loc_a["reorder_recommended"])

        # Filter by Location A only
        res_loc1 = client.get("/api/reports/stock?location_id=1")
        self.assertEqual(res_loc1.status_code, 200)
        self.assertEqual(len(res_loc1.json()), 3)

        # Filter by Category 1 only
        res_cat1 = client.get("/api/reports/stock?category_id=1")
        self.assertEqual(res_cat1.status_code, 200)
        self.assertEqual(len(res_cat1.json()), 4)

        # ========================================================
        # TASK 9: VERIFY MOVEMENTS REPORT & DATE FILTERING
        # ========================================================
        res = client.get("/api/reports/movements")
        self.assertEqual(res.status_code, 200)
        mov_items = res.json()
        self.assertGreaterEqual(len(mov_items), 7)
        for m in mov_items:
            self.assertIn(m["movement_type"], valid_types)
            self.assertNotEqual(m["movement_type"], "DISTRIBUTION")

        # Movement type filter
        res_inw_mov = client.get("/api/reports/movements?movement_type=INWARD")
        self.assertEqual(res_inw_mov.status_code, 200)
        for m in res_inw_mov.json():
            self.assertEqual(m["movement_type"], "INWARD")

        # Date filtering: today to today
        res_today = client.get(f"/api/reports/movements?from_date={today.isoformat()}&to_date={today.isoformat()}")
        self.assertEqual(res_today.status_code, 200)
        self.assertGreater(len(res_today.json()), 0)

        # Date filtering: past date -> should be empty
        past_date = today - timedelta(days=10)
        res_past = client.get(f"/api/reports/movements?from_date={past_date.isoformat()}&to_date={(past_date + timedelta(days=1)).isoformat()}")
        self.assertEqual(res_past.status_code, 200)
        self.assertEqual(len(res_past.json()), 0)

        # Invalid date range: from_date > to_date -> 400 Bad Request
        res_inv = client.get(f"/api/reports/movements?from_date={today.isoformat()}&to_date={past_date.isoformat()}")
        self.assertEqual(res_inv.status_code, 400)

        # ========================================================
        # TASK 10: VERIFY INWARD REPORT
        # ========================================================
        res = client.get("/api/reports/inward")
        self.assertEqual(res.status_code, 200)
        inw_items = res.json()
        self.assertEqual(len(inw_items), 2)
        inw1 = next(i for i in inw_items if i["inward_no"] == "INW-DASH-001")
        self.assertEqual(Decimal(inw1["quantity"]), Decimal("50.00"))
        self.assertEqual(Decimal(inw1["unit_cost"]), Decimal("16.00"))
        self.assertEqual(Decimal(inw1["total_cost"]), Decimal("800.00"))
        self.assertEqual(inw1["supplier_name"], "Universal Supply Corp")
        self.assertEqual(inw1["location_name"], "Location A")

        # ========================================================
        # TASK 11: VERIFY OUTWARD REPORT
        # ========================================================
        res = client.get("/api/reports/outward")
        self.assertEqual(res.status_code, 200)
        out_items = res.json()
        self.assertEqual(len(out_items), 2)
        out1 = next(o for o in out_items if o["outward_no"] == "OUT-DASH-001")
        self.assertEqual(Decimal(out1["quantity"]), Decimal("60.00"))
        self.assertEqual(Decimal(out1["unit_cost_used"]), Decimal("12.00"))
        self.assertEqual(Decimal(out1["total_cost"]), Decimal("720.00"))
        self.assertEqual(out1["issued_to"], "Engineering Dept")
        self.assertEqual(out1["purpose"], "Workstation Setup")
        self.assertEqual(out1["location_name"], "Location A")
