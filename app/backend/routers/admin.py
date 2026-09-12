# @File: backend/routers/admin.py
# @Desc: Admin panel API for KYC verification management
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from typing import Optional, List

from core.database import get_db
from dependencies.auth import (
    get_current_user, get_admin_user, get_staff_user, require_roles, STAFF_ROLES, ROLE_LABELS,
)
from schemas.auth import UserResponse
from models.kyc_verifications import Kyc_verifications as KycVerifications
from models.auth import User
from models.house_ads import HouseAds
from models.ad_bookings import AdBooking
from models.ad_slot_configs import AdSlotConfig
from models.subscriptions import Subscriptions
from models.jobs import Jobs
from models.bids import Bids
from models.reviews import Reviews
from models.profiles import Profiles
from models.disputes import Disputes
from models.messages import Messages
from models.audit import AuditLog, LoginAttempt
from models.invitations import Invitation
from models.platform_settings import PlatformSettings
from services.audit import log_admin_action
from services.house_ad_bookings import AdBookingsService
from services.user import purge_user_completely
from routers.house_ads import KNOWN_SLOTS
from services.email_service import send_email, kyc_approved_email, kyc_rejected_email
from services.email import send_invitation_email

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
    current_user: UserResponse = Depends(require_roles("admin", "soporte")),
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
    current_user: UserResponse = Depends(require_roles("admin", "soporte")),
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
    current_user: UserResponse = Depends(require_roles("admin", "soporte")),
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
    current_user: UserResponse = Depends(get_admin_user),
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

# ==================== Resumen (dashboard) ====================

PLAN_PRICES_EUR = {"pro": 19, "enterprise": 29}


class DashboardStats(BaseModel):
    users_total: int
    users_last_7_days: int
    professionals_total: int
    active_subscriptions: int
    mrr_estimate_eur: float
    jobs_total: int
    jobs_active: int
    messages_total: int
    reviews_total: int
    disputes_open: int
    kyc_pending: int
    ad_bookings_active: int


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    current_user: UserResponse = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    """Vista general de Agrivo, al minuto — la pestaña 'Resumen' del panel."""
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    users_total = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    users_recent = (
        await db.execute(select(func.count()).select_from(User).where(User.created_at >= seven_days_ago))
    ).scalar_one()
    professionals_total = (
        await db.execute(select(func.count()).select_from(Profiles).where(Profiles.role == "professional"))
    ).scalar_one()

    active_subs_result = await db.execute(select(Subscriptions).where(Subscriptions.status == "active"))
    active_subs = active_subs_result.scalars().all()
    mrr = sum(PLAN_PRICES_EUR.get(s.plan, 0) for s in active_subs)

    jobs_total = (await db.execute(select(func.count()).select_from(Jobs))).scalar_one()
    jobs_active = (
        await db.execute(select(func.count()).select_from(Jobs).where(Jobs.status == "open"))
    ).scalar_one()
    messages_total = (await db.execute(select(func.count()).select_from(Messages))).scalar_one()
    reviews_total = (await db.execute(select(func.count()).select_from(Reviews))).scalar_one()
    disputes_open = (
        await db.execute(select(func.count()).select_from(Disputes).where(Disputes.status != "resolved"))
    ).scalar_one()
    kyc_pending = (
        await db.execute(select(func.count()).select_from(KycVerifications).where(KycVerifications.status == "pending"))
    ).scalar_one()

    active_bookings_result = await db.execute(select(AdBooking).where(AdBooking.status == "active"))
    ad_bookings_active = len(active_bookings_result.scalars().all())

    return DashboardStats(
        users_total=users_total,
        users_last_7_days=users_recent,
        professionals_total=professionals_total,
        active_subscriptions=len(active_subs),
        mrr_estimate_eur=float(mrr),
        jobs_total=jobs_total,
        jobs_active=jobs_active,
        messages_total=messages_total,
        reviews_total=reviews_total,
        disputes_open=disputes_open,
        kyc_pending=kyc_pending,
        ad_bookings_active=ad_bookings_active,
    )


# ==================== Usuarios ====================


class AdminUserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str
    account_status: str
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    plan: Optional[str] = None
    subscription_status: Optional[str] = None

    class Config:
        from_attributes = True


class AdminUsersListResponse(BaseModel):
    items: List[AdminUserResponse]
    total: int


class BanUserRequest(BaseModel):
    reason: Optional[str] = None


@router.get("/users", response_model=AdminUsersListResponse)
async def list_users(
    search: Optional[str] = Query(None, description="Filtra por email o nombre"),
    status_filter: Optional[str] = Query(None, alias="status", description="active | suspended | banned | pending_deletion"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    """Lista toda cuenta de usuario, no solo profesionales. Visible a
    cualquier rol de staff. Incluye, por usuario, su plan y estado de
    suscripción si lo tiene."""
    query = select(User)
    count_query = select(func.count()).select_from(User)

    if search:
        like = f"%{search.strip().lower()}%"
        query = query.where((User.email.ilike(like)) | (User.name.ilike(like)))
        count_query = count_query.where((User.email.ilike(like)) | (User.name.ilike(like)))

    if status_filter:
        query = query.where(User.account_status == status_filter)
        count_query = count_query.where(User.account_status == status_filter)

    total = (await db.execute(count_query)).scalar_one()

    query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    user_ids = [u.id for u in users]
    subs_by_user_id = {}
    if user_ids:
        subs_result = await db.execute(select(Subscriptions).where(Subscriptions.user_id.in_(user_ids)))
        subs_by_user_id = {s.user_id: s for s in subs_result.scalars().all()}

    items = [
        AdminUserResponse(
            id=u.id, email=u.email, name=u.name, role=u.role, account_status=u.account_status,
            created_at=u.created_at, last_login=u.last_login,
            plan=(subs_by_user_id.get(u.id).plan if subs_by_user_id.get(u.id) else None),
            subscription_status=(subs_by_user_id.get(u.id).status if subs_by_user_id.get(u.id) else None),
        )
        for u in users
    ]
    return AdminUsersListResponse(items=items, total=total)


@router.post("/users/{user_id}/ban", response_model=AdminUserResponse)
async def ban_user(
    user_id: str,
    payload: BanUserRequest,
    current_user: UserResponse = Depends(require_roles("admin", "seguridad")),
    db: AsyncSession = Depends(get_db),
):
    """Banea una cuenta — bloquea el login hasta que un admin lo levante."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.role in STAFF_ROLES:
        raise HTTPException(status_code=400, detail="No puedes banear a una cuenta del equipo.")

    user.account_status = "banned"
    user.suspended_at = datetime.now(timezone.utc)
    if payload.reason:
        user.deletion_reasons = payload.reason
    await db.commit()
    await db.refresh(user)

    await log_admin_action(
        db, current_user.id, current_user.email, "ban_user", target=user.email, details=payload.reason
    )
    return user


@router.post("/users/{user_id}/unban", response_model=AdminUserResponse)
async def unban_user(
    user_id: str,
    current_user: UserResponse = Depends(require_roles("admin", "seguridad")),
    db: AsyncSession = Depends(get_db),
):
    """Levanta un baneo, restaurando el acceso normal."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.account_status = "active"
    user.suspended_at = None
    await db.commit()
    await db.refresh(user)

    await log_admin_action(db, current_user.id, current_user.email, "unban_user", target=user.email)
    return user


class DeleteUserResponse(BaseModel):
    deleted_email: str


@router.delete("/users/{user_id}", response_model=DeleteUserResponse)
async def delete_user_admin(
    user_id: str,
    current_user: UserResponse = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Borra una cuenta de forma permanente e inmediata (a diferencia del
    autoborrado del propio usuario, que espera 5 años). Solo admin."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.role in STAFF_ROLES:
        raise HTTPException(status_code=400, detail="No puedes borrar a una cuenta del equipo.")

    email = user.email
    await purge_user_completely(db, user_id)
    await log_admin_action(db, current_user.id, current_user.email, "delete_user", target=email)
    return DeleteUserResponse(deleted_email=email)


# ==================== Trabajos (moderación) ====================


class AdminJobResponse(BaseModel):
    id: int
    title: str
    category: str
    country: str
    location: str
    status: Optional[str] = None
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/jobs", response_model=List[AdminJobResponse])
async def list_jobs_admin(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Jobs).order_by(Jobs.created_at.desc())
    if search:
        query = query.where(Jobs.title.ilike(f"%{search.strip()}%"))
    if status_filter:
        query = query.where(Jobs.status == status_filter)
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/jobs/{job_id}/remove", response_model=AdminJobResponse)
async def remove_job_admin(
    job_id: int,
    current_user: UserResponse = Depends(require_roles("admin", "moderacion")),
    db: AsyncSession = Depends(get_db),
):
    """Retira un trabajo de la vista pública (p.ej. por incumplir normas)."""
    result = await db.execute(select(Jobs).where(Jobs.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    job.status = "removed"
    await db.commit()
    await db.refresh(job)
    await log_admin_action(db, current_user.id, current_user.email, "remove_job", target=str(job_id), details=job.title)
    return job


@router.post("/jobs/{job_id}/restore", response_model=AdminJobResponse)
async def restore_job_admin(
    job_id: int,
    current_user: UserResponse = Depends(require_roles("admin", "moderacion")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Jobs).where(Jobs.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    job.status = "open"
    await db.commit()
    await db.refresh(job)
    await log_admin_action(db, current_user.id, current_user.email, "restore_job", target=str(job_id), details=job.title)
    return job


@router.delete("/jobs/{job_id}")
async def delete_job_admin(
    job_id: int,
    current_user: UserResponse = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Jobs).where(Jobs.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    title = job.title
    await db.delete(job)
    await db.commit()
    await log_admin_action(db, current_user.id, current_user.email, "delete_job", target=str(job_id), details=title)
    return {"success": True}


# ==================== Reseñas (moderación) ====================


class AdminReviewResponse(BaseModel):
    id: int
    professional_id: str
    rating: int
    comment: str
    reviewer_name: Optional[str] = None
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/reviews", response_model=List[AdminReviewResponse])
async def list_reviews_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Reviews).order_by(Reviews.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()


@router.delete("/reviews/{review_id}")
async def delete_review_admin(
    review_id: int,
    current_user: UserResponse = Depends(require_roles("admin", "moderacion")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Reviews).where(Reviews.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    await db.delete(review)
    await db.commit()
    await log_admin_action(db, current_user.id, current_user.email, "delete_review", target=str(review_id))
    return {"success": True}


# ==================== Profesionales ====================


class AdminProfessionalResponse(BaseModel):
    id: int
    display_name: str
    role: str
    country: Optional[str] = None
    rating: Optional[float] = None
    jobs_completed: Optional[int] = None
    verified_kyc: Optional[bool] = None
    user_id: str
    email: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/professionals", response_model=List[AdminProfessionalResponse])
async def list_professionals_admin(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Profiles).where(Profiles.role == "professional").order_by(Profiles.created_at.desc())
    if search:
        query = query.where(Profiles.display_name.ilike(f"%{search.strip()}%"))
    result = await db.execute(query.offset(skip).limit(limit))
    profiles = result.scalars().all()

    user_ids = [p.user_id for p in profiles]
    emails_by_user_id = {}
    if user_ids:
        users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        emails_by_user_id = {u.id: u.email for u in users_result.scalars().all()}

    return [
        AdminProfessionalResponse(
            id=p.id, display_name=p.display_name, role=p.role, country=p.country, rating=p.rating,
            jobs_completed=p.jobs_completed, verified_kyc=p.verified_kyc, user_id=p.user_id,
            email=emails_by_user_id.get(p.user_id),
        )
        for p in profiles
    ]


# ==================== Seguridad ====================


class SecurityOverview(BaseModel):
    failed_logins_24h: int
    banned_users: int
    recent_attempts: List[dict]


@router.get("/security", response_model=SecurityOverview)
async def get_security_overview(
    current_user: UserResponse = Depends(require_roles("admin", "seguridad")),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(hours=24)

    failed_result = await db.execute(
        select(func.count()).select_from(LoginAttempt)
        .where(LoginAttempt.success.is_(False), LoginAttempt.created_at >= day_ago)
    )
    failed_logins_24h = failed_result.scalar_one()

    banned_result = await db.execute(select(func.count()).select_from(User).where(User.account_status == "banned"))
    banned_users = banned_result.scalar_one()

    recent_result = await db.execute(select(LoginAttempt).order_by(LoginAttempt.created_at.desc()).limit(30))
    recent_attempts = [
        {
            "email": a.email, "method": a.method, "success": a.success, "reason": a.reason,
            "ip_address": a.ip_address, "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in recent_result.scalars().all()
    ]

    return SecurityOverview(
        failed_logins_24h=failed_logins_24h, banned_users=banned_users, recent_attempts=recent_attempts
    )


# ==================== Auditoría ====================


class AuditLogEntry(BaseModel):
    id: int
    actor_email: Optional[str] = None
    action: str
    target: Optional[str] = None
    details: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/audit-log", response_model=List[AuditLogEntry])
async def get_audit_log(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: UserResponse = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()


# ==================== Equipo (staff) ====================


class StaffMemberResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str
    role_label: str

    class Config:
        from_attributes = True


class AssignRoleRequest(BaseModel):
    email: str
    role: str


@router.get("/staff", response_model=List[StaffMemberResponse])
async def list_staff(
    current_user: UserResponse = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.role.in_(STAFF_ROLES)).order_by(User.role))
    users = result.scalars().all()
    return [
        StaffMemberResponse(
            id=u.id, email=u.email, name=u.name, role=u.role, role_label=ROLE_LABELS.get(u.role, u.role)
        )
        for u in users
    ]


@router.post("/staff/assign-role", response_model=StaffMemberResponse)
async def assign_staff_role(
    payload: AssignRoleRequest,
    current_user: UserResponse = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Da (o quita, con role='user') un rol de staff a una cuenta ya
    existente — la persona debe haberse registrado antes en Agrivo."""
    if payload.role not in STAFF_ROLES and payload.role != "user":
        raise HTTPException(
            status_code=400,
            detail=f"Rol no válido. Usa uno de: {', '.join(sorted(STAFF_ROLES))} o 'user' para quitar el rol.",
        )

    result = await db.execute(select(User).where(User.email == payload.email.strip().lower()))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="No existe ninguna cuenta con ese email. La persona debe registrarse primero.")

    old_role = user.role
    user.role = payload.role
    await db.commit()
    await db.refresh(user)

    await log_admin_action(
        db, current_user.id, current_user.email, "assign_role",
        target=user.email, details=f"{old_role} -> {payload.role}",
    )
    return StaffMemberResponse(
        id=user.id, email=user.email, name=user.name, role=user.role,
        role_label=ROLE_LABELS.get(user.role, user.role),
    )


# ==================== Pujas (subastas) ====================


class AdminBidResponse(BaseModel):
    id: int
    job_id: int
    job_title: Optional[str] = None
    amount: float
    message: Optional[str] = None
    status: Optional[str] = None
    user_id: str
    bidder_email: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/bids", response_model=List[AdminBidResponse])
async def list_bids_admin(
    job_id: Optional[int] = Query(None, description="Filtra las pujas de un trabajo concreto"),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: UserResponse = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    """Registro completo de pujas del sistema de subastas: qué se ha
    ofertado, en qué trabajo, por quién y en qué estado. Filtrable por
    trabajo o por estado (pending/accepted/rejected)."""
    query = select(Bids).order_by(Bids.created_at.desc())
    if job_id is not None:
        query = query.where(Bids.job_id == job_id)
    if status_filter:
        query = query.where(Bids.status == status_filter)
    result = await db.execute(query.offset(skip).limit(limit))
    bids = result.scalars().all()

    job_ids = {b.job_id for b in bids}
    jobs_by_id = {}
    if job_ids:
        jobs_result = await db.execute(select(Jobs).where(Jobs.id.in_(job_ids)))
        jobs_by_id = {j.id: j.title for j in jobs_result.scalars().all()}

    user_ids = [b.user_id for b in bids]
    emails_by_user_id = {}
    if user_ids:
        users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        emails_by_user_id = {u.id: u.email for u in users_result.scalars().all()}

    return [
        AdminBidResponse(
            id=b.id, job_id=b.job_id, job_title=jobs_by_id.get(b.job_id), amount=b.amount,
            message=b.message, status=b.status, user_id=b.user_id,
            bidder_email=emails_by_user_id.get(b.user_id), created_at=b.created_at,
        )
        for b in bids
    ]


@router.post("/bids/{bid_id}/cancel", response_model=AdminBidResponse)
async def cancel_bid_admin(
    bid_id: int,
    current_user: UserResponse = Depends(require_roles("admin", "moderacion")),
    db: AsyncSession = Depends(get_db),
):
    """Anula una puja (p.ej. sospecha de fraude o puja abusiva) sin
    borrarla del registro — queda marcada como 'cancelled'."""
    result = await db.execute(select(Bids).where(Bids.id == bid_id))
    bid = result.scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Puja no encontrada")
    bid.status = "cancelled"
    await db.commit()
    await db.refresh(bid)
    await log_admin_action(
        db, current_user.id, current_user.email, "cancel_bid",
        target=str(bid_id), details=f"job_id={bid.job_id}, amount={bid.amount}",
    )
    return bid


@router.delete("/bids/{bid_id}")
async def delete_bid_admin(
    bid_id: int,
    current_user: UserResponse = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Bids).where(Bids.id == bid_id))
    bid = result.scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Puja no encontrada")
    details = f"job_id={bid.job_id}, amount={bid.amount}"
    await db.delete(bid)
    await db.commit()
    await log_admin_action(db, current_user.id, current_user.email, "delete_bid", target=str(bid_id), details=details)
    return {"success": True}


# ==================== Disputas ====================


class AdminDisputeResponse(BaseModel):
    id: int
    job_title: str
    reason: str
    description: str
    amount_disputed: Optional[float] = None
    status: str
    resolution: Optional[str] = None
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ResolveDisputeRequest(BaseModel):
    resolution: str
    status: str = "resolved"  # resolved | rejected


@router.get("/disputes", response_model=List[AdminDisputeResponse])
async def list_disputes_admin(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: UserResponse = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Disputes).order_by(Disputes.created_at.desc())
    if status_filter:
        query = query.where(Disputes.status == status_filter)
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/disputes/{dispute_id}/resolve", response_model=AdminDisputeResponse)
async def resolve_dispute_admin(
    dispute_id: int,
    payload: ResolveDisputeRequest,
    current_user: UserResponse = Depends(require_roles("admin", "moderacion")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Disputes).where(Disputes.id == dispute_id))
    dispute = result.scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=404, detail="Disputa no encontrada")
    dispute.status = payload.status
    dispute.resolution = payload.resolution
    await db.commit()
    await db.refresh(dispute)
    await log_admin_action(
        db, current_user.id, current_user.email, "resolve_dispute",
        target=str(dispute_id), details=f"{payload.status}: {payload.resolution}",
    )
    return dispute


# ==================== Invitaciones de cortesía ====================


class InvitationResponse(BaseModel):
    id: int
    email: str
    plan: str
    months: int
    status: str
    source: Optional[str] = None
    created_at: Optional[datetime] = None
    redeemed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CreateInvitationRequest(BaseModel):
    email: str
    plan: str = "pro"  # pro | enterprise
    months: int = 1
    source: Optional[str] = None


@router.get("/invitations", response_model=List[InvitationResponse])
async def list_invitations(
    current_user: UserResponse = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Invitation).order_by(Invitation.created_at.desc()))
    return result.scalars().all()


@router.post("/invitations", response_model=InvitationResponse, status_code=201)
async def create_invitation(
    payload: CreateInvitationRequest,
    current_user: UserResponse = Depends(require_roles("admin", "marketing")),
    db: AsyncSession = Depends(get_db),
):
    """Crea una invitación de acceso gratis y manda el email al momento. Si
    ese email ya tiene una invitación pendiente, la actualiza en vez de
    duplicarla."""
    if payload.plan not in ("pro", "enterprise"):
        raise HTTPException(status_code=400, detail="El plan debe ser 'pro' o 'enterprise'.")

    email = payload.email.strip().lower()
    existing_result = await db.execute(
        select(Invitation).where(Invitation.email == email, Invitation.status == "pending")
    )
    invitation = existing_result.scalar_one_or_none()
    if invitation:
        invitation.plan = payload.plan
        invitation.months = payload.months
        invitation.source = payload.source
    else:
        invitation = Invitation(email=email, plan=payload.plan, months=payload.months, source=payload.source)
        db.add(invitation)

    await db.commit()
    await db.refresh(invitation)

    await send_invitation_email(to_email=email, months=payload.months, plan=payload.plan)
    await log_admin_action(
        db, current_user.id, current_user.email, "create_invitation",
        target=email, details=f"{payload.plan} x{payload.months} meses",
    )
    return invitation


@router.delete("/invitations/{invitation_id}")
async def revoke_invitation(
    invitation_id: int,
    current_user: UserResponse = Depends(require_roles("admin", "marketing")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Invitation).where(Invitation.id == invitation_id))
    invitation = result.scalar_one_or_none()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")
    if invitation.status == "pending":
        invitation.status = "revoked"
        invitation.revoked_at = datetime.now(timezone.utc)
        await db.commit()
    else:
        await db.delete(invitation)
        await db.commit()
    await log_admin_action(db, current_user.id, current_user.email, "revoke_invitation", target=invitation.email)
    return {"success": True}


# ==================== Fecha de lanzamiento de la plataforma ====================


class PlatformSettingsResponse(BaseModel):
    launch_date: Optional[datetime] = None


class UpdatePlatformSettingsRequest(BaseModel):
    launch_date: Optional[datetime] = None


@router.get("/platform-settings", response_model=PlatformSettingsResponse)
async def get_platform_settings(
    current_user: UserResponse = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PlatformSettings).where(PlatformSettings.id == 1))
    settings_row = result.scalar_one_or_none()
    return PlatformSettingsResponse(launch_date=settings_row.launch_date if settings_row else None)


@router.put("/platform-settings", response_model=PlatformSettingsResponse)
async def update_platform_settings(
    payload: UpdatePlatformSettingsRequest,
    current_user: UserResponse = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PlatformSettings).where(PlatformSettings.id == 1))
    settings_row = result.scalar_one_or_none()
    if not settings_row:
        settings_row = PlatformSettings(id=1)
        db.add(settings_row)
    settings_row.launch_date = payload.launch_date
    await db.commit()
    await log_admin_action(
        db, current_user.id, current_user.email, "update_launch_date",
        details=payload.launch_date.isoformat() if payload.launch_date else "cleared",
    )
    return PlatformSettingsResponse(launch_date=settings_row.launch_date)


# ==================== Profesionales: acciones ====================


@router.delete("/professionals/{profile_id}")
async def delete_professional_admin(
    profile_id: int,
    current_user: UserResponse = Depends(require_roles("admin", "moderacion")),
    db: AsyncSession = Depends(get_db),
):
    """Borra solo el perfil profesional (no la cuenta de usuario entera)."""
    result = await db.execute(select(Profiles).where(Profiles.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    name = profile.display_name
    await db.delete(profile)
    await db.commit()
    await log_admin_action(db, current_user.id, current_user.email, "delete_professional", target=str(profile_id), details=name)
    return {"success": True}


# ==================== Mensajes (moderación) ====================


class AdminConversationResponse(BaseModel):
    job_id: int
    job_title: Optional[str] = None
    message_count: int
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None


@router.get("/messages/conversations", response_model=List[AdminConversationResponse])
async def list_conversations_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    """Una fila por trabajo con conversación — para poder entrar a revisarla."""
    result = await db.execute(
        select(
            Messages.job_id,
            func.count(Messages.id).label("message_count"),
            func.max(Messages.created_at).label("last_message_at"),
        )
        .group_by(Messages.job_id)
        .order_by(func.max(Messages.created_at).desc())
        .offset(skip).limit(limit)
    )
    rows = result.all()

    job_ids = [r.job_id for r in rows]
    jobs_by_id = {}
    if job_ids:
        jobs_result = await db.execute(select(Jobs).where(Jobs.id.in_(job_ids)))
        jobs_by_id = {j.id: j.title for j in jobs_result.scalars().all()}

    out = []
    for r in rows:
        last_msg_result = await db.execute(
            select(Messages).where(Messages.job_id == r.job_id).order_by(Messages.created_at.desc()).limit(1)
        )
        last_msg = last_msg_result.scalar_one_or_none()
        out.append(AdminConversationResponse(
            job_id=r.job_id, job_title=jobs_by_id.get(r.job_id), message_count=r.message_count,
            last_message_at=r.last_message_at,
            last_message_preview=(last_msg.content[:120] if last_msg else None),
        ))
    return out


class AdminMessageResponse(BaseModel):
    id: int
    job_id: int
    sender_id: Optional[str] = None
    sender_email: Optional[str] = None
    receiver_id: Optional[str] = None
    receiver_email: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/messages/job/{job_id}", response_model=List[AdminMessageResponse])
async def get_conversation_thread_admin(
    job_id: int,
    current_user: UserResponse = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Messages).where(Messages.job_id == job_id).order_by(Messages.created_at.asc()))
    messages = result.scalars().all()

    user_ids = set()
    for m in messages:
        if m.sender_id:
            user_ids.add(m.sender_id)
        if m.receiver_id:
            user_ids.add(m.receiver_id)
    emails_by_id = {}
    if user_ids:
        users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        emails_by_id = {u.id: u.email for u in users_result.scalars().all()}

    return [
        AdminMessageResponse(
            id=m.id, job_id=m.job_id, sender_id=m.sender_id, sender_email=emails_by_id.get(m.sender_id),
            receiver_id=m.receiver_id, receiver_email=emails_by_id.get(m.receiver_id),
            content=m.content, created_at=m.created_at,
        )
        for m in messages
    ]


@router.delete("/messages/{message_id}")
async def delete_message_admin(
    message_id: int,
    current_user: UserResponse = Depends(require_roles("admin", "moderacion")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Messages).where(Messages.id == message_id))
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    await db.delete(message)
    await db.commit()
    await log_admin_action(db, current_user.id, current_user.email, "delete_message", target=str(message_id))
    return {"success": True}
