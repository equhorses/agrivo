"""Daily background jobs, run in-process via APScheduler (see services/scheduler.py).

Jobs living here:
  - purge_scheduled_account_deletions: permanently erases accounts whose
    5-year retention window (after a self-service deletion request) is up.
  - check_ad_bookings: expires house-ad slot bookings past their 30 days and
    promotes the next queued advertiser (if any) into the freed-up slot.

All are defensive: any single row failing is logged and skipped rather than
aborting the whole run.
"""
import logging
from datetime import datetime, timezone

from sqlalchemy import select

from core.database import db_manager
from models.auth import User
from services.audit import log_admin_action
from services.house_ad_bookings import AdBookingsService
from services.user import purge_user_completely

logger = logging.getLogger(__name__)


async def check_ad_bookings() -> None:
    """Expire ad slot bookings past their 30 days, and promote the next
    queued advertiser (if any) into the freed-up slot."""
    if not db_manager.async_session_maker:
        await db_manager.ensure_initialized()
    async with db_manager.async_session_maker() as db:
        service = AdBookingsService(db)
        await service.expire_and_promote()


async def purge_scheduled_account_deletions() -> None:
    """Permanently erase accounts that requested self-service deletion once
    their retention window (scheduled_purge_at, set 5 years out at request
    time — see services/user.py) has passed. Runs daily; most days this finds
    nothing to do."""
    if not db_manager.async_session_maker:
        await db_manager.ensure_initialized()
    async with db_manager.async_session_maker() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(User).where(
                User.account_status == "pending_deletion",
                User.scheduled_purge_at.isnot(None),
                User.scheduled_purge_at <= now,
            )
        )
        users = result.scalars().all()

        for user in users:
            user_id = user.id
            try:
                deleted_email = await purge_user_completely(db, user_id)
            except Exception:
                logger.exception("Error purgando la cuenta %s tras cumplirse su plazo", user_id)
                continue

            if deleted_email:
                await log_admin_action(
                    db, None, "system", "purge_scheduled_deletion",
                    target=deleted_email,
                    details="Purga automatica tras 5 años desde la solicitud de baja",
                )
                logger.info("Cuenta %s purgada automaticamente (plazo de 5 anios cumplido)", deleted_email)


async def run_daily_jobs() -> None:
    """Entry point called by the scheduler once a day."""
    try:
        await purge_scheduled_account_deletions()
    except Exception:
        logger.exception("Fallo en purge_scheduled_account_deletions")

    try:
        await check_ad_bookings()
    except Exception:
        logger.exception("Fallo en check_ad_bookings")
