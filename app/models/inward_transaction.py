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
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.item import Item
    from app.models.location import Location
    from app.models.supplier import Supplier
    from app.models.user import User


class InwardTransaction(Base):
    """Inbound stock receipt from supplier or procurement."""

    __tablename__ = "inward_transactions"

    inward_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    inward_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.item_id"), nullable=False)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.supplier_id"), nullable=False)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.location_id"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    inward_date: Mapped[date] = mapped_column(Date, nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_inward_quantity_positive"),
        CheckConstraint("unit_cost >= 0", name="ck_inward_unit_cost_non_negative"),
        CheckConstraint("total_cost >= 0", name="ck_inward_total_cost_non_negative"),
        Index("ix_inward_item_loc_date", "item_id", "location_id", "inward_date"),
    )

    # Relationships
    item: Mapped["Item"] = relationship("Item", back_populates="inward_transactions")
    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="inward_transactions")
    location: Mapped["Location"] = relationship("Location", back_populates="inward_transactions")
    creator: Mapped["User"] = relationship("User", back_populates="inward_transactions")

    def __repr__(self) -> str:
        return (
            f"<InwardTransaction(inward_id={self.inward_id}, inward_no='{self.inward_no}', "
            f"item_id={self.item_id}, quantity={self.quantity})>"
        )
