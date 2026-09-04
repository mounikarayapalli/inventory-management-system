"""Authentication, identity, and RBAC integration tests for Calibo Inventory Backend.

Tests Step 8A and Step 8B:
- DB-backed login with Argon2id verification
- JWT signing and payload claim structure (sub, role, exp)
- Authenticated /me endpoint returning safe UserResponse
- Exclusion of password and password_hash
- Rejection of invalid passwords, inactive users, missing/malformed/expired/tampered tokens
- Nonexistent user claims rejection
- Centralized RBAC with require_roles (401 for missing token, 403 for unauthorized role)
- Authenticated created_by propagation from JWT user identity into transactions and movements
- Prevention of client-controlled created_by impersonation
- Protected business APIs require authentication
- Public endpoints (/health, /auth/login, /docs, /openapi.json) remain accessible without JWT
"""

from datetime import timedelta
from decimal import Decimal
import unittest
from fastapi.testclient import TestClient
import jwt
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.category import Category
from app.models.inward_transaction import InwardTransaction
from app.models.item import Item
from app.models.location import Location
from app.models.role import Role
from app.models.stock_movement import StockMovement
from app.models.supplier import Supplier
from app.models.user import User
from app.services.user_service import UserService

# Isolated in-memory SQLite engine for auth and RBAC tests
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


