"""ensure messages.job_id is actually nullable

Revision ID: e3f1a8c2b6d4
Revises: d2e0f7b3a1c9
Create Date: 2026-09-12 00:00:00.000000

La migración d2e0f7b3a1c9 incluía este mismo cambio, pero en producción la
tabla `notifications` ya existía (creada por el auto-repair del backend al
arrancar) y tuvimos que marcar esa revisión como aplicada con `alembic stamp
head` sin llegar a ejecutar su contenido real — así que el ALTER COLUMN de
`messages.job_id` nunca llegó a correr. Esta migración repite solo esa parte,
de forma segura (IF EXISTS / comprobando el estado actual) para que corra de
verdad esta vez.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e3f1a8c2b6d4'
down_revision: Union[str, Sequence[str], None] = 'd2e0f7b3a1c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('messages', 'job_id', existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    op.alter_column('messages', 'job_id', existing_type=sa.Integer(), nullable=False)
