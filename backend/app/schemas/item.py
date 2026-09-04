"""Pydantic schemas for catalog item management."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class ItemBase(BaseModel):
    """Base item / product properties."""

    item_code: Optional[str] = Field(default=None, max_length=30, description="Unique item code")
    sku: Optional[str] = Field(default=None, max_length=50, description="Item code / SKU alias")
    item_name: Optional[str] = Field(default=None, max_length=200, description="Item name")
    name: Optional[str] = Field(default=None, max_length=200, description="Item name alias")
    category_id: int = Field(..., description="Associated category ID")
    unit: str = Field(default="pcs", min_length=1, max_length=30, description="Unit of measurement")
    minimum_level: Optional[int] = Field(default=0, ge=0, description="Minimum stock threshold")
    min_stock_level: Optional[int] = Field(default=None, ge=0, description="Minimum stock threshold alias")
    default_unit_cost: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0, description="Default unit cost")
    description: Optional[str] = Field(default=None, max_length=255, description="Item description")
    is_active: bool = Field(default=True, description="Whether the item is active")


class ItemCreate(ItemBase):
    """Schema for creating a new item."""

    pass


class ItemUpdate(BaseModel):
    """Schema for updating an item."""

    item_code: Optional[str] = Field(default=None, max_length=30, description="Updated item code")
    sku: Optional[str] = Field(default=None, max_length=50, description="Updated SKU alias")
    item_name: Optional[str] = Field(default=None, max_length=200, description="Updated item name")
    name: Optional[str] = Field(default=None, max_length=200, description="Updated name alias")
    category_id: Optional[int] = Field(default=None, description="Updated category ID")
    unit: Optional[str] = Field(default=None, min_length=1, max_length=30, description="Updated unit")
    minimum_level: Optional[int] = Field(default=None, ge=0, description="Updated minimum level")
    min_stock_level: Optional[int] = Field(default=None, ge=0, description="Updated min stock level alias")
    default_unit_cost: Optional[Decimal] = Field(default=None, ge=0, description="Updated default cost")
    description: Optional[str] = Field(default=None, max_length=255, description="Updated description")
    is_active: Optional[bool] = Field(default=None, description="Updated active status")


class ItemResponse(BaseModel):
    """Schema for item response payload."""

    id: int = Field(..., description="Unique item identifier")
    item_id: int = Field(..., description="Unique item identifier alias")
    item_code: str = Field(..., description="Item code")
    sku: str = Field(..., description="Item code alias")
    item_name: str = Field(..., description="Item name")
    name: str = Field(..., description="Item name alias")
    category_id: int = Field(..., description="Category ID")
    category_name: Optional[str] = Field(default=None, description="Category name")
    unit: str = Field(..., description="Unit of measure")
    minimum_level: int = Field(..., description="Minimum level")
    min_stock_level: int = Field(..., description="Minimum level alias")
    default_unit_cost: Optional[Decimal] = Field(default=None, description="Default unit cost")
    description: Optional[str] = Field(default=None, description="Item description")
    is_active: bool = Field(default=True, description="Whether the item is active")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Item creation timestamp",
    )
    updated_at: Optional[datetime] = Field(default=None, description="Item update timestamp")

    class Config:
        from_attributes = True
