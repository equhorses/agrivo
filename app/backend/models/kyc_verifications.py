from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Kyc_verifications(Base):
    __tablename__ = "kyc_verifications"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    full_name = Column(String, nullable=False)
    document_type = Column(String, nullable=False)
    document_number = Column(String, nullable=False)
    country = Column(String, nullable=True)
    address = Column(String, nullable=True)
    specialty = Column(String, nullable=True)
    years_experience = Column(Integer, nullable=True)
    certifications = Column(String, nullable=True)
    description = Column(String, nullable=True)
    document_photo_url = Column(String, nullable=True)
    status = Column(String, nullable=False)
    plan = Column(String, nullable=True)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)