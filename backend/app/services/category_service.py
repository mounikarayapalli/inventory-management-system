"""Service layer for product category master data management."""

from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ConflictException, NotFoundException
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate


class CategoryService:
    """Service managing product category master data."""

    @staticmethod
    def _to_response(category: Category) -> CategoryResponse:
        return CategoryResponse(
            id=category.category_id,
            category_id=category.category_id,
            name=category.category_name,
            category_name=category.category_name,
            description=None,
            is_active=category.is_active,
        )

    def list_categories(
        self, db: Session, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None
    ) -> List[CategoryResponse]:
        """Retrieve paginated list of categories with optional active status filter."""
        stmt = select(Category).order_by(Category.category_id.asc())
        if is_active is not None:
            stmt = stmt.where(Category.is_active == is_active)
        stmt = stmt.offset(skip).limit(limit)
        categories = db.scalars(stmt).all()
        return [self._to_response(c) for c in categories]

    def get_category_by_id(self, db: Session, category_id: int) -> CategoryResponse:
        """Retrieve a single category by primary key ID."""
        category = db.get(Category, category_id)
        if not category:
            raise NotFoundException(f"Category with ID {category_id} not found.")
        return self._to_response(category)

    def create_category(self, db: Session, payload: CategoryCreate) -> CategoryResponse:
        """Create a new product category with duplicate name validation."""
        raw_name = payload.category_name or payload.name
        if not raw_name or not raw_name.strip():
            raise BadRequestException("Category name is required.")
        name = raw_name.strip()

        # Check duplicate category name (case-insensitive)
        existing = db.scalars(
            select(Category).where(func.lower(Category.category_name) == name.lower())
        ).first()
        if existing:
            raise ConflictException(f"Category with name '{name}' already exists.")

        category = Category(
            category_name=name,
            is_active=payload.is_active if payload.is_active is not None else True,
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return self._to_response(category)

    def update_category(self, db: Session, category_id: int, payload: CategoryUpdate) -> CategoryResponse:
        """Update an existing category record."""
        category = db.get(Category, category_id)
        if not category:
            raise NotFoundException(f"Category with ID {category_id} not found.")

        raw_name = payload.category_name or payload.name
        if raw_name is not None:
            name = raw_name.strip()
            if not name:
                raise BadRequestException("Category name cannot be empty.")
            if name.lower() != category.category_name.lower():
                existing = db.scalars(
                    select(Category).where(
                        func.lower(Category.category_name) == name.lower(),
                        Category.category_id != category_id,
                    )
                ).first()
                if existing:
                    raise ConflictException(f"Category with name '{name}' already exists.")
            category.category_name = name

        if payload.is_active is not None:
            category.is_active = payload.is_active

        db.commit()
        db.refresh(category)
        return self._to_response(category)


category_service = CategoryService()
