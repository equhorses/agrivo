"""profile manual featured flag

Revision ID: a7c3f1e9d5b2
Revises: f4a2c9e7d1b3
Create Date: 2026-09-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a7c3f1e9d5b2'
down_revision: Union[str, Sequence[str], None] = 'f4a2c9e7d1b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('profiles', sa.Column('featured', sa.Boolean(), server_default='false', nullable=True))


def downgrade() -> None:
    op.drop_column('profiles', 'featured')
