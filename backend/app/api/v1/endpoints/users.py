"""API endpoints for user management and role assignment."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user_service import user_service

router = APIRouter()


@router.get(
    "",
    response_model=List[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="List users",
    description="Retrieve paginated list of system users (Admin & Stock Manager).",
)
def list_users(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=500, description="Pagination page limit"),
    role_id: Optional[int] = Query(None, description="Filter by role ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> List[UserResponse]:
    """Retrieve list of system users."""
    return user_service.list_users(db, skip=skip, limit=limit, role_id=role_id, is_active=is_active)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user by ID",
    description="Retrieve a single user record by its ID (Admin & Stock Manager).",
)
def get_user(
    user_id: int = Path(..., ge=1, description="Target user identifier"),
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Retrieve user details by ID."""
    return user_service.get_user_by_id(db, user_id=user_id)


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user",
    description="Register a new system user (Admin only).",
)
def create_user(
    payload: UserCreate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Create a new user."""
    return user_service.create_user(db, payload=payload)


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update user",
    description="Partially update an existing user's details (Admin only).",
)
def update_user(
    user_id: int = Path(..., ge=1, description="Target user identifier"),
    payload: UserUpdate = ...,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Update user information."""
    return user_service.update_user(db, user_id=user_id, payload=payload)
