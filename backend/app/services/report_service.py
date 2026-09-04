"""Service layer for analytical, operational, and audit inventory reporting."""

from datetime import date, datetime, time
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException
from app.models.inward_transaction import InwardTransaction
from app.models.item import Item
from app.models.location import Location
from app.models.outward_transaction import OutwardTransaction
from app.models.stock_movement import StockMovement
from app.models.supplier import Supplier
from app.schemas.report import (
    InwardReportItem,
    MovementReportItem,
    OutwardReportItem,
    StockReportItem,
)
from app.services.inventory_logic import (
    quantize_currency,
    quantize_quantity,
    to_decimal,
)
from app.services.stock_service import stock_service


class ReportService:
    """Service generating operational inventory audit, movement, inward, and outward reports."""

    def get_stock_report(
        self,
        db: Session,
        location_id: Optional[int] = None,
        category_id: Optional[int] = None,
    ) -> List[StockReportItem]:
        """Generate comprehensive stock audit report across all items and storage locations.

        Computes exact on-hand stock and WAC valuation per Item + Location.
        """
        # Base item query
        item_stmt = select(Item).where(Item.is_active.is_(True)).order_by(Item.item_id.asc())
        if category_id is not None:
            item_stmt = item_stmt.where(Item.category_id == category_id)
        items = db.scalars(item_stmt).all()

        # Base location query
        loc_stmt = select(Location).where(Location.is_active.is_(True)).order_by(Location.location_id.asc())
        if location_id is not None:
            loc_stmt = loc_stmt.where(Location.location_id == location_id)
        locations = db.scalars(loc_stmt).all()

        results: List[StockReportItem] = []

        for item in items:
            cat_name = item.category.category_name if item.category else None

            for loc in locations:
                qty = stock_service.get_available_stock(db, item.item_id, loc.location_id)
                wac = stock_service.get_wac(db, item.item_id, loc.location_id)
                val = quantize_currency(qty * wac)

                min_lvl = Decimal(str(item.minimum_level))
                if qty <= Decimal("0.00"):
                    status = "OUT_OF_STOCK"
                    reorder = True
                elif qty < min_lvl:
                    status = "LOW_STOCK"
                    reorder = True
                else:
                    status = "IN_STOCK"
                    reorder = False

                results.append(
                    StockReportItem(
                        item_id=item.item_id,
                        item_code=item.item_code,
                        item_name=item.item_name,
                        sku=item.item_code,
                        category_name=cat_name,
                        location_id=loc.location_id,
                        location_name=loc.location_name,
                        quantity_on_hand=quantize_quantity(qty),
                        wac=quantize_currency(wac),
                        stock_value=val,
                        minimum_level=item.minimum_level,
                        min_stock_level=item.minimum_level,
                        stock_status=status,
                        reorder_recommended=reorder,
                    )
                )

        return results

    def get_movements_report(
        self,
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        item_id: Optional[int] = None,
        location_id: Optional[int] = None,
        movement_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[MovementReportItem]:
        """Generate historical stock movement audit trail report with date filtering."""
        if from_date and to_date and from_date > to_date:
            raise BadRequestException("from_date must be before or equal to to_date.")

        stmt = (
            select(StockMovement, Item.item_name, Item.item_code, Location.location_name)
            .join(Item, StockMovement.item_id == Item.item_id, isouter=True)
            .join(Location, StockMovement.location_id == Location.location_id, isouter=True)
        )

        if from_date:
            stmt = stmt.where(StockMovement.movement_date >= datetime.combine(from_date, time.min))
        if to_date:
            stmt = stmt.where(StockMovement.movement_date <= datetime.combine(to_date, time.max))
        if item_id is not None:
            stmt = stmt.where(StockMovement.item_id == item_id)
        if location_id is not None:
            stmt = stmt.where(StockMovement.location_id == location_id)
        if movement_type:
            m_upper = movement_type.upper()
            if m_upper not in ("OPENING", "INWARD", "OUTWARD", "RETURN", "ADJUSTMENT"):
                raise BadRequestException(f"Invalid movement_type filter: {movement_type}")
            stmt = stmt.where(StockMovement.movement_type == m_upper)

        stmt = (
            stmt.order_by(StockMovement.movement_date.desc(), StockMovement.movement_id.desc())
            .offset(skip)
            .limit(limit)
        )
        rows = db.execute(stmt).all()

        results: List[MovementReportItem] = []
        for mv, item_name, item_code, loc_name in rows:
            results.append(
                MovementReportItem(
                    transaction_id=mv.movement_id,
                    movement_id=mv.movement_id,
                    timestamp=mv.movement_date,
                    movement_date=mv.movement_date,
                    item_id=mv.item_id,
                    item_name=item_name or f"Item {mv.item_id}",
                    sku=item_code or "",
                    location_id=mv.location_id,
                    location_name=loc_name or f"Location {mv.location_id}",
                    from_location=loc_name if mv.movement_type == "OUTWARD" else None,
                    to_location=loc_name if mv.movement_type in ("OPENING", "INWARD", "RETURN") else None,
                    movement_type=mv.movement_type,
                    quantity=quantize_quantity(to_decimal(mv.quantity)),
                    reference_id=mv.reference_id,
                    reference_no=mv.remarks or (str(mv.reference_id) if mv.reference_id else None),
                    created_by=mv.created_by,
                    remarks=mv.remarks,
                )
            )

        return results

    def get_inward_report(
        self,
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        supplier_id: Optional[int] = None,
        location_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[InwardReportItem]:
        """Generate inbound receiving report from actual inward transactions."""
        if from_date and to_date and from_date > to_date:
            raise BadRequestException("from_date must be before or equal to to_date.")

        stmt = (
            select(InwardTransaction, Item.item_name, Supplier.supplier_name, Location.location_name)
            .join(Item, InwardTransaction.item_id == Item.item_id, isouter=True)
            .join(Supplier, InwardTransaction.supplier_id == Supplier.supplier_id, isouter=True)
            .join(Location, InwardTransaction.location_id == Location.location_id, isouter=True)
        )

        if from_date:
            stmt = stmt.where(InwardTransaction.inward_date >= from_date)
        if to_date:
            stmt = stmt.where(InwardTransaction.inward_date <= to_date)
        if supplier_id is not None:
            stmt = stmt.where(InwardTransaction.supplier_id == supplier_id)
        if location_id is not None:
            stmt = stmt.where(InwardTransaction.location_id == location_id)

        stmt = (
            stmt.order_by(InwardTransaction.inward_date.desc(), InwardTransaction.inward_id.desc())
            .offset(skip)
            .limit(limit)
        )
        rows = db.execute(stmt).all()

        results: List[InwardReportItem] = []
        for inw, item_name, supplier_name, loc_name in rows:
            results.append(
                InwardReportItem(
                    transaction_id=inw.inward_id,
                    inward_id=inw.inward_id,
                    inward_no=inw.inward_no,
                    inward_date=inw.inward_date,
                    timestamp=datetime.combine(inw.inward_date, time.min),
                    item_id=inw.item_id,
                    item_name=item_name or f"Item {inw.item_id}",
                    supplier_id=inw.supplier_id,
                    supplier_name=supplier_name or f"Supplier {inw.supplier_id}",
                    location_id=inw.location_id,
                    location_name=loc_name or f"Location {inw.location_id}",
                    quantity=quantize_quantity(to_decimal(inw.quantity)),
                    unit_cost=quantize_currency(to_decimal(inw.unit_cost)),
                    total_cost=quantize_currency(to_decimal(inw.total_cost)),
                    invoice_no=inw.remarks,
                    created_by=inw.created_by,
                    remarks=inw.remarks,
                )
            )

        return results

    def get_outward_report(
        self,
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        location_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[OutwardReportItem]:
        """Generate outbound dispatch and stock issue report with WAC valuation."""
        if from_date and to_date and from_date > to_date:
            raise BadRequestException("from_date must be before or equal to to_date.")

        stmt = (
            select(OutwardTransaction, Item.item_name, Location.location_name)
            .join(Item, OutwardTransaction.item_id == Item.item_id, isouter=True)
            .join(Location, OutwardTransaction.location_id == Location.location_id, isouter=True)
        )

        if from_date:
            stmt = stmt.where(OutwardTransaction.outward_date >= from_date)
        if to_date:
            stmt = stmt.where(OutwardTransaction.outward_date <= to_date)
        if location_id is not None:
            stmt = stmt.where(OutwardTransaction.location_id == location_id)

        stmt = (
            stmt.order_by(OutwardTransaction.outward_date.desc(), OutwardTransaction.outward_id.desc())
            .offset(skip)
            .limit(limit)
        )
        rows = db.execute(stmt).all()

        results: List[OutwardReportItem] = []
        for out_tx, item_name, loc_name in rows:
            wac = stock_service.get_wac(db, out_tx.item_id, out_tx.location_id)
            qty = quantize_quantity(to_decimal(out_tx.quantity))
            tot_val = quantize_currency(qty * wac)

            results.append(
                OutwardReportItem(
                    transaction_id=out_tx.outward_id,
                    outward_id=out_tx.outward_id,
                    outward_no=out_tx.outward_no,
                    outward_date=out_tx.outward_date,
                    timestamp=datetime.combine(out_tx.outward_date, time.min),
                    item_id=out_tx.item_id,
                    item_name=item_name or f"Item {out_tx.item_id}",
                    location_id=out_tx.location_id,
                    location_name=loc_name or f"Location {out_tx.location_id}",
                    quantity=qty,
                    reference_no=out_tx.outward_no,
                    issued_to=out_tx.issued_to,
                    purpose=out_tx.purpose,
                    unit_cost_used=quantize_currency(wac),
                    total_cost=tot_val,
                    recipient=out_tx.issued_to,
                    created_by=out_tx.created_by,
                    remarks=out_tx.remarks,
                )
            )

        return results


report_service = ReportService()
