"""profile phone and preferred currency

Revision ID: f4a2c9e7d1b3
Revises: e3f1a8c2b6d4
Create Date: 2026-09-12 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f4a2c9e7d1b3'
down_revision: Union[str, Sequence[str], None] = 'e3f1a8c2b6d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('profiles', sa.Column('phone', sa.String(), nullable=True))
    op.add_column('profiles', sa.Column('currency', sa.String(), server_default='USD', nullable=True))


def downgrade() -> None:
    op.drop_column('profiles', 'currency')
    op.drop_column('profiles', 'phone')
