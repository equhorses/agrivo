"""Subscriptions service: generic CRUD (backs the /api/v1/entities/subscriptions
admin/listing endpoints) PLUS the real Stripe lifecycle — checkout, cancel,
resume, change-plan, and webhook handling — for the two paid plans (Pro /
Empresa).

Configure via these environment variables (all required for checkout to work):
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_PRICE_PRO_RECURRENTE
  STRIPE_PRICE_PRO_ACTIVACION
  STRIPE_PRICE_ENTERPRISE_RECURRENTE
  STRIPE_PRICE_ENTERPRISE_ACTIVACION

If STRIPE_SECRET_KEY isn't set, checkout creation fails gracefully with a
clear 503 rather than crashing.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import stripe
from core.config import settings
from models.auth import User
from models.profiles import Profiles
from models.subscriptions import Subscriptions
from services.email import send_subscription_confirmation_email
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

PLAN_ENV_KEYS = {
    "pro": ("stripe_price_pro_recurrente", "stripe_price_pro_activacion"),
    "enterprise": ("stripe_price_enterprise_recurrente", "stripe_price_enterprise_activacion"),
}


class SubscriptionsNotConfiguredError(RuntimeError):
    pass


class SubscriptionsService:
    """Service layer for Subscriptions: generic CRUD + real Stripe lifecycle."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ------------------ Generic CRUD (used by routers/subscriptions.py) ------------------

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Subscriptions]:
        """Create a new subscriptions"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Subscriptions(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created subscriptions with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating subscriptions: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for subscriptions {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Subscriptions]:
        """Get subscriptions by ID (user can only see their own records)"""
        try:
            query = select(Subscriptions).where(Subscriptions.id == obj_id)
            if user_id:
                query = query.where(Subscriptions.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching subscriptions {obj_id}: {str(e)}")
            raise

    async def get_list(
        self,
        skip: int = 0,
        limit: int = 20,
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of subscriptionss (user can only see their own records)"""
        try:
            query = select(Subscriptions)
            count_query = select(func.count(Subscriptions.id))

            if user_id:
                query = query.where(Subscriptions.user_id == user_id)
                count_query = count_query.where(Subscriptions.user_id == user_id)

            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Subscriptions, field):
                        query = query.where(getattr(Subscriptions, field) == value)
                        count_query = count_query.where(getattr(Subscriptions, field) == value)

            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Subscriptions, field_name):
                        query = query.order_by(getattr(Subscriptions, field_name).desc())
                else:
                    if hasattr(Subscriptions, sort):
                        query = query.order_by(getattr(Subscriptions, sort))
            else:
                query = query.order_by(Subscriptions.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching subscriptions list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Subscriptions]:
        """Update subscriptions (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Subscriptions {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated subscriptions {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating subscriptions {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete subscriptions (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Subscriptions {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted subscriptions {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting subscriptions {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Subscriptions]:
        """Get subscriptions by any field"""
        try:
            if not hasattr(Subscriptions, field_name):
                raise ValueError(f"Field {field_name} does not exist on Subscriptions")
            result = await self.db.execute(
                select(Subscriptions).where(getattr(Subscriptions, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching subscriptions by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Subscriptions]:
        """Get list of subscriptionss filtered by field"""
        try:
            if not hasattr(Subscriptions, field_name):
                raise ValueError(f"Field {field_name} does not exist on Subscriptions")
            result = await self.db.execute(
                select(Subscriptions)
                .where(getattr(Subscriptions, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Subscriptions.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching subscriptionss by {field_name}: {str(e)}")
            raise

    # ------------------ Real Stripe lifecycle ------------------

    def _ensure_stripe_configured(self):
        secret_key = getattr(settings, "stripe_secret_key", None)
        if not secret_key:
            raise SubscriptionsNotConfiguredError("STRIPE_SECRET_KEY no está configurada.")
        stripe.api_key = secret_key

    def _recurring_price_id(self, plan: str) -> Optional[str]:
        recurring_key, _ = PLAN_ENV_KEYS[plan]
        return getattr(settings, recurring_key, None)

    def _plan_for_price_id(self, price_id: Optional[str]) -> Optional[str]:
        """Reverse-lookup: given a Stripe price ID, which plan name is it?"""
        if not price_id:
            return None
        for plan, (recurring_key, _) in PLAN_ENV_KEYS.items():
            if getattr(settings, recurring_key, None) == price_id:
                return plan
        return None

    @staticmethod
    def _to_datetime(unix_ts: Optional[int]):
        if not unix_ts:
            return None
        return datetime.fromtimestamp(unix_ts, tz=timezone.utc)

    async def get_or_create_subscription(self, user_id: str) -> Subscriptions:
        result = await self.db.execute(select(Subscriptions).where(Subscriptions.user_id == user_id))
        sub = result.scalar_one_or_none()
        if sub:
            return sub
        sub = Subscriptions(user_id=user_id, plan="free", status="inactive")
        self.db.add(sub)
        await self.db.commit()
        await self.db.refresh(sub)
        return sub

    async def get_subscription_by_user(self, user_id: str) -> Optional[Subscriptions]:
        result = await self.db.execute(select(Subscriptions).where(Subscriptions.user_id == user_id))
        return result.scalar_one_or_none()

    async def create_checkout_session(
        self,
        plan: str,
        user_id: str,
        user_email: str,
        success_url: str,
        cancel_url: str,
    ) -> str:
        if plan not in PLAN_ENV_KEYS:
            raise ValueError(f"Plan desconocido: {plan}")

        self._ensure_stripe_configured()

        recurring_key, activation_key = PLAN_ENV_KEYS[plan]
        recurring_price_id = getattr(settings, recurring_key, None)
        activation_price_id = getattr(settings, activation_key, None)

        if not recurring_price_id or not activation_price_id:
            raise SubscriptionsNotConfiguredError(
                f"Faltan las variables de precio de Stripe para el plan '{plan}'."
            )

        sub = await self.get_or_create_subscription(user_id)

        session = await stripe.checkout.Session.create_async(
            mode="subscription",
            customer_email=user_email,
            line_items=[
                {"price": recurring_price_id, "quantity": 1},
                {"price": activation_price_id, "quantity": 1},
            ],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": user_id, "plan": plan, "subscription_id": str(sub.id)},
            subscription_data={"metadata": {"user_id": user_id, "plan": plan}},
        )
        return session.url

    async def cancel_subscription(self, user_id: str) -> Subscriptions:
        """Soft-cancel: keep access until the current paid period ends, but
        don't charge the renewal."""
        self._ensure_stripe_configured()

        sub = await self.get_subscription_by_user(user_id)
        if not sub or not sub.stripe_subscription_id:
            raise ValueError("No tienes ninguna suscripción activa que cancelar.")

        subscription = await stripe.Subscription.modify_async(
            sub.stripe_subscription_id,
            cancel_at_period_end=True,
        )

        sub.cancel_at_period_end = True
        sub.subscription_end_date = self._to_datetime(getattr(subscription, "current_period_end", None))
        await self.db.commit()
        await self.db.refresh(sub)
        logger.info(f"Subscription for user_id={user_id} set to cancel at period end.")
        return sub

    async def resume_subscription(self, user_id: str) -> Subscriptions:
        """Undo a scheduled cancellation, while the period hasn't ended yet."""
        self._ensure_stripe_configured()

        sub = await self.get_subscription_by_user(user_id)
        if not sub or not sub.stripe_subscription_id:
            raise ValueError("No tienes ninguna suscripción que reactivar.")

        subscription = await stripe.Subscription.modify_async(
            sub.stripe_subscription_id,
            cancel_at_period_end=False,
        )

        sub.cancel_at_period_end = False
        sub.subscription_end_date = self._to_datetime(getattr(subscription, "current_period_end", None))
        await self.db.commit()
        await self.db.refresh(sub)
        logger.info(f"Subscription for user_id={user_id} resumed (cancellation undone).")
        return sub

    async def change_plan(self, user_id: str, new_plan: str) -> Subscriptions:
        """Switch between Pro/Empresa. Stripe prorates automatically."""
        if new_plan not in PLAN_ENV_KEYS:
            raise ValueError(f"Plan desconocido: {new_plan}")

        self._ensure_stripe_configured()

        sub = await self.get_subscription_by_user(user_id)
        if not sub or not sub.stripe_subscription_id:
            raise ValueError("No tienes ninguna suscripción activa que cambiar.")

        if sub.plan == new_plan:
            raise ValueError("Ya tienes activo ese plan.")

        new_price_id = self._recurring_price_id(new_plan)
        if not new_price_id:
            raise SubscriptionsNotConfiguredError(
                f"Falta la variable de precio de Stripe para el plan '{new_plan}'."
            )

        subscription = await stripe.Subscription.retrieve_async(sub.stripe_subscription_id)
        current_item = subscription["items"]["data"][0]

        updated = await stripe.Subscription.modify_async(
            sub.stripe_subscription_id,
            items=[{"id": current_item["id"], "price": new_price_id}],
            proration_behavior="create_prorations",
        )

        sub.plan = new_plan
        sub.status = "active"
        sub.cancel_at_period_end = bool(getattr(updated, "cancel_at_period_end", False))
        sub.subscription_end_date = self._to_datetime(getattr(updated, "current_period_end", None))
        await self.db.commit()
        await self.db.refresh(sub)
        logger.info(f"Plan changed for user_id={user_id} to {new_plan} (prorated by Stripe).")
        return sub

    async def handle_webhook_event(self, event):
        event_type = event.type
        data = event.data.object
        if event_type == "checkout.session.completed":
            await self._handle_checkout_completed(data)
        elif event_type in ("customer.subscription.deleted", "customer.subscription.updated"):
            await self._handle_subscription_change(data)
        else:
            logger.debug(f"Ignoring unhandled Stripe event type: {event_type}")

    async def _handle_checkout_completed(self, session):
        metadata = getattr(session, "metadata", None)
        user_id = getattr(metadata, "user_id", None) if metadata else None
        if not user_id:
            logger.warning("checkout.session.completed without user_id metadata; ignoring.")
            return

        sub = await self.get_or_create_subscription(user_id)

        plan = getattr(metadata, "plan", None) if metadata else None
        subscription_id = getattr(session, "subscription", None)

        sub.status = "active"
        sub.plan = plan
        sub.cancel_at_period_end = False
        sub.stripe_customer_id = getattr(session, "customer", None)
        sub.stripe_subscription_id = subscription_id
        sub.stripe_session_id = getattr(session, "id", None)

        if subscription_id:
            try:
                self._ensure_stripe_configured()
                subscription = await stripe.Subscription.retrieve_async(subscription_id)
                sub.subscription_end_date = self._to_datetime(getattr(subscription, "current_period_end", None))
            except Exception as e:
                logger.warning(f"Could not fetch subscription period end for {subscription_id}: {e}")

        await self.db.commit()
        logger.info(f"Activated subscription for user_id={user_id} (subscription row {sub.id})")

        # Beneficio del plan Empresa: radio de visibilidad ampliado a 150km
        # (ver Precios) — se aplica una sola vez al activarse, sin reducirlo
        # si el profesional ya lo tenía puesto más alto.
        if plan == "enterprise":
            try:
                profile_result = await self.db.execute(select(Profiles).where(Profiles.user_id == user_id))
                profile = profile_result.scalar_one_or_none()
                if profile and (profile.service_radius_km or 0) < 150:
                    profile.service_radius_km = 150
                    await self.db.commit()
            except Exception as e:
                logger.warning(f"Could not widen service radius for user_id={user_id}: {e}")

        user_result = await self.db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if user:
            await send_subscription_confirmation_email(
                to_email=user.email, plan=plan or "pro", name=getattr(user, "name", None)
            )

    async def _handle_subscription_change(self, subscription):
        """Keeps our copy of status/dates in sync with Stripe on every
        renewal, cancellation, or plan change."""
        metadata = getattr(subscription, "metadata", None)
        user_id = getattr(metadata, "user_id", None) if metadata else None
        if not user_id:
            return
        sub = await self.get_subscription_by_user(user_id)
        if not sub:
            return

        status_value = getattr(subscription, "status", None)
        if status_value in ("canceled", "unpaid", "incomplete_expired"):
            sub.status = "inactive"
            sub.plan = "free"
        elif status_value == "active":
            sub.status = "active"

        sub.cancel_at_period_end = bool(getattr(subscription, "cancel_at_period_end", False))
        sub.subscription_end_date = self._to_datetime(getattr(subscription, "current_period_end", None))

        try:
            items = subscription.get("items", {}).get("data", []) if hasattr(subscription, "get") else []
            if items:
                price_id = items[0].get("price", {}).get("id")
                plan = self._plan_for_price_id(price_id)
                if plan:
                    sub.plan = plan
        except Exception as e:
            logger.debug(f"Could not resolve plan from subscription items: {e}")

        await self.db.commit()
        logger.info(f"Updated subscription status for user_id={user_id} to {sub.status}")
