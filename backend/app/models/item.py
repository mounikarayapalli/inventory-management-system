from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.opening_stock import OpeningStock
    from app.models.inward_transaction import InwardTransaction
    from app.models.outward_transaction import OutwardTransaction
    from app.models.return_transaction import ReturnTransaction
    from app.models.stock_adjustment import StockAdjustment
    from app.models.stock_movement import StockMovement


class Item(Base):
    """Inventory item catalog record."""

    __tablename__ = "items"

    item_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.category_id"), nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)
    minimum_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    default_unit_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint("minimum_level >= 0", name="ck_items_minimum_level_non_negative"),
        Index("ix_items_category_id", "category_id"),
    )

    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="items")
    opening_stocks: Mapped[List["OpeningStock"]] = relationship("OpeningStock", back_populates="item")
    inward_transactions: Mapped[List["InwardTransaction"]] = relationship("InwardTransaction", back_populates="item")
    outward_transactions: Mapped[List["OutwardTransaction"]] = relationship("OutwardTransaction", back_populates="item")
    return_transactions: Mapped[List["ReturnTransaction"]] = relationship("ReturnTransaction", back_populates="item")
    stock_adjustments: Mapped[List["StockAdjustment"]] = relationship("StockAdjustment", back_populates="item")
    stock_movements: Mapped[List["StockMovement"]] = relationship("StockMovement", back_populates="item")

    def __repr__(self) -> str:
        return f"<Item(item_id={self.item_id}, item_code='{self.item_code}', item_name='{self.item_name}')>"
