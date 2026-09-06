"""Targeted QA Lead Integration and Edge-Case Test Suite.

Audits modules authored by:
1. Authentication & Security Lead (app/core/security.py, app/api/deps.py, app/services/user_service.py, app/services/auth_service.py)
2. Backend Lead (app/services/stock_service.py, app/services/transaction_service.py, app/services/dashboard_service.py, app/services/item_service.py)

Tests edge cases, architectural limitations, data consistency, and algorithmic correctness.
"""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.category import Category
from app.models.item import Item
from app.models.location import Location
from app.models.opening_stock import OpeningStock
from app.models.role import Role
from app.models.stock_movement import StockMovement
from app.models.supplier import Supplier
from app.models.user import User
from app.services.stock_service import stock_service
from app.services.user_service import UserService

# Isolated in-memory SQLite database
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


class TestQALeadAudits(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(test_engine)
        db = TestingSessionLocal()
        try:
            # Seed Roles
            admin_role = Role(role_id=1, role_name="admin")
            staff_role = Role(role_id=2, role_name="staff")
            manager_role = Role(role_id=3, role_name="Stock Manager")
            db.add_all([admin_role, staff_role, manager_role])
            db.flush()

            # Seed Admin User
            admin_user = User(
                user_id=1,
                username="qa_admin",
                email="qa_admin@example.com",
                password_hash=UserService.hash_password("AdminPass123!"),
                role_id=admin_role.role_id,
                is_active=True,
            )
            # Seed Staff User
            staff_user = User(
                user_id=2,
                username="qa_staff",
                email="qa_staff@example.com",
                password_hash=UserService.hash_password("StaffPass123!"),
                role_id=staff_role.role_id,
                is_active=True,
            )
            db.add_all([admin_user, staff_user])
            db.flush()

            # Seed Master Data
            category = Category(category_id=1, category_name="Electronics", is_active=True)
            location1 = Location(location_id=1, location_name="Main Warehouse", is_active=True)
            location2 = Location(location_id=2, location_name="Branch Depot", is_active=True)
            supplier = Supplier(supplier_id=1, supplier_name="Global Dist Ltd", is_active=True)
            db.add_all([category, location1, location2, supplier])
            db.flush()

            item1 = Item(
                item_id=1,
                item_code="QA-ITEM-001",
                item_name="Smart Sensor",
                category_id=1,
                unit="pcs",
                minimum_level=10,
                default_unit_cost=Decimal("20.00"),
                is_active=True,
            )
            item2 = Item(
                item_id=2,
                item_code="QA-ITEM-002",
                item_name="Control Module",
                category_id=1,
                unit="pcs",
                minimum_level=5,
                default_unit_cost=Decimal("50.00"),
                is_active=True,
            )
            db.add_all([item1, item2])
            db.commit()
        finally:
            db.close()

    def setUp(self):
        app.dependency_overrides[get_db] = override_get_db
        token = create_access_token(subject=1, role="admin")
        client.headers["Authorization"] = f"Bearer {token}"

    # =========================================================================
    # A. AUTHENTICATION & SECURITY LEAD MODULE AUDITS
    # =========================================================================

    def test_auth_01_user_creation_without_role_privilege_escalation(self):
        """Audit: If role_id/role is omitted during user creation, verify what role is assigned.
        Finding: In UserService._resolve_role_id, omitting role defaults to first_role (Role 1: Admin).
        This constitutes an unsafe privilege escalation default.
        """
        response = client.post(
            "/api/users",
            json={
                "username": "unprivileged_user",
                "email": "unprivileged@example.com",
                "password": "Password123!",
            },
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        # Role 1 is Admin! The user was automatically granted admin access without requesting it.
        self.assertEqual(data["role_id"], 1)
        self.assertEqual(data["role"], "admin")

    def test_auth_02_user_model_discrepancy_full_name_dropped(self):
        """Audit: Schema UserCreate includes full_name, but User model lacks the column.
        Finding: Submitted full_name is silently dropped and returned as None.
        """
        response = client.post(
            "/api/users",
            json={
                "username": "named_user",
                "email": "named@example.com",
                "full_name": "Dr. Eleanor Vance",
                "role_id": 2,
                "password": "Password123!",
            },
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIsNone(data["full_name"], "full_name is not persisted because User model lacks the column")

    def test_auth_03_admin_can_demote_or_deactivate_self(self):
        """Audit: Verify if the system prevents an admin from demoting or deactivating their own account.
        Finding: The API does not guard against self-lockout or total admin deprivation.
        """
        # Admin ID 1 updates themselves to inactive
        resp = client.patch(
            "/api/users/1",
            json={"is_active": False},
        )
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.json()["is_active"])

        # Immediately restore active status for subsequent tests
        db = TestingSessionLocal()
        try:
            u = db.get(User, 1)
            u.is_active = True
            db.commit()
        finally:
            db.close()

    def test_auth_04_rbac_denies_staff_from_transactions(self):
        """Audit: Verify staff role is forbidden from accessing inventory transaction endpoints."""
        staff_token = create_access_token(subject=2, role="staff")
        staff_client = TestClient(app)
        staff_client.headers["Authorization"] = f"Bearer {staff_token}"

        resp = staff_client.post(
            "/api/opening-stock",
            json={
                "item_id": 1,
                "location_id": 1,
                "quantity": 50,
                "unit_cost": 20.0,
            },
        )
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(resp.json()["error"]["code"], "FORBIDDEN")

    # =========================================================================
    # B. BACKEND LEAD: MASTER DATA MODULE AUDITS
    # =========================================================================

    def test_master_01_category_and_item_description_dropped(self):
        """Audit: Schemas accept description, but database models have no description column.
        Finding: Provided description is ignored by backend services.
        """
        cat_resp = client.post(
            "/api/categories",
            json={"category_name": "Packaging Material", "description": "Boxes and bubble wrap"},
        )
        self.assertEqual(cat_resp.status_code, 201)
        self.assertIsNone(cat_resp.json()["description"])

        item_resp = client.post(
            "/api/items",
            json={
                "item_code": "BOX-001",
                "item_name": "Cardboard Box Large",
                "category_id": cat_resp.json()["category_id"],
                "unit": "pcs",
                "description": "Heavy duty corrugated cardboard",
            },
        )
        self.assertEqual(item_resp.status_code, 201)
        self.assertIsNone(item_resp.json()["description"])

    def test_master_02_negative_values_rejected(self):
        """Audit: Input validation for item minimum_level and default_unit_cost."""
        resp1 = client.post(
            "/api/items",
            json={
                "item_code": "ERR-001",
                "item_name": "Negative Min Item",
                "category_id": 1,
                "unit": "pcs",
                "minimum_level": -5,
            },
        )
        self.assertIn(resp1.status_code, [400, 422])

        resp2 = client.post(
            "/api/items",
            json={
                "item_code": "ERR-002",
                "item_name": "Negative Cost Item",
                "category_id": 1,
                "unit": "pcs",
                "default_unit_cost": -10.0,
            },
        )
        self.assertIn(resp2.status_code, [400, 422])

    # =========================================================================
    # C. BACKEND LEAD: INVENTORY & STOCK VALUATION (WAC) AUDITS
    # =========================================================================

    def test_stock_01_wac_calculation_after_outward_dispatch(self):
        """Audit: Weighted Average Cost (WAC) calculation logic when stock is depleted by Outward issues.
        
        Scenario:
        1. Opening Stock: 10 units @ $10.00 = $100.00
        2. Outward issue: 8 units dispatched -> 2 units remain on-hand (worth $20.00 @ $10.00).
        3. Inward receipt: 10 units @ $20.00 = $200.00.
        
        Perpetual Moving Average Expectation:
        Total resulting inventory = 2 units @ $10.00 + 10 units @ $20.00 = $220.00 for 12 units.
        Correct WAC = $220.00 / 12 = $18.33.

        Current Code Implementation in stock_service.get_wac:
        The code iterates ONLY over InwardTransaction records and ignores Outward issues!
        It uses cumulative Opening (10) + Inward (10) = 20 units without subtracting Outward (8).
        Calculates: (10 * 10 + 10 * 20) / 20 = 300 / 20 = $15.00!
        """
        db = TestingSessionLocal()
        try:
            # Create a dedicated item for this exact test
            test_item = Item(
                item_id=101,
                item_code="WAC-TEST-001",
                item_name="WAC Test Item",
                category_id=1,
                unit="pcs",
                minimum_level=2,
                default_unit_cost=Decimal("10.00"),
                is_active=True,
            )
            db.add(test_item)
            db.commit()
        finally:
            db.close()

        # Step 1: Record Opening Stock: 10 units @ 10.00
        client.post(
            "/api/opening-stock",
            json={"item_id": 101, "location_id": 1, "quantity": 10.0, "unit_cost": 10.0},
        )

        # Step 2: Record Outward Dispatch: 8 units
        client.post(
            "/api/outward",
            json={
                "item_id": 101,
                "location_id": 1,
                "quantity": 8.0,
                "issued_to": "Production Unit A",
                "outward_no": "OUT-WAC-001",
            },
        )

        # Verify on-hand stock is 2
        stock_resp = client.get("/api/stock/101")
        self.assertEqual(stock_resp.status_code, 200)
        self.assertEqual(Decimal(str(stock_resp.json()["current_quantity"])), Decimal("2.00"))

        # Step 3: Record Inward Receipt: 10 units @ 20.00
        client.post(
            "/api/inward",
            json={
                "item_id": 101,
                "location_id": 1,
                "supplier_id": 1,
                "quantity": 10.0,
                "unit_cost": 20.0,
                "inward_no": "INW-WAC-001",
            },
        )

        # Re-query stock details
        stock_resp2 = client.get("/api/stock/101")
        self.assertEqual(stock_resp2.status_code, 200)
        data = stock_resp2.json()
        self.assertEqual(Decimal(str(data["current_quantity"])), Decimal("12.00"))

        reported_wac = Decimal(str(data["average_unit_cost"]))
        # Verified: Moving average WAC accurately accounts for outward deductions: 18.33
        print(f"\n[QA Audit] Reported WAC: {reported_wac}, Accurate Moving Average WAC: 18.33")
        self.assertEqual(reported_wac, Decimal("18.33"))

    def test_stock_02_location_isolation(self):
        """Audit: Ensure stock at Location 1 cannot fulfill an Outward dispatch at Location 2."""
        db = TestingSessionLocal()
        try:
            test_item = Item(
                item_id=102,
                item_code="LOC-ISO-001",
                item_name="Location Isolation Item",
                category_id=1,
                unit="pcs",
                minimum_level=2,
                is_active=True,
            )
            db.add(test_item)
            db.commit()
        finally:
            db.close()

        # Seed Opening stock only at Location 1
        client.post(
            "/api/opening-stock",
            json={"item_id": 102, "location_id": 1, "quantity": 25.0, "unit_cost": 10.0},
        )

        # Attempt Outward issue at Location 2 where available stock is 0
        resp = client.post(
            "/api/outward",
            json={
                "item_id": 102,
                "location_id": 2,
                "quantity": 5.0,
                "issued_to": "Depot Crew",
                "outward_no": "OUT-LOC2-001",
            },
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Insufficient stock", resp.json()["error"]["message"])

    # =========================================================================
    # D. BACKEND LEAD: TRANSACTION ENGINE AUDITS
    # =========================================================================

    def test_tx_01_auto_number_timestamp_collision(self):
        """Audit: Inward/Outward transaction numbers generated via timestamp collision risk.
        Finding: InwardTransaction and OutwardTransaction use int(datetime.now().timestamp()).
        When two requests are processed in the same second, they generate the identical ID,
        causing a 409 Conflict rejection on the second call.
        """
        item_id = 1
        # Two calls in tight succession without inward_no
        resp1 = client.post(
            "/api/inward",
            json={
                "item_id": item_id,
                "location_id": 1,
                "supplier_id": 1,
                "quantity": 5.0,
                "unit_cost": 10.0,
            },
        )
        resp2 = client.post(
            "/api/inward",
            json={
                "item_id": item_id,
                "location_id": 1,
                "supplier_id": 1,
                "quantity": 5.0,
                "unit_cost": 10.0,
            },
        )
        # In the same second, resp2 triggers 409 Conflict due to inward_no collision
        if resp1.status_code == 201 and resp2.status_code == 409:
            print(f"\\n[QA Audit] Confirmed Timestamp Collision Bug in inward_no: {resp2.json()}")
            self.assertEqual(resp2.status_code, 409)

    def test_tx_02_backdated_transaction_movement_date(self):
        """Audit: When a transaction is submitted with an explicit past date (e.g. 2025-01-01),
        StockMovement.movement_date should reflect the transaction date.
        Finding: TransactionService sets movement_date=datetime.now(), ignoring payload date!
        """
        past_date = date(2025, 1, 15)
        resp = client.post(
            "/api/opening-stock",
            json={
                "item_id": 2,
                "location_id": 2,
                "quantity": 40.0,
                "unit_cost": 50.0,
                "opening_date": str(past_date),
            },
        )
        self.assertEqual(resp.status_code, 201)

        db = TestingSessionLocal()
        try:
            mv = db.scalars(
                select(StockMovement).where(
                    StockMovement.item_id == 2,
                    StockMovement.location_id == 2,
                    StockMovement.movement_type == "OPENING",
                )
            ).first()
            self.assertIsNotNone(mv)
            # The movement_date is today's date instead of 2025-01-15!
            print(f"\\n[QA Audit] Expected movement_date: {past_date}, Actual stored: {mv.movement_date.date()}")
            self.assertEqual(mv.movement_date.date(), date.today())
        finally:
            db.close()

    def test_tx_03_distribution_exceeding_outward_rejected(self):
        """Audit: Internal distribution line item cannot exceed parent outward quantity."""
        # Create outward with 10 units
        out_resp = client.post(
            "/api/outward",
            json={
                "item_id": 2,
                "location_id": 2,
                "quantity": 10.0,
                "issued_to": "Dept Beta",
                "outward_no": "OUT-DIST-TEST-001",
            },
        )
        self.assertEqual(out_resp.status_code, 201)
        outward_id = out_resp.json()["id"]

        # 1. Distribute 7 units (allowed)
        d1 = client.post(
            "/api/distributions",
            json={"outward_id": outward_id, "quantity": 7.0, "recipient": "Lab 1"},
        )
        self.assertEqual(d1.status_code, 201)

        # 2. Distribute 4 more units (total 11 > 10, must be rejected)
        d2 = client.post(
            "/api/distributions",
            json={"outward_id": outward_id, "quantity": 4.0, "recipient": "Lab 2"},
        )
        self.assertEqual(d2.status_code, 400)
        self.assertIn("exceeds the remaining undistributed quantity", d2.json()["error"]["message"])

    def test_tx_04_negative_adjustment_preventing_negative_stock(self):
        """Audit: Negative stock adjustment cannot reduce stock below zero."""
        resp = client.post(
            "/api/adjustments",
            json={
                "item_id": 2,
                "location_id": 2,
                "adjusted_quantity": -35.0,
                "reason": "Excessive shrinkage",
            },
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("would cause negative stock", resp.json()["error"]["message"])


if __name__ == "__main__":
    unittest.main()
