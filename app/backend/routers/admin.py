# @File: backend/routers/admin.py
# @Desc: Admin panel API for KYC verification management
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional, List

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from models.kyc_verifications import Kyc_verifications as KycVerifications
from services.email_service import send_email, kyc_approved_email, kyc_rejected_email

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

logger = logging.getLogger(__name__)


class KycListResponse(BaseModel):
    items: list
    total: int


class KycActionRequest(BaseModel):
    kyc_id: int
    action: str  # "approve" or "reject"
    reason: Optional[str] = None
    user_email: Optional[str] = None


class KycActionResponse(BaseModel):
    success: bool
    message: str
    email_sent: bool = False


@router.get("/kyc/pending", response_model=KycListResponse)
async def get_pending_kyc(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all pending KYC verifications for admin review"""
    try:
        result = await db.execute(
            select(KycVerifications).where(
                KycVerifications.status == "pending"
            ).order_by(KycVerifications.created_at.desc())
        )
        items = result.scalars().all()
        data = []
        for item in items:
            data.append({
                "id": item.id,
                "user_id": item.user_id,
                "full_name": item.full_name,
                "document_type": item.document_type,
                "document_number": item.document_number,
                "country": item.country,
                "specialty": item.specialty,
                "years_experience": item.years_experience,
                "certifications": item.certifications,
                "status": item.status,
                "plan": item.plan,
                "created_at": str(item.created_at) if item.created_at else None,
            })
        return KycListResponse(items=data, total=len(data))
    except Exception as e:
        logger.error(f"Error fetching pending KYC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kyc/all", response_model=KycListResponse)
async def get_all_kyc(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all KYC verifications"""
    try:
        result = await db.execute(
            select(KycVerifications).order_by(KycVerifications.created_at.desc())
        )
        items = result.scalars().all()
        data = []
        for item in items:
            data.append({
                "id": item.id,
                "user_id": item.user_id,
                "full_name": item.full_name,
                "document_type": item.document_type,
                "document_number": item.document_number,
                "country": item.country,
                "specialty": item.specialty,
                "years_experience": item.years_experience,
                "certifications": item.certifications,
                "status": item.status,
                "plan": item.plan,
                "created_at": str(item.created_at) if item.created_at else None,
            })
        return KycListResponse(items=data, total=len(data))
    except Exception as e:
        logger.error(f"Error fetching all KYC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/kyc/action", response_model=KycActionResponse)
async def kyc_action(
    data: KycActionRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a KYC verification and send email notification"""
    try:
        if data.action not in ("approve", "reject"):
            raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")

        # Get the KYC record first
        result = await db.execute(
            select(KycVerifications).where(KycVerifications.id == data.kyc_id)
        )
        kyc_record = result.scalar_one_or_none()
        if not kyc_record:
            raise HTTPException(status_code=404, detail="KYC record not found")

        new_status = "approved" if data.action == "approve" else "rejected"

        await db.execute(
            update(KycVerifications)
            .where(KycVerifications.id == data.kyc_id)
            .values(status=new_status)
        )
        await db.commit()

        # Send email notification
        email_sent = False
        if data.user_email:
            if data.action == "approve":
                subject, html = kyc_approved_email(kyc_record.full_name, kyc_record.plan or "pro")
            else:
                subject, html = kyc_rejected_email(kyc_record.full_name, data.reason or "")
            email_sent = await send_email(data.user_email, subject, html)

        return KycActionResponse(
            success=True,
            message=f"KYC verification {data.action}d successfully",
            email_sent=email_sent,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing KYC action: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-notification")
async def send_notification(
    to: str,
    subject: str,
    html: str,
    current_user: UserResponse = Depends(get_current_user),
):
    """Generic endpoint to send email notifications"""
    result = await send_email(to, subject, html)
    return {"success": result}