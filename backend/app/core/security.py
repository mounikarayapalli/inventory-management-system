"""Security utilities for JWT token creation, decoding, and cryptographic validation."""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError, PyJWTError

from app.core.config import settings
from app.core.exceptions import UnauthorizedException


def create_access_token(
    subject: Optional[Union[str, int]] = None,
    role: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
    data: Optional[Dict[str, Any]] = None,
    **kwargs: Any,
) -> str:
    """Generate a signed JWT access token containing subject, role, and expiration.

    Args:
        subject: The user ID to store in the 'sub' claim.
        role: The role name to store in the 'role' claim.
        expires_delta: Optional custom token lifetime. Defaults to Settings.ACCESS_TOKEN_EXPIRE_MINUTES.
        data: Optional dictionary of additional claims.
        **kwargs: Any additional key-value claims.

    Returns:
        str: Encoded and signed JWT string.
    """
    payload: Dict[str, Any] = {}
    if data:
        payload.update(data)
    payload.update(kwargs)

    if subject is not None:
        payload["sub"] = str(subject)
    if role is not None:
        payload["role"] = role

    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    if "exp" not in payload:
        payload["exp"] = expire
    if "iat" not in payload:
        payload["iat"] = now

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token.

    Args:
        token: The encoded JWT string.

    Returns:
        Dict[str, Any]: Decoded payload claims dictionary.

    Raises:
        UnauthorizedException: If the token is missing, expired, invalid, or malformed.
    """
    if not token or not isinstance(token, str):
        raise UnauthorizedException("Could not validate credentials")

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except ExpiredSignatureError:
        raise UnauthorizedException("Token has expired")
    except (InvalidTokenError, PyJWTError):
        raise UnauthorizedException("Could not validate credentials")
