"""invitations + platform settings

Revision ID: b7e4f1a8c3d2
Revises: f3a7c9d1e4b2
Create Date: 2026-09-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7e4f1a8c3d2'
down_revision: Union[str, Sequence[str], None] = 'f3a7c9d1e4b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'invitations',
        sa.Column('id', sa.Integer(), primary_key=True, index=True, autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False, index=True),
        sa.Column('plan', sa.String(length=20), nullable=False, server_default='pro'),
        sa.Column('months', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('redeemed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'platform_settings',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('launch_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    platform_settings = sa.table('platform_settings', sa.column('id', sa.Integer))
    op.bulk_insert(platform_settings, [{'id': 1}])


def downgrade() -> None:
    op.drop_table('platform_settings')
    op.drop_table('invitations')
