"""Service layer for inventory stock balances, per-location breakdown, and WAC calculation."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.item import Item
from app.models.location import Location
from app.models.opening_stock import OpeningStock
from app.models.inward_transaction import InwardTransaction
from app.models.stock_movement import MovementType, StockMovement
from app.schemas.stock import (
    LocationStockDetail,
    StockBreakdownSchema,
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

        Processes the stock ledger chronologically.

        Rules:
        - OPENING establishes the initial quantity and unit cost.
        - INWARD increases quantity and recalculates WAC.
        - OUTWARD decreases quantity but does not change WAC.
        - RETURN increases quantity but does not change WAC.
        - ADJUSTMENT changes quantity but does not change WAC.
        - DISTRIBUTION has no movement and therefore has no WAC effect.
        """
        movements_stmt = (
            select(StockMovement)
            .where(
                StockMovement.item_id == item_id,
                StockMovement.location_id == location_id,
            )
            .order_by(
                StockMovement.movement_date.asc(),
                StockMovement.movement_id.asc(),
                )
            )
        movements = db.scalars(movements_stmt).all()

        current_qty = Decimal("0.00")
        current_wac = Decimal("0.00")

        # Load source transactions referenced by the movement ledger.
        opening_ids = [
            mv.reference_id
            for mv in movements
            if str(mv.movement_type).upper() == MovementType.OPENING.value
            and mv.reference_id is not None
        ]

        inward_ids = [
            mv.reference_id
            for mv in movements
            if str(mv.movement_type).upper() == MovementType.INWARD.value
            and mv.reference_id is not None
        ]

        opening_map = {}
        if opening_ids:
            openings = db.scalars(
                select(OpeningStock).where(
                    OpeningStock.opening_stock_id.in_(opening_ids)
                )
            ).all()
            opening_map = {
                opening.opening_stock_id: opening
                for opening in openings
            }

        inward_map = {}
        if inward_ids:
            inwards = db.scalars(
                select(InwardTransaction).where(
                    InwardTransaction.inward_id.in_(inward_ids)
                )
            ).all()
            inward_map = {
                inward.inward_id: inward
                for inward in inwards
            }

        for movement in movements:
            movement_type = str(movement.movement_type).upper()
            quantity = to_decimal(movement.quantity)

            if movement_type == MovementType.OPENING.value:
                opening = opening_map.get(movement.reference_id)

                if opening is None:
                    continue

                current_qty = quantity
                current_wac = to_decimal(opening.unit_cost)

            elif movement_type == MovementType.INWARD.value:
                inward = inward_map.get(movement.reference_id)

                if inward is None:
                    continue

                inward_qty = quantity
                inward_cost = to_decimal(inward.unit_cost)

                current_wac = calculate_wac(
                    current_qty,
                    current_wac,
                    inward_qty,
                    inward_cost,
                )
                current_qty += inward_qty

            elif movement_type == MovementType.OUTWARD.value:
                current_qty -= quantity

            elif movement_type == MovementType.RETURN.value:
                current_qty += quantity

            elif movement_type == MovementType.ADJUSTMENT.value:
                current_qty += quantity

            else:
                raise NotFoundException(
                    f"Unsupported stock movement type encountered: {movement_type}"
                )

            # Prevent tiny Decimal rounding residue.
            if current_qty < Decimal("0"):
                current_qty = Decimal("0.00")

        # If there is no transaction-based cost, use the item's default cost.
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
            category_id=item.category_id,
            category_name=item.category.category_name if item.category else None,
            current_quantity=quantize_quantity(total_quantity),
            available_quantity=quantize_quantity(total_quantity),
            min_stock_level=item.minimum_level,
            status=determine_stock_status(total_quantity, item.minimum_level),
            average_unit_cost=avg_cost,
            wac=avg_cost,
            total_valuation=quantize_currency(total_value),
            stock_value=quantize_currency(total_value),
            locations=location_details,
            last_updated=datetime.now(timezone.utc),
        )

    def get_stock_breakdown(self, db: Session, item_id: int, location_id: int) -> StockBreakdownSchema:
        """Calculate movement breakdown for an item at a specific location."""
        stmt = (
            select(StockMovement)
            .where(
                StockMovement.item_id == item_id,
                StockMovement.location_id == location_id,
            )
        )
        movements = db.scalars(stmt).all()
        opening = Decimal("0.00")
        inward = Decimal("0.00")
        outward = Decimal("0.00")
        returns = Decimal("0.00")
        adjustments = Decimal("0.00")

        for m in movements:
            m_type = str(m.movement_type).upper()
            qty = to_decimal(m.quantity)
            if m_type == "OPENING":
                opening += qty
            elif m_type == "INWARD":
                inward += qty
            elif m_type == "OUTWARD":
                outward += qty
            elif m_type == "RETURN":
                returns += qty
            elif m_type == "ADJUSTMENT":
                adjustments += qty

        return StockBreakdownSchema(
            opening_stock=opening,
            inward=inward,
            outward=outward,
            returns=returns,
            adjustments=adjustments,
        )

    def list_stock(self, db: Session, skip: int = 0, limit: int = 500) -> List[StockResponse]:
        """List inventory stock balances maintained Item + Location wise across active items and locations."""
        items = db.scalars(
            select(Item).where(Item.is_active.is_(True)).order_by(Item.item_id.asc())
        ).all()
        locations = db.scalars(
            select(Location).where(Location.is_active.is_(True)).order_by(Location.location_name.asc())
        ).all()

        all_records: List[StockResponse] = []
        for item in items:
            cat_name = item.category.category_name if item.category else None
            cat_id = item.category_id
            for loc in locations:
                avail_qty = self.get_available_stock(db, item.item_id, loc.location_id)
                wac_val = self.get_wac(db, item.item_id, loc.location_id)
                tot_val = quantize_currency(avail_qty * wac_val)
                st = determine_stock_status(avail_qty, item.minimum_level)
                bk = self.get_stock_breakdown(db, item.item_id, loc.location_id)

                all_records.append(
                    StockResponse(
                        item_id=item.item_id,
                        item_name=item.item_name,
                        sku=item.item_code,
                        category_id=cat_id,
                        category_name=cat_name,
                        location_id=loc.location_id,
                        location_name=loc.location_name,
                        current_quantity=avail_qty,
                        available_quantity=avail_qty,
                        min_stock_level=item.minimum_level,
                        status=st,
                        average_unit_cost=wac_val,
                        wac=wac_val,
                        total_valuation=tot_val,
                        stock_value=tot_val,
                        breakdown=bk,
                        last_updated=datetime.now(timezone.utc),
                    )
                )

        return all_records[skip : skip + limit]

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
