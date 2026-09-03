from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String


class Profiles(Base):
    __tablename__ = "profiles"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    display_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    country = Column(String, nullable=True)
    description = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    rating = Column(Float, nullable=True, default=0, server_default='0')
    jobs_completed = Column(Integer, nullable=True, default=0, server_default='0')
    service_radius_km = Column(Integer, nullable=True, default=50, server_default='50')
    verified_kyc = Column(Boolean, nullable=True, default=False, server_default='false')
    categories = Column(String, nullable=True)
    language = Column(String, nullable=True, default='es', server_default='es')
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)