class TestAuthFoundationAPI(unittest.TestCase):
    """Test suite for JWT authentication, RBAC authorization, and created_by propagation."""

    @classmethod
    def setUpClass(cls):
        """Set up in-memory SQLite schema and seed standard roles, test users, and catalog."""
        Base.metadata.create_all(test_engine)
        db = TestingSessionLocal()
        try:
            # Seed standard roles
            role_admin = Role(role_id=1, role_name="admin")
            role_staff = Role(role_id=2, role_name="staff")
            role_manager = Role(role_id=3, role_name="Stock Manager")
            db.add_all([role_admin, role_staff, role_manager])
            db.flush()

            # Seed test users
            # 1. Active Admin
            active_admin = User(
                user_id=1,
                username="valid_user",
                email="valid_user@example.com",
                password_hash=UserService.hash_password("ValidPassword123!"),
                role_id=1,
                is_active=True,
            )

            # 2. Inactive User
            inactive_user = User(
                user_id=2,
                username="inactive_user",
                email="inactive_user@example.com",
                password_hash=UserService.hash_password("ValidPassword123!"),
                role_id=2,
                is_active=False,
            )

            # 3. Active Stock Manager
            manager_user = User(
                user_id=3,
                username="manager_user",
                email="manager@example.com",
                password_hash=UserService.hash_password("ValidPassword123!"),
                role_id=3,
                is_active=True,
            )

            # 4. Active Staff User (insufficient permissions for inventory transactions)
            staff_user = User(
                user_id=4,
                username="staff_user",
                email="staff@example.com",
                password_hash=UserService.hash_password("ValidPassword123!"),
                role_id=2,
                is_active=True,
            )

            db.add_all([active_admin, inactive_user, manager_user, staff_user])

            # Seed catalog records for transaction tests
            cat = Category(category_id=1, category_name="General Goods", is_active=True)
            db.add(cat)
            db.flush()

            item = Item(
                item_id=1,
                item_code="ITEM-RBAC-001",
                item_name="RBAC Verified Item",
                category_id=1,
                unit="pcs",
                minimum_level=5,
                default_unit_cost=Decimal("15.00"),
                is_active=True,
            )
            location = Location(location_id=1, location_name="Central Depot", is_active=True)
            supplier = Supplier(supplier_id=1, supplier_name="Verified Supplier", is_active=True)

            db.add_all([item, location, supplier])
            db.commit()
        finally:
            db.close()

    def setUp(self):
        """Ensure dependency override is active and client headers are clean."""
        app.dependency_overrides[get_db] = override_get_db
        client.headers.clear()

    # =========================================================================
    # 1. LOGIN TESTS (Step 8A)
    # =========================================================================

    def test_login_success_with_valid_username_and_password(self):
        """Valid user can login with username, receives valid JWT and TokenResponse structure."""
        response = client.post(
            "/api/auth/login",
            json={"username": "valid_user", "password": "ValidPassword123!"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["user_id"], 1)
        self.assertEqual(data["role"], "admin")
        self.assertEqual(data["expires_in"], 3600)

        token = data["access_token"]
        self.assertNotEqual(token, "mock_jwt_token_placeholder_calibo_inventory")
        self.assertEqual(len(token.split(".")), 3)

        claims = decode_access_token(token)
        self.assertEqual(claims["sub"], "1")
        self.assertEqual(claims["role"], "admin")
        self.assertEqual(claims["username"], "valid_user")
        self.assertIn("exp", claims)
        self.assertIn("iat", claims)
        self.assertGreater(claims["exp"], claims["iat"])

    def test_login_success_with_valid_email_and_password(self):
        """Valid user can login using email address as the identifier."""
        response = client.post(
            "/api/auth/login",
            json={"username": "valid_user@example.com", "password": "ValidPassword123!"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["user_id"], 1)
        self.assertEqual(data["role"], "admin")
        self.assertIn("access_token", data)

    def test_login_failure_with_wrong_password(self):
        """Login with invalid password fails with 401 Unauthorized."""
        response = client.post(
            "/api/auth/login",
            json={"username": "valid_user", "password": "WrongPassword999!"},
        )
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "UNAUTHORIZED")

    def test_login_failure_with_nonexistent_user(self):
        """Login with nonexistent username fails with 401 Unauthorized."""
        response = client.post(
            "/api/auth/login",
            json={"username": "unknown_user", "password": "ValidPassword123!"},
        )
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "UNAUTHORIZED")

    def test_login_failure_with_inactive_user(self):
        """Login with credentials of an inactive user fails with 401 Unauthorized."""
        response = client.post(
            "/api/auth/login",
            json={"username": "inactive_user", "password": "ValidPassword123!"},
        )
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "UNAUTHORIZED")
        self.assertIn("inactive", data["error"]["message"].lower())

    # =========================================================================
    # 2. /ME ENDPOINT TESTS (Step 8A)
    # =========================================================================

    def test_get_me_success_with_valid_token(self):
        """Valid token successfully retrieves current user profile without sensitive fields."""
        login_resp = client.post(
            "/api/auth/login",
            json={"username": "valid_user", "password": "ValidPassword123!"},
        )
        token = login_resp.json()["access_token"]

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["id"], 1)
        self.assertEqual(data["user_id"], 1)
        self.assertEqual(data["username"], "valid_user")
        self.assertEqual(data["email"], "valid_user@example.com")
        self.assertEqual(data["role"], "admin")
        self.assertEqual(data["role_id"], 1)
        self.assertTrue(data["is_active"])

        self.assertNotIn("password", data)
        self.assertNotIn("password_hash", data)

    def test_get_me_failure_missing_authorization_header(self):
        """Accessing /me without Authorization header returns 401."""
        response = client.get("/api/auth/me")
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "UNAUTHORIZED")

    def test_get_me_failure_malformed_bearer_token(self):
        """Accessing /me with invalid authorization scheme or empty token returns 401."""
        resp_basic = client.get(
            "/api/auth/me",
            headers={"Authorization": "Basic dXNlcjpwYXNz"},
        )
        self.assertEqual(resp_basic.status_code, 401)

        resp_empty = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer "},
        )
        self.assertEqual(resp_empty.status_code, 401)

        resp_garbage = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer not-a-valid-token-string"},
        )
        self.assertEqual(resp_garbage.status_code, 401)

    def test_get_me_failure_invalid_signature(self):
        """Token signed with a different key is rejected with 401."""
        tampered_token = jwt.encode(
            {"sub": "1", "role": "admin"},
            "completely-wrong-secret-key-32chars!",
            algorithm="HS256",
        )
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {tampered_token}"},
        )
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "UNAUTHORIZED")

    def test_get_me_failure_expired_token(self):
        """Expired JWT token is rejected with 401."""
        expired_token = create_access_token(
            subject=1,
            role="admin",
            expires_delta=timedelta(seconds=-10),
        )
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "UNAUTHORIZED")

    def test_get_me_failure_nonexistent_user_in_token(self):
        """Token referencing a user_id that does not exist in the database returns 401."""
        nonexistent_token = create_access_token(
            subject=99999,
            role="admin",
        )
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {nonexistent_token}"},
        )
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "UNAUTHORIZED")

    def test_get_me_failure_inactive_user_token(self):
        """Token belonging to an inactive user returns 401."""
        inactive_token = create_access_token(
            subject=2,
            role="staff",
        )
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {inactive_token}"},
        )
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "UNAUTHORIZED")

    # =========================================================================
    # 3. RBAC & CREATED_BY PROPAGATION TESTS (Step 8B)
    # =========================================================================

    def test_authenticated_user_can_create_inventory_transaction_and_created_by_propagates(self):
        """Valid authenticated user (Stock Manager, ID=3) creates transaction; created_by in DB matches JWT identity."""
        manager_token = create_access_token(subject=3, role="Stock Manager")

        inward_payload = {
            "inward_no": "INW-RBAC-001",
            "item_id": 1,
            "location_id": 1,
            "supplier_id": 1,
            "quantity": 25.0,
            "unit_cost": 15.0,
            "total_cost": 375.0,
        }
        res = client.post(
            "/api/inward",
            json=inward_payload,
            headers={"Authorization": f"Bearer {manager_token}"},
        )
        self.assertEqual(res.status_code, 201, res.text)

        # Inspect database record to verify created_by equals authenticated user ID 3
        db = TestingSessionLocal()
        try:
            inw_tx = db.scalars(
                select(InwardTransaction).where(InwardTransaction.inward_no == "INW-RBAC-001")
            ).first()
            self.assertIsNotNone(inw_tx)
            self.assertEqual(inw_tx.created_by, 3)

            # Verify associated stock movement also has created_by == 3
            movement = db.scalars(
                select(StockMovement).where(
                    StockMovement.reference_id == inw_tx.inward_id,
                    StockMovement.movement_type == "INWARD",
                )
            ).first()
            self.assertIsNotNone(movement)
            self.assertEqual(movement.created_by, 3)
        finally:
            db.close()

    def test_client_cannot_choose_another_created_by_impersonation_prevented(self):
        """If client provides a created_by field in the payload, it must NOT override authenticated user identity."""
        manager_token = create_access_token(subject=3, role="Stock Manager")

        inward_payload = {
            "inward_no": "INW-RBAC-002",
            "item_id": 1,
            "location_id": 1,
            "supplier_id": 1,
            "quantity": 10.0,
            "unit_cost": 15.0,
            "total_cost": 150.0,
            "created_by": 9999,  # Impersonation attempt!
        }
        res = client.post(
            "/api/inward",
            json=inward_payload,
            headers={"Authorization": f"Bearer {manager_token}"},
        )
        self.assertEqual(res.status_code, 201, res.text)

        # Verify DB recorded user_id 3, NOT 9999
        db = TestingSessionLocal()
        try:
            inw_tx = db.scalars(
                select(InwardTransaction).where(InwardTransaction.inward_no == "INW-RBAC-002")
            ).first()
            self.assertIsNotNone(inw_tx)
            self.assertEqual(inw_tx.created_by, 3)
            self.assertNotEqual(inw_tx.created_by, 9999)
        finally:
            db.close()

    def test_inventory_transaction_missing_jwt_returns_401(self):
        """Creating an inventory transaction without JWT returns 401 Unauthorized."""
        res = client.post(
            "/api/inward",
            json={
                "item_id": 1,
                "location_id": 1,
                "supplier_id": 1,
                "quantity": 10.0,
                "unit_cost": 15.0,
            },
        )
        self.assertEqual(res.status_code, 401)
        data = res.json()
        self.assertEqual(data["error"]["code"], "UNAUTHORIZED")

    def test_inventory_transaction_invalid_jwt_returns_401(self):
        """Creating an inventory transaction with malformed or invalid JWT returns 401 Unauthorized."""
        res = client.post(
            "/api/inward",
            json={
                "item_id": 1,
                "location_id": 1,
                "supplier_id": 1,
                "quantity": 10.0,
                "unit_cost": 15.0,
            },
            headers={"Authorization": "Bearer invalid.jwt.signature"},
        )
        self.assertEqual(res.status_code, 401)
        data = res.json()
        self.assertEqual(data["error"]["code"], "UNAUTHORIZED")

    def test_inventory_transaction_unauthorized_role_returns_403(self):
        """Authenticated user with role 'staff' (ID=4) is forbidden from recording inventory transactions."""
        staff_token = create_access_token(subject=4, role="staff")

        res = client.post(
            "/api/inward",
            json={
                "item_id": 1,
                "location_id": 1,
                "supplier_id": 1,
                "quantity": 10.0,
                "unit_cost": 15.0,
            },
            headers={"Authorization": f"Bearer {staff_token}"},
        )
        self.assertEqual(res.status_code, 403)
        data = res.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "FORBIDDEN")
        self.assertIn("insufficient privileges", data["error"]["message"].lower())

    def test_inventory_transaction_authorized_roles_succeed(self):
        """Both Admin (ID=1) and Stock Manager (ID=3) roles can record transactions."""
        admin_token = create_access_token(subject=1, role="admin")
        manager_token = create_access_token(subject=3, role="Stock Manager")

        # Admin creates inward
        res_admin = client.post(
            "/api/inward",
            json={
                "inward_no": "INW-ADMIN-001",
                "item_id": 1,
                "location_id": 1,
                "supplier_id": 1,
                "quantity": 5.0,
                "unit_cost": 15.0,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(res_admin.status_code, 201)

        # Stock Manager creates inward
        res_mgr = client.post(
            "/api/inward",
            json={
                "inward_no": "INW-MGR-001",
                "item_id": 1,
                "location_id": 1,
                "supplier_id": 1,
                "quantity": 5.0,
                "unit_cost": 15.0,
            },
            headers={"Authorization": f"Bearer {manager_token}"},
        )
        self.assertEqual(res_mgr.status_code, 201)

    # =========================================================================
    # 4. USER MANAGEMENT & MASTER DATA RBAC TESTS (FINAL RBAC MATRIX)
    # =========================================================================

    def test_user_management_restricted_to_admin(self):
        """User management endpoints: View allowed for Admin & Stock Manager, Mutation Admin-only."""
        admin_token = create_access_token(subject=1, role="admin")
        manager_token = create_access_token(subject=3, role="Stock Manager")
        staff_token = create_access_token(subject=4, role="staff")

        # Admin access -> 200 OK
        res_admin = client.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})
        self.assertEqual(res_admin.status_code, 200)

        # Stock Manager access -> 200 OK (View allowed per Final RBAC Matrix)
        res_mgr = client.get("/api/users", headers={"Authorization": f"Bearer {manager_token}"})
        self.assertEqual(res_mgr.status_code, 200)

        # Staff access -> 403 Forbidden
        res_staff = client.get("/api/users", headers={"Authorization": f"Bearer {staff_token}"})
        self.assertEqual(res_staff.status_code, 403)
        self.assertEqual(res_staff.json()["error"]["code"], "FORBIDDEN")

        # Unauthenticated access -> 401 Unauthorized
        res_anon = client.get("/api/users")
        self.assertEqual(res_anon.status_code, 401)

    def test_stock_manager_can_view_all_master_data(self):
        """Stock Manager can View Users, Items, Categories, Suppliers, and Locations (200 OK)."""
        manager_token = create_access_token(subject=3, role="Stock Manager")
        headers = {"Authorization": f"Bearer {manager_token}"}

        endpoints = [
            "/api/users",
            "/api/users/1",
            "/api/categories",
            "/api/categories/1",
            "/api/suppliers",
            "/api/suppliers/1",
            "/api/locations",
            "/api/locations/1",
            "/api/items",
            "/api/items/1",
        ]
        for ep in endpoints:
            res = client.get(ep, headers=headers)
            self.assertEqual(res.status_code, 200, f"Expected 200 for Stock Manager on {ep}, got {res.status_code}: {res.text}")

    def test_stock_manager_forbidden_from_mutating_master_data(self):
        """Stock Manager receives 403 Forbidden for all Master Data Create and Update operations."""
        manager_token = create_access_token(subject=3, role="Stock Manager")
        headers = {"Authorization": f"Bearer {manager_token}"}

        mutations = [
            ("POST", "/api/users", {"username": "newuser", "email": "new@calibo.com", "password": "Password123!", "role_id": 1}),
            ("PATCH", "/api/users/1", {"is_active": True}),
            ("POST", "/api/categories", {"category_name": "New Category"}),
            ("PATCH", "/api/categories/1", {"category_name": "Updated Category"}),
            ("POST", "/api/suppliers", {"supplier_name": "New Supplier"}),
            ("PATCH", "/api/suppliers/1", {"supplier_name": "Updated Supplier"}),
            ("POST", "/api/locations", {"location_name": "New Location"}),
            ("PATCH", "/api/locations/1", {"location_name": "Updated Location"}),
            ("POST", "/api/items", {"item_code": "NEW-001", "item_name": "New Item", "category_id": 1, "unit": "pcs", "minimum_level": 5, "default_unit_cost": 10.0}),
            ("PATCH", "/api/items/1", {"item_name": "Updated Item Name"}),
        ]

        for method, ep, payload in mutations:
            if method == "POST":
                res = client.post(ep, json=payload, headers=headers)
            else:
                res = client.patch(ep, json=payload, headers=headers)

            self.assertEqual(res.status_code, 403, f"Expected 403 for Stock Manager {method} {ep}, got {res.status_code}")
            err = res.json()
            self.assertFalse(err["success"])
            self.assertEqual(err["error"]["code"], "FORBIDDEN")

    def test_adjustment_rbac_admin_vs_stock_manager(self):
        """Adjustment RBAC: Admin can Create, View, Update; Stock Manager can View only (403 on Create/Update)."""
        manager_token = create_access_token(subject=3, role="Stock Manager")
        admin_token = create_access_token(subject=1, role="admin")

        # 1. Stock Manager attempting POST /api/adjustments -> 403 Forbidden
        res_post_mgr = client.post(
            "/api/adjustments",
            json={
                "item_id": 1,
                "location_id": 1,
                "adjusted_quantity": 5,
                "reason": "Unauthorized Manager Adjustment",
            },
            headers={"Authorization": f"Bearer {manager_token}"},
        )
        self.assertEqual(res_post_mgr.status_code, 403)
        self.assertEqual(res_post_mgr.json()["error"]["code"], "FORBIDDEN")

        # 2. Stock Manager attempting PATCH /api/adjustments/1 -> 403 Forbidden
        res_patch_mgr = client.patch(
            "/api/adjustments/1",
            json={"reason": "Unauthorized update"},
            headers={"Authorization": f"Bearer {manager_token}"},
        )
        self.assertEqual(res_patch_mgr.status_code, 403)
        self.assertEqual(res_patch_mgr.json()["error"]["code"], "FORBIDDEN")

        # 3. Admin creates an adjustment -> 201 Created
        res_post_admin = client.post(
            "/api/adjustments",
            json={
                "item_id": 1,
                "location_id": 1,
                "adjusted_quantity": 10,
                "reason": "Authorized Admin Audit Adjustment",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(res_post_admin.status_code, 201)
        adj_id = res_post_admin.json()["id"]

        # 4. Admin updates adjustment -> 200 OK
        res_patch_admin = client.patch(
            f"/api/adjustments/{adj_id}",
            json={"reason": "Audit reconcilied by Admin"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(res_patch_admin.status_code, 200)
        self.assertEqual(res_patch_admin.json()["reason"], "Audit reconcilied by Admin")

        # 5. Stock Manager views adjustments list -> 200 OK
        res_list_mgr = client.get("/api/adjustments", headers={"Authorization": f"Bearer {manager_token}"})
        self.assertEqual(res_list_mgr.status_code, 200)
        adjustments = res_list_mgr.json()
        self.assertGreaterEqual(len(adjustments), 1)

        # 6. Stock Manager views single adjustment by ID -> 200 OK
        res_get_mgr = client.get(f"/api/adjustments/{adj_id}", headers={"Authorization": f"Bearer {manager_token}"})
        self.assertEqual(res_get_mgr.status_code, 200)
        self.assertEqual(res_get_mgr.json()["reason"], "Audit reconcilied by Admin")

    def test_queries_movements_dashboard_reports_rbac(self):
        """Stock, Movements, Dashboard, and Reports: Accessible to Admin and Stock Manager; Forbidden for Staff."""
        admin_token = create_access_token(subject=1, role="admin")
        manager_token = create_access_token(subject=3, role="Stock Manager")
        staff_token = create_access_token(subject=4, role="staff")

        test_endpoints = [
            "/api/stock",
            "/api/stock/1",
            "/api/stock/movements",
            "/api/dashboard/summary",
            "/api/reports/stock",
        ]

        for ep in test_endpoints:
            # Admin -> 200 OK
            res_admin = client.get(ep, headers={"Authorization": f"Bearer {admin_token}"})
            self.assertEqual(res_admin.status_code, 200, f"Expected 200 for Admin on {ep}")

            # Stock Manager -> 200 OK
            res_mgr = client.get(ep, headers={"Authorization": f"Bearer {manager_token}"})
            self.assertEqual(res_mgr.status_code, 200, f"Expected 200 for Stock Manager on {ep}")

            # Staff -> 403 Forbidden
            res_staff = client.get(ep, headers={"Authorization": f"Bearer {staff_token}"})
            self.assertEqual(res_staff.status_code, 403, f"Expected 403 for Staff on {ep}")

    # =========================================================================
    # 5. BUSINESS APIS PROTECTION & PUBLIC ROUTE TESTS
    # =========================================================================

    def test_business_apis_require_authentication(self):
        """Unauthenticated requests to business APIs return 401."""
        endpoints = [
            "/api/categories",
            "/api/suppliers",
            "/api/locations",
            "/api/items",
            "/api/stock",
            "/api/dashboard/summary",
            "/api/reports/stock",
        ]
        for ep in endpoints:
            res = client.get(ep)
            self.assertEqual(res.status_code, 401, f"Expected 401 for {ep}, got {res.status_code}")

    def test_public_endpoints_remain_accessible_without_jwt(self):
        """Health check, login, and OpenAPI documentation remain accessible without JWT."""
        # Health
        res_health = client.get("/api/health")
        self.assertEqual(res_health.status_code, 200)

        # Login
        res_login = client.post(
            "/api/auth/login",
            json={"username": "valid_user", "password": "ValidPassword123!"},
        )
        self.assertEqual(res_login.status_code, 200)

        # Docs & OpenAPI schema
        res_docs = client.get("/docs")
        self.assertEqual(res_docs.status_code, 200)

        res_schema = client.get("/openapi.json")
        self.assertEqual(res_schema.status_code, 200)


if __name__ == "__main__":
    unittest.main()
