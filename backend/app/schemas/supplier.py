"""Pydantic schemas for vendor and supplier management."""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class SupplierBase(BaseModel):
    """Base supplier properties."""

    supplier_name: Optional[str] = Field(default=None, max_length=150, description="Supplier business name")
    name: Optional[str] = Field(default=None, max_length=150, description="Supplier business name alias")
    contact_person: Optional[str] = Field(default=None, max_length=100, description="Primary contact name")
    email: Optional[EmailStr] = Field(default=None, description="Contact email address")
    phone: Optional[str] = Field(default=None, max_length=30, description="Contact telephone")
    address: Optional[str] = Field(default=None, max_length=255, description="Physical address")
    is_active: bool = Field(default=True, description="Whether the supplier is active")


class SupplierCreate(SupplierBase):
    """Schema for creating a new supplier."""

    pass


class SupplierUpdate(BaseModel):
    """Schema for updating a supplier."""

    supplier_name: Optional[str] = Field(default=None, max_length=150, description="Updated name")
    name: Optional[str] = Field(default=None, max_length=150, description="Updated name alias")
    contact_person: Optional[str] = Field(default=None, max_length=100, description="Updated contact name")
    email: Optional[EmailStr] = Field(default=None, description="Updated email")
    phone: Optional[str] = Field(default=None, max_length=30, description="Updated phone")
    address: Optional[str] = Field(default=None, max_length=255, description="Updated address")
    is_active: Optional[bool] = Field(default=None, description="Updated active status")


class SupplierResponse(BaseModel):
    """Schema for supplier response payload."""

    id: int = Field(..., description="Unique supplier identifier")
    supplier_id: int = Field(..., description="Unique supplier identifier alias")
    name: str = Field(..., description="Supplier name")
    supplier_name: str = Field(..., description="Supplier name")
    contact_person: Optional[str] = Field(default=None, description="Primary contact name")
    email: Optional[str] = Field(default=None, description="Contact email address")
    phone: Optional[str] = Field(default=None, description="Contact telephone")
    address: Optional[str] = Field(default=None, description="Physical address")
    is_active: bool = Field(default=True, description="Whether the supplier is active")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Supplier creation timestamp",
    )

    class Config:
        from_attributes = True
