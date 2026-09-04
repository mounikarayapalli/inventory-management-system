"""API endpoints for catalog items and stock keeping unit (SKU) management."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.item import ItemCreate, ItemResponse, ItemUpdate
from app.services.item_service import item_service

router = APIRouter()


@router.get(
    "",
    response_model=List[ItemResponse],
    status_code=status.HTTP_200_OK,
    summary="List items",
    description="Retrieve paginated list of catalog items with optional filters (Admin & Stock Manager).",
)
def list_items(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=500, description="Pagination limit"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> List[ItemResponse]:
    """Retrieve catalog items."""
    return item_service.list_items(db, skip=skip, limit=limit, category_id=category_id, is_active=is_active)


@router.get(
    "/{item_id}",
    response_model=ItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Get item by ID",
    description="Retrieve details for a single item by its ID (Admin & Stock Manager).",
)
def get_item(
    item_id: int = Path(..., ge=1, description="Target item identifier"),
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> ItemResponse:
    """Retrieve item details by ID."""
    return item_service.get_item_by_id(db, item_id=item_id)


@router.post(
    "",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create item",
    description="Register a new inventory item in the catalog (Admin only).",
)
def create_item(
    payload: ItemCreate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> ItemResponse:
    """Create a new item in the catalog."""
    return item_service.create_item(db, payload=payload)


@router.patch(
    "/{item_id}",
    response_model=ItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Update item",
    description="Partially update an existing item's details (Admin only).",
)
def update_item(
    item_id: int = Path(..., ge=1, description="Target item identifier"),
    payload: ItemUpdate = ...,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> ItemResponse:
    """Update item details."""
    return item_service.update_item(db, item_id=item_id, payload=payload)
