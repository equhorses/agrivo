import logging
from typing import Optional, Dict, Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.notifications import Notifications

logger = logging.getLogger(__name__)


class NotificationsService:
    """Service layer for Notifications operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Notifications]:
        try:
            obj = Notifications(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created notification with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating notification: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Notifications]:
        query = select(Notifications).where(Notifications.id == obj_id)
        if user_id:
            query = query.where(Notifications.user_id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_list(
        self,
        skip: int = 0,
        limit: int = 20,
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        query = select(Notifications)
        count_query = select(func.count(Notifications.id))

        if user_id:
            query = query.where(Notifications.user_id == user_id)
            count_query = count_query.where(Notifications.user_id == user_id)

        if query_dict:
            for field, value in query_dict.items():
                if hasattr(Notifications, field):
                    query = query.where(getattr(Notifications, field) == value)
                    count_query = count_query.where(getattr(Notifications, field) == value)

        count_result = await self.db.execute(count_query)
        total = count_result.scalar()

        if sort and sort.startswith('-') and hasattr(Notifications, sort[1:]):
            query = query.order_by(getattr(Notifications, sort[1:]).desc())
        elif sort and hasattr(Notifications, sort):
            query = query.order_by(getattr(Notifications, sort))
        else:
            query = query.order_by(Notifications.id.desc())

        result = await self.db.execute(query.offset(skip).limit(limit))
        items = result.scalars().all()

        return {"items": items, "total": total, "skip": skip, "limit": limit}

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: str) -> Optional[Notifications]:
        obj = await self.get_by_id(obj_id, user_id=user_id)
        if not obj:
            return None
        for key, value in update_data.items():
            if hasattr(obj, key) and key not in ('user_id', 'type', 'title', 'body', 'link'):
                setattr(obj, key, value)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj
