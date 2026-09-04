"""Pydantic schemas for storage location and warehouse management."""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class LocationBase(BaseModel):
    """Base storage location properties."""

    location_name: Optional[str] = Field(default=None, max_length=100, description="Location name")
    name: Optional[str] = Field(default=None, max_length=100, description="Location name alias")
    code: Optional[str] = Field(default=None, max_length=50, description="Short code identifier")
    description: Optional[str] = Field(default=None, max_length=255, description="Location description")
    is_active: bool = Field(default=True, description="Whether location is active")


class LocationCreate(LocationBase):
    """Schema for creating a location."""

    pass


class LocationUpdate(BaseModel):
    """Schema for updating a location."""

    location_name: Optional[str] = Field(default=None, max_length=100, description="Updated name")
    name: Optional[str] = Field(default=None, max_length=100, description="Updated name alias")
    code: Optional[str] = Field(default=None, max_length=50, description="Updated code")
    description: Optional[str] = Field(default=None, max_length=255, description="Updated description")
    is_active: Optional[bool] = Field(default=None, description="Updated active status")


class LocationResponse(BaseModel):
    """Schema for location response payload."""

    id: int = Field(..., description="Unique location identifier")
    location_id: int = Field(..., description="Unique location identifier alias")
    name: str = Field(..., description="Location name")
    location_name: str = Field(..., description="Location name")
    code: Optional[str] = Field(default=None, description="Location code")
    description: Optional[str] = Field(default=None, description="Location description")
    is_active: bool = Field(default=True, description="Whether location is active")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Location creation timestamp",
    )

    class Config:
        from_attributes = True
