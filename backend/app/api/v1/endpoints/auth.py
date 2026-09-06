"""API endpoints for user authentication and identity verification."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.auth_service import auth_service
from app.services.user_service import UserService

from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import user_service

router = APIRouter()


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Authenticate user with credentials and return a signed JWT access token.",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Authenticate user credentials and return bearer token."""
    return auth_service.login(db, payload)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="User registration",
    description="Register a new user account in PostgreSQL database.",
)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> UserResponse:
    """Public user registration."""
    # Ensure public registration defaults to non-admin stock manager role
    if not payload.role and not payload.role_id:
        payload.role = "stock manager"
    elif payload.role and payload.role.lower() == "admin":
        payload.role = "stock manager"
    return user_service.create_user(db, payload=payload)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Retrieve the profile of the currently authenticated user.",
)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return the profile information for the authenticated user."""
    return UserService._to_response(current_user)
