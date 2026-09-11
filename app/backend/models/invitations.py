from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Invitation(Base):
    """A complimentary-access invite sent by staff to a specific email. When
    that email registers (password or Google), the invited plan is granted
    automatically — see services/auth.py register hooks."""

    __tablename__ = "invitations"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    email = Column(String(255), nullable=False, index=True)
    plan = Column(String(20), nullable=False, default="pro", server_default="pro")
    months = Column(Integer, nullable=False, default=1, server_default="1")
    status = Column(String(20), nullable=False, default="pending", server_default="pending")  # pending|redeemed|revoked
    source = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    redeemed_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
