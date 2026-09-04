from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import (
    CheckConstraint,
    Date,
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
    from app.models.distribution_transaction import DistributionTransaction
    from app.models.item import Item
    from app.models.location import Location
    from app.models.user import User


class OutwardTransaction(Base):
    """Outbound stock issue or dispatch."""

    __tablename__ = "outward_transactions"

    outward_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    outward_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.item_id"), nullable=False)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.location_id"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    issued_to: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    purpose: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    outward_date: Mapped[date] = mapped_column(Date, nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_outward_quantity_positive"),
        Index("ix_outward_item_loc_date", "item_id", "location_id", "outward_date"),
    )

    # Relationships
    item: Mapped["Item"] = relationship("Item", back_populates="outward_transactions")
    location: Mapped["Location"] = relationship("Location", back_populates="outward_transactions")
    creator: Mapped["User"] = relationship("User", back_populates="outward_transactions")
    distributions: Mapped[List["DistributionTransaction"]] = relationship(
        "DistributionTransaction", back_populates="outward_transaction"
    )

    def __repr__(self) -> str:
        return (
            f"<OutwardTransaction(outward_id={self.outward_id}, outward_no='{self.outward_no}', "
            f"item_id={self.item_id}, quantity={self.quantity})>"
        )
