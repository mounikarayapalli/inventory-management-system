from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Optional
from sqlalchemy import (
    CheckConstraint,
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


class ReturnTransaction(Base):
    """Stock return transaction into inventory."""

    __tablename__ = "return_transactions"

    return_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.item_id"), nullable=False)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.location_id"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    source: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    return_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_return_quantity_positive"),
        Index("ix_return_item_loc_date", "item_id", "location_id", "return_date"),
    )

    # Relationships
    item: Mapped["Item"] = relationship("Item", back_populates="return_transactions")
    location: Mapped["Location"] = relationship("Location", back_populates="return_transactions")
    creator: Mapped["User"] = relationship("User", back_populates="return_transactions")

    def __repr__(self) -> str:
        return (
            f"<ReturnTransaction(return_id={self.return_id}, item_id={self.item_id}, "
            f"location_id={self.location_id}, quantity={self.quantity})>"
        )
