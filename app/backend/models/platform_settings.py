from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer


class PlatformSettings(Base):
    """Single-row table (id always 1) for platform-wide settings that don't
    fit anywhere else — right now just the public launch date, used to know
    when a gifted subscription's free-access clock should start counting."""

    __tablename__ = "platform_settings"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, default=1)
    launch_date = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)
