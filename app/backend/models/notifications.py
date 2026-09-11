from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Notifications(Base):
    __tablename__ = "notifications"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)  # destinatario de la notificación
    type = Column(String, nullable=False)  # new_bid | bid_accepted | bid_rejected
    title = Column(String, nullable=False)
    body = Column(String, nullable=True)
    link = Column(String, nullable=True)  # ruta del frontend a la que lleva, ej. /jobs/11
    read = Column(Boolean, nullable=True, default=False, server_default='false')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)
