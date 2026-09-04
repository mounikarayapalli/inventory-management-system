"""FastAPI dependencies for authentication, database session management, and request validation."""

from typing import Optional
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

# HTTPBearer security scheme with auto_error=False to allow custom 401 handling per project design
http_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> User:
    """Validate JWT bearer token and resolve the authenticated, active User entity.

    Raises:
        UnauthorizedException: If credentials are missing, malformed, expired,
            the user does not exist, or the user is inactive (HTTP 401).
    """
    if not credentials or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise UnauthorizedException("Authentication credentials were not provided")

    token = credentials.credentials.strip()
    if not token:
        raise UnauthorizedException("Authentication credentials were not provided")

    payload = decode_access_token(token)

    sub = payload.get("sub")
    if sub is None:
        raise UnauthorizedException("Could not validate credentials")

    try:
        user_id = int(sub)
    except (ValueError, TypeError):
        raise UnauthorizedException("Could not validate credentials")

    stmt = (
        select(User)
        .options(joinedload(User.role))
        .where(User.user_id == user_id)
    )
    user = db.scalars(stmt).first()

    if not user:
        raise UnauthorizedException("User not found")

    if not user.is_active:
        raise UnauthorizedException("User account is inactive")

    return user


def require_roles(*allowed_roles: str):
    """FastAPI dependency factory enforcing role-based access control.

    Args:
        *allowed_roles: Role names permitted to access the endpoint.

    Returns:
        Callable: Dependency function verifying current user and role.

    Raises:
        ForbiddenException: If authenticated user's role is not in allowed_roles (HTTP 403).
    """
    normalized_allowed = {
        r.strip().lower().replace("_", " ") for r in allowed_roles
    } | {r.strip().lower() for r in allowed_roles}

    def role_verifier(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role.role_name if current_user.role else ""
        norm_user_role = user_role.strip().lower()
        if not norm_user_role or (
            norm_user_role not in normalized_allowed
            and norm_user_role.replace("_", " ") not in normalized_allowed
        ):
            raise ForbiddenException(
                f"Insufficient privileges. Required role in {list(allowed_roles)}"
            )
        return current_user

    return role_verifier
