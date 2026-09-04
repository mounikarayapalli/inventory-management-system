from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.inward_transaction import InwardTransaction


class Supplier(Base):
    """Goods and inventory supplier / vendor."""

    __tablename__ = "suppliers"

    supplier_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    supplier_name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    contact_person: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    inward_transactions: Mapped[List["InwardTransaction"]] = relationship("InwardTransaction", back_populates="supplier")

    def __repr__(self) -> str:
        return f"<Supplier(supplier_id={self.supplier_id}, supplier_name='{self.supplier_name}')>"
