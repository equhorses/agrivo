import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.bids import BidsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from models.jobs import Jobs
from models.bids import Bids

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/bids", tags=["bids"])


# ---------- Pydantic Schemas ----------
class BidsData(BaseModel):
    """Entity data schema (for create/update)"""
    job_id: int
    amount: float
    message: str = None
    status: str = None


class BidsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    job_id: Optional[int] = None
    amount: Optional[float] = None
    message: Optional[str] = None
    status: Optional[str] = None


class BidsResponse(BaseModel):
    """Entity response schema"""
    id: int
    job_id: int
    amount: float
    message: Optional[str] = None
    status: Optional[str] = None
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BidsListResponse(BaseModel):
    """List response schema"""
    items: List[BidsResponse]
    total: int
    skip: int
    limit: int


class BidsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[BidsData]


class BidsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: BidsUpdateData


class BidsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[BidsBatchUpdateItem]


class BidsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=BidsListResponse)
async def query_bidss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query bidss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying bidss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = BidsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} bidss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying bidss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=BidsListResponse)
async def query_bidss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query bidss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying bidss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = BidsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} bidss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying bidss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=BidsResponse)
async def get_bids(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single bids by ID (user can only see their own records)"""
    logger.debug(f"Fetching bids with id: {id}, fields={fields}")
    
    service = BidsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Bids with id {id} not found")
            raise HTTPException(status_code=404, detail="Bids not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching bids {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=BidsResponse, status_code=201)
async def create_bids(
    data: BidsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new bids"""
    logger.debug(f"Creating new bids with data: {data}")
    
    service = BidsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create bids")
        
        logger.info(f"Bids created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating bids: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating bids: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[BidsResponse], status_code=201)
async def create_bidss_batch(
    request: BidsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple bidss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} bidss")
    
    service = BidsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} bidss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[BidsResponse])
async def update_bidss_batch(
    request: BidsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple bidss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} bidss")
    
    service = BidsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} bidss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=BidsResponse)
async def update_bids(
    id: int,
    data: BidsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing bids (requires ownership)"""
    logger.debug(f"Updating bids {id} with data: {data}")

    service = BidsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Bids with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Bids not found")
        
        logger.info(f"Bids {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating bids {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating bids {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


async def _get_bid_and_owned_job(bid_id: int, current_user: UserResponse, db: AsyncSession) -> tuple[Bids, Jobs]:
    """Carga la puja y su trabajo, comprobando que el usuario actual es el DUEÑO DEL TRABAJO
    (no el de la puja: quien acepta/rechaza es quien publicó el trabajo)."""
    bid_result = await db.execute(select(Bids).where(Bids.id == bid_id))
    bid = bid_result.scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")

    job_result = await db.execute(select(Jobs).where(Jobs.id == bid.job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")

    if job.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Solo el dueño del trabajo puede gestionar esta oferta")

    return bid, job


@router.post("/{id}/accept", response_model=BidsResponse)
async def accept_bid(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Acepta una oferta (solo el dueño del trabajo). Rechaza automáticamente
    el resto de ofertas pendientes de ese mismo trabajo y lo marca en progreso."""
    try:
        bid, job = await _get_bid_and_owned_job(id, current_user, db)

        bid.status = "accepted"
        job.status = "in_progress"

        others_result = await db.execute(
            select(Bids).where(Bids.job_id == job.id, Bids.id != bid.id, Bids.status == "pending")
        )
        for other in others_result.scalars().all():
            other.status = "rejected"

        await db.commit()
        await db.refresh(bid)
        logger.info(f"Bid {id} accepted for job {job.id}")
        return bid
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error accepting bid {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{id}/reject", response_model=BidsResponse)
async def reject_bid(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rechaza una oferta (solo el dueño del trabajo)."""
    try:
        bid, _job = await _get_bid_and_owned_job(id, current_user, db)

        bid.status = "rejected"
        await db.commit()
        await db.refresh(bid)
        logger.info(f"Bid {id} rejected")
        return bid
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error rejecting bid {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_bidss_batch(
    request: BidsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple bidss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} bidss")
    
    service = BidsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} bidss successfully")
        return {"message": f"Successfully deleted {deleted_count} bidss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_bids(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single bids by ID (requires ownership)"""
    logger.debug(f"Deleting bids with id: {id}")
    
    service = BidsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Bids with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Bids not found")
        
        logger.info(f"Bids {id} deleted successfully")
        return {"message": "Bids deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting bids {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")