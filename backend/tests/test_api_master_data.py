"""API integration tests for Master Data endpoints (Categories, Suppliers, Locations, Items, Users).

Uses an isolated in-memory SQLite database via FastAPI dependency override.
Tests all CRUD operations, negative validations, unique constraints, and response schemas.
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
from app.models import Role

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


class TestMasterDataAPI(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[get_db] = override_get_db
        from app.core.security import create_access_token
        token = create_access_token(subject=1, role="admin")
        client.headers["Authorization"] = f"Bearer {token}"

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(test_engine)
        db = TestingSessionLocal()
        try:
            # Seed standard roles
            role_admin = Role(role_id=1, role_name="admin")
            role_staff = Role(role_id=2, role_name="staff")
            db.add_all([role_admin, role_staff])
            # Seed admin user for authenticated master data requests
            from app.models.user import User
            from app.services.user_service import UserService
            admin_user = User(
                user_id=1,
                username="admin_master",
                email="admin_master@calibo.com",
                password_hash=UserService.hash_password("admin_pass123"),
                role_id=1,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
        finally:
            db.close()

    # =========================================================================
    # A. CATEGORIES CRUD & VALIDATIONS
    # =========================================================================
    def test_01_categories_crud_and_validations(self):
        # 1. Create Category
        res = client.post(
            "/api/categories",
            json={"category_name": "Hardware", "description": "Physical devices"},
        )
        self.assertEqual(res.status_code, 201)
        cat_data = res.json()
        cat_id = cat_data["id"]
        self.assertEqual(cat_data["category_name"], "Hardware")
        self.assertEqual(cat_data["name"], "Hardware")
        self.assertTrue(cat_data["is_active"])

        # 2. Duplicate Category (Case-insensitive) -> 409
        res_dup = client.post(
            "/api/categories",
            json={"category_name": "hardware"},
        )
        self.assertEqual(res_dup.status_code, 409)

        # 3. Get Category by ID
        res_get = client.get(f"/api/categories/{cat_id}")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["id"], cat_id)

        # 4. Get Nonexistent Category -> 404
        res_404 = client.get("/api/categories/9999")
        self.assertEqual(res_404.status_code, 404)

        # 5. Update Category
        res_patch = client.patch(
            f"/api/categories/{cat_id}",
            json={"category_name": "IT Hardware", "is_active": False},
        )
        self.assertEqual(res_patch.status_code, 200)
        self.assertEqual(res_patch.json()["category_name"], "IT Hardware")
        self.assertFalse(res_patch.json()["is_active"])

        # 6. List Categories
        res_list = client.get("/api/categories")
        self.assertEqual(res_list.status_code, 200)
        self.assertGreaterEqual(len(res_list.json()), 1)

    # =========================================================================
    # B. SUPPLIERS CRUD & VALIDATIONS
    # =========================================================================
    def test_02_suppliers_crud_and_validations(self):
        # 1. Create Supplier
        res = client.post(
            "/api/suppliers",
            json={
                "supplier_name": "Acme Electronics",
                "contact_person": "Jane Smith",
                "email": "jane@acme.com",
                "phone": "+1-800-555-0199",
                "address": "456 Silicon Ave",
            },
        )
        self.assertEqual(res.status_code, 201)
        sup_data = res.json()
        sup_id = sup_data["id"]
        self.assertEqual(sup_data["supplier_name"], "Acme Electronics")
        self.assertTrue(sup_data["is_active"])

        # 2. Duplicate Supplier -> 409
        res_dup = client.post(
            "/api/suppliers",
            json={"supplier_name": "acme electronics"},
        )
        self.assertEqual(res_dup.status_code, 409)

        # 3. Get Supplier by ID
        res_get = client.get(f"/api/suppliers/{sup_id}")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["id"], sup_id)

        # 4. Nonexistent Supplier -> 404
        res_404 = client.get("/api/suppliers/9999")
        self.assertEqual(res_404.status_code, 404)

        # 5. Update Supplier
        res_patch = client.patch(
            f"/api/suppliers/{sup_id}",
            json={"contact_person": "Bob Jones", "phone": "+1-800-999-9999"},
        )
        self.assertEqual(res_patch.status_code, 200)
        self.assertEqual(res_patch.json()["contact_person"], "Bob Jones")

        # 6. List Suppliers
        res_list = client.get("/api/suppliers")
        self.assertEqual(res_list.status_code, 200)
        self.assertGreaterEqual(len(res_list.json()), 1)

    # =========================================================================
    # C. LOCATIONS CRUD & VALIDATIONS
    # =========================================================================
    def test_03_locations_crud_and_validations(self):
        # 1. Create Location
        res = client.post(
            "/api/locations",
            json={"location_name": "North Warehouse", "description": "Cold storage and parts"},
        )
        self.assertEqual(res.status_code, 201)
        loc_data = res.json()
        loc_id = loc_data["id"]
        self.assertEqual(loc_data["location_name"], "North Warehouse")
        self.assertTrue(loc_data["is_active"])

        # 2. Duplicate Location -> 409
        res_dup = client.post(
            "/api/locations",
            json={"location_name": "north warehouse"},
        )
        self.assertEqual(res_dup.status_code, 409)

        # 3. Get Location by ID
        res_get = client.get(f"/api/locations/{loc_id}")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["id"], loc_id)

        # 4. Nonexistent Location -> 404
        res_404 = client.get("/api/locations/9999")
        self.assertEqual(res_404.status_code, 404)

        # 5. Update Location
        res_patch = client.patch(
            f"/api/locations/{loc_id}",
            json={"location_name": "North Logistics Hub", "is_active": True},
        )
        self.assertEqual(res_patch.status_code, 200)
        self.assertEqual(res_patch.json()["location_name"], "North Logistics Hub")

        # 6. List Locations
        res_list = client.get("/api/locations")
        self.assertEqual(res_list.status_code, 200)
        self.assertGreaterEqual(len(res_list.json()), 1)

    # =========================================================================
    # D. ITEMS CRUD & VALIDATIONS
    # =========================================================================
    def test_04_items_crud_and_validations(self):
        # Create a category for the item
        c_res = client.post("/api/categories", json={"category_name": "Components"})
        cat_id = c_res.json()["id"]

        # 1. Create Item successfully
        res = client.post(
            "/api/items",
            json={
                "item_code": "CMP-CPU-001",
                "item_name": "Central Processing Unit",
                "category_id": cat_id,
                "unit": "pcs",
                "minimum_level": 15,
                "default_unit_cost": 250.00,
            },
        )
        self.assertEqual(res.status_code, 201)
        item_data = res.json()
        item_id = item_data["id"]
        self.assertEqual(item_data["item_code"], "CMP-CPU-001")
        self.assertEqual(item_data["item_name"], "Central Processing Unit")
        self.assertEqual(Decimal(item_data["default_unit_cost"]), Decimal("250.00"))
        self.assertEqual(item_data["minimum_level"], 15)

        # 2. Duplicate item_code -> 409
        res_dup = client.post(
            "/api/items",
            json={
                "item_code": "cmp-cpu-001",
                "item_name": "Duplicate CPU",
                "category_id": cat_id,
                "unit": "pcs",
            },
        )
        self.assertEqual(res_dup.status_code, 409)

        # 3. Invalid Category ID -> 404
        res_bad_cat = client.post(
            "/api/items",
            json={
                "item_code": "CMP-RAM-001",
                "item_name": "RAM Module",
                "category_id": 9999,
                "unit": "pcs",
            },
        )
        self.assertEqual(res_bad_cat.status_code, 404)

        # 4. Negative minimum_level -> 422 or 400
        res_neg_min = client.post(
            "/api/items",
            json={
                "item_code": "CMP-GPU-001",
                "item_name": "GPU Card",
                "category_id": cat_id,
                "unit": "pcs",
                "minimum_level": -5,
            },
        )
        self.assertIn(res_neg_min.status_code, [400, 422])

        # 5. Negative default_unit_cost -> 422 or 400
        res_neg_cost = client.post(
            "/api/items",
            json={
                "item_code": "CMP-SSD-001",
                "item_name": "SSD Drive",
                "category_id": cat_id,
                "unit": "pcs",
                "default_unit_cost": -10.00,
            },
        )
        self.assertIn(res_neg_cost.status_code, [400, 422])

        # 6. Missing item_code / name / unit -> 422 or 400
        res_missing = client.post(
            "/api/items",
            json={"category_id": cat_id},
        )
        self.assertIn(res_missing.status_code, [400, 422])

        # 7. Get Item by ID
        res_get = client.get(f"/api/items/{item_id}")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["id"], item_id)

        # 8. Nonexistent Item -> 404
        res_404 = client.get("/api/items/9999")
        self.assertEqual(res_404.status_code, 404)

        # 9. Update Item
        res_patch = client.patch(
            f"/api/items/{item_id}",
            json={"minimum_level": 25, "default_unit_cost": 275.50},
        )
        self.assertEqual(res_patch.status_code, 200)
        self.assertEqual(res_patch.json()["minimum_level"], 25)
        self.assertEqual(Decimal(res_patch.json()["default_unit_cost"]), Decimal("275.50"))

        # 10. List Items
        res_list = client.get("/api/items")
        self.assertEqual(res_list.status_code, 200)
        self.assertGreaterEqual(len(res_list.json()), 1)

    # =========================================================================
    # E. USERS CRUD & VALIDATIONS
    # =========================================================================
    def test_05_users_crud_and_validations(self):
        # 1. Create User successfully
        res = client.post(
            "/api/users",
            json={
                "username": "tech_operator",
                "email": "operator@calibo.com",
                "password": "securepassword123",
                "role_id": 2,
            },
        )
        self.assertEqual(res.status_code, 201)
        u_data = res.json()
        u_id = u_data["id"]
        self.assertEqual(u_data["username"], "tech_operator")
        self.assertEqual(u_data["email"], "operator@calibo.com")
        self.assertEqual(u_data["role_id"], 2)
        self.assertTrue(u_data["is_active"])

        # CRITICAL: Verify password_hash is NOT exposed in response
        self.assertNotIn("password_hash", u_data)
        self.assertNotIn("password", u_data)

        # Verify Argon2id hashing in database
        db = TestingSessionLocal()
        try:
            from app.models.user import User
            from app.services.user_service import user_service
            db_user = db.get(User, u_id)
            self.assertIsNotNone(db_user)
            # Must start with $argon2id$
            self.assertTrue(db_user.password_hash.startswith("$argon2id$"))
            # Must never be plaintext
            self.assertNotEqual(db_user.password_hash, "securepassword123")
            # Password verification succeeds for valid password
            self.assertTrue(user_service.verify_password("securepassword123", db_user.password_hash))
            # Password verification fails for invalid password
            self.assertFalse(user_service.verify_password("wrong_password", db_user.password_hash))
        finally:
            db.close()

        # 2. Duplicate Username -> 409
        res_dup_u = client.post(
            "/api/users",
            json={
                "username": "TECH_OPERATOR",
                "email": "another@calibo.com",
                "password": "password123",
                "role_id": 2,
            },
        )
        self.assertEqual(res_dup_u.status_code, 409)

        # 3. Duplicate Email -> 409
        res_dup_e = client.post(
            "/api/users",
            json={
                "username": "distinct_user",
                "email": "operator@calibo.com",
                "password": "password123",
                "role_id": 2,
            },
        )
        self.assertEqual(res_dup_e.status_code, 409)

        # 4. Invalid Role ID -> 404
        res_bad_role = client.post(
            "/api/users",
            json={
                "username": "ghost_user",
                "email": "ghost@calibo.com",
                "password": "password123",
                "role_id": 9999,
            },
        )
        self.assertEqual(res_bad_role.status_code, 404)

        # 5. Short Password -> 422 or 400
        res_short_pw = client.post(
            "/api/users",
            json={
                "username": "short_pw_user",
                "email": "short@calibo.com",
                "password": "123",
                "role_id": 2,
            },
        )
        self.assertIn(res_short_pw.status_code, [400, 422])

        # 6. Get User by ID (Verify no password_hash exposed)
        res_get = client.get(f"/api/users/{u_id}")
        self.assertEqual(res_get.status_code, 200)
        get_data = res_get.json()
        self.assertEqual(get_data["id"], u_id)
        self.assertNotIn("password_hash", get_data)
        self.assertNotIn("password", get_data)

        # 7. Nonexistent User -> 404
        res_404 = client.get("/api/users/9999")
        self.assertEqual(res_404.status_code, 404)

        # 8. Update User (Update email, role, and password)
        res_patch = client.patch(
            f"/api/users/{u_id}",
            json={
                "email": "operator_updated@calibo.com",
                "role_id": 1,
                "password": "new_secret_password_456",
            },
        )
        self.assertEqual(res_patch.status_code, 200)
        patch_data = res_patch.json()
        self.assertEqual(patch_data["email"], "operator_updated@calibo.com")
        self.assertEqual(patch_data["role_id"], 1)
        self.assertNotIn("password_hash", patch_data)
        self.assertNotIn("password", patch_data)

        # Verify updated Argon2id password hash in DB
        db = TestingSessionLocal()
        try:
            db_user_updated = db.get(User, u_id)
            self.assertTrue(db_user_updated.password_hash.startswith("$argon2id$"))
            self.assertNotEqual(db_user_updated.password_hash, "new_secret_password_456")
            self.assertTrue(user_service.verify_password("new_secret_password_456", db_user_updated.password_hash))
            self.assertFalse(user_service.verify_password("securepassword123", db_user_updated.password_hash))
        finally:
            db.close()

        # 9. List Users (Verify no password_hash exposed across list)
        res_list = client.get("/api/users")
        self.assertEqual(res_list.status_code, 200)
        u_list = res_list.json()
        self.assertGreaterEqual(len(u_list), 1)
        for u in u_list:
            self.assertNotIn("password_hash", u)
            self.assertNotIn("password", u)
