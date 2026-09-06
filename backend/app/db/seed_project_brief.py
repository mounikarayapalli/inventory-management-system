"""Seed script for Calibo Inventory Management satisfying Project Brief & Development Guidelines.

Requirements:
- 4 Admin users (Full access)
- 6 Stock Manager users (Inventory operations)
- Calibo AI Academy Stationery and Equipment catalog
"""

from decimal import Decimal
from app.db.session import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.models.category import Category
from app.models.location import Location
from app.models.supplier import Supplier
from app.models.item import Item
from app.models.stock_movement import MovementType, StockMovement
from app.models.opening_stock import OpeningStock
from app.services.user_service import user_service
from datetime import date, datetime

def seed_project_brief_data():
    db = SessionLocal()
    try:
        print("--- Ensuring Roles Exist ---")
        admin_role = db.query(Role).filter(Role.role_name == "admin").first()
        if not admin_role:
            admin_role = Role(role_name="admin")
            db.add(admin_role)
            db.flush()

        manager_role = db.query(Role).filter(Role.role_name == "stock manager").first()
        if not manager_role:
            manager_role = Role(role_name="stock manager")
            db.add(manager_role)
            db.flush()

        db.commit()
        db.refresh(admin_role)
        db.refresh(manager_role)

        print("--- Seeding 4 Admin Users & 6 Stock Manager Users ---")
        admin_users_data = [
            ("admin", "admin@calibo.com", "admin123"),
            ("admin1", "admin1@calibo.com", "admin123"),
            ("admin2", "admin2@calibo.com", "admin123"),
            ("admin3", "admin3@calibo.com", "admin123"),
        ]

        manager_users_data = [
            ("manager", "manager@calibo.com", "manager123"),
            ("manager1", "manager1@calibo.com", "manager123"),
            ("manager2", "manager2@calibo.com", "manager123"),
            ("manager3", "manager3@calibo.com", "manager123"),
            ("manager4", "manager4@calibo.com", "manager123"),
            ("manager5", "manager5@calibo.com", "manager123"),
        ]

        for uname, email, pwd in admin_users_data:
            existing = db.query(User).filter((User.username == uname) | (User.email == email)).first()
            if not existing:
                u = User(
                    username=uname,
                    email=email,
                    password_hash=user_service.hash_password(pwd),
                    role_id=admin_role.role_id,
                    is_active=True,
                )
                db.add(u)
                print(f"  Created Admin: {uname} ({email})")
            else:
                existing.role_id = admin_role.role_id
                existing.is_active = True
                print(f"  Admin already exists: {uname}")

        for uname, email, pwd in manager_users_data:
            existing = db.query(User).filter((User.username == uname) | (User.email == email)).first()
            if not existing:
                u = User(
                    username=uname,
                    email=email,
                    password_hash=user_service.hash_password(pwd),
                    role_id=manager_role.role_id,
                    is_active=True,
                )
                db.add(u)
                print(f"  Created Stock Manager: {uname} ({email})")
            else:
                existing.role_id = manager_role.role_id
                existing.is_active = True
                print(f"  Stock Manager already exists: {uname}")

        db.commit()

        print("--- Ensuring Stationery Category & Items ---")
        office_cat = db.query(Category).filter(Category.category_name == "Office Supplies").first()
        if not office_cat:
            office_cat = Category(category_name="Office Supplies", is_active=True)
            db.add(office_cat)
            db.commit()
            db.refresh(office_cat)

        primary_loc = db.query(Location).first()
        admin_user = db.query(User).filter(User.username == "admin").first()

        stationery_items = [
            ("STAT-A4-500", "A4 Copier Paper 75GSM (500 Sheets/Ream)", "reams", 10, Decimal("260.00")),
            ("STAT-WB-10", "Whiteboard Dry-Erase Markers (Box of 10)", "boxes", 5, Decimal("150.00")),
            ("STAT-NB-200", "Calibo Academy Student Notebooks (200 Pgs)", "pcs", 20, Decimal("75.00")),
            ("STAT-PEN-20", "Executive Gel Pens Blue & Black (Pack of 20)", "packs", 10, Decimal("140.00")),
            ("STAT-STP-01", "Desktop Heavy-Duty Stapler & Pins Set", "sets", 5, Decimal("180.00")),
        ]

        for code, name, unit, min_lvl, cost in stationery_items:
            existing = db.query(Item).filter(Item.item_code == code).first()
            if not existing:
                it = Item(
                    item_code=code,
                    item_name=name,
                    category_id=office_cat.category_id,
                    unit=unit,
                    minimum_level=min_lvl,
                    default_unit_cost=cost,
                    is_active=True,
                )
                db.add(it)
                db.commit()
                db.refresh(it)
                print(f"  Created Stationery Item: {code} - {name}")

                # If primary location and admin user exist, seed opening stock
                if primary_loc and admin_user:
                    op = OpeningStock(
                        item_id=it.item_id,
                        location_id=primary_loc.location_id,
                        quantity=Decimal("50.00"),
                        unit_cost=cost,
                        opening_date=date.today(),
                        created_by=admin_user.user_id,
                    )
                    db.add(op)
                    db.flush()

                    mv = StockMovement(
                        item_id=it.item_id,
                        location_id=primary_loc.location_id,
                        movement_type=MovementType.OPENING.value,
                        quantity=Decimal("50.00"),
                        reference_id=op.opening_stock_id,
                        movement_date=datetime.now(),
                        created_by=admin_user.user_id,
                        remarks=f"Initial seed opening stock for {name}",
                    )
                    db.add(mv)
                    db.commit()
                    print(f"    Initialized opening stock: 50.00 {unit} @ Rs {cost}")
            else:
                print(f"  Item already exists: {code}")

        print("--- Seed Complete! Current User Count: ---")
        total_admins = db.query(User).filter(User.role_id == admin_role.role_id).count()
        total_managers = db.query(User).filter(User.role_id == manager_role.role_id).count()
        print(f"Total Admins: {total_admins} (Expected: 4)")
        print(f"Total Stock Managers: {total_managers} (Expected: 6)")
        print(f"Total Items: {db.query(Item).count()}")

    finally:
        db.close()

if __name__ == "__main__":
    seed_project_brief_data()
