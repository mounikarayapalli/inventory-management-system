"""make_stock_movements_reference_id_not_null

Revision ID: 66a631c8444e
Revises: 5a1439c17e7a
Create Date: 2026-09-05 20:21:47.580424

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '66a631c8444e'
down_revision: Union[str, None] = '5a1439c17e7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'stock_movements',
        'reference_id',
        existing_type=sa.BigInteger(),
        nullable=False
    )


def downgrade() -> None:
    op.alter_column(
        'stock_movements',
        'reference_id',
        existing_type=sa.BigInteger(),
        nullable=True
    )
