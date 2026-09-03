import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.bids import Bids

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class BidsService:
    """Service layer for Bids operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Bids]:
        """Create a new bids"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Bids(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created bids with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating bids: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for bids {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Bids]:
        """Get bids by ID (user can only see their own records)"""
        try:
            query = select(Bids).where(Bids.id == obj_id)
            if user_id:
                query = query.where(Bids.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching bids {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of bidss (user can only see their own records)"""
        try:
            query = select(Bids)
            count_query = select(func.count(Bids.id))
            
            if user_id:
                query = query.where(Bids.user_id == user_id)
                count_query = count_query.where(Bids.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Bids, field):
                        query = query.where(getattr(Bids, field) == value)
                        count_query = count_query.where(getattr(Bids, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Bids, field_name):
                        query = query.order_by(getattr(Bids, field_name).desc())
                else:
                    if hasattr(Bids, sort):
                        query = query.order_by(getattr(Bids, sort))
            else:
                query = query.order_by(Bids.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching bids list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Bids]:
        """Update bids (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Bids {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated bids {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating bids {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete bids (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Bids {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted bids {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting bids {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Bids]:
        """Get bids by any field"""
        try:
            if not hasattr(Bids, field_name):
                raise ValueError(f"Field {field_name} does not exist on Bids")
            result = await self.db.execute(
                select(Bids).where(getattr(Bids, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching bids by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Bids]:
        """Get list of bidss filtered by field"""
        try:
            if not hasattr(Bids, field_name):
                raise ValueError(f"Field {field_name} does not exist on Bids")
            result = await self.db.execute(
                select(Bids)
                .where(getattr(Bids, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Bids.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching bidss by {field_name}: {str(e)}")
            raise