from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Optional
from sqlalchemy import (
    Date,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.item import Item
    from app.models.location import Location
    from app.models.user import User


class StockAdjustment(Base):
    """Inventory quantity adjustment for audit discrepancies or damage write-offs."""

    __tablename__ = "stock_adjustments"

    adjustment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.item_id"), nullable=False)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.location_id"), nullable=False)
    quantity_change: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    adjustment_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False)

    __table_args__ = (
        Index("ix_adjustment_item_loc_date", "item_id", "location_id", "adjustment_date"),
    )

    # Relationships
    item: Mapped["Item"] = relationship("Item", back_populates="stock_adjustments")
    location: Mapped["Location"] = relationship("Location", back_populates="stock_adjustments")
    creator: Mapped["User"] = relationship("User", back_populates="stock_adjustments")

    def __repr__(self) -> str:
        return (
            f"<StockAdjustment(adjustment_id={self.adjustment_id}, item_id={self.item_id}, "
            f"location_id={self.location_id}, quantity_change={self.quantity_change})>"
        )
