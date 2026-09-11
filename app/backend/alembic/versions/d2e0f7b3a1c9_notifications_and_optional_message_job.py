"""notifications table + optional job_id on messages

Revision ID: d2e0f7b3a1c9
Revises: c1d9e6a2f5b7
Create Date: 2026-09-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd2e0f7b3a1c9'
down_revision: Union[str, Sequence[str], None] = 'c1d9e6a2f5b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), primary_key=True, index=True, autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('body', sa.String(), nullable=True),
        sa.Column('link', sa.String(), nullable=True),
        sa.Column('read', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)

    # Permite mensajes generales (no ligados a un trabajo concreto), que hasta
    # ahora fallaban siempre porque job_id era obligatorio en la tabla pero el
    # chat general no lo envía.
    op.alter_column('messages', 'job_id', existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    op.alter_column('messages', 'job_id', existing_type=sa.Integer(), nullable=False)
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')
