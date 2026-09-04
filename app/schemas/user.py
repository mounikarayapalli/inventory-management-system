"""Pydantic schemas for user identity and role-based access management."""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user properties."""

    username: str = Field(..., min_length=3, max_length=100, description="Unique username")
    email: EmailStr = Field(..., description="User email address")
    full_name: Optional[str] = Field(default=None, max_length=100, description="User full name")
    role_id: Optional[int] = Field(default=None, description="System role identifier")
    role: Optional[str] = Field(default=None, description="System role name (e.g. admin, manager, staff)")
    is_active: bool = Field(default=True, description="Account active status")


class UserCreate(UserBase):
    """Schema for creating a new user."""

    password: str = Field(..., min_length=6, description="User password")


class UserUpdate(BaseModel):
    """Schema for updating user details."""

    username: Optional[str] = Field(default=None, min_length=3, max_length=100, description="Updated username")
    email: Optional[EmailStr] = Field(default=None, description="Updated email address")
    full_name: Optional[str] = Field(default=None, max_length=100, description="Updated full name")
    role_id: Optional[int] = Field(default=None, description="Updated role ID")
    role: Optional[str] = Field(default=None, description="Updated role name")
    password: Optional[str] = Field(default=None, min_length=6, description="Updated password")
    is_active: Optional[bool] = Field(default=None, description="Updated active status")


class UserResponse(BaseModel):
    """Schema for user response payload (never exposes password_hash)."""

    id: int = Field(..., description="Unique user identifier")
    user_id: int = Field(..., description="Unique user identifier alias")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="Email address")
    full_name: Optional[str] = Field(default=None, description="User full name")
    role_id: int = Field(..., description="Role identifier")
    role: str = Field(..., description="Role name")
    is_active: bool = Field(default=True, description="Account active status")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="User creation timestamp",
    )
    updated_at: Optional[datetime] = Field(default=None, description="User update timestamp")

    class Config:
        from_attributes = True
