"""profile view counter

Revision ID: d8e4b2a6c1f7
Revises: a7c3f1e9d5b2
Create Date: 2026-09-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd8e4b2a6c1f7'
down_revision: Union[str, Sequence[str], None] = 'a7c3f1e9d5b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('profiles', sa.Column('profile_views', sa.Integer(), server_default='0', nullable=True))


def downgrade() -> None:
    op.drop_column('profiles', 'profile_views')
