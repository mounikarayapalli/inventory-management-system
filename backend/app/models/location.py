from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.opening_stock import OpeningStock
    from app.models.inward_transaction import InwardTransaction
    from app.models.outward_transaction import OutwardTransaction
    from app.models.return_transaction import ReturnTransaction
    from app.models.stock_adjustment import StockAdjustment
    from app.models.stock_movement import StockMovement


class Location(Base):
    """Storage location or warehouse."""

    __tablename__ = "locations"

    location_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    location_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    opening_stocks: Mapped[List["OpeningStock"]] = relationship("OpeningStock", back_populates="location")
    inward_transactions: Mapped[List["InwardTransaction"]] = relationship("InwardTransaction", back_populates="location")
    outward_transactions: Mapped[List["OutwardTransaction"]] = relationship("OutwardTransaction", back_populates="location")
    return_transactions: Mapped[List["ReturnTransaction"]] = relationship("ReturnTransaction", back_populates="location")
    stock_adjustments: Mapped[List["StockAdjustment"]] = relationship("StockAdjustment", back_populates="location")
    stock_movements: Mapped[List["StockMovement"]] = relationship("StockMovement", back_populates="location")

    def __repr__(self) -> str:
        return f"<Location(location_id={self.location_id}, location_name='{self.location_name}')>"
