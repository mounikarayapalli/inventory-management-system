"""Service layer for catalog item master data management."""

from decimal import Decimal
from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ConflictException, NotFoundException
from app.models.category import Category
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemResponse, ItemUpdate
from app.services.inventory_logic import quantize_currency, to_decimal


class ItemService:
    """Service managing inventory items and product catalog."""

    @staticmethod
    def _to_response(item: Item) -> ItemResponse:
        return ItemResponse(
            id=item.item_id,
            item_id=item.item_id,
            item_code=item.item_code,
            sku=item.item_code,
            item_name=item.item_name,
            name=item.item_name,
            category_id=item.category_id,
            category_name=item.category.category_name if item.category else None,
            unit=item.unit,
            minimum_level=item.minimum_level,
            min_stock_level=item.minimum_level,
            default_unit_cost=quantize_currency(to_decimal(item.default_unit_cost)) if item.default_unit_cost is not None else None,
            description=None,
            is_active=item.is_active,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )

    def list_items(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        is_active: Optional[bool] = None,
    ) -> List[ItemResponse]:
        """Retrieve paginated list of catalog items with optional category and active filters."""
        stmt = (
            select(Item)
            .join(Category, Item.category_id == Category.category_id, isouter=True)
            .order_by(Item.item_id.asc())
        )
        if category_id is not None:
            stmt = stmt.where(Item.category_id == category_id)
        if is_active is not None:
            stmt = stmt.where(Item.is_active == is_active)

        stmt = stmt.offset(skip).limit(limit)
        items = db.scalars(stmt).all()
        return [self._to_response(i) for i in items]

    def get_item_by_id(self, db: Session, item_id: int) -> ItemResponse:
        """Retrieve a single catalog item by primary key ID."""
        item = db.get(Item, item_id)
        if not item:
            raise NotFoundException(f"Item with ID {item_id} not found.")
        return self._to_response(item)

    def create_item(self, db: Session, payload: ItemCreate) -> ItemResponse:
        """Create a new catalog item with validation for code, name, category, unit, and non-negative values."""
        # 1. Validate item_code
        raw_code = payload.item_code or payload.sku
        if not raw_code or not raw_code.strip():
            raise BadRequestException("item_code is required.")
        item_code = raw_code.strip()

        # 2. Validate item_name
        raw_name = payload.item_name or payload.name
        if not raw_name or not raw_name.strip():
            raise BadRequestException("item_name is required.")
        item_name = raw_name.strip()

        # 3. Validate category exists
        category = db.get(Category, payload.category_id)
        if not category:
            raise NotFoundException(f"Category with ID {payload.category_id} not found.")

        # 4. Validate unit
        if not payload.unit or not payload.unit.strip():
            raise BadRequestException("unit is required.")
        unit = payload.unit.strip()

        # 5. Validate minimum_level >= 0
        min_level = (
            payload.minimum_level
            if payload.minimum_level is not None
            else (payload.min_stock_level if payload.min_stock_level is not None else 0)
        )
        if min_level < 0:
            raise BadRequestException("minimum_level cannot be negative.")

        # 6. Validate default_unit_cost >= 0
        cost = None
        if payload.default_unit_cost is not None:
            c = to_decimal(payload.default_unit_cost)
            if c < Decimal("0.00"):
                raise BadRequestException("default_unit_cost cannot be negative.")
            cost = quantize_currency(c)

        # 7. Check duplicate item_code (case-insensitive)
        existing = db.scalars(
            select(Item).where(func.lower(Item.item_code) == item_code.lower())
        ).first()
        if existing:
            raise ConflictException(f"Item with code '{item_code}' already exists.")

        item = Item(
            item_code=item_code,
            item_name=item_name,
            category_id=category.category_id,
            unit=unit,
            minimum_level=min_level,
            default_unit_cost=cost,
            is_active=payload.is_active if payload.is_active is not None else True,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return self._to_response(item)

    def update_item(self, db: Session, item_id: int, payload: ItemUpdate) -> ItemResponse:
        """Update an existing catalog item record."""
        item = db.get(Item, item_id)
        if not item:
            raise NotFoundException(f"Item with ID {item_id} not found.")

        # Update item_code if provided
        raw_code = payload.item_code or payload.sku
        if raw_code is not None:
            new_code = raw_code.strip()
            if not new_code:
                raise BadRequestException("item_code cannot be empty.")
            if new_code.lower() != item.item_code.lower():
                existing = db.scalars(
                    select(Item).where(
                        func.lower(Item.item_code) == new_code.lower(),
                        Item.item_id != item_id,
                    )
                ).first()
                if existing:
                    raise ConflictException(f"Item with code '{new_code}' already exists.")
            item.item_code = new_code

        # Update item_name if provided
        raw_name = payload.item_name or payload.name
        if raw_name is not None:
            new_name = raw_name.strip()
            if not new_name:
                raise BadRequestException("item_name cannot be empty.")
            item.item_name = new_name

        # Update category_id if provided
        if payload.category_id is not None:
            category = db.get(Category, payload.category_id)
            if not category:
                raise NotFoundException(f"Category with ID {payload.category_id} not found.")
            item.category_id = category.category_id

        # Update unit if provided
        if payload.unit is not None:
            new_unit = payload.unit.strip()
            if not new_unit:
                raise BadRequestException("unit cannot be empty.")
            item.unit = new_unit

        # Update minimum_level if provided
        min_lvl = payload.minimum_level if payload.minimum_level is not None else payload.min_stock_level
        if min_lvl is not None:
            if min_lvl < 0:
                raise BadRequestException("minimum_level cannot be negative.")
            item.minimum_level = min_lvl

        # Update default_unit_cost if provided
        if payload.default_unit_cost is not None:
            c = to_decimal(payload.default_unit_cost)
            if c < Decimal("0.00"):
                raise BadRequestException("default_unit_cost cannot be negative.")
            item.default_unit_cost = quantize_currency(c)

        if payload.is_active is not None:
            item.is_active = payload.is_active

        db.commit()
        db.refresh(item)
        return self._to_response(item)


item_service = ItemService()
