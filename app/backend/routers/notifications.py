import json
import logging
from typing import List, Optional

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.notifications import NotificationsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from models.notifications import Notifications

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/notifications", tags=["notifications"])


class NotificationsResponse(BaseModel):
    id: int
    user_id: str
    type: str
    title: str
    body: Optional[str] = None
    link: Optional[str] = None
    read: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationsListResponse(BaseModel):
    items: List[NotificationsResponse]
    total: int
    skip: int
    limit: int


class NotificationsUpdateData(BaseModel):
    read: Optional[bool] = None


# Nunca se crean notificaciones a través de la API pública: siempre las crea
# el backend directamente (al recibir una oferta, aceptarla o rechazarla),
# para que solo pueda notificarse lo que realmente ha pasado.


@router.get("", response_model=NotificationsListResponse)
async def query_notifications(
    query: str = Query(None),
    sort: str = Query('-created_at'),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Notificaciones del usuario autenticado."""
    service = NotificationsService(db)
    try:
        query_dict = json.loads(query) if query else None
        result = await service.get_list(
            skip=skip, limit=limit, query_dict=query_dict, sort=sort, user_id=str(current_user.id)
        )
        return result
    except Exception as e:
        logger.error(f"Error querying notifications: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/read-all")
async def mark_all_read(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marca todas las notificaciones del usuario como leídas."""
    try:
        await db.execute(
            sa_update(Notifications).where(Notifications.user_id == str(current_user.id)).values(read=True)
        )
        await db.commit()
        return {"message": "ok"}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error marking notifications read: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/{id}", response_model=NotificationsResponse)
async def update_notification(
    id: int,
    data: NotificationsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marca/desmarca una notificación como leída (solo la propia)."""
    service = NotificationsService(db)
    try:
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=404, detail="Notification not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating notification {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
