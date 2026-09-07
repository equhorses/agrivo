# @File: backend/routers/admin.py
# @Desc: Admin panel API for KYC verification management
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional, List

from core.database import get_db
from dependencies.auth import get_current_user, require_roles
from schemas.auth import UserResponse
from models.kyc_verifications import Kyc_verifications as KycVerifications
from models.house_ads import HouseAds
from models.ad_bookings import AdBooking
from models.ad_slot_configs import AdSlotConfig
from services.audit import log_admin_action
from services.house_ad_bookings import AdBookingsService
from routers.house_ads import KNOWN_SLOTS
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


# ==================== Publicidad (house ads + reservas self-service) ====================


class HouseAdAdminResponse(BaseModel):
    slot: str
    title: str
    image_url: str
    link_url: str
    active: bool

    class Config:
        from_attributes = True


@router.get("/house-ads", response_model=List[HouseAdAdminResponse])
async def list_house_ads(
    current_user: UserResponse = Depends(require_roles("admin", "marketing")),
    db: AsyncSession = Depends(get_db),
):
    """The banner currently configured for every slot (may not cover all
    KNOWN_SLOTS if one has never been set)."""
    result = await db.execute(select(HouseAds))
    return result.scalars().all()


class UpsertHouseAdRequest(BaseModel):
    title: str
    image_url: str
    link_url: str
    active: bool = True


@router.put("/house-ads/{slot}", response_model=HouseAdAdminResponse)
async def upsert_house_ad(
    slot: str,
    payload: UpsertHouseAdRequest,
    current_user: UserResponse = Depends(require_roles("admin", "marketing")),
    db: AsyncSession = Depends(get_db),
):
    """Manually set/replace the banner for a slot — e.g. to run an internal
    promo instead of an external advertiser's creative."""
    result = await db.execute(select(HouseAds).where(HouseAds.slot == slot))
    ad = result.scalar_one_or_none()
    if ad:
        ad.title = payload.title
        ad.image_url = payload.image_url
        ad.link_url = payload.link_url
        ad.active = payload.active
    else:
        ad = HouseAds(
            slot=slot, title=payload.title, image_url=payload.image_url,
            link_url=payload.link_url, active=payload.active,
        )
        db.add(ad)
    await db.commit()
    await db.refresh(ad)
    await log_admin_action(
        db, current_user.id, current_user.email, "upsert_house_ad", target=slot, details=payload.title
    )
    return ad


@router.delete("/house-ads/{slot}")
async def delete_house_ad(
    slot: str,
    current_user: UserResponse = Depends(require_roles("admin", "marketing")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(HouseAds).where(HouseAds.slot == slot))
    ad = result.scalar_one_or_none()
    if not ad:
        raise HTTPException(status_code=404, detail="No hay banner configurado para ese hueco.")
    await db.delete(ad)
    await db.commit()
    await log_admin_action(db, current_user.id, current_user.email, "delete_house_ad", target=slot)
    return {"success": True}


class AdBookingAdminResponse(BaseModel):
    id: int
    slot: str
    user_id: str
    advertiser_name: str
    advertiser_email: str
    title: str
    image_url: str
    link_url: str
    amount_cents: int
    status: str
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    rejected_reason: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/ad-bookings", response_model=List[AdBookingAdminResponse])
async def list_ad_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: UserResponse = Depends(require_roles("admin", "marketing")),
    db: AsyncSession = Depends(get_db),
):
    """List advertiser slot bookings, most recent first. Filter by status
    (e.g. status=pending_approval) to see what's waiting for review."""
    query = select(AdBooking).order_by(AdBooking.created_at.desc()).limit(200)
    if status_filter:
        query = select(AdBooking).where(AdBooking.status == status_filter).order_by(
            AdBooking.created_at.desc()
        ).limit(200)
    result = await db.execute(query)
    return result.scalars().all()


class RejectAdBookingRequest(BaseModel):
    reason: str


@router.post("/ad-bookings/{booking_id}/approve", response_model=AdBookingAdminResponse)
async def approve_ad_booking(
    booking_id: int,
    current_user: UserResponse = Depends(require_roles("admin", "marketing")),
    db: AsyncSession = Depends(get_db),
):
    """Approve a paid booking's creative. Goes live immediately if the slot
    is free, otherwise joins the queue for when it frees up."""
    service = AdBookingsService(db)
    try:
        booking = await service.approve_booking(booking_id, admin_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await log_admin_action(
        db, current_user.id, current_user.email, "approve_ad_booking",
        target=booking.advertiser_email, details=f"slot={booking.slot}, status={booking.status}",
    )
    return booking


@router.post("/ad-bookings/{booking_id}/reject", response_model=AdBookingAdminResponse)
async def reject_ad_booking(
    booking_id: int,
    payload: RejectAdBookingRequest,
    current_user: UserResponse = Depends(require_roles("admin", "marketing")),
    db: AsyncSession = Depends(get_db),
):
    """Reject a paid booking's creative (e.g. inappropriate content). The
    charge itself isn't refunded automatically — do that from Stripe if needed."""
    service = AdBookingsService(db)
    try:
        booking = await service.reject_booking(booking_id, admin_id=current_user.id, reason=payload.reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await log_admin_action(
        db, current_user.id, current_user.email, "reject_ad_booking",
        target=booking.advertiser_email, details=f"slot={booking.slot}, reason={payload.reason}",
    )
    return booking


# --- Self-service ad slot pricing/availability config ---


class AdSlotAdminResponse(BaseModel):
    slot: str
    price_cents: int
    self_service_enabled: bool
    occupied_until: Optional[datetime] = None
    queue_length: int = 0


class UpdateAdSlotRequest(BaseModel):
    price_cents: Optional[int] = None
    self_service_enabled: Optional[bool] = None


@router.get("/ad-slots", response_model=List[AdSlotAdminResponse])
async def list_ad_slots(
    current_user: UserResponse = Depends(require_roles("admin", "marketing")),
    db: AsyncSession = Depends(get_db),
):
    """Price, self-service toggle, and current occupancy for every ad slot."""
    service = AdBookingsService(db)
    out = []
    for slot in KNOWN_SLOTS:
        config = await service.get_slot_config(slot)
        if not config:
            config = AdSlotConfig(slot=slot, price_cents=4999, self_service_enabled=True)
            db.add(config)
            await db.commit()
            await db.refresh(config)
        active = await service.get_active_booking(slot)
        queue_length = await service.get_queue_length(slot)
        out.append(
            AdSlotAdminResponse(
                slot=slot,
                price_cents=config.price_cents,
                self_service_enabled=config.self_service_enabled,
                occupied_until=active.ends_at if active else None,
                queue_length=queue_length,
            )
        )
    return out


@router.put("/ad-slots/{slot}", response_model=AdSlotAdminResponse)
async def update_ad_slot(
    slot: str,
    payload: UpdateAdSlotRequest,
    current_user: UserResponse = Depends(require_roles("admin", "marketing")),
    db: AsyncSession = Depends(get_db),
):
    """Change the monthly price and/or block/allow self-service purchase of a slot."""
    if slot not in KNOWN_SLOTS:
        raise HTTPException(status_code=400, detail=f"Hueco desconocido. Usa uno de: {', '.join(KNOWN_SLOTS)}")

    result = await db.execute(select(AdSlotConfig).where(AdSlotConfig.slot == slot))
    config = result.scalar_one_or_none()
    if not config:
        config = AdSlotConfig(slot=slot)
        db.add(config)

    if payload.price_cents is not None:
        if payload.price_cents < 0:
            raise HTTPException(status_code=400, detail="El precio no puede ser negativo.")
        config.price_cents = payload.price_cents
    if payload.self_service_enabled is not None:
        config.self_service_enabled = payload.self_service_enabled

    await db.commit()
    await db.refresh(config)

    await log_admin_action(
        db, current_user.id, current_user.email, "update_ad_slot", target=slot,
        details=f"price_cents={config.price_cents}, self_service_enabled={config.self_service_enabled}",
    )
    return AdSlotAdminResponse(
        slot=config.slot, price_cents=config.price_cents, self_service_enabled=config.self_service_enabled,
    )