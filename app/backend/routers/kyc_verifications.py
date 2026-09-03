import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.kyc_verifications import Kyc_verificationsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/kyc_verifications", tags=["kyc_verifications"])


# ---------- Pydantic Schemas ----------
class Kyc_verificationsData(BaseModel):
    """Entity data schema (for create/update)"""
    full_name: str
    document_type: str
    document_number: str
    country: str = None
    address: str = None
    specialty: str = None
    years_experience: int = None
    certifications: str = None
    description: str = None
    document_photo_url: str = None
    status: str
    plan: str = None


class Kyc_verificationsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    full_name: Optional[str] = None
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    specialty: Optional[str] = None
    years_experience: Optional[int] = None
    certifications: Optional[str] = None
    description: Optional[str] = None
    document_photo_url: Optional[str] = None
    status: Optional[str] = None
    plan: Optional[str] = None


class Kyc_verificationsResponse(BaseModel):
    """Entity response schema"""
    id: int
    full_name: str
    document_type: str
    document_number: str
    country: Optional[str] = None
    address: Optional[str] = None
    specialty: Optional[str] = None
    years_experience: Optional[int] = None
    certifications: Optional[str] = None
    description: Optional[str] = None
    document_photo_url: Optional[str] = None
    status: str
    plan: Optional[str] = None
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Kyc_verificationsListResponse(BaseModel):
    """List response schema"""
    items: List[Kyc_verificationsResponse]
    total: int
    skip: int
    limit: int


class Kyc_verificationsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Kyc_verificationsData]


class Kyc_verificationsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Kyc_verificationsUpdateData


class Kyc_verificationsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Kyc_verificationsBatchUpdateItem]


class Kyc_verificationsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Kyc_verificationsListResponse)
async def query_kyc_verificationss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query kyc_verificationss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying kyc_verificationss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Kyc_verificationsService(db)
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
        logger.debug(f"Found {result['total']} kyc_verificationss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying kyc_verificationss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Kyc_verificationsListResponse)
async def query_kyc_verificationss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query kyc_verificationss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying kyc_verificationss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Kyc_verificationsService(db)
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
        logger.debug(f"Found {result['total']} kyc_verificationss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying kyc_verificationss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Kyc_verificationsResponse)
async def get_kyc_verifications(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single kyc_verifications by ID (user can only see their own records)"""
    logger.debug(f"Fetching kyc_verifications with id: {id}, fields={fields}")
    
    service = Kyc_verificationsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Kyc_verifications with id {id} not found")
            raise HTTPException(status_code=404, detail="Kyc_verifications not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching kyc_verifications {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Kyc_verificationsResponse, status_code=201)
async def create_kyc_verifications(
    data: Kyc_verificationsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new kyc_verifications"""
    logger.debug(f"Creating new kyc_verifications with data: {data}")
    
    service = Kyc_verificationsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create kyc_verifications")
        
        logger.info(f"Kyc_verifications created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating kyc_verifications: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating kyc_verifications: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Kyc_verificationsResponse], status_code=201)
async def create_kyc_verificationss_batch(
    request: Kyc_verificationsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple kyc_verificationss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} kyc_verificationss")
    
    service = Kyc_verificationsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} kyc_verificationss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Kyc_verificationsResponse])
async def update_kyc_verificationss_batch(
    request: Kyc_verificationsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple kyc_verificationss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} kyc_verificationss")
    
    service = Kyc_verificationsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} kyc_verificationss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Kyc_verificationsResponse)
async def update_kyc_verifications(
    id: int,
    data: Kyc_verificationsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing kyc_verifications (requires ownership)"""
    logger.debug(f"Updating kyc_verifications {id} with data: {data}")

    service = Kyc_verificationsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Kyc_verifications with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Kyc_verifications not found")
        
        logger.info(f"Kyc_verifications {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating kyc_verifications {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating kyc_verifications {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_kyc_verificationss_batch(
    request: Kyc_verificationsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple kyc_verificationss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} kyc_verificationss")
    
    service = Kyc_verificationsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} kyc_verificationss successfully")
        return {"message": f"Successfully deleted {deleted_count} kyc_verificationss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_kyc_verifications(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single kyc_verifications by ID (requires ownership)"""
    logger.debug(f"Deleting kyc_verifications with id: {id}")
    
    service = Kyc_verificationsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Kyc_verifications with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Kyc_verifications not found")
        
        logger.info(f"Kyc_verifications {id} deleted successfully")
        return {"message": "Kyc_verifications deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting kyc_verifications {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")