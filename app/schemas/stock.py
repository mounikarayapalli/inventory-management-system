from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class LocationStockDetail(BaseModel):
    """Stock level and WAC valuation at a specific location."""

    location_id: int = Field(..., description="Location identifier")
    location_name: str = Field(..., description="Location name")
    quantity: Decimal = Field(..., ge=0, description="Quantity stored at location")
    unit_cost: Optional[Decimal] = Field(default=None, description="Current WAC at this location")
    total_valuation: Optional[Decimal] = Field(default=None, description="Total stock valuation (quantity × WAC)")

    class Config:
        from_attributes = True


class StockResponse(BaseModel):
    """Summary of aggregate stock level and inventory valuation for an item."""

    item_id: int = Field(..., description="Unique item identifier")
    item_name: str = Field(..., description="Name of the item")
    sku: str = Field(..., description="Item SKU")
    current_quantity: Decimal = Field(..., description="Total available quantity across all locations")
    min_stock_level: int = Field(..., description="Configured reorder threshold")
    status: str = Field(..., description="Stock status: 'in_stock', 'low_stock', or 'out_of_stock'")
    average_unit_cost: Optional[Decimal] = Field(default=None, description="Weighted average unit cost")
    total_valuation: Optional[Decimal] = Field(default=None, description="Total inventory valuation")
    last_updated: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of last stock change",
    )

    class Config:
        from_attributes = True


class StockDetailResponse(StockResponse):
    """Detailed stock information including per-location breakdown."""

    locations: List[LocationStockDetail] = Field(default_factory=list, description="Stock distribution per location")


class StockMovementResponse(BaseModel):
    """Record of an individual stock movement."""

    id: int = Field(..., description="Movement record identifier")
    item_id: int = Field(..., description="Item identifier")
    item_name: Optional[str] = Field(default=None, description="Item name")
    location_id: Optional[int] = Field(default=None, description="Location identifier")
    location_name: Optional[str] = Field(default=None, description="Location name")
    movement_type: str = Field(..., description="Type of movement: OPENING, INWARD, OUTWARD, RETURN, ADJUSTMENT")
    quantity: Decimal = Field(..., description="Quantity moved")
    reference_id: Optional[int] = Field(default=None, description="Associated document ID")
    reference_no: Optional[str] = Field(default=None, description="Associated document or receipt reference")
    remarks: Optional[str] = Field(default=None, description="Remarks or notes")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of movement",
    )

    class Config:
        from_attributes = True
