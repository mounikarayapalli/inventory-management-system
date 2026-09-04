from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import settings
from app.db.base import Base

# Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import all 13 model modules to ensure their SQLAlchemy 2.0 declarative
# mappings are registered on Base.metadata before Alembic inspects target_metadata.
import app.models  # noqa: F401
from app.models import (
    Category,
    DistributionTransaction,
    InwardTransaction,
    Item,
    Location,
    OpeningStock,
    OutwardTransaction,
    ReturnTransaction,
    Role,
    StockAdjustment,
    StockMovement,
    Supplier,
    User,
)

# Overwrite sqlalchemy.url with centralized app settings
if settings.sync_database_url:
    config.set_main_option("sqlalchemy.url", settings.sync_database_url.replace("%", "%%"))

# Add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = context.config.attributes.get("connection", None)

    if connectable is None:
        connectable = engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
