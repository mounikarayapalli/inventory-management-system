"""Comprehensive Test Suite for Inventory & Business Logic Lead Modules.

Tests:
1. Inventory Workflow (Opening Stock -> Inward -> Outward -> Distribution -> Return -> Adjustment)
2. Stock Calculation (Available stock, Movement ledger balance, WAC calculation, Deterministic status)
3. Transaction Lifecycle & Movement Recording (Integrity, Reference IDs, Distribution non-deduction)
4. Business Rules & Validations (Positive quantity, Non-negative cost, Tolerance, Negative stock prevention)
5. Audit of Inventory Lead commits (e.g. backend/tests/test_inventory.py vs app/services/inventory_logic.py)
"""

from decimal import Decimal
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.exceptions import BadRequestException
from app.core.security import create_access_token
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.category import Category
from app.models.distribution_transaction import DistributionTransaction
from app.models.inward_transaction import InwardTransaction
from app.models.item import Item
from app.models.location import Location
from app.models.opening_stock import OpeningStock
from app.models.outward_transaction import OutwardTransaction
from app.models.return_transaction import ReturnTransaction
from app.models.role import Role
from app.models.stock_adjustment import StockAdjustment
from app.models.stock_movement import StockMovement
from app.models.supplier import Supplier
from app.models.user import User
from app.services.inventory_logic import (
    calculate_available_stock,
    calculate_stock_from_movements,
    calculate_wac,
    compute_inward_total_cost,
    determine_stock_status,
    quantize_currency,
    quantize_quantity,
    to_decimal,
    validate_adjustment_stock,
    validate_distribution_quantity,
    validate_non_negative_cost,
    validate_outward_stock,
    validate_positive_quantity,
)
from app.services.stock_service import stock_service
from app.services.transaction_service import transaction_service
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


