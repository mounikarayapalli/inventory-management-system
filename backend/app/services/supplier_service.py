"""Service layer for supplier and vendor master data management."""

from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ConflictException, NotFoundException
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierResponse, SupplierUpdate


class SupplierService:
    """Service managing supplier and vendor master records."""

    @staticmethod
    def _to_response(supplier: Supplier) -> SupplierResponse:
        return SupplierResponse(
            id=supplier.supplier_id,
            supplier_id=supplier.supplier_id,
            name=supplier.supplier_name,
            supplier_name=supplier.supplier_name,
            contact_person=supplier.contact_person,
            email=supplier.email,
            phone=supplier.phone,
            address=supplier.address,
            is_active=supplier.is_active,
        )

    def list_suppliers(
        self, db: Session, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None
    ) -> List[SupplierResponse]:
        """Retrieve paginated list of suppliers with optional active filter."""
        stmt = select(Supplier).order_by(Supplier.supplier_id.asc())
        if is_active is not None:
            stmt = stmt.where(Supplier.is_active == is_active)
        stmt = stmt.offset(skip).limit(limit)
        suppliers = db.scalars(stmt).all()
        return [self._to_response(s) for s in suppliers]

    def get_supplier_by_id(self, db: Session, supplier_id: int) -> SupplierResponse:
        """Retrieve a single supplier by primary key ID."""
        supplier = db.get(Supplier, supplier_id)
        if not supplier:
            raise NotFoundException(f"Supplier with ID {supplier_id} not found.")
        return self._to_response(supplier)

    def create_supplier(self, db: Session, payload: SupplierCreate) -> SupplierResponse:
        """Create a new supplier with duplicate name validation."""
        raw_name = payload.supplier_name or payload.name
        if not raw_name or not raw_name.strip():
            raise BadRequestException("Supplier name is required.")
        name = raw_name.strip()

        # Check duplicate supplier name (case-insensitive)
        existing = db.scalars(
            select(Supplier).where(func.lower(Supplier.supplier_name) == name.lower())
        ).first()
        if existing:
            raise ConflictException(f"Supplier with name '{name}' already exists.")

        supplier = Supplier(
            supplier_name=name,
            contact_person=payload.contact_person,
            email=payload.email,
            phone=payload.phone,
            address=payload.address,
            is_active=payload.is_active if payload.is_active is not None else True,
        )
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        return self._to_response(supplier)

    def update_supplier(self, db: Session, supplier_id: int, payload: SupplierUpdate) -> SupplierResponse:
        """Update an existing supplier record."""
        supplier = db.get(Supplier, supplier_id)
        if not supplier:
            raise NotFoundException(f"Supplier with ID {supplier_id} not found.")

        raw_name = payload.supplier_name or payload.name
        if raw_name is not None:
            name = raw_name.strip()
            if not name:
                raise BadRequestException("Supplier name cannot be empty.")
            if name.lower() != supplier.supplier_name.lower():
                existing = db.scalars(
                    select(Supplier).where(
                        func.lower(Supplier.supplier_name) == name.lower(),
                        Supplier.supplier_id != supplier_id,
                    )
                ).first()
                if existing:
                    raise ConflictException(f"Supplier with name '{name}' already exists.")
            supplier.supplier_name = name

        if payload.contact_person is not None:
            supplier.contact_person = payload.contact_person
        if payload.email is not None:
            supplier.email = payload.email
        if payload.phone is not None:
            supplier.phone = payload.phone
        if payload.address is not None:
            supplier.address = payload.address
        if payload.is_active is not None:
            supplier.is_active = payload.is_active

        db.commit()
        db.refresh(supplier)
        return self._to_response(supplier)


supplier_service = SupplierService()
