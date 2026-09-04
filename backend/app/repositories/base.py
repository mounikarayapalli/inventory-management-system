from typing import Any, Generic, List, Optional, Type, TypeVar
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic repository providing standard CRUD operations using SQLAlchemy 2.x."""

    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """Fetch a single record by primary key."""
        return db.get(self.model, id)

    def list(self, db: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Fetch multiple records with pagination."""
        statement = select(self.model).offset(skip).limit(limit)
        return list(db.scalars(statement).all())

    def create(self, db: Session, obj_in: ModelType) -> ModelType:
        """Persist a new model instance."""
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def delete(self, db: Session, id: Any) -> Optional[ModelType]:
        """Delete a record by primary key."""
        obj = self.get(db, id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj
