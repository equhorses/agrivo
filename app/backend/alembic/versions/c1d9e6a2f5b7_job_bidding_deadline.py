"""job bidding deadline

Revision ID: c1d9e6a2f5b7
Revises: b7e4f1a8c3d2
Create Date: 2026-09-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c1d9e6a2f5b7'
down_revision: Union[str, Sequence[str], None] = 'b7e4f1a8c3d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # NULL = sin límite de tiempo (subasta abierta indefinidamente).
    op.add_column('jobs', sa.Column('bidding_ends_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('jobs', 'bidding_ends_at')
