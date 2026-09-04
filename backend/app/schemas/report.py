"""Pydantic schemas for operational, analytical, and audit inventory reports."""

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class StockReportItem(BaseModel):
    """Detailed line item for stock ledger reports."""

    item_id: int = Field(..., description="Item identifier")
    item_code: str = Field(..., description="Item code / SKU")
    item_name: str = Field(..., description="Item name")
    sku: Optional[str] = Field(default=None, description="Item SKU alias")
    category_name: Optional[str] = Field(default=None, description="Category name")
    location_id: Optional[int] = Field(default=None, description="Location identifier")
    location_name: Optional[str] = Field(default=None, description="Location name")
    quantity_on_hand: Decimal = Field(..., description="Available quantity on hand")
    wac: Decimal = Field(default=Decimal("0.00"), description="Weighted Average Cost")
    stock_value: Decimal = Field(default=Decimal("0.00"), description="Total stock value (quantity × WAC)")
    minimum_level: int = Field(..., description="Minimum reorder threshold")
    min_stock_level: Optional[int] = Field(default=None, description="Minimum level alias")
    stock_status: str = Field(
        default="IN_STOCK",
        description="Stock health status: IN_STOCK, LOW_STOCK, OUT_OF_STOCK",
    )
    reorder_recommended: bool = Field(default=False, description="Flag indicating replenishment need")


class MovementReportItem(BaseModel):
    """Line item for audit movement report."""

    transaction_id: int = Field(..., description="Movement / transaction ID")
    movement_id: Optional[int] = Field(default=None, description="Movement ID alias")
    timestamp: datetime = Field(..., description="Movement event timestamp")
    movement_date: Optional[datetime] = Field(default=None, description="Movement timestamp alias")
    item_id: int = Field(..., description="Item ID")
    item_name: str = Field(..., description="Item name")
    sku: Optional[str] = Field(default=None, description="Item SKU")
    location_id: int = Field(..., description="Location ID")
    location_name: str = Field(..., description="Location name")
    from_location: Optional[str] = Field(default=None, description="Source location alias")
    to_location: Optional[str] = Field(default=None, description="Target location alias")
    movement_type: str = Field(..., description="Movement operation type (OPENING, INWARD, OUTWARD, RETURN, ADJUSTMENT)")
    quantity: Decimal = Field(..., description="Transacted quantity")
    reference_id: Optional[int] = Field(default=None, description="Reference entity ID")
    reference_no: Optional[str] = Field(default=None, description="Document reference")
    created_by: int = Field(..., description="User ID who created movement")
    remarks: Optional[str] = Field(default=None, description="Movement remarks")


class InwardReportItem(BaseModel):
    """Line item for inbound procurement and receipt report."""

    transaction_id: int = Field(..., description="Inward transaction ID")
    inward_id: Optional[int] = Field(default=None, description="Inward transaction ID alias")
    inward_no: str = Field(..., description="Inward receipt number")
    inward_date: date = Field(..., description="Inward receipt date")
    timestamp: Optional[datetime] = Field(default=None, description="Receipt creation timestamp")
    item_id: int = Field(..., description="Item ID")
    item_name: str = Field(..., description="Item received")
    supplier_id: int = Field(..., description="Supplier ID")
    supplier_name: Optional[str] = Field(default=None, description="Supplier name")
    location_id: int = Field(..., description="Receiving location ID")
    location_name: str = Field(..., description="Receiving storage location")
    quantity: Decimal = Field(..., description="Units received")
    unit_cost: Decimal = Field(..., description="Unit cost at receipt")
    total_cost: Decimal = Field(..., description="Total cost of receipt")
    invoice_no: Optional[str] = Field(default=None, description="Invoice or shipment reference")
    created_by: int = Field(..., description="User ID who recorded transaction")
    remarks: Optional[str] = Field(default=None, description="Transaction remarks")


class OutwardReportItem(BaseModel):
    """Line item for outbound dispatch and issue report."""

    transaction_id: int = Field(..., description="Outward transaction ID")
    outward_id: Optional[int] = Field(default=None, description="Outward transaction ID alias")
    outward_no: str = Field(..., description="Outward dispatch number")
    outward_date: date = Field(..., description="Outward dispatch date")
    timestamp: Optional[datetime] = Field(default=None, description="Dispatch creation timestamp")
    item_id: int = Field(..., description="Item ID")
    item_name: str = Field(..., description="Item issued")
    location_id: int = Field(..., description="Source location ID")
    location_name: str = Field(..., description="Source dispatch location")
    quantity: Decimal = Field(..., description="Units issued")
    reference_no: Optional[str] = Field(default=None, description="Issue reference or dispatch slip")
    issued_to: Optional[str] = Field(default=None, description="Issued to individual or department")
    purpose: Optional[str] = Field(default=None, description="Purpose of issue")
    unit_cost_used: Optional[Decimal] = Field(default=None, description="WAC / unit cost used for valuation")
    total_cost: Optional[Decimal] = Field(default=None, description="Total valuation of issued stock")
    recipient: Optional[str] = Field(default=None, description="Recipient individual or team")
    created_by: int = Field(..., description="User ID who recorded transaction")
    remarks: Optional[str] = Field(default=None, description="Transaction remarks")
