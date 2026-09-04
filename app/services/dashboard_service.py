"""Service layer for executive dashboard analytics, inventory KPIs, and activity feeds."""

from datetime import date, datetime, time, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.distribution_transaction import DistributionTransaction
from app.models.inward_transaction import InwardTransaction
from app.models.item import Item
from app.models.location import Location
from app.models.outward_transaction import OutwardTransaction
from app.models.stock_movement import StockMovement
from app.schemas.dashboard import (
    CategoryStockResponse,
    DashboardSummaryResponse,
    LocationStockResponse,
    LowStockItemResponse,
    OutOfStockItemResponse,
    RecentTransactionResponse,
)
from app.services.inventory_logic import (
    quantize_currency,
    quantize_quantity,
    to_decimal,
)
from app.services.stock_service import stock_service


class DashboardService:
    """Service handling executive dashboard metrics, stock alerts, and recent transactions."""

    def get_summary(self, db: Session) -> DashboardSummaryResponse:
        """Calculate high-level dashboard KPIs across all active items and locations.

        Provides:
        - Total active items and categories
        - Total available stock units (sum of on-hand stock across active locations)
        - Total stock valuation (using location-specific WAC)
        - Today's inward, outward, and distributed quantities
        - Low stock and out of stock counts
        - Total transactions processed today
        """
        # Active items and categories counts
        total_items = (
            db.scalar(select(func.count(Item.item_id)).where(Item.is_active.is_(True))) or 0
        )
        total_categories = (
            db.scalar(select(func.count(Category.category_id)).where(Category.is_active.is_(True)))
            or 0
        )

        active_items = db.scalars(
            select(Item).where(Item.is_active.is_(True)).order_by(Item.item_id.asc())
        ).all()
        active_locations = db.scalars(
            select(Location).where(Location.is_active.is_(True)).order_by(Location.location_id.asc())
        ).all()

        total_stock_units = Decimal("0.00")
        total_stock_value = Decimal("0.00")

        for item in active_items:
            for loc in active_locations:
                qty = stock_service.get_available_stock(db, item.item_id, loc.location_id)
                wac = stock_service.get_wac(db, item.item_id, loc.location_id)
                val = quantize_currency(qty * wac)
                total_stock_units += qty
                total_stock_value += val

        low_stock_items = self.get_low_stock_items(db)
        out_of_stock_items = self.get_out_of_stock_items(db)

        # Today's activity aggregations
        today = date.today()
        start_of_today = datetime.combine(today, time.min)
        end_of_today = datetime.combine(today, time.max)

        today_inward_sum = db.scalar(
            select(func.coalesce(func.sum(InwardTransaction.quantity), 0)).where(
                InwardTransaction.inward_date == today
            )
        )
        today_inward = quantize_quantity(to_decimal(today_inward_sum))

        today_outward_sum = db.scalar(
            select(func.coalesce(func.sum(OutwardTransaction.quantity), 0)).where(
                OutwardTransaction.outward_date == today
            )
        )
        today_outward = quantize_quantity(to_decimal(today_outward_sum))

        today_dist_sum = db.scalar(
            select(func.coalesce(func.sum(DistributionTransaction.quantity), 0)).where(
                DistributionTransaction.distribution_date == today
            )
        )
        today_dist = quantize_quantity(to_decimal(today_dist_sum))

        tx_today_count = (
            db.scalar(
                select(func.count(StockMovement.movement_id)).where(
                    StockMovement.movement_date >= start_of_today,
                    StockMovement.movement_date <= end_of_today,
                )
            )
            or 0
        )

        return DashboardSummaryResponse(
            total_items=total_items,
            total_categories=total_categories,
            total_stock_units=quantize_quantity(total_stock_units),
            total_stock_value=quantize_currency(total_stock_value),
            today_inward_quantity=today_inward,
            today_outward_quantity=today_outward,
            today_distributed_quantity=today_dist,
            low_stock_count=len(low_stock_items),
            out_of_stock_count=len(out_of_stock_items),
            transactions_today=tx_today_count,
        )

    def get_low_stock_items(self, db: Session) -> List[LowStockItemResponse]:
        """Return active items whose on-hand quantity at a location is below configured minimum level."""
        active_items = db.scalars(
            select(Item).where(Item.is_active.is_(True)).order_by(Item.item_id.asc())
        ).all()
        active_locations = db.scalars(
            select(Location).where(Location.is_active.is_(True)).order_by(Location.location_id.asc())
        ).all()

        low_stock_list: List[LowStockItemResponse] = []

        for item in active_items:
            # Query category name if available
            cat_name = item.category.category_name if item.category else None

            # Only check locations where movements have occurred for this item
            tracked_loc_ids = db.scalars(
                select(StockMovement.location_id)
                .where(StockMovement.item_id == item.item_id)
                .distinct()
            ).all()

            for loc in active_locations:
                # If item has activity at this location or is being inspected
                if loc.location_id in tracked_loc_ids:
                    qty = stock_service.get_available_stock(db, item.item_id, loc.location_id)
                    min_lvl = Decimal(str(item.minimum_level))
                    if Decimal("0.00") < qty < min_lvl:
                        low_stock_list.append(
                            LowStockItemResponse(
                                item_id=item.item_id,
                                item_name=item.item_name,
                                sku=item.item_code,
                                current_quantity=quantize_quantity(qty),
                                min_stock_level=item.minimum_level,
                                category_name=cat_name,
                                location_id=loc.location_id,
                                location_name=loc.location_name,
                            )
                        )

        return low_stock_list

    def get_out_of_stock_items(self, db: Session) -> List[OutOfStockItemResponse]:
        """Return active items/locations where available stock is completely depleted (zero)."""
        active_items = db.scalars(
            select(Item).where(Item.is_active.is_(True)).order_by(Item.item_id.asc())
        ).all()
        active_locations = db.scalars(
            select(Location).where(Location.is_active.is_(True)).order_by(Location.location_id.asc())
        ).all()

        out_of_stock_list: List[OutOfStockItemResponse] = []

        for item in active_items:
            cat_name = item.category.category_name if item.category else None

            tracked_loc_ids = db.scalars(
                select(StockMovement.location_id)
                .where(StockMovement.item_id == item.item_id)
                .distinct()
            ).all()

            # If the item has never had movements anywhere, it's out of stock globally
            if not tracked_loc_ids:
                out_of_stock_list.append(
                    OutOfStockItemResponse(
                        item_id=item.item_id,
                        item_name=item.item_name,
                        sku=item.item_code,
                        category_name=cat_name,
                        location_id=None,
                        location_name=None,
                        last_depleted_at=None,
                    )
                )
            else:
                # Check locations where movements have occurred
                for loc in active_locations:
                    if loc.location_id in tracked_loc_ids:
                        qty = stock_service.get_available_stock(db, item.item_id, loc.location_id)
                        if qty <= Decimal("0.00"):
                            last_mv = db.scalars(
                                select(StockMovement)
                                .where(
                                    StockMovement.item_id == item.item_id,
                                    StockMovement.location_id == loc.location_id,
                                )
                                .order_by(StockMovement.movement_date.desc(), StockMovement.movement_id.desc())
                                .limit(1)
                            ).first()
                            last_depleted = last_mv.movement_date if last_mv else None

                            out_of_stock_list.append(
                                OutOfStockItemResponse(
                                    item_id=item.item_id,
                                    item_name=item.item_name,
                                    sku=item.item_code,
                                    category_name=cat_name,
                                    location_id=loc.location_id,
                                    location_name=loc.location_name,
                                    last_depleted_at=last_depleted,
                                )
                            )

        return out_of_stock_list

    def get_recent_transactions(self, db: Session, limit: int = 10) -> List[RecentTransactionResponse]:
        """Return recent inventory activity from stock movement ledger."""
        stmt = (
            select(StockMovement, Item.item_name, Location.location_name)
            .join(Item, StockMovement.item_id == Item.item_id, isouter=True)
            .join(Location, StockMovement.location_id == Location.location_id, isouter=True)
            .order_by(StockMovement.movement_date.desc(), StockMovement.movement_id.desc())
            .limit(limit)
        )
        rows = db.execute(stmt).all()

        results: List[RecentTransactionResponse] = []
        for mv, item_name, loc_name in rows:
            results.append(
                RecentTransactionResponse(
                    id=mv.movement_id,
                    transaction_type=mv.movement_type,
                    item_name=item_name or f"Item {mv.item_id}",
                    quantity=quantize_quantity(to_decimal(mv.quantity)),
                    reference_no=mv.remarks or (str(mv.reference_id) if mv.reference_id else None),
                    timestamp=mv.movement_date,
                    location_name=loc_name or f"Location {mv.location_id}",
                    created_by=mv.created_by,
                    remarks=mv.remarks,
                )
            )

        return results

    def get_category_stock(self, db: Session) -> List[CategoryStockResponse]:
        """Calculate inventory units and WAC valuation grouped by category."""
        categories = db.scalars(
            select(Category).where(Category.is_active.is_(True)).order_by(Category.category_id.asc())
        ).all()
        locations = db.scalars(
            select(Location).where(Location.is_active.is_(True)).order_by(Location.location_id.asc())
        ).all()

        results: List[CategoryStockResponse] = []
        for cat in categories:
            items = db.scalars(
                select(Item).where(Item.category_id == cat.category_id, Item.is_active.is_(True))
            ).all()

            total_units = Decimal("0.00")
            total_val = Decimal("0.00")

            for itm in items:
                for loc in locations:
                    q = stock_service.get_available_stock(db, itm.item_id, loc.location_id)
                    w = stock_service.get_wac(db, itm.item_id, loc.location_id)
                    total_units += q
                    total_val += quantize_currency(q * w)

            results.append(
                CategoryStockResponse(
                    category_id=cat.category_id,
                    category_name=cat.category_name,
                    item_count=len(items),
                    total_units=quantize_quantity(total_units),
                    total_valuation=quantize_currency(total_val),
                )
            )

        return results

    def get_location_stock(self, db: Session) -> List[LocationStockResponse]:
        """Calculate inventory units and WAC valuation grouped by storage location."""
        locations = db.scalars(
            select(Location).where(Location.is_active.is_(True)).order_by(Location.location_id.asc())
        ).all()
        items = db.scalars(
            select(Item).where(Item.is_active.is_(True)).order_by(Item.item_id.asc())
        ).all()

        results: List[LocationStockResponse] = []
        for loc in locations:
            total_units = Decimal("0.00")
            total_val = Decimal("0.00")

            for itm in items:
                q = stock_service.get_available_stock(db, itm.item_id, loc.location_id)
                w = stock_service.get_wac(db, itm.item_id, loc.location_id)
                total_units += q
                total_val += quantize_currency(q * w)

            results.append(
                LocationStockResponse(
                    location_id=loc.location_id,
                    location_name=loc.location_name,
                    location_code=getattr(loc, "location_code", None) or f"LOC-{loc.location_id}",
                    total_units=quantize_quantity(total_units),
                    total_valuation=quantize_currency(total_val),
                )
            )

        return results


dashboard_service = DashboardService()
