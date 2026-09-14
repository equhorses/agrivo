"""professional response to reviews

Revision ID: e5f2c8b4a9d3
Revises: d8e4b2a6c1f7
Create Date: 2026-09-14 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f2c8b4a9d3'
down_revision: Union[str, Sequence[str], None] = 'd8e4b2a6c1f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('reviews', sa.Column('professional_response', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('reviews', 'professional_response')
