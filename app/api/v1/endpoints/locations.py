"""API endpoints for warehouse and storage location management."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.location import LocationCreate, LocationResponse, LocationUpdate
from app.services.location_service import location_service

router = APIRouter()


@router.get(
    "",
    response_model=List[LocationResponse],
    status_code=status.HTTP_200_OK,
    summary="List locations",
    description="Retrieve list of storage locations and warehouses with optional filtering (Admin & Stock Manager).",
)
def list_locations(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=500, description="Pagination limit"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> List[LocationResponse]:
    """List storage locations."""
    return location_service.list_locations(db, skip=skip, limit=limit, is_active=is_active)


@router.get(
    "/{location_id}",
    response_model=LocationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get location by ID",
    description="Retrieve a single location by its ID (Admin & Stock Manager).",
)
def get_location(
    location_id: int = Path(..., ge=1, description="Location identifier"),
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> LocationResponse:
    """Get location details by ID."""
    return location_service.get_location_by_id(db, location_id=location_id)


@router.post(
    "",
    response_model=LocationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create location",
    description="Register a new storage location or warehouse bay (Admin only).",
)
def create_location(
    payload: LocationCreate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> LocationResponse:
    """Create a new location."""
    return location_service.create_location(db, payload=payload)


@router.patch(
    "/{location_id}",
    response_model=LocationResponse,
    status_code=status.HTTP_200_OK,
    summary="Update location",
    description="Update an existing location's details (Admin only).",
)
def update_location(
    location_id: int = Path(..., ge=1, description="Location identifier"),
    payload: LocationUpdate = ...,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> LocationResponse:
    """Update location information."""
    return location_service.update_location(db, location_id=location_id, payload=payload)
