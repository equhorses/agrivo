from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Subscriptions(Base):
    __tablename__ = "subscriptions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    plan = Column(String, nullable=False)
    status = Column(String, nullable=True, default='active', server_default='active')
    stripe_session_id = Column(String, nullable=True)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)