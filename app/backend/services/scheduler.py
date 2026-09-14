"""Lightweight in-process scheduler — no separate Railway service needed.

Runs services.scheduled_jobs.run_daily_jobs() once a day. Started from
main.py's lifespan on app startup, stopped on shutdown.
"""
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from services.scheduled_jobs import run_daily_jobs, close_expired_auctions

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return

    _scheduler = AsyncIOScheduler(timezone="UTC")
    # 08:00 UTC ≈ 09:00/10:00 hora peninsular española (según horario de verano/invierno).
    _scheduler.add_job(run_daily_jobs, CronTrigger(hour=8, minute=0), id="daily_jobs", replace_existing=True)
    # Cada 10 minutos, porque una fecha límite de subasta puede caer en
    # cualquier momento del día, no solo una vez a las 08:00.
    _scheduler.add_job(close_expired_auctions, IntervalTrigger(minutes=10), id="close_auctions", replace_existing=True)
    _scheduler.start()
    logger.info(
        "Scheduler iniciado: trabajo diario (purga de cuentas) a las 08:00 UTC, "
        "cierre de subastas cada 10 minutos"
    )


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Scheduler detenido")
