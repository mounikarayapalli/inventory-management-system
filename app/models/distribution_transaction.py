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
    from app.models.outward_transaction import OutwardTransaction
    from app.models.user import User


class DistributionTransaction(Base):
    """Internal stock distribution or department transfer breakdown under an outward issue."""

    __tablename__ = "distribution_transactions"

    distribution_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    outward_id: Mapped[int] = mapped_column(ForeignKey("outward_transactions.outward_id"), nullable=False)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.item_id"), nullable=False)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.location_id"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    recipient: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    batch: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    purpose: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    distribution_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_distribution_quantity_positive"),
        Index("ix_distribution_item_loc_date", "item_id", "location_id", "distribution_date"),
    )

    # Relationships
    outward_transaction: Mapped["OutwardTransaction"] = relationship(
        "OutwardTransaction", back_populates="distributions"
    )
    item: Mapped["Item"] = relationship("Item", back_populates="distribution_transactions")
    location: Mapped["Location"] = relationship("Location", back_populates="distribution_transactions")
    creator: Mapped["User"] = relationship("User", back_populates="distribution_transactions")

    def __repr__(self) -> str:
        return (
            f"<DistributionTransaction(distribution_id={self.distribution_id}, outward_id={self.outward_id}, "
            f"item_id={self.item_id}, quantity={self.quantity})>"
        )
