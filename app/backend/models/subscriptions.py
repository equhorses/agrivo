from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Subscriptions(Base):
    """One row per user: their current Agrivo subscription plan.

    status: 'inactive' | 'active' (kept in sync with Stripe via webhook —
    see services/subscriptions.py._handle_subscription_change).
    """

    __tablename__ = "subscriptions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    plan = Column(String, nullable=False, default="free", server_default="free")
    status = Column(String, nullable=True, default='inactive', server_default='inactive')
    stripe_session_id = Column(String, nullable=True)
    stripe_customer_id = Column(String(100), nullable=True)
    stripe_subscription_id = Column(String(100), nullable=True)
    cancel_at_period_end = Column(Boolean, nullable=False, default=False, server_default='false')
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)
    user_id = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)