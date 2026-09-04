"""Pydantic schemas for product category management."""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    """Base item category properties."""

    category_name: Optional[str] = Field(default=None, max_length=100, description="Category name")
    name: Optional[str] = Field(default=None, max_length=100, description="Category name alias")
    description: Optional[str] = Field(default=None, max_length=255, description="Category description")
    is_active: bool = Field(default=True, description="Whether the category is active")


class CategoryCreate(CategoryBase):
    """Schema for creating a category."""

    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""

    category_name: Optional[str] = Field(default=None, max_length=100, description="Updated category name")
    name: Optional[str] = Field(default=None, max_length=100, description="Updated name alias")
    description: Optional[str] = Field(default=None, max_length=255, description="Updated description")
    is_active: Optional[bool] = Field(default=None, description="Updated active status")


class CategoryResponse(BaseModel):
    """Schema for category response payload."""

    id: int = Field(..., description="Unique category identifier")
    category_id: int = Field(..., description="Unique category identifier alias")
    name: str = Field(..., description="Category name")
    category_name: str = Field(..., description="Category name")
    description: Optional[str] = Field(default=None, description="Category description")
    is_active: bool = Field(default=True, description="Whether category is active")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Category creation timestamp",
    )

    class Config:
        from_attributes = True