class TestInventoryBusinessLogicLead(unittest.TestCase):
    """Test suite targeting Inventory & Business Logic Lead deliverables."""

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(test_engine)
        db = TestingSessionLocal()
        try:
            # Seed Roles
            admin_role = Role(role_id=1, role_name="admin")
            manager_role = Role(role_id=2, role_name="Stock Manager")
            staff_role = Role(role_id=3, role_name="staff")
            db.add_all([admin_role, manager_role, staff_role])
            db.flush()

            # Seed Admin and Manager Users
            admin_user = User(
                user_id=1,
                username="inv_admin",
                email="inv_admin@example.com",
                password_hash=UserService.hash_password("AdminPass123!"),
                role_id=admin_role.role_id,
                is_active=True,
            )
            manager_user = User(
                user_id=2,
                username="inv_manager",
                email="inv_manager@example.com",
                password_hash=UserService.hash_password("ManagerPass123!"),
                role_id=manager_role.role_id,
                is_active=True,
            )
            db.add_all([admin_user, manager_user])
            db.flush()

            # Seed Category, Locations, Supplier
            category = Category(category_id=1, category_name="Raw Materials", is_active=True)
            loc1 = Location(location_id=1, location_name="Warehouse Alpha", is_active=True)
            loc2 = Location(location_id=2, location_name="Warehouse Beta", is_active=True)
            supplier = Supplier(supplier_id=1, supplier_name="Industrial Source Inc", is_active=True)
            db.add_all([category, loc1, loc2, supplier])
            db.flush()

            # Seed Catalog Items
            item1 = Item(
                item_id=1,
                item_code="RAW-STEEL-001",
                item_name="Steel Rod 10mm",
                category_id=1,
                unit="kg",
                minimum_level=20,
                default_unit_cost=Decimal("5.00"),
                is_active=True,
            )
            item2 = Item(
                item_id=2,
                item_code="RAW-ALUM-002",
                item_name="Aluminium Sheet 2mm",
                category_id=1,
                unit="sheet",
                minimum_level=15,
                default_unit_cost=Decimal("12.00"),
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
    # 1. PURE BUSINESS RULES & CALCULATION TESTS
    # =========================================================================

    def test_br_01_quantize_precision(self):
        """Business Rule: Currency and quantities must quantize cleanly to 2 decimal places with ROUND_HALF_UP."""
        self.assertEqual(quantize_currency(Decimal("10.555")), Decimal("10.56"))
        self.assertEqual(quantize_currency(Decimal("10.554")), Decimal("10.55"))
        self.assertEqual(quantize_quantity(Decimal("100.123")), Decimal("100.12"))
        self.assertEqual(quantize_quantity(Decimal("100.126")), Decimal("100.13"))

    def test_br_02_to_decimal_safety(self):
        """Business Rule: to_decimal safely parses strings, numbers, None, and Decimal objects."""
        self.assertEqual(to_decimal(None), Decimal("0.00"))
        self.assertEqual(to_decimal(None, default="10.00"), Decimal("10.00"))
        self.assertEqual(to_decimal("45.67"), Decimal("45.67"))
        self.assertEqual(to_decimal(100), Decimal("100"))
        self.assertEqual(to_decimal(Decimal("12.34")), Decimal("12.34"))

    def test_br_03_positive_quantity_validation(self):
        """Business Rule: Quantities must be strictly greater than zero."""
        self.assertEqual(validate_positive_quantity("10.5"), Decimal("10.50"))
        with self.assertRaises(BadRequestException):
            validate_positive_quantity(0)
        with self.assertRaises(BadRequestException):
            validate_positive_quantity("-5.00")

    def test_br_04_non_negative_cost_validation(self):
        """Business Rule: Unit costs must be non-negative (>= 0)."""
        self.assertEqual(validate_non_negative_cost(0), Decimal("0.00"))
        self.assertEqual(validate_non_negative_cost("15.75"), Decimal("15.75"))
        with self.assertRaises(BadRequestException):
            validate_non_negative_cost("-0.01")

    def test_br_05_wac_mathematical_cases(self):
        """Business Rule: WAC formula:
        (existing_qty * existing_cost + in_qty * in_cost) / (existing_qty + in_qty).
        """
        # Case 1: Standard intake
        # Existing: 10 @ $10.00 ($100), New: 10 @ $20.00 ($200) -> 20 units worth $300 -> WAC $15.00
        wac1 = calculate_wac(Decimal("10"), Decimal("10.00"), Decimal("10"), Decimal("20.00"))
        self.assertEqual(wac1, Decimal("15.00"))

        # Case 2: Baseline intake (existing stock is zero)
        wac2 = calculate_wac(Decimal("0"), Decimal("0.00"), Decimal("25"), Decimal("18.50"))
        self.assertEqual(wac2, Decimal("18.50"))

        # Case 3: Free goods inward (inward cost = $0.00)
        # Existing: 10 @ $10.00, New: 10 @ $0.00 -> 20 units worth $100 -> WAC $5.00
        wac3 = calculate_wac(Decimal("10"), Decimal("10.00"), Decimal("10"), Decimal("0.00"))
        self.assertEqual(wac3, Decimal("5.00"))

        # Case 4: Zero inward quantity -> retains existing WAC
        wac4 = calculate_wac(Decimal("10"), Decimal("14.50"), Decimal("0"), Decimal("20.00"))
        self.assertEqual(wac4, Decimal("14.50"))

    def test_br_06_available_stock_formula(self):
        """Business Rule: Available Stock = Opening + Inward - Outward + Returns +/- Adjustments.
        CRITICAL: Distribution must NOT be deducted.
        """
        stock = calculate_available_stock(
            opening_stock=Decimal("100.00"),
            inward=Decimal("50.00"),
            outward=Decimal("30.00"),
            returns=Decimal("10.00"),
            adjustments=Decimal("-5.00"),
        )
        # 100 + 50 - 30 + 10 - 5 = 125
        self.assertEqual(stock, Decimal("125.00"))

    def test_br_07_stock_from_movements_aggregation(self):
        """Business Rule: calculate_stock_from_movements correctly applies movement type signs."""
        class MockMovement:
            def __init__(self, movement_type: str, quantity: Decimal):
                self.movement_type = movement_type
                self.quantity = quantity

        movements = [
            MockMovement("OPENING", Decimal("50")),
            MockMovement("INWARD", Decimal("20")),
            MockMovement("OUTWARD", Decimal("15")),
            MockMovement("RETURN", Decimal("5")),
            MockMovement("ADJUSTMENT", Decimal("-10")),
            MockMovement("ADJUSTMENT", Decimal("8")),
        ]
        balance = calculate_stock_from_movements(movements)
        # 50 + 20 - 15 + 5 - 10 + 8 = 58
        self.assertEqual(balance, Decimal("58.00"))

        # Unsupported movement type
        with self.assertRaises(BadRequestException):
            calculate_stock_from_movements([MockMovement("UNKNOWN_TYPE", Decimal("10"))])

    def test_br_08_inward_total_cost_tolerance(self):
        """Business Rule: compute_inward_total_cost calculates qty * unit_cost and allows 0.05 rounding tolerance."""
        # Exact
        self.assertEqual(compute_inward_total_cost(Decimal("10"), Decimal("15.50")), Decimal("155.00"))

        # Within 0.05 tolerance
        self.assertEqual(
            compute_inward_total_cost(Decimal("10"), Decimal("15.50"), declared_total_cost="155.04"),
            Decimal("155.04"),
        )

        # Exceeds 0.05 tolerance -> raises BadRequestException
        with self.assertRaises(BadRequestException):
            compute_inward_total_cost(Decimal("10"), Decimal("15.50"), declared_total_cost="155.10")

    def test_br_09_outward_stock_validation(self):
        """Business Rule: Requested outward quantity cannot exceed available on-hand stock."""
        # Sufficient stock
        validate_outward_stock(available_stock=Decimal("20.00"), requested_quantity=Decimal("20.00"))
        validate_outward_stock(available_stock=Decimal("20.00"), requested_quantity=Decimal("15.00"))

        # Insufficient stock -> raises BadRequestException
        with self.assertRaises(BadRequestException):
            validate_outward_stock(available_stock=Decimal("20.00"), requested_quantity=Decimal("20.01"))

    def test_br_10_adjustment_stock_validation(self):
        """Business Rule: Adjustments cannot be zero, and negative adjustments cannot cause negative stock."""
        # Zero change rejected
        with self.assertRaises(BadRequestException):
            validate_adjustment_stock(available_stock=Decimal("10.00"), quantity_change=Decimal("0"))

        # Negative change within balance accepted
        validate_adjustment_stock(available_stock=Decimal("10.00"), quantity_change=Decimal("-10.00"))

        # Negative change exceeding balance rejected
        with self.assertRaises(BadRequestException):
            validate_adjustment_stock(available_stock=Decimal("10.00"), quantity_change=Decimal("-10.01"))

    def test_br_11_distribution_quantity_validation(self):
        """Business Rule: Cumulative distribution line items cannot exceed related outward quantity."""
        # Total distribution matches outward
        validate_distribution_quantity(
            outward_quantity=Decimal("30.00"),
            already_distributed_quantity=Decimal("20.00"),
            requested_distribution_quantity=Decimal("10.00"),
        )

        # Total distribution exceeds outward -> raises BadRequestException
        with self.assertRaises(BadRequestException):
            validate_distribution_quantity(
                outward_quantity=Decimal("30.00"),
                already_distributed_quantity=Decimal("20.00"),
                requested_distribution_quantity=Decimal("10.01"),
            )

    def test_br_12_deterministic_stock_status(self):
        """Business Rule: Status is deterministic:
        qty <= 0 -> out_of_stock
        0 < qty <= min_level -> low_stock
        qty > min_level -> in_stock
        """
        self.assertEqual(determine_stock_status(Decimal("0.00"), 10), "out_of_stock")
        self.assertEqual(determine_stock_status(Decimal("-2.00"), 10), "out_of_stock")
        self.assertEqual(determine_stock_status(Decimal("5.00"), 10), "low_stock")
        self.assertEqual(determine_stock_status(Decimal("10.00"), 10), "low_stock")
        self.assertEqual(determine_stock_status(Decimal("10.01"), 10), "in_stock")
        self.assertEqual(determine_stock_status(Decimal("100.00"), 10), "in_stock")

    # =========================================================================
    # 2. INVENTORY WORKFLOW INTEGRATION TESTS
    # =========================================================================

    def test_wf_01_complete_inventory_lifecycle(self):
        """Verify full transaction lifecycle for an item at Location 1:
        1. Opening Stock: 100 kg @ $5.00 -> Stock = 100, WAC = $5.00
        2. Inward Receipt: 50 kg @ $8.00 -> Stock = 150, WAC = $6.00
        3. Outward Issue: 40 kg -> Stock = 110
        4. Distribution: 25 kg against outward -> Stock REMAINS 110 (NO double deduction)
        5. Return: 10 kg -> Stock = 120
        6. Adjustment: -5 kg (shrinkage) -> Stock = 115
        7. Adjustment: +15 kg (found stock) -> Stock = 130
        """
        item_id = 1
        loc_id = 1

        # 1. Opening Stock
        op_resp = client.post(
            "/api/opening-stock",
            json={"item_id": item_id, "location_id": loc_id, "quantity": 100.0, "unit_cost": 5.0},
        )
        self.assertEqual(op_resp.status_code, 201)
        self.assertEqual(op_resp.json()["status"], "completed")

        # 2. Inward Receipt
        in_resp = client.post(
            "/api/inward",
            json={
                "item_id": item_id,
                "location_id": loc_id,
                "supplier_id": 1,
                "quantity": 50.0,
                "unit_cost": 8.0,
                "inward_no": "INW-WF-001",
            },
        )
        self.assertEqual(in_resp.status_code, 201)

        # Check Stock and WAC: (100*5 + 50*8)/150 = 900/150 = 6.00
        stock1 = client.get(f"/api/stock/{item_id}")
        self.assertEqual(stock1.status_code, 200)
        self.assertEqual(Decimal(str(stock1.json()["current_quantity"])), Decimal("150.00"))
        self.assertEqual(Decimal(str(stock1.json()["average_unit_cost"])), Decimal("6.00"))

        # 3. Outward Issue: 40 units
        out_resp = client.post(
            "/api/outward",
            json={
                "item_id": item_id,
                "location_id": loc_id,
                "quantity": 40.0,
                "issued_to": "Fabrication Shop",
                "outward_no": "OUT-WF-001",
            },
        )
        self.assertEqual(out_resp.status_code, 201)
        outward_id = out_resp.json()["id"]

        stock2 = client.get(f"/api/stock/{item_id}")
        self.assertEqual(Decimal(str(stock2.json()["current_quantity"])), Decimal("110.00"))

        # 4. Distribution: 25 units under that Outward Issue
        dist_resp = client.post(
            "/api/distributions",
            json={
                "outward_id": outward_id,
                "quantity": 25.0,
                "recipient": "Shift Foreman",
                "department": "Machining",
            },
        )
        self.assertEqual(dist_resp.status_code, 201)

        # Verify stock did NOT decrease again: Still 110!
        stock3 = client.get(f"/api/stock/{item_id}")
        self.assertEqual(Decimal(str(stock3.json()["current_quantity"])), Decimal("110.00"))

        # 5. Return: 10 units
        ret_resp = client.post(
            "/api/returns",
            json={
                "item_id": item_id,
                "location_id": loc_id,
                "quantity": 10.0,
                "source": "Fabrication Shop",
                "reason": "Excess material returned",
            },
        )
        self.assertEqual(ret_resp.status_code, 201)

        stock4 = client.get(f"/api/stock/{item_id}")
        self.assertEqual(Decimal(str(stock4.json()["current_quantity"])), Decimal("120.00"))

        # 6. Adjustment: -5 units
        adj1_resp = client.post(
            "/api/adjustments",
            json={
                "item_id": item_id,
                "location_id": loc_id,
                "adjusted_quantity": -5.0,
                "reason": "Damaged rod write-off",
            },
        )
        self.assertEqual(adj1_resp.status_code, 201)

        stock5 = client.get(f"/api/stock/{item_id}")
        self.assertEqual(Decimal(str(stock5.json()["current_quantity"])), Decimal("115.00"))

        # 7. Adjustment: +15 units
        adj2_resp = client.post(
            "/api/adjustments",
            json={
                "item_id": item_id,
                "location_id": loc_id,
                "adjusted_quantity": 15.0,
                "reason": "Inventory audit recount surplus",
            },
        )
        self.assertEqual(adj2_resp.status_code, 201)

        stock6 = client.get(f"/api/stock/{item_id}")
        self.assertEqual(Decimal(str(stock6.json()["current_quantity"])), Decimal("130.00"))

        # Verify movement ledger: exactly 6 movements (OPENING, INWARD, OUTWARD, RETURN, ADJUSTMENT, ADJUSTMENT)
        # Distribution MUST NOT produce a movement!
        db = TestingSessionLocal()
        try:
            movements = db.scalars(
                select(StockMovement)
                .where(StockMovement.item_id == item_id, StockMovement.location_id == loc_id)
                .order_by(StockMovement.movement_id.asc())
            ).all()
            self.assertEqual(len(movements), 6)
            types = [m.movement_type for m in movements]
            self.assertEqual(types, ["OPENING", "INWARD", "OUTWARD", "RETURN", "ADJUSTMENT", "ADJUSTMENT"])
            self.assertNotIn("DISTRIBUTION", types)
            # Ensure every single movement has a non-null reference_id
            for m in movements:
                self.assertIsNotNone(m.reference_id)
                self.assertGreater(m.reference_id, 0)
        finally:
            db.close()

    def test_wf_02_duplicate_opening_stock_rejection(self):
        """Business Rule: Opening stock cannot be recorded twice for the same Item + Location."""
        # Attempt duplicate opening stock for item 1 at location 1
        resp = client.post(
            "/api/opening-stock",
            json={"item_id": 1, "location_id": 1, "quantity": 10.0, "unit_cost": 5.0},
        )
        self.assertEqual(resp.status_code, 409)
        self.assertEqual(resp.json()["error"]["code"], "RESOURCE_CONFLICT")

    def test_wf_03_opening_stock_nullable_cost(self):
        """Business Rule: Opening stock unit_cost is optional (nullable in DB)."""
        # Record opening stock for item 2 at location 1 with no unit_cost
        resp = client.post(
            "/api/opening-stock",
            json={"item_id": 2, "location_id": 1, "quantity": 50.0},
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertIsNone(data["unit_cost"])
        self.assertIsNone(data["total_cost"])

    # =========================================================================
    # 3. AUDIT OF INVENTORY LEAD COMMITS & CODE DEFECTS
    # =========================================================================

    def test_audit_01_backend_tests_test_inventory_has_zero_tests(self):
        """Audit Finding: backend/tests/test_inventory.py was committed with zero tests.
        It contains duplicated business logic functions instead of test cases,
        which causes `pytest tests/test_inventory.py` to exit with error code 1 (NO_TESTS_COLLECTED).
        """
        import tests.test_inventory as ti_module
        # Inspect module attributes for test classes or test functions
        test_funcs = [attr for attr in dir(ti_module) if attr.startswith("test_")]
        test_classes = [attr for attr in dir(ti_module) if attr.startswith("Test")]
        print(f"\n[QA Audit] Test items in backend/tests/test_inventory.py: funcs={len(test_funcs)}, classes={len(test_classes)}")
        self.assertEqual(len(test_funcs), 0, "No test functions exist in test_inventory.py")
        self.assertEqual(len(test_classes), 0, "No test classes exist in test_inventory.py")

    def test_audit_02_wac_moving_average_depletion_omission(self):
        """Audit Finding: StockService.get_wac ignores outward stock deductions when recalculating WAC.
        This reproduces the perpetual inventory moving-average accounting flaw.
        """
        db = TestingSessionLocal()
        try:
            test_item = Item(
                item_id=99,
                item_code="AUDIT-WAC-099",
                item_name="Audit Valuation Item",
                category_id=1,
                unit="pcs",
                minimum_level=5,
                default_unit_cost=Decimal("10.00"),
                is_active=True,
            )
            db.add(test_item)
            db.commit()
        finally:
            db.close()

        # Opening stock: 10 units @ $10.00 ($100.00)
        client.post(
            "/api/opening-stock",
            json={"item_id": 99, "location_id": 1, "quantity": 10.0, "unit_cost": 10.0},
        )
        # Outward dispatch: 8 units -> 2 units remain on hand
        client.post(
            "/api/outward",
            json={"item_id": 99, "location_id": 1, "quantity": 8.0, "issued_to": "Workshop"},
        )
        # Inward receipt: 10 units @ $20.00 ($200.00)
        client.post(
            "/api/inward",
            json={"item_id": 99, "location_id": 1, "supplier_id": 1, "quantity": 10.0, "unit_cost": 20.0},
        )

        stock_resp = client.get("/api/stock/99")
        reported_wac = Decimal(str(stock_resp.json()["average_unit_cost"]))
        # True moving average WAC: (2*10 + 10*20) / 12 = 220 / 12 = 18.33
        print(f"\n[QA Audit] Reported WAC: {reported_wac}, Accurate WAC: 18.33")
        self.assertEqual(reported_wac, Decimal("18.33"), "Confirms accurate perpetual WAC calculation")


if __name__ == "__main__":
    unittest.main()
