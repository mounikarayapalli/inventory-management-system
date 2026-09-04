"""Service layer for authentication and JWT token issuance."""

from datetime import timedelta
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.user_service import UserService


class AuthService:
    """Service managing user authentication and JWT token generation."""

    def login(self, db: Session, payload: LoginRequest) -> TokenResponse:
        """Authenticate user credentials, verify active status, and issue a signed JWT."""
        identifier = payload.username.strip()

        # Query user by username or email (case-insensitive) with role loaded
        stmt = (
            select(User)
            .options(joinedload(User.role))
            .where(
                or_(
                    func.lower(User.username) == identifier.lower(),
                    func.lower(User.email) == identifier.lower(),
                )
            )
        )
        user = db.scalars(stmt).first()

        if not user or not UserService.verify_password(payload.password, user.password_hash):
            raise UnauthorizedException("Invalid username or password")

        if not user.is_active:
            raise UnauthorizedException("User account is inactive")

        role_name = user.role.role_name if user.role else "USER"
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        access_token = create_access_token(
            subject=user.user_id,
            role=role_name,
            username=user.username,
            expires_delta=expires_delta,
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user.user_id,
            role=role_name,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )


auth_service = AuthService()
