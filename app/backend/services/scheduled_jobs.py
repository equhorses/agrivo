"""Daily background jobs, run in-process via APScheduler (see services/scheduler.py).

Jobs living here:
  - purge_scheduled_account_deletions: permanently erases accounts whose
    5-year retention window (after a self-service deletion request) is up.
  - check_ad_bookings: expires house-ad slot bookings past their 30 days and
    promotes the next queued advertiser (if any) into the freed-up slot.
  - close_expired_auctions: cierra los trabajos cuya fecha límite de ofertas
    ya pasó (ver services/scheduler.py — este corre cada pocos minutos, no
    a diario, porque una fecha límite puede ser dentro de unas horas).

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


async def close_expired_auctions() -> None:
    """Trabajos con status='open' cuya bidding_ends_at ya pasó:
    - Subasta inversa con ofertas pendientes: elige automáticamente la más
      baja como ganadora (misma lógica que aceptar a mano), rechaza el
      resto, notifica y manda mensaje a ambas partes, y suma el trabajo al
      historial del ganador.
    - Sin ofertas, o precio fijo: se marca 'expired' (deja de recibir
      ofertas y desaparece del listado público) y se avisa al dueño para
      que elija manualmente si quiere, entre lo que haya recibido.
    """
    from models.jobs import Jobs
    from models.bids import Bids
    from models.notifications import Notifications
    from models.messages import Messages
    from models.profiles import Profiles

    if not db_manager.async_session_maker:
        await db_manager.ensure_initialized()
    async with db_manager.async_session_maker() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Jobs).where(
                Jobs.status == "open",
                Jobs.bidding_ends_at.isnot(None),
                Jobs.bidding_ends_at <= now,
            )
        )
        jobs = result.scalars().all()

        for job in jobs:
            try:
                winner = None
                others = []
                if job.contract_type == "reverse_auction":
                    bids_result = await db.execute(
                        select(Bids)
                        .where(Bids.job_id == job.id, Bids.status == "pending")
                        .order_by(Bids.amount.asc())
                    )
                    pending_bids = bids_result.scalars().all()
                    if pending_bids:
                        winner, others = pending_bids[0], pending_bids[1:]

                if winner:
                    winner.status = "accepted"
                    job.status = "in_progress"
                    for other in others:
                        other.status = "rejected"

                    db.add(Notifications(
                        user_id=winner.user_id, type="bid_accepted",
                        title=f'¡Tu oferta para "{job.title}" fue la ganadora!',
                        body=f"${winner.amount:,.0f} USD — se cerró el plazo automáticamente",
                        link=f"/jobs/{job.id}",
                    ))
                    db.add(Messages(
                        job_id=job.id, sender_id=job.user_id, receiver_id=winner.user_id,
                        content=(
                            f'Se cerró el plazo de "{job.title}" y tu oferta de ${winner.amount:,.0f} USD '
                            f"fue la más baja — ¡ganaste! Podéis coordinar los detalles por aquí."
                        ),
                        user_id=job.user_id,
                    ))
                    for other in others:
                        db.add(Notifications(
                            user_id=other.user_id, type="bid_rejected",
                            title=f'Tu oferta para "{job.title}" no fue seleccionada',
                            body=f"${other.amount:,.0f} USD", link=f"/jobs/{job.id}",
                        ))
                        db.add(Messages(
                            job_id=job.id, sender_id=job.user_id, receiver_id=other.user_id,
                            content=(
                                f'Se cerró el plazo de "{job.title}". Esta vez otra oferta fue más baja, '
                                f"¡pero esperamos verte en próximos trabajos!"
                            ),
                            user_id=job.user_id,
                        ))

                    profile_result = await db.execute(select(Profiles).where(Profiles.user_id == winner.user_id))
                    winner_profile = profile_result.scalar_one_or_none()
                    if winner_profile:
                        winner_profile.jobs_completed = (winner_profile.jobs_completed or 0) + 1
                else:
                    job.status = "expired"
                    db.add(Notifications(
                        user_id=job.user_id, type="job_expired",
                        title=f'Se cerró el plazo de "{job.title}" sin ganador automático',
                        body=(
                            "No había ninguna oferta pendiente para elegir automáticamente."
                            if job.contract_type == "reverse_auction"
                            else "Puedes revisar las ofertas recibidas y elegir manualmente."
                        ),
                        link=f"/jobs/{job.id}",
                    ))

                await db.commit()
                logger.info("Trabajo %s cerrado automáticamente por fecha límite", job.id)
            except Exception:
                await db.rollback()
                logger.exception("Error cerrando automáticamente el trabajo %s", job.id)


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
