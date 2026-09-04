"""Pydantic schemas for executive dashboard KPI aggregations and activity feeds."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class DashboardSummaryResponse(BaseModel):
    """High-level metrics for the executive inventory dashboard."""

    total_items: int = Field(..., description="Total active catalog items")
    total_categories: int = Field(..., description="Total active product categories")
    total_stock_units: Decimal = Field(..., description="Aggregate units of stock across all locations")
    total_stock_value: Decimal = Field(
        default=Decimal("0.00"), description="Total valuation of on-hand inventory"
    )
    today_inward_quantity: Decimal = Field(
        default=Decimal("0.00"), description="Total inward units received today"
    )
    today_outward_quantity: Decimal = Field(
        default=Decimal("0.00"), description="Total outward units dispatched today"
    )
    today_distributed_quantity: Decimal = Field(
        default=Decimal("0.00"), description="Total units distributed today"
    )
    low_stock_count: int = Field(..., description="Number of items below minimum threshold")
    out_of_stock_count: int = Field(..., description="Number of items completely depleted")
    transactions_today: int = Field(
        default=0, description="Total transactions processed today"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_items": 10,
                "total_categories": 3,
                "total_stock_units": "95.00",
                "total_stock_value": "1140.00",
                "today_inward_quantity": "50.00",
                "today_outward_quantity": "60.00",
                "today_distributed_quantity": "30.00",
                "low_stock_count": 1,
                "out_of_stock_count": 0,
                "transactions_today": 5,
            }
        }
    }


class LowStockItemResponse(BaseModel):
    """Item currently flagged with low stock level."""

    item_id: int = Field(..., description="Item identifier")
    item_name: str = Field(..., description="Item name")
    sku: str = Field(..., description="Item SKU / Item Code")
    current_quantity: Decimal = Field(..., description="Current stock level")
    min_stock_level: int = Field(..., description="Configured minimum threshold")
    category_name: Optional[str] = Field(default=None, description="Category name")
    location_id: Optional[int] = Field(default=None, description="Location identifier")
    location_name: Optional[str] = Field(default=None, description="Location name")


class OutOfStockItemResponse(BaseModel):
    """Item currently depleted from inventory."""

    item_id: int = Field(..., description="Item identifier")
    item_name: str = Field(..., description="Item name")
    sku: str = Field(..., description="Item SKU / Item Code")
    category_name: Optional[str] = Field(default=None, description="Category name")
    location_id: Optional[int] = Field(default=None, description="Location identifier")
    location_name: Optional[str] = Field(default=None, description="Location name")
    last_depleted_at: Optional[datetime] = Field(default=None, description="Timestamp when stock reached zero")


class RecentTransactionResponse(BaseModel):
    """Activity feed transaction summary."""

    id: int = Field(..., description="Transaction ID")
    transaction_type: str = Field(..., description="Type of transaction (OPENING, INWARD, OUTWARD, RETURN, ADJUSTMENT)")
    item_name: str = Field(..., description="Item transacted")
    quantity: Decimal = Field(..., description="Quantity transacted")
    reference_no: Optional[str] = Field(default=None, description="Reference code or document number")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Transaction timestamp",
    )
    location_name: Optional[str] = Field(default=None, description="Location name")
    created_by: Optional[int] = Field(default=None, description="User ID who created the record")
    remarks: Optional[str] = Field(default=None, description="Transaction remarks")


class CategoryStockResponse(BaseModel):
    """Stock volume distribution by product category."""

    category_id: int = Field(..., description="Category ID")
    category_name: str = Field(..., description="Category name")
    item_count: int = Field(..., description="Total unique items in category")
    total_units: Decimal = Field(..., description="Total stock units in category")
    total_valuation: Decimal = Field(
        default=Decimal("0.00"), description="Total valuation of stock in category"
    )


class LocationStockResponse(BaseModel):
    """Stock volume distribution by warehouse/location."""

    location_id: int = Field(..., description="Location ID")
    location_name: str = Field(..., description="Location name")
    location_code: Optional[str] = Field(default=None, description="Location code")
    total_units: Decimal = Field(..., description="Total stock units stored at location")
    total_valuation: Decimal = Field(
        default=Decimal("0.00"), description="Total valuation of stock at location"
    )
