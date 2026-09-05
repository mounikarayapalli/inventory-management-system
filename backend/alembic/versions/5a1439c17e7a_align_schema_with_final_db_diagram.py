"""align_schema_with_final_db_diagram

Revision ID: 5a1439c17e7a
Revises: 58bc214000cc
Create Date: 2026-09-05 00:56:25.807021

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a1439c17e7a'
down_revision: Union[str, None] = '58bc214000cc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Drop index on distribution_transactions (item_id, location_id, distribution_date)
    op.drop_index('ix_distribution_item_loc_date', table_name='distribution_transactions')

    # 2. Drop foreign key constraints and columns item_id & location_id on distribution_transactions
    op.drop_constraint('distribution_transactions_item_id_fkey', 'distribution_transactions', type_='foreignkey')
    op.drop_constraint('distribution_transactions_location_id_fkey', 'distribution_transactions', type_='foreignkey')
    op.drop_column('distribution_transactions', 'location_id')
    op.drop_column('distribution_transactions', 'item_id')

    # 3. Add created_at column to distribution_transactions with server default
    op.add_column(
        'distribution_transactions',
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False)
    )

    # 4. Make outward_transactions.issued_to NOT NULL
    op.alter_column(
        'outward_transactions',
        'issued_to',
        existing_type=sa.String(length=150),
        nullable=False
    )

    # 5. Make return_transactions.source and reason NOT NULL
    op.alter_column(
        'return_transactions',
        'source',
        existing_type=sa.String(length=150),
        nullable=False
    )
    op.alter_column(
        'return_transactions',
        'reason',
        existing_type=sa.String(length=255),
        nullable=False
    )

    # 6. Make opening_stock.unit_cost nullable
    op.alter_column(
        'opening_stock',
        'unit_cost',
        existing_type=sa.Numeric(precision=12, scale=2),
        nullable=True
    )


def downgrade() -> None:
    # 1. Add distribution_transactions.item_id as nullable=True
    op.add_column(
        'distribution_transactions',
        sa.Column('item_id', sa.Integer(), nullable=True)
    )

    # 2. Add distribution_transactions.location_id as nullable=True
    op.add_column(
        'distribution_transactions',
        sa.Column('location_id', sa.Integer(), nullable=True)
    )

    # 3. Populate both columns by joining distribution_transactions.outward_id to outward_transactions
    op.execute(
        """
        UPDATE distribution_transactions
        SET item_id = outward_transactions.item_id,
            location_id = outward_transactions.location_id
        FROM outward_transactions
        WHERE distribution_transactions.outward_id = outward_transactions.outward_id
        """
    )

    # 4. Make item_id NOT NULL
    op.alter_column(
        'distribution_transactions',
        'item_id',
        existing_type=sa.Integer(),
        nullable=False
    )

    # 5. Make location_id NOT NULL
    op.alter_column(
        'distribution_transactions',
        'location_id',
        existing_type=sa.Integer(),
        nullable=False
    )

    # 6. Recreate the two foreign keys
    op.create_foreign_key(
        'distribution_transactions_item_id_fkey',
        'distribution_transactions',
        'items',
        ['item_id'],
        ['item_id']
    )
    op.create_foreign_key(
        'distribution_transactions_location_id_fkey',
        'distribution_transactions',
        'locations',
        ['location_id'],
        ['location_id']
    )

    # 7. Recreate ix_distribution_item_loc_date
    op.create_index(
        'ix_distribution_item_loc_date',
        'distribution_transactions',
        ['item_id', 'location_id', 'distribution_date'],
        unique=False
    )

    # 8. Drop created_at column from distribution_transactions
    op.drop_column('distribution_transactions', 'created_at')

    # 9. Make outward_transactions.issued_to nullable
    op.alter_column(
        'outward_transactions',
        'issued_to',
        existing_type=sa.String(length=150),
        nullable=True
    )

    # 10. Make return_transactions.source and reason nullable
    op.alter_column(
        'return_transactions',
        'reason',
        existing_type=sa.String(length=255),
        nullable=True
    )
    op.alter_column(
        'return_transactions',
        'source',
        existing_type=sa.String(length=150),
        nullable=True
    )

    # 11. Make opening_stock.unit_cost NOT NULL
    op.alter_column(
        'opening_stock',
        'unit_cost',
        existing_type=sa.Numeric(precision=12, scale=2),
        nullable=False
    )
