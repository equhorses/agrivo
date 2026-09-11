from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Messages(Base):
    __tablename__ = "messages"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    job_id = Column(Integer, nullable=True)
    sender_id = Column(String, nullable=True)
    receiver_id = Column(String, nullable=True)
    content = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)