from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional
from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.item import Item
    from app.models.location import Location
    from app.models.user import User


class OpeningStock(Base):
    """Initial baseline stock recorded for an item at a specific location."""

    __tablename__ = "opening_stock"

    opening_stock_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.item_id"), nullable=False)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.location_id"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    unit_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    opening_date: Mapped[date] = mapped_column(Date, nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_opening_stock_quantity_positive"),
        CheckConstraint("unit_cost >= 0", name="ck_opening_stock_unit_cost_non_negative"),
        Index("ix_opening_stock_item_loc_date", "item_id", "location_id", "opening_date"),
    )

    # Relationships
    item: Mapped["Item"] = relationship("Item", back_populates="opening_stocks")
    location: Mapped["Location"] = relationship("Location", back_populates="opening_stocks")
    creator: Mapped["User"] = relationship("User", back_populates="opening_stocks")

    def __repr__(self) -> str:
        return (
            f"<OpeningStock(opening_stock_id={self.opening_stock_id}, item_id={self.item_id}, "
            f"location_id={self.location_id}, quantity={self.quantity})>"
        )
