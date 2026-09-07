"""stripe subscriptions + house ads system

Revision ID: f3a7c9d1e4b2
Revises: 8382ea72f16a
Create Date: 2026-09-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a7c9d1e4b2'
down_revision: Union[str, Sequence[str], None] = '8382ea72f16a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- subscriptions: add real Stripe lifecycle columns ---
    op.add_column('subscriptions', sa.Column('stripe_customer_id', sa.String(length=100), nullable=True))
    op.add_column('subscriptions', sa.Column('stripe_subscription_id', sa.String(length=100), nullable=True))
    op.add_column(
        'subscriptions',
        sa.Column('cancel_at_period_end', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.add_column('subscriptions', sa.Column('subscription_end_date', sa.DateTime(timezone=True), nullable=True))
    op.alter_column('subscriptions', 'plan', server_default='free')
    op.alter_column('subscriptions', 'status', server_default='inactive')
    op.create_unique_constraint('uq_subscriptions_user_id', 'subscriptions', ['user_id'])

    # --- house_ads: live banner content per slot ---
    op.create_table(
        'house_ads',
        sa.Column('id', sa.Integer(), primary_key=True, index=True, autoincrement=True, nullable=False),
        sa.Column('slot', sa.String(length=50), nullable=False, unique=True, index=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('link_url', sa.String(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # --- ad_slot_configs: price + self-service toggle per slot ---
    op.create_table(
        'ad_slot_configs',
        sa.Column('slot', sa.String(length=50), primary_key=True),
        sa.Column('price_cents', sa.Integer(), nullable=False, server_default='4999'),
        sa.Column('self_service_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # --- ad_bookings: advertiser purchases/reservations of a slot ---
    op.create_table(
        'ad_bookings',
        sa.Column('id', sa.Integer(), primary_key=True, index=True, autoincrement=True, nullable=False),
        sa.Column('slot', sa.String(length=50), nullable=False, index=True),
        sa.Column('user_id', sa.String(), nullable=False, index=True),
        sa.Column('advertiser_name', sa.String(length=200), nullable=False),
        sa.Column('advertiser_email', sa.String(length=255), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('link_url', sa.String(), nullable=False),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending_payment'),
        sa.Column('stripe_session_id', sa.String(length=200), nullable=True),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('approved_by', sa.String(), nullable=True),
        sa.Column('rejected_reason', sa.String(), nullable=True),
    )

    # Seed the three slots decided for launch: home_top, jobs_top, pros_top.
    ad_slot_configs = sa.table(
        'ad_slot_configs',
        sa.column('slot', sa.String),
        sa.column('price_cents', sa.Integer),
        sa.column('self_service_enabled', sa.Boolean),
    )
    op.bulk_insert(
        ad_slot_configs,
        [
            {'slot': 'home_top', 'price_cents': 4999, 'self_service_enabled': True},
            {'slot': 'jobs_top', 'price_cents': 4999, 'self_service_enabled': True},
            {'slot': 'pros_top', 'price_cents': 4999, 'self_service_enabled': True},
        ],
    )


def downgrade() -> None:
    op.drop_table('ad_bookings')
    op.drop_table('ad_slot_configs')
    op.drop_table('house_ads')
    op.drop_constraint('uq_subscriptions_user_id', 'subscriptions', type_='unique')
    op.alter_column('subscriptions', 'status', server_default='active')
    op.alter_column('subscriptions', 'plan', server_default=None)
    op.drop_column('subscriptions', 'subscription_end_date')
    op.drop_column('subscriptions', 'cancel_at_period_end')
    op.drop_column('subscriptions', 'stripe_subscription_id')
    op.drop_column('subscriptions', 'stripe_customer_id')
