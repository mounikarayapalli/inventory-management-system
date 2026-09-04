"""Service layer for inventory stock balances, per-location breakdown, and WAC calculation."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.item import Item
from app.models.location import Location
from app.models.opening_stock import OpeningStock
from app.models.inward_transaction import InwardTransaction
from app.models.outward_transaction import OutwardTransaction
from app.models.stock_movement import StockMovement
from app.schemas.stock import (
    LocationStockDetail,
    StockDetailResponse,
    StockMovementResponse,
    StockResponse,
)
from app.services.inventory_logic import (
    calculate_stock_from_movements,
    calculate_wac,
    determine_stock_status,
    quantize_currency,
    quantize_quantity,
    to_decimal,
)


class StockService:
    """Service handling stock balances, WAC valuation, and movement history."""

    def get_available_stock(self, db: Session, item_id: int, location_id: int) -> Decimal:
        """Calculate available on-hand stock for an Item at a specific Location.

        Aggregates all chronological stock movements for this item and location.
        Formula:
            Available Stock = Opening + Inward - Outward + Return +/- Adjustment
        (Distribution does not create a separate movement, preventing double deduction).
        """
        stmt = (
            select(StockMovement)
            .where(
                StockMovement.item_id == item_id,
                StockMovement.location_id == location_id,
            )
            .order_by(StockMovement.movement_date.asc(), StockMovement.movement_id.asc())
        )
        movements = db.scalars(stmt).all()
        return calculate_stock_from_movements(movements)

    def get_wac(self, db: Session, item_id: int, location_id: int) -> Decimal:
        """Calculate current Weighted Average Cost (WAC) for an Item at a Location.

        Algorithm:
        1. Reads Opening Stock for the item+location (baseline quantity and unit cost).
        2. Iterates over all Inward transactions in chronological order:
           new_wac = (prev_qty * prev_wac + in_qty * in_cost) / (prev_qty + in_qty)
        3. Deducts Outward issues from available stock quantity without altering unit WAC.
        4. If no receipts exist, falls back to the catalog item's default_unit_cost or 0.00.
        """
        # Baseline: Opening stock
        op_stmt = (
            select(OpeningStock)
            .where(
                OpeningStock.item_id == item_id,
                OpeningStock.location_id == location_id,
            )
            .order_by(OpeningStock.opening_date.asc(), OpeningStock.opening_stock_id.asc())
        )
        opening = db.scalars(op_stmt).first()

        current_qty = Decimal("0.00")
        current_wac = Decimal("0.00")

        if opening is not None:
            current_qty = to_decimal(opening.quantity)
            current_wac = to_decimal(opening.unit_cost)

        # Inward receipts
        in_stmt = (
            select(InwardTransaction)
            .where(
                InwardTransaction.item_id == item_id,
                InwardTransaction.location_id == location_id,
            )
            .order_by(InwardTransaction.inward_date.asc(), InwardTransaction.inward_id.asc())
        )
        inwards = db.scalars(in_stmt).all()

        for in_tx in inwards:
            in_qty = to_decimal(in_tx.quantity)
            in_cost = to_decimal(in_tx.unit_cost)
            current_wac = calculate_wac(current_qty, current_wac, in_qty, in_cost)
            current_qty += in_qty

        # If still 0 and no receipts, fallback to default_unit_cost on Item
        if current_wac == Decimal("0.00"):
            item = db.get(Item, item_id)
            if item and item.default_unit_cost is not None:
                current_wac = to_decimal(item.default_unit_cost)

        return quantize_currency(current_wac)

    def get_stock_by_item(self, db: Session, item_id: int) -> StockDetailResponse:
        """Retrieve detailed stock breakdown and WAC valuation for an item across all locations."""
        item = db.get(Item, item_id)
        if not item:
            raise NotFoundException(f"Item with ID {item_id} not found.")

        # Find all active locations
        locations = db.scalars(
            select(Location).where(Location.is_active.is_(True)).order_by(Location.location_name.asc())
        ).all()

        location_details: List[LocationStockDetail] = []
        total_quantity = Decimal("0.00")
        total_value = Decimal("0.00")

        for loc in locations:
            loc_qty = self.get_available_stock(db, item.item_id, loc.location_id)
            loc_wac = self.get_wac(db, item.item_id, loc.location_id)
            loc_val = quantize_currency(loc_qty * loc_wac)

            total_quantity += loc_qty
            total_value += loc_val

            location_details.append(
                LocationStockDetail(
                    location_id=loc.location_id,
                    location_name=loc.location_name,
                    quantity=loc_qty,
                    unit_cost=loc_wac,
                    total_valuation=loc_val,
                )
            )

        avg_cost = (
            quantize_currency(total_value / total_quantity)
            if total_quantity > Decimal("0")
            else to_decimal(item.default_unit_cost)
        )

        return StockDetailResponse(
            item_id=item.item_id,
            item_name=item.item_name,
            sku=item.item_code,
            current_quantity=quantize_quantity(total_quantity),
            min_stock_level=item.minimum_level,
            status=determine_stock_status(total_quantity, item.minimum_level),
            average_unit_cost=avg_cost,
            total_valuation=quantize_currency(total_value),
            locations=location_details,
            last_updated=datetime.now(timezone.utc),
        )

    def list_stock(self, db: Session, skip: int = 0, limit: int = 100) -> List[StockResponse]:
        """List aggregate stock balances and valuations across all catalog items."""
        items = db.scalars(
            select(Item).where(Item.is_active.is_(True)).order_by(Item.item_id.asc()).offset(skip).limit(limit)
        ).all()

        results: List[StockResponse] = []
        for item in items:
            detail = self.get_stock_by_item(db, item.item_id)
            results.append(
                StockResponse(
                    item_id=detail.item_id,
                    item_name=detail.item_name,
                    sku=detail.sku,
                    current_quantity=detail.current_quantity,
                    min_stock_level=detail.min_stock_level,
                    status=detail.status,
                    average_unit_cost=detail.average_unit_cost,
                    total_valuation=detail.total_valuation,
                    last_updated=detail.last_updated,
                )
            )

        return results

    def list_movements(self, db: Session, skip: int = 0, limit: int = 100) -> List[StockMovementResponse]:
        """Retrieve chronological log of all stock ledger movements."""
        stmt = (
            select(StockMovement, Item.item_name, Location.location_name)
            .join(Item, StockMovement.item_id == Item.item_id, isouter=True)
            .join(Location, StockMovement.location_id == Location.location_id, isouter=True)
            .order_by(StockMovement.movement_date.desc(), StockMovement.movement_id.desc())
            .offset(skip)
            .limit(limit)
        )
        rows = db.execute(stmt).all()

        results: List[StockMovementResponse] = []
        for mv, item_name, loc_name in rows:
            results.append(
                StockMovementResponse(
                    id=mv.movement_id,
                    item_id=mv.item_id,
                    item_name=item_name or f"Item {mv.item_id}",
                    location_id=mv.location_id,
                    location_name=loc_name or f"Location {mv.location_id}",
                    movement_type=mv.movement_type,
                    quantity=mv.quantity,
                    reference_id=mv.reference_id,
                    reference_no=mv.remarks,
                    remarks=mv.remarks,
                    timestamp=mv.movement_date,
                )
            )

        return results


stock_service = StockService()
