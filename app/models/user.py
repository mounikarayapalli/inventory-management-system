from datetime import datetime
from typing import TYPE_CHECKING, List
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.role import Role
    from app.models.opening_stock import OpeningStock
    from app.models.inward_transaction import InwardTransaction
    from app.models.outward_transaction import OutwardTransaction
    from app.models.distribution_transaction import DistributionTransaction
    from app.models.return_transaction import ReturnTransaction
    from app.models.stock_adjustment import StockAdjustment
    from app.models.stock_movement import StockMovement


class User(Base):
    """System user with role-based access control and audit accountability."""

    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.role_id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    role: Mapped["Role"] = relationship("Role", back_populates="users")
    opening_stocks: Mapped[List["OpeningStock"]] = relationship("OpeningStock", back_populates="creator")
    inward_transactions: Mapped[List["InwardTransaction"]] = relationship("InwardTransaction", back_populates="creator")
    outward_transactions: Mapped[List["OutwardTransaction"]] = relationship("OutwardTransaction", back_populates="creator")
    distribution_transactions: Mapped[List["DistributionTransaction"]] = relationship("DistributionTransaction", back_populates="creator")
    return_transactions: Mapped[List["ReturnTransaction"]] = relationship("ReturnTransaction", back_populates="creator")
    stock_adjustments: Mapped[List["StockAdjustment"]] = relationship("StockAdjustment", back_populates="creator")
    stock_movements: Mapped[List["StockMovement"]] = relationship("StockMovement", back_populates="creator")

    def __repr__(self) -> str:
        return f"<User(user_id={self.user_id}, username='{self.username}', role_id={self.role_id})>"
