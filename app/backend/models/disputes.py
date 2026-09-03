from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Disputes(Base):
    __tablename__ = "disputes"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    job_title = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    description = Column(String, nullable=False)
    amount_disputed = Column(Float, nullable=True)
    status = Column(String, nullable=False)
    resolution = Column(String, nullable=True)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)