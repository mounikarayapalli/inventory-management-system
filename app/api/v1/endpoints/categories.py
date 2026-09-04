"""API endpoints for product category management."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category_service import category_service

router = APIRouter()


@router.get(
    "",
    response_model=List[CategoryResponse],
    status_code=status.HTTP_200_OK,
    summary="List categories",
    description="Retrieve all product categories with optional filtering (Admin & Stock Manager).",
)
def list_categories(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=500, description="Pagination limit"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> List[CategoryResponse]:
    """List product categories."""
    return category_service.list_categories(db, skip=skip, limit=limit, is_active=is_active)


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get category by ID",
    description="Retrieve a single category record by its ID (Admin & Stock Manager).",
)
def get_category(
    category_id: int = Path(..., ge=1, description="Category identifier"),
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> CategoryResponse:
    """Get category by ID."""
    return category_service.get_category_by_id(db, category_id=category_id)


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create category",
    description="Create a new item category (Admin only).",
)
def create_category(
    payload: CategoryCreate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> CategoryResponse:
    """Create a new product category."""
    return category_service.create_category(db, payload=payload)


@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Update category",
    description="Update an existing product category (Admin only).",
)
def update_category(
    category_id: int = Path(..., ge=1, description="Category identifier"),
    payload: CategoryUpdate = ...,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> CategoryResponse:
    """Update category details."""
    return category_service.update_category(db, category_id=category_id, payload=payload)
