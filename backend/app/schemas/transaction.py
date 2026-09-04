"""Pydantic schemas for inventory transactions, movement tracking, and stock requests."""

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class OpeningStockRequest(BaseModel):
    """Schema for recording initial opening inventory."""

    item_id: int = Field(..., description="Target item ID")
    location_id: int = Field(..., description="Target storage location ID")
    quantity: Decimal = Field(..., gt=0, description="Initial stock quantity")
    unit_cost: Decimal = Field(default=Decimal("0.00"), ge=0.0, description="Per-unit acquisition cost")
    opening_date: Optional[date] = Field(default=None, description="Opening date")
    remarks: Optional[str] = Field(default=None, max_length=255, description="Audit notes")


class InwardRequest(BaseModel):
    """Schema for receiving inbound stock from supplier or purchase."""

    item_id: int = Field(..., description="Target item ID")
    location_id: int = Field(..., description="Receiving storage location ID")
    supplier_id: int = Field(..., description="Originating supplier ID")
    quantity: Decimal = Field(..., gt=0, description="Quantity received")
    unit_cost: Decimal = Field(..., ge=0.0, description="Per-unit purchase cost")
    inward_no: Optional[str] = Field(default=None, max_length=50, description="Supplier invoice or inward receipt number")
    total_cost: Optional[Decimal] = Field(default=None, ge=0.0, description="Declared total cost (auto-computed if omitted)")
    inward_date: Optional[date] = Field(default=None, description="Receipt date")
    invoice_no: Optional[str] = Field(default=None, max_length=100, description="Supplier invoice or PO reference")
    remarks: Optional[str] = Field(default=None, max_length=255, description="Notes")


class OutwardRequest(BaseModel):
    """Schema for outbound stock issue/dispatch."""

    item_id: int = Field(..., description="Target item ID")
    location_id: int = Field(..., description="Source storage location ID")
    quantity: Decimal = Field(..., gt=0, description="Quantity issued")
    outward_no: Optional[str] = Field(default=None, max_length=50, description="Dispatch / outward number")
    issued_to: Optional[str] = Field(default=None, max_length=150, description="Recipient individual or team")
    purpose: Optional[str] = Field(default=None, max_length=255, description="Purpose of issue")
    outward_date: Optional[date] = Field(default=None, description="Outward dispatch date")
    reference_no: Optional[str] = Field(default=None, max_length=100, description="Dispatch / order reference")
    remarks: Optional[str] = Field(default=None, max_length=255, description="Notes")


class DistributionRequest(BaseModel):
    """Schema for recording distribution line item linked to an outward transaction."""

    outward_id: Optional[int] = Field(default=None, description="Related outward transaction ID")
    item_id: int = Field(..., description="Target item ID")
    location_id: Optional[int] = Field(default=None, description="Storage location ID")
    source_location_id: Optional[int] = Field(default=None, description="Source location ID (backward-compatible alias)")
    destination_location_id: Optional[int] = Field(default=None, description="Destination location ID")
    quantity: Decimal = Field(..., gt=0, description="Quantity to distribute")
    recipient: Optional[str] = Field(default=None, max_length=150, description="Recipient department or person")
    batch: Optional[str] = Field(default=None, max_length=100, description="Batch number")
    department: Optional[str] = Field(default=None, max_length=150, description="Department")
    purpose: Optional[str] = Field(default=None, max_length=255, description="Purpose")
    distribution_date: Optional[date] = Field(default=None, description="Distribution date")
    remarks: Optional[str] = Field(default=None, max_length=255, description="Notes")


class ReturnRequest(BaseModel):
    """Schema for recording stock returns."""

    item_id: int = Field(..., description="Target item ID")
    location_id: int = Field(..., description="Storage location receiving the return")
    quantity: Decimal = Field(..., gt=0, description="Quantity returned")
    source: Optional[str] = Field(default=None, max_length=150, description="Originating return source")
    return_type: str = Field(default="customer", description="Type of return: 'customer', 'supplier', or 'internal'")
    reason: Optional[str] = Field(default=None, max_length=255, description="Reason for return")
    return_date: Optional[date] = Field(default=None, description="Return date")
    remarks: Optional[str] = Field(default=None, max_length=255, description="Notes")


class AdjustmentRequest(BaseModel):
    """Schema for stock discrepancy adjustments (write-offs, recount corrections)."""

    item_id: int = Field(..., description="Target item ID")
    location_id: int = Field(..., description="Storage location ID")
    adjusted_quantity: Decimal = Field(..., description="Quantity delta (positive for addition, negative for deduction)")
    reason: str = Field(..., min_length=1, max_length=255, description="Reason for manual adjustment")
    adjustment_date: Optional[date] = Field(default=None, description="Adjustment date")
    remarks: Optional[str] = Field(default=None, max_length=255, description="Notes")


class TransactionResponse(BaseModel):
    """Standard response model for inventory transactions."""

    id: int = Field(..., description="Unique transaction ID")
    transaction_type: str = Field(..., description="Type of transaction (opening_stock, inward, outward, distribution, return, adjustment)")
    item_id: int = Field(..., description="Item ID")
    location_id: int = Field(..., description="Location ID")
    quantity: Decimal = Field(..., description="Quantity transacted")
    reference_no: Optional[str] = Field(default=None, description="External reference or receipt number")
    status: str = Field(default="completed", description="Transaction status")
    unit_cost: Optional[Decimal] = Field(default=None, description="Unit cost / WAC applied")
    total_cost: Optional[Decimal] = Field(default=None, description="Total valuation / cost")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Transaction timestamp",
    )

    class Config:
        from_attributes = True


class AdjustmentUpdate(BaseModel):
    """Schema for updating an adjustment record (Admin only)."""

    reason: Optional[str] = Field(default=None, max_length=255, description="Updated reason or audit note")
    remarks: Optional[str] = Field(default=None, max_length=255, description="Updated audit remarks")


class AdjustmentResponse(BaseModel):
    """Schema for stock adjustment detail response (Admin & Stock Manager)."""

    adjustment_id: int = Field(..., description="Unique adjustment ID")
    id: Optional[int] = Field(default=None, description="Unique adjustment ID alias")
    item_id: int = Field(..., description="Item ID")
    location_id: int = Field(..., description="Location ID")
    quantity_change: Decimal = Field(..., description="Quantity delta applied")
    reason: str = Field(..., description="Adjustment justification")
    adjustment_date: date = Field(..., description="Adjustment transaction date")
    created_by: int = Field(..., description="User ID who created adjustment")

    class Config:
        from_attributes = True
