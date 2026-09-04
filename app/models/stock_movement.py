from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Optional
from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.item import Item
    from app.models.location import Location
    from app.models.user import User


class MovementType(str, Enum):
    """Allowed stock movement classification types.

    Note: As per business rules, Distribution is a detail of Outward and does NOT
    have its own movement type. Distributions are recorded under OUTWARD.
    """

    OPENING = "OPENING"
    INWARD = "INWARD"
    OUTWARD = "OUTWARD"
    RETURN = "RETURN"
    ADJUSTMENT = "ADJUSTMENT"


class StockMovement(Base):
    """Single-source-of-truth chronological ledger for physical stock inventory changes."""

    __tablename__ = "stock_movements"

    movement_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True
    )
    item_id: Mapped[int] = mapped_column(ForeignKey("items.item_id"), nullable=False)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.location_id"), nullable=False)
    movement_type: Mapped[str] = mapped_column(String(30), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    reference_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    movement_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "movement_type IN ('OPENING', 'INWARD', 'OUTWARD', 'RETURN', 'ADJUSTMENT')",
            name="ck_stock_movements_type_valid",
        ),
        Index("ix_stock_movements_item_loc_date", "item_id", "location_id", "movement_date"),
    )

    # Relationships
    item: Mapped["Item"] = relationship("Item", back_populates="stock_movements")
    location: Mapped["Location"] = relationship("Location", back_populates="stock_movements")
    creator: Mapped["User"] = relationship("User", back_populates="stock_movements")

    def __repr__(self) -> str:
        return (
            f"<StockMovement(movement_id={self.movement_id}, item_id={self.item_id}, "
            f"location_id={self.location_id}, movement_type='{self.movement_type}', quantity={self.quantity})>"
        )
