"""Service layer for warehouse and storage location master data management."""

from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ConflictException, NotFoundException
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationResponse, LocationUpdate


class LocationService:
    """Service managing storage locations and warehouse bays."""

    @staticmethod
    def _to_response(location: Location) -> LocationResponse:
        return LocationResponse(
            id=location.location_id,
            location_id=location.location_id,
            name=location.location_name,
            location_name=location.location_name,
            code=f"LOC-{location.location_id:02d}",
            description=location.description,
            is_active=location.is_active,
        )

    def list_locations(
        self, db: Session, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None
    ) -> List[LocationResponse]:
        """Retrieve paginated list of locations with optional active filter."""
        stmt = select(Location).order_by(Location.location_id.asc())
        if is_active is not None:
            stmt = stmt.where(Location.is_active == is_active)
        stmt = stmt.offset(skip).limit(limit)
        locations = db.scalars(stmt).all()
        return [self._to_response(l) for l in locations]

    def get_location_by_id(self, db: Session, location_id: int) -> LocationResponse:
        """Retrieve a single location by primary key ID."""
        location = db.get(Location, location_id)
        if not location:
            raise NotFoundException(f"Location with ID {location_id} not found.")
        return self._to_response(location)

    def create_location(self, db: Session, payload: LocationCreate) -> LocationResponse:
        """Create a new storage location with duplicate name validation."""
        raw_name = payload.location_name or payload.name
        if not raw_name or not raw_name.strip():
            raise BadRequestException("Location name is required.")
        name = raw_name.strip()

        # Check duplicate location name (case-insensitive)
        existing = db.scalars(
            select(Location).where(func.lower(Location.location_name) == name.lower())
        ).first()
        if existing:
            raise ConflictException(f"Location with name '{name}' already exists.")

        location = Location(
            location_name=name,
            description=payload.description,
            is_active=payload.is_active if payload.is_active is not None else True,
        )
        db.add(location)
        db.commit()
        db.refresh(location)
        return self._to_response(location)

    def update_location(self, db: Session, location_id: int, payload: LocationUpdate) -> LocationResponse:
        """Update an existing location record."""
        location = db.get(Location, location_id)
        if not location:
            raise NotFoundException(f"Location with ID {location_id} not found.")

        raw_name = payload.location_name or payload.name
        if raw_name is not None:
            name = raw_name.strip()
            if not name:
                raise BadRequestException("Location name cannot be empty.")
            if name.lower() != location.location_name.lower():
                existing = db.scalars(
                    select(Location).where(
                        func.lower(Location.location_name) == name.lower(),
                        Location.location_id != location_id,
                    )
                ).first()
                if existing:
                    raise ConflictException(f"Location with name '{name}' already exists.")
            location.location_name = name

        if payload.description is not None:
            location.description = payload.description
        if payload.is_active is not None:
            location.is_active = payload.is_active

        db.commit()
        db.refresh(location)
        return self._to_response(location)


location_service = LocationService()
