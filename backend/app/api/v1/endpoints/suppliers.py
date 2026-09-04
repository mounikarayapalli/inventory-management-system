"""API endpoints for supplier relationship management."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.supplier import SupplierCreate, SupplierResponse, SupplierUpdate
from app.services.supplier_service import supplier_service

router = APIRouter()


@router.get(
    "",
    response_model=List[SupplierResponse],
    status_code=status.HTTP_200_OK,
    summary="List suppliers",
    description="Retrieve list of registered suppliers with optional filtering (Admin & Stock Manager).",
)
def list_suppliers(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=500, description="Pagination limit"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> List[SupplierResponse]:
    """List registered suppliers."""
    return supplier_service.list_suppliers(db, skip=skip, limit=limit, is_active=is_active)


@router.get(
    "/{supplier_id}",
    response_model=SupplierResponse,
    status_code=status.HTTP_200_OK,
    summary="Get supplier by ID",
    description="Retrieve supplier details by supplier ID (Admin & Stock Manager).",
)
def get_supplier(
    supplier_id: int = Path(..., ge=1, description="Supplier identifier"),
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> SupplierResponse:
    """Get supplier details by ID."""
    return supplier_service.get_supplier_by_id(db, supplier_id=supplier_id)


@router.post(
    "",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create supplier",
    description="Register a new supplier (Admin only).",
)
def create_supplier(
    payload: SupplierCreate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> SupplierResponse:
    """Create a new supplier."""
    return supplier_service.create_supplier(db, payload=payload)


@router.patch(
    "/{supplier_id}",
    response_model=SupplierResponse,
    status_code=status.HTTP_200_OK,
    summary="Update supplier",
    description="Update an existing supplier's details (Admin only).",
)
def update_supplier(
    supplier_id: int = Path(..., ge=1, description="Supplier identifier"),
    payload: SupplierUpdate = ...,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> SupplierResponse:
    """Update supplier information."""
    return supplier_service.update_supplier(db, supplier_id=supplier_id, payload=payload)
