"""Pytest test case for the Project Brief mandatory flow."""

from decimal import Decimal
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import Category, Item, Location, Role, Supplier, User
from app.services.user_service import UserService

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

class TestProjectBriefMandatoryFlow(unittest.TestCase):
    """Verifies all 10 mandatory steps described in Section 9 of the Project Brief."""

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(test_engine)
        db = TestingSessionLocal()
        try:
            admin_role = Role(role_id=1, role_name="admin")
            db.add(admin_role)
            db.flush()

            admin_user = User(
                user_id=1,
                username="admin_brief",
                email="admin_brief@calibo.com",
                password_hash=UserService.hash_password("AdminPass123!"),
                role_id=admin_role.role_id,
                is_active=True,
            )
            db.add(admin_user)

            category = Category(category_id=1, category_name="Stationery Supplies", is_active=True)
            location = Location(location_id=1, location_name="Academy Main Store", is_active=True)
            supplier = Supplier(supplier_id=1, supplier_name="Calibo Academy Vendors", is_active=True)
            db.add_all([category, location, supplier])
            db.commit()
        finally:
            db.close()

    def setUp(self):
        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

    def test_project_brief_mandatory_flow(self):
        # 1. Login
        login = self.client.post("/api/auth/login", json={"username": "admin_brief", "password": "AdminPass123!"})
        self.assertEqual(login.status_code, 200)
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create Item
        it_res = self.client.post(
            "/api/items",
            headers=headers,
            json={
                "item_code": "STAT-PEN-BRIEF",
                "item_name": "Calibo Academy Executive Pen",
                "category_id": 1,
                "unit": "pcs",
                "minimum_level": 10,
                "default_unit_cost": 25.0,
            },
        )
        self.assertEqual(it_res.status_code, 201)
        item_id = it_res.json()["item_id"]

        # 3. Opening Stock (100 @ 20.00)
        op_res = self.client.post(
            "/api/opening-stock",
            headers=headers,
            json={
                "item_id": item_id,
                "location_id": 1,
                "quantity": 100.0,
                "unit_cost": 20.0,
            },
        )
        self.assertEqual(op_res.status_code, 201)

        # 4. Verify Stock = 100
        stk1 = self.client.get(f"/api/stock/{item_id}", headers=headers).json()
        self.assertEqual(Decimal(str(stk1["current_quantity"])), Decimal("100.00"))

        # 5. Inward (50 @ 26.00)
        inw_res = self.client.post(
            "/api/inward",
            headers=headers,
            json={
                "item_id": item_id,
                "location_id": 1,
                "supplier_id": 1,
                "quantity": 50.0,
                "unit_cost": 26.0,
                "inward_no": "INW-BRIEF-01",
            },
        )
        self.assertEqual(inw_res.status_code, 201)

        # 6. Verify Stock = 150 & WAC = (100*20 + 50*26)/150 = 3300/150 = 22.00
        stk2 = self.client.get(f"/api/stock/{item_id}", headers=headers).json()
        self.assertEqual(Decimal(str(stk2["current_quantity"])), Decimal("150.00"))
        self.assertEqual(Decimal(str(stk2["average_unit_cost"])), Decimal("22.00"))

        # 7. Outward (30)
        out_res = self.client.post(
            "/api/outward",
            headers=headers,
            json={
                "item_id": item_id,
                "location_id": 1,
                "quantity": 30.0,
                "issued_to": "Design Department",
                "outward_no": "OUT-BRIEF-01",
            },
        )
        self.assertEqual(out_res.status_code, 201)
        outward_id = out_res.json()["id"]

        # 8. Verify Stock = 120
        stk3 = self.client.get(f"/api/stock/{item_id}", headers=headers).json()
        self.assertEqual(Decimal(str(stk3["current_quantity"])), Decimal("120.00"))

        # 9. Distribution (15)
        dist_res = self.client.post(
            "/api/distributions",
            headers=headers,
            json={
                "outward_id": outward_id,
                "quantity": 15.0,
                "recipient": "Design Cohort Lead",
            },
        )
        self.assertEqual(dist_res.status_code, 201)

        # 10. Verify Stock STILL 120 (no double deduction)
        stk4 = self.client.get(f"/api/stock/{item_id}", headers=headers).json()
        self.assertEqual(Decimal(str(stk4["current_quantity"])), Decimal("120.00"))

        # 11. Verify Distributions List
        dist_list = self.client.get("/api/distributions", headers=headers).json()
        self.assertGreaterEqual(len(dist_list), 1)
        self.assertEqual(Decimal(str(dist_list[0]["quantity"])), Decimal("15.00"))

        # 12. Return (5)
        ret_res = self.client.post(
            "/api/returns",
            headers=headers,
            json={
                "item_id": item_id,
                "location_id": 1,
                "quantity": 5.0,
                "source": "Design Department",
                "reason": "Excess items returned",
            },
        )
        self.assertEqual(ret_res.status_code, 201)

        # 13. Verify Stock = 125
        stk5 = self.client.get(f"/api/stock/{item_id}", headers=headers).json()
        self.assertEqual(Decimal(str(stk5["current_quantity"])), Decimal("125.00"))

        # 14. Adjustment (-5)
        adj_res = self.client.post(
            "/api/adjustments",
            headers=headers,
            json={
                "item_id": item_id,
                "location_id": 1,
                "adjusted_quantity": -5.0,
                "reason": "Damaged items discard",
            },
        )
        self.assertEqual(adj_res.status_code, 201)

        # 15. Verify Final Stock = 120
        stk6 = self.client.get(f"/api/stock/{item_id}", headers=headers).json()
        self.assertEqual(Decimal(str(stk6["current_quantity"])), Decimal("120.00"))

        # 16. Verify Movements History
        mov_res = self.client.get(f"/api/reports/movements?item_id={item_id}", headers=headers)
        self.assertEqual(mov_res.status_code, 200)
        types = [m["movement_type"] for m in mov_res.json()]
        for expected in ["OPENING", "INWARD", "OUTWARD", "RETURN", "ADJUSTMENT"]:
            self.assertIn(expected, types)
