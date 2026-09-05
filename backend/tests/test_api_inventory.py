"""API integration tests for inventory transactions and stock endpoints.

Uses an isolated in-memory SQLite database via FastAPI dependency override.
Does NOT require a live PostgreSQL database or external test runners.
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
from app.models import (
    Category,
    Item,
    Location,
    Role,
    StockMovement,
    Supplier,
    User,
)

# In-memory SQLite engine for fast, isolated API testing
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


class TestInventoryAPI(unittest.TestCase):
    """Integration test suite executing the complete inventory API flow."""

    def setUp(self):
        app.dependency_overrides[get_db] = override_get_db
        from app.core.security import create_access_token
        token = create_access_token(subject=1, role="Admin")
        client.headers["Authorization"] = f"Bearer {token}"

    @classmethod
    def setUpClass(cls):
        """Create all 13 tables in memory and seed master records."""
        Base.metadata.create_all(test_engine)
        db = TestingSessionLocal()
        try:
            # Seed Role and User
            admin_role = Role(role_id=1, role_name="Admin")
            db.add(admin_role)
            db.flush()

            admin_user = User(
                user_id=1,
                username="admin_user",
                email="admin@calibo.com",
                password_hash="hashed_pw",
                role_id=admin_role.role_id,
                is_active=True,
            )
            db.add(admin_user)

            # Seed Category
            cat = Category(category_id=1, category_name="Electronics", is_active=True)
            db.add(cat)
            db.flush()

            # Seed Item
            item = Item(
                item_id=1,
                item_code="ELEC-KB-001",
                item_name="Mechanical Keyboard",
                category_id=cat.category_id,
                unit="pcs",
                minimum_level=10,
                default_unit_cost=Decimal("10.00"),
                is_active=True,
            )
            db.add(item)

            # Seed Supplier
            supplier = Supplier(
                supplier_id=1,
                supplier_name="Global Tech Supplies",
                is_active=True,
            )
            db.add(supplier)

            # Seed Locations A & B
            loc_a = Location(location_id=1, location_name="Location A", is_active=True)
            loc_b = Location(location_id=2, location_name="Location B", is_active=True)
            db.add_all([loc_a, loc_b])

            db.commit()
        finally:
            db.close()

    def test_01_full_inventory_api_flow(self):
        """Execute complete inventory lifecycle flow through FastAPI HTTP endpoints."""

        # 1. Opening Stock: 100 units at Location A @ 10.00
        res = client.post(
            "/api/opening-stock",
            json={
                "item_id": 1,
                "location_id": 1,
                "quantity": 100,
                "unit_cost": 10.00,
                "remarks": "Initial baseline inventory",
                "created_by": 1,
            },
        )
        self.assertEqual(res.status_code, 201, res.text)
        data = res.json()
        self.assertEqual(float(data["quantity"]), 100.0)
        self.assertEqual(float(data["unit_cost"]), 10.00)

        # Verify initial stock and WAC via GET /api/stock/1
        res = client.get("/api/stock/1")
        self.assertEqual(res.status_code, 200)
        stock_data = res.json()
        self.assertEqual(float(stock_data["current_quantity"]), 100.0)
        self.assertEqual(float(stock_data["average_unit_cost"]), 10.00)
        loc_a = next(l for l in stock_data["locations"] if l["location_id"] == 1)
        loc_b = next(l for l in stock_data["locations"] if l["location_id"] == 2)
        self.assertEqual(float(loc_a["quantity"]), 100.0)
        self.assertEqual(float(loc_b["quantity"]), 0.0)

        # 2. Inward: 50 units at Location A @ 16.00
        # Expected WAC: (100 * 10 + 50 * 16) / 150 = 1800 / 150 = 12.00
        res = client.post(
            "/api/inward",
            json={
                "inward_no": "INW-2026-001",
                "item_id": 1,
                "location_id": 1,
                "supplier_id": 1,
                "quantity": 50,
                "unit_cost": 16.00,
                "total_cost": 800.00,
                "created_by": 1,
            },
        )
        self.assertEqual(res.status_code, 201, res.text)

        # Verify stock = 150 and WAC = 12.00
        res = client.get("/api/stock/1")
        self.assertEqual(res.status_code, 200)
        stock_data = res.json()
        self.assertEqual(float(stock_data["current_quantity"]), 150.0)
        self.assertEqual(float(stock_data["average_unit_cost"]), 12.00)
        loc_a = next(l for l in stock_data["locations"] if l["location_id"] == 1)
        self.assertEqual(float(loc_a["quantity"]), 150.0)
        self.assertEqual(float(loc_a["unit_cost"]), 12.00)

        # 3. Outward: 60 units at Location A
        # Expected remaining stock: 150 - 60 = 90
        # Expected valuation: 60 * 12.00 = 720.00
        res = client.post(
            "/api/outward",
            json={
                "outward_no": "OUT-2026-001",
                "item_id": 1,
                "location_id": 1,
                "quantity": 60,
                "issued_to": "Engineering Dept",
                "purpose": "Hardware upgrade",
                "created_by": 1,
            },
        )
        self.assertEqual(res.status_code, 201, res.text)
        out_data = res.json()
        outward_id = out_data["id"]
        self.assertEqual(float(out_data["quantity"]), 60.0)
        self.assertEqual(float(out_data["unit_cost"]), 12.00)
        self.assertEqual(float(out_data["total_cost"]), 720.00)

        # Verify stock = 90
        res = client.get("/api/stock/1")
        stock_data = res.json()
        self.assertEqual(float(stock_data["current_quantity"]), 90.0)

        # 4. Try Outward of 100 units (> 90 available) -> MUST be rejected with HTTP 400
        res = client.post(
            "/api/outward",
            json={
                "outward_no": "OUT-EXCEED",
                "item_id": 1,
                "location_id": 1,
                "quantity": 100,
                "issued_to": "Engineering Dept",
                "created_by": 1,
            },
        )
        self.assertEqual(res.status_code, 400)
        err_body = res.json()
        self.assertFalse(err_body["success"])
        self.assertEqual(err_body["error"]["code"], "BAD_REQUEST")

        # 5. Distribution: 30 units linked to existing Outward (OUT-2026-001)
        # Verify request does NOT require item_id or location_id
        db = TestingSessionLocal()
        movements_before = len(db.query(StockMovement).all())
        db.close()

        res = client.post(
            "/api/distributions",
            json={
                "outward_id": outward_id,
                "quantity": 30,
                "recipient": "Team Alpha",
                "department": "Engineering",
                "batch": "BATCH-01",
                "purpose": "Project deployment",
                "created_by": 1,
            },
        )
        self.assertEqual(res.status_code, 201, res.text)
        dist_res = res.json()
        # Verify response returns item_id and location_id derived from parent outward
        self.assertEqual(dist_res["item_id"], 1)
        self.assertEqual(dist_res["location_id"], 1)

        # CRITICAL VERIFICATION:
        # Distribution must NOT deduct stock separately and must NOT create a new stock movement
        res = client.get("/api/stock/1")
        stock_data = res.json()
        self.assertEqual(float(stock_data["current_quantity"]), 90.0)  # Stock remains 90!

        db = TestingSessionLocal()
        movements_after = len(db.query(StockMovement).all())
        db.close()
        self.assertEqual(movements_before, movements_after, "Distribution created a duplicate stock movement!")

        # 6. Distribution exceeding outward quantity (already 30 distributed out of 60; try 40 more -> 70 > 60)
        res = client.post(
            "/api/distributions",
            json={
                "outward_id": outward_id,
                "quantity": 40,
                "recipient": "Team Beta",
                "department": "QA",
                "created_by": 1,
            },
        )
        self.assertEqual(res.status_code, 400)
        err_body = res.json()
        self.assertFalse(err_body["success"])
        self.assertEqual(err_body["error"]["code"], "BAD_REQUEST")

        # 7. Returns: 10 units at Location A
        # Stock should become 90 + 10 = 100
        res = client.post(
            "/api/returns",
            json={
                "item_id": 1,
                "location_id": 1,
                "quantity": 10,
                "source": "Engineering Dept",
                "reason": "Surplus units",
                "created_by": 1,
            },
        )
        self.assertEqual(res.status_code, 201, res.text)

        res = client.get("/api/stock/1")
        stock_data = res.json()
        self.assertEqual(float(stock_data["current_quantity"]), 100.0)

        # 8. Adjustment: -5 units at Location A
        # Stock should become 100 - 5 = 95
        res = client.post(
            "/api/adjustments",
            json={
                "item_id": 1,
                "location_id": 1,
                "adjusted_quantity": -5,
                "reason": "Physical count audit correction",
                "created_by": 1,
            },
        )
        self.assertEqual(res.status_code, 201, res.text)

        res = client.get("/api/stock/1")
        stock_data = res.json()
        self.assertEqual(float(stock_data["current_quantity"]), 95.0)

        # 9. Verify Location B remained 0.0 throughout all Location A transactions
        loc_b = next(l for l in stock_data["locations"] if l["location_id"] == 2)
        self.assertEqual(float(loc_b["quantity"]), 0.0)

        # 10. Check GET /api/stock aggregate list
        res = client.get("/api/stock")
        self.assertEqual(res.status_code, 200)
        stock_list = res.json()
        self.assertGreaterEqual(len(stock_list), 1)
        item_stock = next(i for i in stock_list if i["item_id"] == 1)
        self.assertEqual(float(item_stock["current_quantity"]), 95.0)

        # 11. Check GET /api/stock/movements ledger
        res = client.get("/api/stock/movements")
        self.assertEqual(res.status_code, 200)
        movements_list = res.json()
        self.assertGreaterEqual(len(movements_list), 5)
        registered_types = set(m["movement_type"] for m in movements_list)
        self.assertTrue(registered_types.issubset({"OPENING", "INWARD", "OUTWARD", "RETURN", "ADJUSTMENT"}))
        self.assertNotIn("DISTRIBUTION", registered_types)

    def test_02_validation_and_error_handling(self):
        """Verify edge cases and validation error responses."""

        # Duplicate inward_no (INW-2026-001 already created) -> 409 Conflict
        res = client.post(
            "/api/inward",
            json={
                "inward_no": "INW-2026-001",
                "item_id": 1,
                "location_id": 1,
                "supplier_id": 1,
                "quantity": 10,
                "unit_cost": 15.00,
            },
        )
        self.assertEqual(res.status_code, 409)
        self.assertEqual(res.json()["error"]["code"], "RESOURCE_CONFLICT")

        # Duplicate outward_no (OUT-2026-001 already created) -> 409 Conflict
        res = client.post(
            "/api/outward",
            json={
                "outward_no": "OUT-2026-001",
                "item_id": 1,
                "location_id": 1,
                "quantity": 5,
                "issued_to": "Engineering Dept",
            },
        )
        self.assertEqual(res.status_code, 409)
        self.assertEqual(res.json()["error"]["code"], "RESOURCE_CONFLICT")

        # Missing issued_to on outward -> 422 Unprocessable Entity
        res = client.post(
            "/api/outward",
            json={
                "outward_no": "OUT-NO-ISSUED-TO",
                "item_id": 1,
                "location_id": 1,
                "quantity": 5,
            },
        )
        self.assertEqual(res.status_code, 422)

        # Missing return source -> 422 Unprocessable Entity
        res = client.post(
            "/api/returns",
            json={
                "item_id": 1,
                "location_id": 1,
                "quantity": 5,
                "reason": "Test reason",
            },
        )
        self.assertEqual(res.status_code, 422)

        # Missing return reason -> 422 Unprocessable Entity
        res = client.post(
            "/api/returns",
            json={
                "item_id": 1,
                "location_id": 1,
                "quantity": 5,
                "source": "Test source",
            },
        )
        self.assertEqual(res.status_code, 422)

        # Opening stock with unit_cost=None succeeds (unit_cost nullable)
        res = client.post(
            "/api/opening-stock",
            json={
                "item_id": 1,
                "location_id": 2,
                "quantity": 15,
                "unit_cost": None,
                "remarks": "Null unit cost opening",
                "created_by": 1,
            },
        )
        self.assertEqual(res.status_code, 201, res.text)
        op_data = res.json()
        self.assertIsNone(op_data["unit_cost"])
        self.assertIsNone(op_data["total_cost"])

        # Invalid quantity <= 0 -> 400 or 422
        res = client.post(
            "/api/inward",
            json={
                "inward_no": "INW-ZERO",
                "item_id": 1,
                "location_id": 1,
                "supplier_id": 1,
                "quantity": 0,
                "unit_cost": 10.00,
            },
        )
        self.assertIn(res.status_code, (400, 422))

        # Invalid item ID -> 404
        res = client.post(
            "/api/outward",
            json={
                "item_id": 9999,
                "location_id": 1,
                "quantity": 5,
                "issued_to": "Engineering Dept",
            },
        )
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.json()["error"]["code"], "RESOURCE_NOT_FOUND")

        # Invalid location ID -> 404
        res = client.post(
            "/api/outward",
            json={
                "item_id": 1,
                "location_id": 9999,
                "quantity": 5,
                "issued_to": "Engineering Dept",
            },
        )
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.json()["error"]["code"], "RESOURCE_NOT_FOUND")

        # Adjustment causing negative stock -> 400
        res = client.post(
            "/api/adjustments",
            json={
                "item_id": 1,
                "location_id": 1,
                "adjusted_quantity": -200,
                "reason": "Exceeding inventory writeoff",
            },
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()["error"]["code"], "BAD_REQUEST")


if __name__ == "__main__":
    unittest.main()
