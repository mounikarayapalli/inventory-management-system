from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy ORM models.

    Database models will be registered here once defined by the Database Lead.
    """
    pass
