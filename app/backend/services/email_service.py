# @File: backend/services/email_service.py
# @Desc: Email notification service using Resend
import os
import logging
import httpx

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = "Agrivo <notifications@agrivo.app>"
RESEND_URL = "https://api.resend.com/emails"


async def send_email(to: str, subject: str, html: str) -> bool:
    """Send an email via Resend API."""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return False

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                RESEND_URL,
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": FROM_EMAIL,
                    "to": [to],
                    "subject": subject,
                    "html": html,
                },
                timeout=10,
            )
            if response.status_code in (200, 201):
                logger.info(f"Email sent to {to}: {subject}")
                return True
            else:
                logger.error(f"Resend error {response.status_code}: {response.text}")
                return False
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return False


def kyc_approved_email(full_name: str, plan: str) -> tuple[str, str]:
    """Generate KYC approval email subject and HTML."""
    badge = "Top Pro ⭐" if plan == "enterprise" else "Verificado ✓"
    subject = f"🎉 ¡Felicidades {full_name}! Tu verificación ha sido aprobada"
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 30px 0;">
            <h1 style="color: #166534; margin: 0;">🌱 Agrivo</h1>
            <p style="color: #6b7280; margin-top: 5px;">Marketplace de Servicios Agrícolas</p>
        </div>
        <div style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 16px; padding: 30px; text-align: center;">
            <h2 style="color: #166534; margin-top: 0;">¡Verificación aprobada! ✅</h2>
            <p style="color: #374151; font-size: 16px;">
                Hola <strong>{full_name}</strong>, tu identidad ha sido verificada exitosamente.
            </p>
            <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; display: inline-block;">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Tu insignia:</p>
                <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #166534;">{badge}</p>
            </div>
            <p style="color: #374151; font-size: 14px;">
                Tu perfil ahora muestra la insignia de verificación. Los clientes confiarán más en tus servicios.
            </p>
        </div>
        <div style="text-align: center; padding: 20px;">
            <a href="https://agrivo.app/dashboard" style="background: #166534; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Ver mi perfil
            </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
            © 2026 Agrivo. Todos los derechos reservados.
        </p>
    </div>
    """
    return subject, html


def kyc_rejected_email(full_name: str, reason: str = "") -> tuple[str, str]:
    """Generate KYC rejection email subject and HTML."""
    reason_text = f"<p style='color: #991b1b; background: #fef2f2; padding: 12px; border-radius: 8px;'><strong>Motivo:</strong> {reason}</p>" if reason else ""
    subject = f"⚠️ {full_name}, tu verificación necesita revisión"
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 30px 0;">
            <h1 style="color: #166534; margin: 0;">🌱 Agrivo</h1>
            <p style="color: #6b7280; margin-top: 5px;">Marketplace de Servicios Agrícolas</p>
        </div>
        <div style="background: #fef2f2; border-radius: 16px; padding: 30px; text-align: center;">
            <h2 style="color: #991b1b; margin-top: 0;">Verificación no aprobada</h2>
            <p style="color: #374151; font-size: 16px;">
                Hola <strong>{full_name}</strong>, lamentamos informarte que tu verificación no ha sido aprobada en esta ocasión.
            </p>
            {reason_text}
            <p style="color: #374151; font-size: 14px;">
                Puedes volver a enviar tu documentación corrigiendo los datos indicados.
            </p>
        </div>
        <div style="text-align: center; padding: 20px;">
            <a href="https://agrivo.app/kyc" style="background: #166534; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Reintentar verificación
            </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
            © 2026 Agrivo. Todos los derechos reservados.
        </p>
    </div>
    """
    return subject, html


def new_bid_email(job_title: str, bidder_name: str, amount: str) -> tuple[str, str]:
    """Generate new bid notification email."""
    subject = f"💰 Nueva oferta en tu trabajo: {job_title}"
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 30px 0;">
            <h1 style="color: #166534; margin: 0;">🌱 Agrivo</h1>
        </div>
        <div style="background: #f0fdf4; border-radius: 16px; padding: 30px;">
            <h2 style="color: #166534; margin-top: 0;">Nueva oferta recibida 💰</h2>
            <p style="color: #374151;">
                <strong>{bidder_name}</strong> ha enviado una oferta de <strong>{amount}</strong> para tu trabajo:
            </p>
            <p style="color: #166534; font-size: 18px; font-weight: bold;">"{job_title}"</p>
        </div>
        <div style="text-align: center; padding: 20px;">
            <a href="https://agrivo.app/dashboard" style="background: #166534; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Ver ofertas
            </a>
        </div>
    </div>
    """
    return subject, html


def new_message_email(sender_name: str) -> tuple[str, str]:
    """Generate new message notification email."""
    subject = f"💬 Nuevo mensaje de {sender_name} en Agrivo"
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 30px 0;">
            <h1 style="color: #166534; margin: 0;">🌱 Agrivo</h1>
        </div>
        <div style="background: #f0fdf4; border-radius: 16px; padding: 30px;">
            <h2 style="color: #166534; margin-top: 0;">Nuevo mensaje 💬</h2>
            <p style="color: #374151;">
                <strong>{sender_name}</strong> te ha enviado un mensaje.
            </p>
        </div>
        <div style="text-align: center; padding: 20px;">
            <a href="https://agrivo.app/messages" style="background: #166534; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Leer mensaje
            </a>
        </div>
    </div>
    """
    return subject, html