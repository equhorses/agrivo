import logging
from typing import Optional

import httpx
from core.config import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


async def send_welcome_email(to_email: str, name: Optional[str] = None) -> bool:
    """Send a welcome email via Resend. Never raises; returns True/False."""
    api_key = getattr(settings, "resend_api_key", None)
    from_email = getattr(settings, "resend_from_email", None)

    if not api_key or not from_email:
        logger.warning("Resend no configurado (RESEND_API_KEY / RESEND_FROM_EMAIL); email de bienvenida omitido")
        return False

    display_name = name or to_email.split("@", 1)[0]

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0A714E;">¡Bienvenido a Agrivo, {display_name}!</h2>
      <p>Gracias por registrarte en el mayor marketplace agrario del mundo.</p>
      <p>Ya puedes publicar trabajos agrícolas, encontrar profesionales verificados o explorar
      oportunidades cerca de ti.</p>
      <p style="margin-top: 24px;">
        <a href="https://agrivo.com/jobs/new" style="background-color:#0A714E;color:#fff;
        padding:10px 20px;border-radius:6px;text-decoration:none;">Publicar un trabajo</a>
      </p>
      <p style="margin-top: 24px; color: #666; font-size: 13px;">
        Si tienes cualquier duda, escríbenos a
        <a href="mailto:soporte@agrivo.com">soporte@agrivo.com</a>.
      </p>
    </div>
    """

    payload = {
        "from": from_email,
        "to": [to_email],
        "subject": "¡Bienvenido a Agrivo!",
        "html": html_content,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                RESEND_API_URL,
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
            response.raise_for_status()
        logger.info(f"Email de bienvenida enviado a {to_email}")
        return True
    except httpx.HTTPError as exc:
        logger.error(f"Fallo al enviar email de bienvenida a {to_email}: {exc}")
        return False


async def send_subscription_confirmation_email(to_email: str, plan: str, name: Optional[str] = None) -> bool:
    """Send a subscription activation confirmation email via Resend. Never raises."""
    api_key = getattr(settings, "resend_api_key", None)
    from_email = getattr(settings, "resend_from_email", None)

    if not api_key or not from_email:
        logger.warning("Resend no configurado; email de confirmación de suscripción omitido")
        return False

    display_name = name or to_email.split("@", 1)[0]
    plan_label = "Profesional" if plan == "profesional" else "Básico"

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0A714E;">¡Tu plan {plan_label} ya está activo, {display_name}!</h2>
      <p>Hemos confirmado tu pago y tu cuenta profesional en Agrivo ya está activada.</p>
      <p>Ya puedes acceder a todas las ventajas de tu plan y empezar a pujar por trabajos.</p>
      <p style="margin-top: 24px;">
        <a href="https://agrivo.com/dashboard" style="background-color:#0A714E;color:#fff;
        padding:10px 20px;border-radius:6px;text-decoration:none;">Ver mi suscripción</a>
      </p>
      <p style="margin-top: 24px; color: #666; font-size: 13px;">
        Si tienes cualquier duda, escríbenos a
        <a href="mailto:soporte@agrivo.com">soporte@agrivo.com</a>.
      </p>
    </div>
    """

    payload = {
        "from": from_email,
        "to": [to_email],
        "subject": f"Tu plan {plan_label} está activo - Agrivo",
        "html": html_content,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                RESEND_API_URL,
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
            response.raise_for_status()
        logger.info(f"Email de confirmación de suscripción enviado a {to_email}")
        return True
    except httpx.HTTPError as exc:
        logger.error(f"Fallo al enviar email de confirmación a {to_email}: {exc}")
        return False

