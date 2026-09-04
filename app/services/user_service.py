"""Service layer for user identity and role management with Argon2id password hashing."""

from typing import List, Optional
from argon2 import PasswordHasher, Type
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ConflictException, NotFoundException
from app.models.role import Role
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate

# Argon2id password hasher instance with RFC 9106 recommended defaults
_hasher = PasswordHasher(type=Type.ID)


class UserService:
    """Service managing system users and role associations with Argon2id security."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a plaintext password using Argon2id."""
        return _hasher.hash(password)

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify a plaintext password against an Argon2id hash."""
        try:
            return _hasher.verify(password_hash, password)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False

    @staticmethod
    def _to_response(user: User) -> UserResponse:
        return UserResponse(
            id=user.user_id,
            user_id=user.user_id,
            username=user.username,
            email=user.email,
            full_name=None,
            role_id=user.role_id,
            role=user.role.role_name if user.role else f"Role {user.role_id}",
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    def _resolve_role_id(self, db: Session, role_id: Optional[int], role_name: Optional[str]) -> int:
        """Resolve role ID from explicit ID or case-insensitive role name."""
        if role_id is not None:
            role = db.get(Role, role_id)
            if not role:
                raise NotFoundException(f"Role with ID {role_id} not found.")
            return role.role_id

        if role_name is not None and role_name.strip():
            r_name = role_name.strip()
            role = db.scalars(
                select(Role).where(func.lower(Role.role_name) == r_name.lower())
            ).first()
            if not role:
                raise NotFoundException(f"Role with name '{r_name}' not found.")
            return role.role_id

        # Default to first role if available, or raise error
        first_role = db.scalars(select(Role).order_by(Role.role_id.asc())).first()
        if first_role:
            return first_role.role_id
        raise BadRequestException("role_id or valid role name is required.")

    def list_users(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        role_id: Optional[int] = None,
        is_active: Optional[bool] = None,
    ) -> List[UserResponse]:
        """Retrieve paginated list of users with optional role and active status filters."""
        stmt = select(User).join(Role, User.role_id == Role.role_id, isouter=True).order_by(User.user_id.asc())
        if role_id is not None:
            stmt = stmt.where(User.role_id == role_id)
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)

        stmt = stmt.offset(skip).limit(limit)
        users = db.scalars(stmt).all()
        return [self._to_response(u) for u in users]

    def get_user_by_id(self, db: Session, user_id: int) -> UserResponse:
        """Retrieve a single user by primary key ID."""
        user = db.get(User, user_id)
        if not user:
            raise NotFoundException(f"User with ID {user_id} not found.")
        return self._to_response(user)

    def create_user(self, db: Session, payload: UserCreate) -> UserResponse:
        """Create a new user with duplicate username and email validation and Argon2id hashing."""
        username = payload.username.strip()
        email = str(payload.email).strip().lower()

        if not username:
            raise BadRequestException("Username is required.")
        if not payload.password or len(payload.password) < 6:
            raise BadRequestException("Password must be at least 6 characters.")

        # Check duplicate username (case-insensitive)
        existing_u = db.scalars(
            select(User).where(func.lower(User.username) == username.lower())
        ).first()
        if existing_u:
            raise ConflictException(f"Username '{username}' is already taken.")

        # Check duplicate email (case-insensitive)
        existing_e = db.scalars(
            select(User).where(func.lower(User.email) == email)
        ).first()
        if existing_e:
            raise ConflictException(f"Email '{email}' is already registered.")

        # Resolve role
        target_role_id = self._resolve_role_id(db, payload.role_id, payload.role)

        password_hash = self.hash_password(payload.password)

        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            role_id=target_role_id,
            is_active=payload.is_active if payload.is_active is not None else True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return self._to_response(user)

    def update_user(self, db: Session, user_id: int, payload: UserUpdate) -> UserResponse:
        """Update an existing user's details and rehash password using Argon2id if updated."""
        user = db.get(User, user_id)
        if not user:
            raise NotFoundException(f"User with ID {user_id} not found.")

        # Update username if provided
        if payload.username is not None:
            new_u = payload.username.strip()
            if not new_u:
                raise BadRequestException("Username cannot be empty.")
            if new_u.lower() != user.username.lower():
                existing_u = db.scalars(
                    select(User).where(
                        func.lower(User.username) == new_u.lower(),
                        User.user_id != user_id,
                    )
                ).first()
                if existing_u:
                    raise ConflictException(f"Username '{new_u}' is already taken.")
            user.username = new_u

        # Update email if provided
        if payload.email is not None:
            new_e = str(payload.email).strip().lower()
            if new_e != user.email.lower():
                existing_e = db.scalars(
                    select(User).where(
                        func.lower(User.email) == new_e,
                        User.user_id != user_id,
                    )
                ).first()
                if existing_e:
                    raise ConflictException(f"Email '{new_e}' is already registered.")
            user.email = new_e

        # Update role if provided
        if payload.role_id is not None or payload.role is not None:
            user.role_id = self._resolve_role_id(db, payload.role_id, payload.role)

        # Update password if provided
        if payload.password is not None:
            if len(payload.password) < 6:
                raise BadRequestException("Password must be at least 6 characters.")
            user.password_hash = self.hash_password(payload.password)

        if payload.is_active is not None:
            user.is_active = payload.is_active

        db.commit()
        db.refresh(user)
        return self._to_response(user)


user_service = UserService()
