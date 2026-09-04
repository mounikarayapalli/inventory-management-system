"""Service layer for inventory transactions, movement tracking, and material accounting."""

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ConflictException, NotFoundException
from app.models.distribution_transaction import DistributionTransaction
from app.models.inward_transaction import InwardTransaction
from app.models.item import Item
from app.models.location import Location
from app.models.opening_stock import OpeningStock
from app.models.outward_transaction import OutwardTransaction
from app.models.return_transaction import ReturnTransaction
from app.models.stock_adjustment import StockAdjustment
from app.models.stock_movement import MovementType, StockMovement
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.transaction import (
    AdjustmentRequest,
    AdjustmentUpdate,
    DistributionRequest,
    InwardRequest,
    OpeningStockRequest,
    OutwardRequest,
    ReturnRequest,
    TransactionResponse,
)
from app.services.inventory_logic import (
    compute_inward_total_cost,
    quantize_currency,
    quantize_quantity,
    to_decimal,
    validate_adjustment_stock,
    validate_distribution_quantity,
    validate_non_negative_cost,
    validate_outward_stock,
    validate_positive_quantity,
)
from app.services.stock_service import stock_service


class TransactionService:
    """Service handling atomic recording of inventory transactions and stock movements."""

    def _ensure_user_exists(self, db: Session, user_id: Optional[int]) -> int:
        """Validate user ID exists or fallback to the primary system user."""
        if user_id is not None:
            user = db.get(User, user_id)
            if user:
                return user.user_id
        # Fallback to the first available user in the system
        first_user = db.scalars(select(User).order_by(User.user_id.asc())).first()
        if first_user:
            return first_user.user_id
        return 1

    def _validate_item_and_location(
        self, db: Session, item_id: int, location_id: int
    ) -> tuple[Item, Location]:
        """Ensure both item and storage location exist and are active."""
        item = db.get(Item, item_id)
        if not item or not item.is_active:
            raise NotFoundException(f"Active item with ID {item_id} not found.")

        location = db.get(Location, location_id)
        if not location or not location.is_active:
            raise NotFoundException(f"Active location with ID {location_id} not found.")

        return item, location

    def record_opening_stock(
        self, db: Session, payload: OpeningStockRequest, created_by: Optional[int] = None
    ) -> TransactionResponse:
        """Record initial opening stock for an Item at a Location.

        Rules:
        - Quantity must be positive (> 0).
        - Unit cost must be non-negative (>= 0).
        - Increases available stock.
        - Creates a StockMovement with movement_type = OPENING.
        - Reject duplicate opening stock for the same Item + Location.
        """
        qty = validate_positive_quantity(payload.quantity, "Opening stock quantity")
        cost = validate_non_negative_cost(payload.unit_cost, "Opening stock unit cost")
        item, location = self._validate_item_and_location(db, payload.item_id, payload.location_id)
        user_id = self._ensure_user_exists(db, created_by or getattr(payload, "created_by", None))

        # Check for existing opening stock
        existing = db.scalars(
            select(OpeningStock).where(
                OpeningStock.item_id == item.item_id,
                OpeningStock.location_id == location.location_id,
            )
        ).first()
        if existing:
            raise ConflictException(
                f"Opening stock for item '{item.item_name}' at location '{location.location_name}' has already been recorded."
            )

        opening_date = payload.opening_date or date.today()

        opening_entry = OpeningStock(
            item_id=item.item_id,
            location_id=location.location_id,
            quantity=qty,
            unit_cost=cost,
            opening_date=opening_date,
            remarks=payload.remarks,
            created_by=user_id,
        )
        db.add(opening_entry)
        db.flush()

        # Create corresponding stock movement
        movement = StockMovement(
            item_id=item.item_id,
            location_id=location.location_id,
            movement_type=MovementType.OPENING.value,
            quantity=qty,
            reference_id=opening_entry.opening_stock_id,
            movement_date=datetime.now(timezone.utc),
            created_by=user_id,
            remarks=payload.remarks or "Opening stock balance",
        )
        db.add(movement)
        db.commit()
        db.refresh(opening_entry)

        return TransactionResponse(
            id=opening_entry.opening_stock_id,
            transaction_type="opening_stock",
            item_id=opening_entry.item_id,
            location_id=opening_entry.location_id,
            quantity=opening_entry.quantity,
            reference_no=payload.remarks or "OPENING-STOCK",
            status="completed",
            unit_cost=opening_entry.unit_cost,
            total_cost=quantize_currency(qty * cost),
            created_at=opening_entry.created_at,
        )

    def record_inward(
        self, db: Session, payload: InwardRequest, created_by: Optional[int] = None
    ) -> TransactionResponse:
        """Record inbound stock received from supplier or procurement.

        Rules:
        - Quantity must be positive (> 0).
        - Unit cost must be non-negative (>= 0).
        - Total cost must be consistent with quantity × unit_cost.
        - Increases available stock.
        - Creates a StockMovement with movement_type = INWARD.
        """
        qty = validate_positive_quantity(payload.quantity, "Inward quantity")
        cost = validate_non_negative_cost(payload.unit_cost, "Inward unit cost")
        total_cost = compute_inward_total_cost(qty, cost, payload.total_cost)

        item, location = self._validate_item_and_location(db, payload.item_id, payload.location_id)
        supplier = db.get(Supplier, payload.supplier_id)
        if not supplier or not supplier.is_active:
            raise NotFoundException(f"Active supplier with ID {payload.supplier_id} not found.")

        user_id = self._ensure_user_exists(db, created_by or getattr(payload, "created_by", None))
        inward_no = payload.inward_no or f"INW-{int(datetime.now(timezone.utc).timestamp())}"

        # Uniqueness check for inward_no
        existing_inw = db.scalars(
            select(InwardTransaction).where(InwardTransaction.inward_no == inward_no)
        ).first()
        if existing_inw:
            raise ConflictException(f"Inward receipt number '{inward_no}' already exists.")

        inward_date = payload.inward_date or date.today()

        inward_entry = InwardTransaction(
            inward_no=inward_no,
            item_id=item.item_id,
            supplier_id=supplier.supplier_id,
            location_id=location.location_id,
            quantity=qty,
            unit_cost=cost,
            total_cost=total_cost,
            inward_date=inward_date,
            remarks=payload.remarks or payload.invoice_no,
            created_by=user_id,
        )
        db.add(inward_entry)
        db.flush()

        # Create corresponding stock movement
        movement = StockMovement(
            item_id=item.item_id,
            location_id=location.location_id,
            movement_type=MovementType.INWARD.value,
            quantity=qty,
            reference_id=inward_entry.inward_id,
            movement_date=datetime.now(timezone.utc),
            created_by=user_id,
            remarks=f"Inward receipt {inward_no}",
        )
        db.add(movement)
        db.commit()
        db.refresh(inward_entry)

        return TransactionResponse(
            id=inward_entry.inward_id,
            transaction_type="inward",
            item_id=inward_entry.item_id,
            location_id=inward_entry.location_id,
            quantity=inward_entry.quantity,
            reference_no=inward_entry.inward_no,
            status="completed",
            unit_cost=inward_entry.unit_cost,
            total_cost=inward_entry.total_cost,
            created_at=inward_entry.created_at,
        )

    def record_outward(
        self, db: Session, payload: OutwardRequest, created_by: Optional[int] = None
    ) -> TransactionResponse:
        """Record outbound stock issue or dispatch.

        Rules:
        - Quantity must be positive (> 0).
        - Requested quantity must NOT exceed available on-hand stock for that Item + Location.
        - Negative stock must never be allowed.
        - Outward valuation uses current WAC for that Item + Location.
        - Decreases available stock.
        - Creates a StockMovement with movement_type = OUTWARD.
        """
        qty = validate_positive_quantity(payload.quantity, "Outward quantity")
        item, location = self._validate_item_and_location(db, payload.item_id, payload.location_id)

        # Check available stock at this specific location
        available_stock = stock_service.get_available_stock(db, item.item_id, location.location_id)
        validate_outward_stock(available_stock, qty)

        # Retrieve current WAC for valuation
        current_wac = stock_service.get_wac(db, item.item_id, location.location_id)
        total_valuation = quantize_currency(qty * current_wac)

        user_id = self._ensure_user_exists(db, created_by or getattr(payload, "created_by", None))
        outward_no = payload.outward_no or f"OUT-{int(datetime.now(timezone.utc).timestamp())}"

        # Uniqueness check for outward_no
        existing_out = db.scalars(
            select(OutwardTransaction).where(OutwardTransaction.outward_no == outward_no)
        ).first()
        if existing_out:
            raise ConflictException(f"Outward dispatch number '{outward_no}' already exists.")

        outward_date = payload.outward_date or date.today()

        outward_entry = OutwardTransaction(
            outward_no=outward_no,
            item_id=item.item_id,
            location_id=location.location_id,
            quantity=qty,
            issued_to=payload.issued_to,
            purpose=payload.purpose,
            outward_date=outward_date,
            remarks=payload.remarks or payload.reference_no,
            created_by=user_id,
        )
        db.add(outward_entry)
        db.flush()

        # Create corresponding stock movement
        movement = StockMovement(
            item_id=item.item_id,
            location_id=location.location_id,
            movement_type=MovementType.OUTWARD.value,
            quantity=qty,
            reference_id=outward_entry.outward_id,
            movement_date=datetime.now(timezone.utc),
            created_by=user_id,
            remarks=f"Outward issue {outward_no}",
        )
        db.add(movement)
        db.commit()
        db.refresh(outward_entry)

        return TransactionResponse(
            id=outward_entry.outward_id,
            transaction_type="outward",
            item_id=outward_entry.item_id,
            location_id=outward_entry.location_id,
            quantity=outward_entry.quantity,
            reference_no=outward_entry.outward_no,
            status="completed",
            unit_cost=current_wac,
            total_cost=total_valuation,
            created_at=datetime.now(timezone.utc),
        )

    def record_distribution(
        self, db: Session, payload: DistributionRequest, created_by: Optional[int] = None
    ) -> TransactionResponse:
        """Record an internal stock distribution line item attached to an Outward issue.

        CRITICAL RULES:
        - Distribution is a TYPE/DETAIL OF OUTWARD.
        - Distribution must NOT deduct stock separately (Outward performed the sole deduction).
        - Must reference outward_id.
        - Must NOT create a separate stock movement (movement remains OUTWARD).
        - Distribution quantity must not exceed the related outward transaction's quantity.
        """
        qty = validate_positive_quantity(payload.quantity, "Distribution quantity")

        if payload.outward_id is None:
            raise BadRequestException("A valid outward_id is required to record a distribution.")

        outward = db.get(OutwardTransaction, payload.outward_id)
        if not outward:
            raise NotFoundException(f"Related outward transaction with ID {payload.outward_id} not found.")

        # Ensure item matches the parent outward issue
        if outward.item_id != payload.item_id:
            raise BadRequestException(
                f"Distribution item_id ({payload.item_id}) does not match parent outward item_id ({outward.item_id})."
            )

        # Determine location (fallback to outward issue location if not specified)
        location_id = payload.location_id or payload.source_location_id or outward.location_id
        if location_id != outward.location_id:
            raise BadRequestException(
                f"Distribution location_id ({location_id}) must match outward origin location ({outward.location_id})."
            )

        # Validate that cumulative distributions do not exceed outward issue quantity
        already_distributed = sum(
            (to_decimal(d.quantity) for d in outward.distributions), Decimal("0.00")
        )
        validate_distribution_quantity(outward.quantity, already_distributed, qty)

        user_id = self._ensure_user_exists(db, created_by or getattr(payload, "created_by", None))
        dist_date = payload.distribution_date or date.today()

        dist_entry = DistributionTransaction(
            outward_id=outward.outward_id,
            item_id=outward.item_id,
            location_id=location_id,
            quantity=qty,
            recipient=payload.recipient,
            batch=payload.batch,
            department=payload.department,
            purpose=payload.purpose,
            distribution_date=dist_date,
            created_by=user_id,
        )
        db.add(dist_entry)
        # NOTE: WE DELIBERATELY DO NOT ADD A STOCK MOVEMENT HERE.
        # Stock deduction was already executed when the OutwardTransaction was created.

        db.commit()
        db.refresh(dist_entry)

        # Retrieve current WAC for valuation reference
        current_wac = stock_service.get_wac(db, outward.item_id, location_id)

        return TransactionResponse(
            id=dist_entry.distribution_id,
            transaction_type="distribution",
            item_id=dist_entry.item_id,
            location_id=dist_entry.location_id,
            quantity=dist_entry.quantity,
            reference_no=f"DIST-OUT-{outward.outward_id}",
            status="completed",
            unit_cost=current_wac,
            total_cost=quantize_currency(qty * current_wac),
            created_at=datetime.now(timezone.utc),
        )

    def record_return(
        self, db: Session, payload: ReturnRequest, created_by: Optional[int] = None
    ) -> TransactionResponse:
        """Record returned inventory goods.

        Rules:
        - Quantity must be positive (> 0).
        - Increases available stock.
        - Creates a StockMovement with movement_type = RETURN.
        """
        qty = validate_positive_quantity(payload.quantity, "Return quantity")
        item, location = self._validate_item_and_location(db, payload.item_id, payload.location_id)
        user_id = self._ensure_user_exists(db, created_by or getattr(payload, "created_by", None))
        return_date = payload.return_date or date.today()

        return_entry = ReturnTransaction(
            item_id=item.item_id,
            location_id=location.location_id,
            quantity=qty,
            source=payload.source,
            reason=payload.reason,
            return_date=return_date,
            created_by=user_id,
        )
        db.add(return_entry)
        db.flush()

        # Create corresponding stock movement
        movement = StockMovement(
            item_id=item.item_id,
            location_id=location.location_id,
            movement_type=MovementType.RETURN.value,
            quantity=qty,
            reference_id=return_entry.return_id,
            movement_date=datetime.now(timezone.utc),
            created_by=user_id,
            remarks=payload.reason or f"Return from {payload.source or 'customer'}",
        )
        db.add(movement)
        db.commit()
        db.refresh(return_entry)

        current_wac = stock_service.get_wac(db, item.item_id, location.location_id)

        return TransactionResponse(
            id=return_entry.return_id,
            transaction_type="return",
            item_id=return_entry.item_id,
            location_id=return_entry.location_id,
            quantity=return_entry.quantity,
            reference_no=payload.reason or "RETURN-TX",
            status="completed",
            unit_cost=current_wac,
            total_cost=quantize_currency(qty * current_wac),
            created_at=datetime.now(timezone.utc),
        )

    def record_adjustment(
        self, db: Session, payload: AdjustmentRequest, created_by: Optional[int] = None
    ) -> TransactionResponse:
        """Record a physical count adjustment or damage write-off.

        Rules:
        - Quantity change can be positive (found stock) or negative (write-off).
        - Cannot be zero.
        - Negative adjustment must NOT cause stock to fall below zero.
        - Creates a StockMovement with movement_type = ADJUSTMENT.
        """
        delta = quantize_quantity(to_decimal(payload.adjusted_quantity))
        item, location = self._validate_item_and_location(db, payload.item_id, payload.location_id)

        # Check that negative adjustment does not cause negative stock
        available_stock = stock_service.get_available_stock(db, item.item_id, location.location_id)
        validate_adjustment_stock(available_stock, delta)

        user_id = self._ensure_user_exists(db, created_by or getattr(payload, "created_by", None))
        adj_date = payload.adjustment_date or date.today()

        adj_entry = StockAdjustment(
            item_id=item.item_id,
            location_id=location.location_id,
            quantity_change=delta,
            reason=payload.reason,
            adjustment_date=adj_date,
            created_by=user_id,
        )
        db.add(adj_entry)
        db.flush()

        # Create corresponding stock movement
        movement = StockMovement(
            item_id=item.item_id,
            location_id=location.location_id,
            movement_type=MovementType.ADJUSTMENT.value,
            quantity=delta,
            reference_id=adj_entry.adjustment_id,
            movement_date=datetime.now(timezone.utc),
            created_by=user_id,
            remarks=payload.reason,
        )
        db.add(movement)
        db.commit()
        db.refresh(adj_entry)

        current_wac = stock_service.get_wac(db, item.item_id, location.location_id)

        return TransactionResponse(
            id=adj_entry.adjustment_id,
            transaction_type="adjustment",
            item_id=adj_entry.item_id,
            location_id=adj_entry.location_id,
            quantity=delta,
            reference_no=payload.reason,
            status="completed",
            unit_cost=current_wac,
            total_cost=quantize_currency(abs(delta) * current_wac),
            created_at=datetime.now(timezone.utc),
        )

    def list_adjustments(
        self, db: Session, skip: int = 0, limit: int = 100
    ) -> List[StockAdjustment]:
        """Retrieve paginated list of stock adjustments."""
        stmt = (
            select(StockAdjustment)
            .order_by(StockAdjustment.adjustment_id.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.scalars(stmt).all())

    def get_adjustment(self, db: Session, adjustment_id: int) -> StockAdjustment:
        """Retrieve a single stock adjustment record by ID."""
        adjustment = db.get(StockAdjustment, adjustment_id)
        if not adjustment:
            raise NotFoundException(f"Stock adjustment with ID {adjustment_id} not found.")
        return adjustment

    def update_adjustment(
        self, db: Session, adjustment_id: int, payload: AdjustmentUpdate
    ) -> StockAdjustment:
        """Update an adjustment record (e.g. audit reason/remarks). Admin only."""
        adjustment = self.get_adjustment(db, adjustment_id)
        if payload.reason is not None:
            adjustment.reason = payload.reason
        db.commit()
        db.refresh(adjustment)
        return adjustment


transaction_service = TransactionService()
