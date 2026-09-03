"""Generate DOCX documentation for Agrivo platform."""
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import re


def add_heading_styled(doc, text, level=1):
    heading = doc.add_heading(text, level=level)
    return heading


def add_table_from_data(doc, headers, rows):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    # Header row
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        for paragraph in hdr_cells[i].paragraphs:
            for run in paragraph.runs:
                run.bold = True
    # Data rows
    for row_data in rows:
        row_cells = table.add_row().cells
        for i, cell_text in enumerate(row_data):
            row_cells[i].text = str(cell_text)
    return table


def add_code_block(doc, code, language=''):
    para = doc.add_paragraph()
    para.style = doc.styles['No Spacing']
    run = para.add_run(code)
    run.font.name = 'Courier New'
    run.font.size = Pt(8)
    return para


def generate_spanish_doc():
    doc = Document()
    
    # Title
    title = doc.add_heading('AGRIVO - Documentación Técnica Completa', 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    subtitle = doc.add_paragraph('Marketplace Global de Servicios Agrícolas')
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.runs[0].font.size = Pt(14)
    
    doc.add_paragraph('Documento para desarrollador - Versión 1.0')
    doc.add_paragraph('Fecha: 11 de julio de 2026')
    doc.add_page_break()
    
    # ===== 1. DESCRIPCIÓN GENERAL =====
    add_heading_styled(doc, '1. Descripción General', 1)
    doc.add_paragraph(
        'Agrivo es un marketplace global que conecta agricultores con profesionales del campo. '
        'La plataforma permite publicar trabajos agrícolas, recibir pujas competitivas, '
        'contratar profesionales verificados y gestionar pagos de forma segura.'
    )
    
    add_heading_styled(doc, 'Funcionalidades Principales', 2)
    features = [
        'Publicar trabajos agrícolas con sistema de subasta inversa o precio fijo',
        'Directorio de profesionales verificados con KYC',
        'Sistema de pujas donde profesionales compiten por trabajos',
        'Mensajería en tiempo real entre usuarios',
        'Reseñas y valoraciones de profesionales',
        'Planes de suscripción (Free, Pro €19/mes, Enterprise €29/mes) con Stripe',
        'Verificación KYC post-pago con panel de administración',
        'Centro de disputas para resolución de conflictos',
        'Soporte multiidioma (Español, Inglés, Portugués, Francés)',
        '10 países operativos: España, Brasil, Argentina, USA, Portugal, Francia, India, Australia, Ucrania, México',
        '12 categorías: Drones, Cosecha, Poda, Arado, Siembra, Riego, Fumigación, Análisis de Suelo, Topografía, Ganadería, Consultoría, Transporte',
    ]
    for f in features:
        doc.add_paragraph(f, style='List Bullet')
    
    add_heading_styled(doc, 'Modelo de Negocio', 2)
    add_table_from_data(doc,
        ['Plan', 'Precio', 'Características'],
        [
            ['Free', '€0', '3 trabajos/mes, 5 ofertas/trabajo, perfil básico'],
            ['Profesional', '€19/mes', 'KYC verificado, insignia ✓, pujas ilimitadas, ranking priorizado'],
            ['Empresa', '€29/mes', 'Destacado en portada, insignia Top Pro ⭐, analíticas, soporte prioritario'],
        ]
    )
    
    # ===== 2. ARQUITECTURA =====
    doc.add_page_break()
    add_heading_styled(doc, '2. Arquitectura del Sistema', 1)
    
    doc.add_paragraph('El sistema sigue una arquitectura de separación frontend/backend:')
    
    arch_text = """FRONTEND (React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui)
    ↓ @metagptx/web-sdk (HTTP + Auth con cookies)
BACKEND (FastAPI + SQLAlchemy + PostgreSQL)
    ↓
SERVICIOS EXTERNOS (Stripe, Resend, Object Storage)"""
    add_code_block(doc, arch_text)
    
    add_heading_styled(doc, 'Flujo de Datos Principal', 2)
    flows = [
        'Usuario publica trabajo → Frontend → SDK → Backend → PostgreSQL',
        'Profesional puja → Frontend → SDK → Backend → PostgreSQL + Email',
        'Pago suscripción → Frontend → Stripe Checkout → Backend → Actualiza plan',
        'KYC → Frontend (formulario + foto) → Backend → Admin aprueba/rechaza → Email',
    ]
    for f in flows:
        doc.add_paragraph(f, style='List Number')
    
    # ===== 3. STACK TECNOLÓGICO =====
    doc.add_page_break()
    add_heading_styled(doc, '3. Stack Tecnológico', 1)
    
    add_heading_styled(doc, 'Frontend', 2)
    add_table_from_data(doc,
        ['Tecnología', 'Versión', 'Uso'],
        [
            ['React', '18.3.1', 'Framework UI'],
            ['TypeScript', '5.5.3', 'Tipado estático'],
            ['Vite', '5.4.1', 'Build tool'],
            ['Tailwind CSS', '3.4.11', 'Estilos utility-first'],
            ['shadcn/ui', 'latest', 'Componentes UI (Radix)'],
            ['React Router', '6.30.0', 'Enrutamiento SPA'],
            ['TanStack Query', '5.56.2', 'Cache y fetching'],
            ['Recharts', '2.12.7', 'Gráficos'],
            ['Lucide React', '0.462.0', 'Iconos'],
            ['@metagptx/web-sdk', 'latest', 'SDK backend'],
            ['Sonner', '1.7.4', 'Notificaciones toast'],
            ['React Hook Form + Zod', 'latest', 'Formularios y validación'],
        ]
    )
    
    add_heading_styled(doc, 'Backend', 2)
    add_table_from_data(doc,
        ['Tecnología', 'Uso'],
        [
            ['FastAPI', 'Framework API REST'],
            ['SQLAlchemy', 'ORM para PostgreSQL'],
            ['Alembic', 'Migraciones de BD'],
            ['PostgreSQL', 'Base de datos relacional'],
            ['Stripe SDK', 'Procesamiento de pagos'],
            ['Resend', 'Envío de emails'],
        ]
    )
    
    add_heading_styled(doc, 'Diseño Visual', 2)
    add_table_from_data(doc,
        ['Aspecto', 'Valor'],
        [
            ['Color primario', 'Emerald/Green (#059669, #166534)'],
            ['Color secundario', 'Earth/Amber (#92400e)'],
            ['Color acento', 'Orange (#ea580c)'],
            ['Fondo', 'Warm white (#fafaf5)'],
            ['Tipografía headings', 'Poppins'],
            ['Tipografía body', 'Open Sans'],
            ['Estilo', 'Trust & Authority, marketplace'],
        ]
    )
    
    # ===== 4. BASE DE DATOS =====
    doc.add_page_break()
    add_heading_styled(doc, '4. Base de Datos - Schemas', 1)
    
    doc.add_paragraph('La base de datos PostgreSQL contiene 8 tablas principales. Todas incluyen campos automáticos created_at y updated_at.')
    
    # Jobs
    add_heading_styled(doc, 'Tabla: jobs (Trabajos)', 2)
    add_table_from_data(doc,
        ['Campo', 'Tipo', 'Requerido', 'Descripción'],
        [
            ['id', 'integer', 'Auto', 'Primary key autoincrement'],
            ['title', 'string', 'Sí', 'Título del trabajo'],
            ['description', 'string', 'No', 'Descripción detallada'],
            ['category', 'string', 'Sí', 'Categoría de servicio'],
            ['country', 'string', 'Sí', 'País'],
            ['location', 'string', 'Sí', 'Ubicación específica'],
            ['hectares', 'number', 'No', 'Superficie en hectáreas'],
            ['budget_min', 'number', 'No', 'Presupuesto mínimo (€)'],
            ['budget_max', 'number', 'No', 'Presupuesto máximo (€)'],
            ['contract_type', 'string', 'Sí', 'reverse_auction o fixed_price'],
            ['status', 'string', 'No', 'open, in_progress, completed, cancelled'],
            ['user_id', 'string', 'Sí', 'ID del usuario creador'],
        ]
    )
    
    # Bids
    add_heading_styled(doc, 'Tabla: bids (Pujas/Ofertas)', 2)
    add_table_from_data(doc,
        ['Campo', 'Tipo', 'Requerido', 'Descripción'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['job_id', 'integer', 'Sí', 'FK a jobs.id'],
            ['amount', 'number', 'Sí', 'Monto de la oferta (€)'],
            ['message', 'string', 'No', 'Mensaje del profesional'],
            ['status', 'string', 'No', 'pending, accepted, rejected'],
            ['user_id', 'string', 'Sí', 'ID del profesional'],
        ]
    )
    
    # Profiles
    add_heading_styled(doc, 'Tabla: profiles (Perfiles)', 2)
    add_table_from_data(doc,
        ['Campo', 'Tipo', 'Requerido', 'Descripción'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['display_name', 'string', 'Sí', 'Nombre visible'],
            ['role', 'string', 'Sí', 'farmer o professional'],
            ['country', 'string', 'No', 'País del profesional'],
            ['description', 'string', 'No', 'Bio/descripción'],
            ['avatar_url', 'string', 'No', 'URL del avatar'],
            ['rating', 'number', 'No', 'Valoración media (0-5)'],
            ['jobs_completed', 'integer', 'No', 'Trabajos completados'],
            ['service_radius_km', 'integer', 'No', 'Radio de servicio (km)'],
            ['verified_kyc', 'boolean', 'No', 'KYC verificado'],
            ['categories', 'string', 'No', 'Categorías (separadas por coma)'],
            ['language', 'string', 'No', 'Idioma preferido'],
            ['user_id', 'string', 'Sí', 'ID del usuario'],
        ]
    )
    
    # Messages
    add_heading_styled(doc, 'Tabla: messages (Mensajes)', 2)
    add_table_from_data(doc,
        ['Campo', 'Tipo', 'Requerido', 'Descripción'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['job_id', 'integer', 'Sí', 'FK a jobs.id'],
            ['sender_id', 'string', 'No', 'ID del remitente'],
            ['receiver_id', 'string', 'No', 'ID del destinatario'],
            ['content', 'string', 'Sí', 'Contenido del mensaje'],
            ['user_id', 'string', 'Sí', 'ID del usuario'],
        ]
    )
    
    # Reviews
    add_heading_styled(doc, 'Tabla: reviews (Reseñas)', 2)
    add_table_from_data(doc,
        ['Campo', 'Tipo', 'Requerido', 'Descripción'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['professional_id', 'string', 'Sí', 'ID del profesional valorado'],
            ['job_id', 'integer', 'No', 'FK a jobs.id'],
            ['rating', 'integer', 'Sí', 'Valoración (1-5)'],
            ['comment', 'string', 'Sí', 'Comentario de la reseña'],
            ['reviewer_name', 'string', 'No', 'Nombre del evaluador'],
            ['user_id', 'string', 'Sí', 'ID del evaluador'],
        ]
    )
    
    # Disputes
    add_heading_styled(doc, 'Tabla: disputes (Disputas)', 2)
    add_table_from_data(doc,
        ['Campo', 'Tipo', 'Requerido', 'Descripción'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['job_title', 'string', 'Sí', 'Título del trabajo en disputa'],
            ['reason', 'string', 'Sí', 'Motivo de la disputa'],
            ['description', 'string', 'Sí', 'Descripción detallada'],
            ['amount_disputed', 'number', 'No', 'Monto en disputa (€)'],
            ['status', 'string', 'Sí', 'open, in_review, resolved, closed'],
            ['resolution', 'string', 'No', 'Resolución aplicada'],
            ['user_id', 'string', 'Sí', 'ID del usuario'],
        ]
    )
    
    # Subscriptions
    add_heading_styled(doc, 'Tabla: subscriptions (Suscripciones)', 2)
    add_table_from_data(doc,
        ['Campo', 'Tipo', 'Requerido', 'Descripción'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['plan', 'string', 'Sí', 'free, pro, enterprise'],
            ['status', 'string', 'No', 'active, cancelled, expired'],
            ['stripe_session_id', 'string', 'No', 'ID de sesión de Stripe'],
            ['user_id', 'string', 'Sí', 'ID del usuario'],
        ]
    )
    
    # KYC
    add_heading_styled(doc, 'Tabla: kyc_verifications (Verificaciones KYC)', 2)
    add_table_from_data(doc,
        ['Campo', 'Tipo', 'Requerido', 'Descripción'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['full_name', 'string', 'Sí', 'Nombre completo'],
            ['document_type', 'string', 'Sí', 'dni, passport, license'],
            ['document_number', 'string', 'Sí', 'Número de documento'],
            ['country', 'string', 'No', 'País'],
            ['address', 'string', 'No', 'Dirección'],
            ['specialty', 'string', 'No', 'Especialidad'],
            ['years_experience', 'integer', 'No', 'Años de experiencia'],
            ['certifications', 'string', 'No', 'Certificaciones'],
            ['description', 'string', 'No', 'Descripción profesional'],
            ['document_photo_url', 'string', 'No', 'URL de foto del documento'],
            ['status', 'string', 'Sí', 'pending, approved, rejected'],
            ['plan', 'string', 'No', 'Plan suscrito'],
            ['user_id', 'string', 'Sí', 'ID del usuario'],
        ]
    )
    
    # ===== 5. BACKEND API =====
    doc.add_page_break()
    add_heading_styled(doc, '5. Backend - API y Servicios', 1)
    
    add_heading_styled(doc, 'Endpoints Principales', 2)
    add_table_from_data(doc,
        ['Método', 'Ruta', 'Descripción'],
        [
            ['GET', '/api/v1/auth/login', 'Iniciar login OAuth'],
            ['GET', '/api/v1/auth/me', 'Obtener usuario actual'],
            ['GET', '/api/v1/auth/logout', 'Cerrar sesión'],
            ['GET/POST', '/api/v1/jobs/', 'Listar/Crear trabajos'],
            ['GET', '/api/v1/jobs/{id}', 'Detalle de trabajo'],
            ['GET/POST', '/api/v1/bids/', 'Listar/Crear pujas'],
            ['GET/POST', '/api/v1/profiles/', 'Listar/Crear perfiles'],
            ['GET/POST', '/api/v1/messages/', 'Listar/Enviar mensajes'],
            ['GET/POST', '/api/v1/reviews/', 'Listar/Crear reseñas'],
            ['GET/POST', '/api/v1/disputes/', 'Listar/Crear disputas'],
            ['GET/POST', '/api/v1/subscriptions/', 'Listar/Crear suscripciones'],
            ['GET/POST', '/api/v1/kyc_verifications/', 'Listar/Crear verificaciones KYC'],
            ['POST', '/api/v1/admin/kyc/{id}/approve', 'Aprobar KYC'],
            ['POST', '/api/v1/admin/kyc/{id}/reject', 'Rechazar KYC'],
            ['POST', '/api/v1/storage/upload', 'Subir archivos'],
            ['GET', '/api/v1/health', 'Health check'],
        ]
    )
    
    add_heading_styled(doc, 'Estructura Backend', 2)
    backend_structure = """app/backend/
├── main.py                    # Entry point FastAPI
├── lambda_handler.py          # Handler serverless
├── core/
│   ├── auth.py               # Configuración auth
│   ├── config.py             # Variables de entorno
│   ├── database.py           # Conexión PostgreSQL
│   └── enums.py              # Enumeraciones
├── models/                    # Modelos SQLAlchemy (8 tablas)
├── routers/                   # Endpoints API (14 routers)
├── services/                  # Lógica de negocio
│   ├── email_service.py      # Emails con Resend
│   ├── payment.py            # Pagos con Stripe
│   ├── storage.py            # Object storage
│   └── mock_data.py          # Datos iniciales
└── data_models/               # JSON schemas de tablas"""
    add_code_block(doc, backend_structure)
    
    # ===== 6. FRONTEND =====
    doc.add_page_break()
    add_heading_styled(doc, '6. Frontend - Vistas y Componentes', 1)
    
    add_heading_styled(doc, 'Rutas de la Aplicación', 2)
    add_table_from_data(doc,
        ['Ruta', 'Componente', 'Descripción'],
        [
            ['/', 'Index.tsx', 'Landing page con hero, stats, categorías, profesionales, trabajos'],
            ['/jobs', 'Jobs.tsx', 'Listado de trabajos con filtros'],
            ['/jobs/new', 'CreateJob.tsx', 'Formulario para publicar trabajo'],
            ['/jobs/:id', 'JobDetail.tsx', 'Detalle del trabajo con pujas'],
            ['/pros', 'Professionals.tsx', 'Directorio de profesionales'],
            ['/pros/:id', 'ProProfile.tsx', 'Perfil público con reseñas'],
            ['/precios', 'Pricing.tsx', 'Planes de suscripción'],
            ['/dashboard', 'Dashboard.tsx', 'Panel del usuario'],
            ['/messages', 'Messages.tsx', 'Sistema de mensajería'],
            ['/disputes', 'Disputes.tsx', 'Centro de disputas'],
            ['/payment-success', 'PaymentSuccess.tsx', 'Confirmación de pago'],
            ['/kyc', 'KycVerification.tsx', 'Formulario KYC'],
            ['/admin', 'Admin.tsx', 'Panel de administración'],
            ['/auth/callback', 'AuthCallback.tsx', 'Callback OAuth'],
            ['/legal/:page', 'Legal.tsx', 'Páginas legales'],
        ]
    )
    
    add_heading_styled(doc, 'Landing Page - Secciones', 2)
    sections = [
        'Hero: Imagen de fondo con drone agrícola, título animado, CTAs, banderas de países',
        'Estadísticas animadas: Profesionales activos, trabajos completados, países, satisfacción',
        'Cómo funciona: 3 pasos (publicar → recibir ofertas → contratar)',
        'Categorías: Grid de 12 categorías con iconos emoji',
        'Profesionales destacados: Cards con avatar, rating, insignias, país',
        'Trabajos recientes: Cards con presupuesto, ubicación, categoría',
        'CTA final: Llamada a la acción para registrarse',
    ]
    for i, s in enumerate(sections, 1):
        doc.add_paragraph(f'{i}. {s}')
    
    add_heading_styled(doc, 'Componentes Compartidos', 2)
    add_table_from_data(doc,
        ['Componente', 'Descripción'],
        [
            ['Header.tsx', 'Navegación, selector idioma, login/logout, menú usuario'],
            ['Footer.tsx', 'Links, categorías, legal, redes sociales'],
            ['Badges.tsx', 'Insignias Verificado (✓) y Top Pro (⭐)'],
            ['CookieConsent.tsx', 'Banner de consentimiento de cookies'],
            ['LoadingSpinner.tsx', 'Indicador de carga'],
            ['ProtectedAdminRoute.tsx', 'HOC para rutas admin'],
            ['ui/ (40+ componentes)', 'shadcn/ui: Button, Card, Dialog, Select, Table, etc.'],
        ]
    )
    
    # ===== 7. AUTENTICACIÓN =====
    doc.add_page_break()
    add_heading_styled(doc, '7. Autenticación y Seguridad', 1)
    
    add_heading_styled(doc, 'Flujo de Autenticación', 2)
    auth_flow = [
        'Usuario hace clic en "Iniciar Sesión"',
        'Frontend llama a authApi.login()',
        'Backend redirige a proveedor OAuth (OIDC)',
        'Usuario se autentica en el proveedor',
        'Callback a /auth/callback con código',
        'Backend establece cookie de sesión (httpOnly)',
        'Frontend obtiene usuario con client.auth.me()',
    ]
    for i, step in enumerate(auth_flow, 1):
        doc.add_paragraph(f'{i}. {step}')
    
    add_heading_styled(doc, 'Código de Auth (Frontend)', 2)
    auth_code = """// src/lib/auth.ts
import axios from 'axios';

class RPApi {
  private client = axios.create({
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  async getCurrentUser() {
    const response = await this.client.get('/api/v1/auth/me');
    return response.data;
  }

  async login() {
    const response = await this.client.get('/api/v1/auth/login');
    window.location.href = response.data.redirect_url;
  }

  async logout() {
    const response = await this.client.get('/api/v1/auth/logout');
    window.location.href = response.data.redirect_url;
  }
}"""
    add_code_block(doc, auth_code)
    
    add_heading_styled(doc, 'SDK para Entidades', 2)
    sdk_code = """// src/lib/api.ts
import { createClient } from '@metagptx/web-sdk';
export const client = createClient();

// Uso en componentes:
client.entities.jobs.queryAll({ country: 'España' })
client.entities.jobs.queryMine()
client.entities.jobs.create({ title: '...', category: '...', ... })
client.entities.bids.create({ job_id: 1, amount: 5000, message: '...' })
client.payment.createPaymentSession({ plan: 'pro', price: 19 })
client.payment.verifyPayment(sessionId)"""
    add_code_block(doc, sdk_code)
    
    # ===== 8. PAGOS =====
    doc.add_page_break()
    add_heading_styled(doc, '8. Sistema de Pagos (Stripe)', 1)
    
    add_heading_styled(doc, 'Flujo de Pago', 2)
    payment_flow = [
        'Usuario selecciona plan (Pro €19 o Enterprise €29)',
        'Frontend llama a client.payment.createPaymentSession()',
        'Stripe genera URL de checkout',
        'Usuario completa pago en Stripe',
        'Redirect a /payment-success?session_id=xxx',
        'Frontend verifica con client.payment.verifyPayment()',
        'Backend actualiza suscripción del usuario',
        'Redirect a /kyc para verificación de identidad',
    ]
    for i, step in enumerate(payment_flow, 1):
        doc.add_paragraph(f'{i}. {step}')
    
    doc.add_paragraph('')
    doc.add_paragraph('Proration: Si el usuario ya tiene plan Pro y quiere Enterprise, se aplica prorrateo. Se calcula el crédito restante del plan actual y se cobra solo la diferencia.')
    
    # ===== 9. i18n =====
    add_heading_styled(doc, '9. Internacionalización (i18n)', 1)
    
    add_table_from_data(doc,
        ['Código', 'Idioma', 'Bandera'],
        [
            ['es', 'Español', '🇪🇸'],
            ['en', 'English', '🇺🇸'],
            ['pt', 'Português', '🇧🇷'],
            ['fr', 'Français', '🇫🇷'],
        ]
    )
    
    doc.add_paragraph('')
    doc.add_paragraph('Sistema basado en localStorage con detección automática del idioma del navegador. Uso: t("nav.jobs") devuelve "Trabajos" en español o "Jobs" en inglés según la configuración.')
    
    # ===== 10. DATOS SEMILLA =====
    doc.add_page_break()
    add_heading_styled(doc, '10. Datos Semilla (Seed Data) - España', 1)
    
    add_heading_styled(doc, 'Profesionales de España (14 perfiles)', 2)
    add_table_from_data(doc,
        ['Nombre', 'Especialidad', 'Ubicación', 'Rating', 'Plan'],
        [
            ['María García López', 'Poda', 'La Rioja', '4.8', 'Pro'],
            ['Miguel Ángel Ruiz', 'Arado', 'Andalucía', '4.6', 'Enterprise'],
            ['Carlos Martínez Herrera', 'Riego', 'Jaén, Andalucía', '4.9', 'Enterprise'],
            ['Laura Sánchez Moreno', 'Drones', 'Castilla-La Mancha', '4.8', 'Pro'],
            ['Javier Fernández Ortega', 'Topografía', 'Aragón/Cataluña', '4.7', 'Pro'],
            ['Ana Rodríguez Vega', 'Análisis de Suelo', 'Valencia', '4.9', 'Enterprise'],
            ['Pedro Navarro Gil', 'Cosecha', 'Castilla y León', '4.6', 'Pro'],
            ['Isabel Torres Muñoz', 'Ganadería', 'Extremadura', '4.8', 'Enterprise'],
            ['Francisco López Castillo', 'Fumigación', 'Andalucía', '4.5', 'Pro'],
            ['Carmen Díaz Romero', 'Consultoría', 'Andalucía', '4.9', 'Enterprise'],
            ['Antonio Gómez Serrano', 'Siembra', 'Castilla-La Mancha', '4.7', 'Pro'],
            ['Elena Martín Blanco', 'Poda', 'Murcia/Almería', '4.8', 'Pro'],
            ['David Ruiz Peña', 'Transporte', 'Toda España', '4.6', 'Enterprise'],
            ['Sofía Hernández Rivas', 'Drones', 'Lleida', '4.8', 'Pro'],
        ]
    )
    
    add_heading_styled(doc, 'Trabajos en España (14 ofertas)', 2)
    add_table_from_data(doc,
        ['Trabajo', 'Ubicación', 'Ha', 'Presupuesto'],
        [
            ['Poda de 3.000 olivos', 'Jaén, Andalucía', '45', '€8.000-12.000'],
            ['Riego por goteo en olivar', 'Jaén, Andalucía', '45', '€8.000-15.000'],
            ['Fumigación con drones en viñedo', 'Haro, La Rioja', '30', '€3.000-5.500'],
            ['Análisis de suelos para cítricos', 'Alzira, Valencia', '20', '€2.000-4.000'],
            ['Cosecha de cereal', 'Medina del Campo, Valladolid', '200', '€12.000-20.000'],
            ['Poda olivar superintensivo', 'Lucena, Córdoba', '60', '€5.000-9.000'],
            ['Consultoría ganadera en dehesa', 'Trujillo, Cáceres', '150', '€3.000-6.000'],
            ['Topografía y nivelación', 'Monzón, Huesca', '80', '€4.000-7.000'],
            ['Siembra directa de girasol', 'Manzanares, Ciudad Real', '100', '€5.000-8.000'],
            ['Fertilización de almendro', 'Cieza, Murcia', '35', '€2.500-4.500'],
            ['Riego hidropónico invernadero', 'El Ejido, Almería', '5', '€15.000-25.000'],
            ['Fumigación terrestre cereal', 'Toro, Zamora', '150', '€3.500-5.000'],
            ['Transporte de aceituna', 'Baena, Córdoba', '80', '€4.000-6.000'],
            ['Arado para viñedo', 'Aranda de Duero, Burgos', '25', '€6.000-9.000'],
        ]
    )
    
    # ===== 11. DESPLIEGUE =====
    doc.add_page_break()
    add_heading_styled(doc, '11. Despliegue', 1)
    
    add_heading_styled(doc, 'Variables de Entorno', 2)
    env_vars = """# Frontend
VITE_API_BASE_URL=<URL del backend>

# Backend
DATABASE_URL=postgresql://user:pass@host:5432/dbname
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
RESEND_API_KEY=re_xxxxx
JWT_SECRET=<secret>
OIDC_CLIENT_ID=<client_id>
OIDC_CLIENT_SECRET=<client_secret>
OIDC_ISSUER_URL=<issuer_url>"""
    add_code_block(doc, env_vars)
    
    add_heading_styled(doc, 'Comandos de Build', 2)
    build_cmds = """# Frontend
cd app/frontend
pnpm install
pnpm run build    # Genera dist/

# Backend
cd app/backend
pip install -r requirements.txt
alembic upgrade head    # Migraciones
uvicorn main:app --host 0.0.0.0 --port 8000"""
    add_code_block(doc, build_cmds)
    
    # ===== 12. ESTRUCTURA =====
    doc.add_page_break()
    add_heading_styled(doc, '12. Estructura de Archivos Completa', 1)
    
    file_tree = """app/
├── backend/
│   ├── main.py
│   ├── lambda_handler.py
│   ├── alembic/versions/          # Migraciones
│   ├── core/
│   │   ├── auth.py, config.py, database.py, enums.py
│   ├── data_models/               # JSON schemas (8 archivos)
│   ├── models/                    # SQLAlchemy models (8 archivos)
│   ├── routers/                   # API endpoints (14 routers)
│   │   ├── admin.py, auth.py, jobs.py, bids.py
│   │   ├── profiles.py, messages.py, reviews.py
│   │   ├── disputes.py, subscriptions.py
│   │   ├── kyc_verifications.py, storage.py, aihub.py
│   ├── services/
│   │   ├── email_service.py, payment.py
│   │   ├── storage.py, mock_data.py
│   └── schemas/
│
├── frontend/
│   ├── index.html, package.json
│   ├── vite.config.ts, tailwind.config.ts
│   ├── src/
│   │   ├── main.tsx, App.tsx, index.css
│   │   ├── components/
│   │   │   ├── Header.tsx, Footer.tsx, Badges.tsx
│   │   │   ├── CookieConsent.tsx, LoadingSpinner.tsx
│   │   │   └── ui/ (40+ componentes shadcn)
│   │   ├── pages/
│   │   │   ├── Index.tsx, Jobs.tsx, JobDetail.tsx
│   │   │   ├── CreateJob.tsx, Professionals.tsx
│   │   │   ├── ProProfile.tsx, Pricing.tsx
│   │   │   ├── Dashboard.tsx, Messages.tsx
│   │   │   ├── Disputes.tsx, KycVerification.tsx
│   │   │   ├── Admin.tsx, PaymentSuccess.tsx
│   │   │   ├── AuthCallback.tsx, AuthError.tsx, Legal.tsx
│   │   ├── lib/
│   │   │   ├── api.ts, auth.ts, config.ts
│   │   │   ├── constants.ts, i18n.ts, utils.ts
│   │   ├── contexts/AuthContext.tsx
│   │   └── hooks/"""
    add_code_block(doc, file_tree)
    
    # NOTAS FINALES
    doc.add_page_break()
    add_heading_styled(doc, 'Notas para el Desarrollador', 1)
    
    notes = [
        'SDK Web: El frontend usa @metagptx/web-sdk que abstrae las llamadas al backend. Para replicar sin este SDK, implementar un cliente HTTP que maneje auth con cookies y CRUD de entidades REST estándar.',
        'Avatares: Se generan dinámicamente con DiceBear API: https://api.dicebear.com/7.x/initials/svg?seed={nombre}',
        'Imágenes: Las imágenes del hero y categorías están alojadas en CDN. Para replicar, usar imágenes propias o servicios como Unsplash.',
        'Stripe: Requiere cuenta de Stripe con productos configurados para los planes Pro (€19) y Enterprise (€29).',
        'Resend: Para emails transaccionales. Alternativa: SendGrid, Mailgun, o cualquier servicio SMTP.',
        'Datos Seed: Los datos iniciales se muestran como contenido de ejemplo hasta que usuarios reales se registren. Se mezclan con datos reales de la BD.',
        'Componentes UI: Se usa shadcn/ui (basado en Radix UI) con más de 40 componentes pre-configurados. Son copiados al proyecto, no instalados como dependencia.',
    ]
    for i, note in enumerate(notes, 1):
        doc.add_paragraph(f'{i}. {note}')
    
    doc.save('/workspace/AGRIVO_Documentacion_ES.docx')
    print('✅ Documento español generado: AGRIVO_Documentacion_ES.docx')


def generate_english_doc():
    doc = Document()
    
    # Title
    title = doc.add_heading('AGRIVO - Complete Technical Documentation', 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    subtitle = doc.add_paragraph('Global Agricultural Services Marketplace')
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.runs[0].font.size = Pt(14)
    
    doc.add_paragraph('Developer Documentation - Version 1.0')
    doc.add_paragraph('Date: July 11, 2026')
    doc.add_page_break()
    
    # ===== 1. GENERAL DESCRIPTION =====
    add_heading_styled(doc, '1. General Description', 1)
    doc.add_paragraph(
        'Agrivo is a global marketplace connecting farmers with field professionals. '
        'The platform enables posting agricultural jobs, receiving competitive bids, '
        'hiring verified professionals and managing payments securely.'
    )
    
    add_heading_styled(doc, 'Main Features', 2)
    features = [
        'Post agricultural jobs with reverse auction or fixed price system',
        'Professional directory with KYC verification',
        'Bidding system where professionals compete for jobs',
        'Real-time messaging between users',
        'Reviews and ratings for professionals',
        'Subscription plans (Free, Pro €19/month, Enterprise €29/month) with Stripe',
        'KYC verification post-payment with admin panel',
        'Dispute resolution center for conflict management',
        'Multi-language support (Spanish, English, Portuguese, French)',
        '10 operating countries: Spain, Brazil, Argentina, USA, Portugal, France, India, Australia, Ukraine, Mexico',
        '12 categories: Drones, Harvesting, Pruning, Plowing, Seeding, Irrigation, Spraying, Soil Analysis, Topography, Livestock, Consulting, Transport',
    ]
    for f in features:
        doc.add_paragraph(f, style='List Bullet')
    
    add_heading_styled(doc, 'Business Model', 2)
    add_table_from_data(doc,
        ['Plan', 'Price', 'Features'],
        [
            ['Free', '€0', '3 jobs/month, 5 bids/job, basic profile'],
            ['Professional', '€19/month', 'Verified KYC, ✓ badge, unlimited bids, priority ranking'],
            ['Enterprise', '€29/month', 'Featured on homepage, Top Pro ⭐ badge, analytics, priority support'],
        ]
    )
    
    # ===== 2. ARCHITECTURE =====
    doc.add_page_break()
    add_heading_styled(doc, '2. System Architecture', 1)
    
    doc.add_paragraph('The system follows a frontend/backend separation architecture:')
    
    arch_text = """FRONTEND (React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui)
    ↓ @metagptx/web-sdk (HTTP + Auth with cookies)
BACKEND (FastAPI + SQLAlchemy + PostgreSQL)
    ↓
EXTERNAL SERVICES (Stripe, Resend, Object Storage)"""
    add_code_block(doc, arch_text)
    
    add_heading_styled(doc, 'Main Data Flow', 2)
    flows = [
        'User posts job → Frontend → SDK → Backend → PostgreSQL',
        'Professional bids → Frontend → SDK → Backend → PostgreSQL + Email',
        'Subscription payment → Frontend → Stripe Checkout → Backend → Updates plan',
        'KYC → Frontend (form + photo) → Backend → Admin approves/rejects → Email',
    ]
    for f in flows:
        doc.add_paragraph(f, style='List Number')
    
    # ===== 3. TECH STACK =====
    doc.add_page_break()
    add_heading_styled(doc, '3. Technology Stack', 1)
    
    add_heading_styled(doc, 'Frontend', 2)
    add_table_from_data(doc,
        ['Technology', 'Version', 'Usage'],
        [
            ['React', '18.3.1', 'UI Framework'],
            ['TypeScript', '5.5.3', 'Static typing'],
            ['Vite', '5.4.1', 'Build tool'],
            ['Tailwind CSS', '3.4.11', 'Utility-first styles'],
            ['shadcn/ui', 'latest', 'UI Components (Radix)'],
            ['React Router', '6.30.0', 'SPA routing'],
            ['TanStack Query', '5.56.2', 'Cache & fetching'],
            ['Recharts', '2.12.7', 'Charts'],
            ['Lucide React', '0.462.0', 'Icons'],
            ['@metagptx/web-sdk', 'latest', 'Backend SDK'],
            ['Sonner', '1.7.4', 'Toast notifications'],
            ['React Hook Form + Zod', 'latest', 'Forms & validation'],
        ]
    )
    
    add_heading_styled(doc, 'Backend', 2)
    add_table_from_data(doc,
        ['Technology', 'Usage'],
        [
            ['FastAPI', 'REST API framework'],
            ['SQLAlchemy', 'PostgreSQL ORM'],
            ['Alembic', 'DB migrations'],
            ['PostgreSQL', 'Relational database'],
            ['Stripe SDK', 'Payment processing'],
            ['Resend', 'Email delivery'],
        ]
    )
    
    add_heading_styled(doc, 'Visual Design', 2)
    add_table_from_data(doc,
        ['Aspect', 'Value'],
        [
            ['Primary color', 'Emerald/Green (#059669, #166534)'],
            ['Secondary color', 'Earth/Amber (#92400e)'],
            ['Accent color', 'Orange (#ea580c)'],
            ['Background', 'Warm white (#fafaf5)'],
            ['Heading font', 'Poppins'],
            ['Body font', 'Open Sans'],
            ['Style', 'Trust & Authority, marketplace'],
        ]
    )
    
    # ===== 4. DATABASE =====
    doc.add_page_break()
    add_heading_styled(doc, '4. Database - Schemas', 1)
    
    doc.add_paragraph('The PostgreSQL database contains 8 main tables. All include automatic created_at and updated_at fields.')
    
    add_heading_styled(doc, 'Table: jobs', 2)
    add_table_from_data(doc,
        ['Field', 'Type', 'Required', 'Description'],
        [
            ['id', 'integer', 'Auto', 'Primary key autoincrement'],
            ['title', 'string', 'Yes', 'Job title'],
            ['description', 'string', 'No', 'Detailed description'],
            ['category', 'string', 'Yes', 'Service category'],
            ['country', 'string', 'Yes', 'Country'],
            ['location', 'string', 'Yes', 'Specific location'],
            ['hectares', 'number', 'No', 'Area in hectares'],
            ['budget_min', 'number', 'No', 'Minimum budget (€)'],
            ['budget_max', 'number', 'No', 'Maximum budget (€)'],
            ['contract_type', 'string', 'Yes', 'reverse_auction or fixed_price'],
            ['status', 'string', 'No', 'open, in_progress, completed, cancelled'],
            ['user_id', 'string', 'Yes', 'Creator user ID'],
        ]
    )
    
    add_heading_styled(doc, 'Table: bids', 2)
    add_table_from_data(doc,
        ['Field', 'Type', 'Required', 'Description'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['job_id', 'integer', 'Yes', 'FK to jobs.id'],
            ['amount', 'number', 'Yes', 'Bid amount (€)'],
            ['message', 'string', 'No', 'Professional message'],
            ['status', 'string', 'No', 'pending, accepted, rejected'],
            ['user_id', 'string', 'Yes', 'Professional ID'],
        ]
    )
    
    add_heading_styled(doc, 'Table: profiles', 2)
    add_table_from_data(doc,
        ['Field', 'Type', 'Required', 'Description'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['display_name', 'string', 'Yes', 'Display name'],
            ['role', 'string', 'Yes', 'farmer or professional'],
            ['country', 'string', 'No', 'Professional country'],
            ['description', 'string', 'No', 'Bio/description'],
            ['avatar_url', 'string', 'No', 'Avatar URL'],
            ['rating', 'number', 'No', 'Average rating (0-5)'],
            ['jobs_completed', 'integer', 'No', 'Completed jobs'],
            ['service_radius_km', 'integer', 'No', 'Service radius (km)'],
            ['verified_kyc', 'boolean', 'No', 'KYC verified'],
            ['categories', 'string', 'No', 'Categories (comma-separated)'],
            ['language', 'string', 'No', 'Preferred language'],
            ['user_id', 'string', 'Yes', 'User ID'],
        ]
    )
    
    add_heading_styled(doc, 'Table: messages', 2)
    add_table_from_data(doc,
        ['Field', 'Type', 'Required', 'Description'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['job_id', 'integer', 'Yes', 'FK to jobs.id'],
            ['sender_id', 'string', 'No', 'Sender ID'],
            ['receiver_id', 'string', 'No', 'Receiver ID'],
            ['content', 'string', 'Yes', 'Message content'],
            ['user_id', 'string', 'Yes', 'User ID'],
        ]
    )
    
    add_heading_styled(doc, 'Table: reviews', 2)
    add_table_from_data(doc,
        ['Field', 'Type', 'Required', 'Description'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['professional_id', 'string', 'Yes', 'Reviewed professional ID'],
            ['job_id', 'integer', 'No', 'FK to jobs.id'],
            ['rating', 'integer', 'Yes', 'Rating (1-5)'],
            ['comment', 'string', 'Yes', 'Review comment'],
            ['reviewer_name', 'string', 'No', 'Reviewer name'],
            ['user_id', 'string', 'Yes', 'Reviewer ID'],
        ]
    )
    
    add_heading_styled(doc, 'Table: disputes', 2)
    add_table_from_data(doc,
        ['Field', 'Type', 'Required', 'Description'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['job_title', 'string', 'Yes', 'Disputed job title'],
            ['reason', 'string', 'Yes', 'Dispute reason'],
            ['description', 'string', 'Yes', 'Detailed description'],
            ['amount_disputed', 'number', 'No', 'Disputed amount (€)'],
            ['status', 'string', 'Yes', 'open, in_review, resolved, closed'],
            ['resolution', 'string', 'No', 'Applied resolution'],
            ['user_id', 'string', 'Yes', 'User ID'],
        ]
    )
    
    add_heading_styled(doc, 'Table: subscriptions', 2)
    add_table_from_data(doc,
        ['Field', 'Type', 'Required', 'Description'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['plan', 'string', 'Yes', 'free, pro, enterprise'],
            ['status', 'string', 'No', 'active, cancelled, expired'],
            ['stripe_session_id', 'string', 'No', 'Stripe session ID'],
            ['user_id', 'string', 'Yes', 'User ID'],
        ]
    )
    
    add_heading_styled(doc, 'Table: kyc_verifications', 2)
    add_table_from_data(doc,
        ['Field', 'Type', 'Required', 'Description'],
        [
            ['id', 'integer', 'Auto', 'Primary key'],
            ['full_name', 'string', 'Yes', 'Full name'],
            ['document_type', 'string', 'Yes', 'dni, passport, license'],
            ['document_number', 'string', 'Yes', 'Document number'],
            ['country', 'string', 'No', 'Country'],
            ['address', 'string', 'No', 'Address'],
            ['specialty', 'string', 'No', 'Specialty'],
            ['years_experience', 'integer', 'No', 'Years of experience'],
            ['certifications', 'string', 'No', 'Certifications'],
            ['description', 'string', 'No', 'Professional description'],
            ['document_photo_url', 'string', 'No', 'Document photo URL'],
            ['status', 'string', 'Yes', 'pending, approved, rejected'],
            ['plan', 'string', 'No', 'Subscribed plan'],
            ['user_id', 'string', 'Yes', 'User ID'],
        ]
    )
    
    # ===== 5. BACKEND =====
    doc.add_page_break()
    add_heading_styled(doc, '5. Backend - API & Services', 1)
    
    add_heading_styled(doc, 'Main Endpoints', 2)
    add_table_from_data(doc,
        ['Method', 'Route', 'Description'],
        [
            ['GET', '/api/v1/auth/login', 'Initiate OAuth login'],
            ['GET', '/api/v1/auth/me', 'Get current user'],
            ['GET', '/api/v1/auth/logout', 'Logout'],
            ['GET/POST', '/api/v1/jobs/', 'List/Create jobs'],
            ['GET', '/api/v1/jobs/{id}', 'Job detail'],
            ['GET/POST', '/api/v1/bids/', 'List/Create bids'],
            ['GET/POST', '/api/v1/profiles/', 'List/Create profiles'],
            ['GET/POST', '/api/v1/messages/', 'List/Send messages'],
            ['GET/POST', '/api/v1/reviews/', 'List/Create reviews'],
            ['GET/POST', '/api/v1/disputes/', 'List/Create disputes'],
            ['GET/POST', '/api/v1/subscriptions/', 'List/Create subscriptions'],
            ['GET/POST', '/api/v1/kyc_verifications/', 'List/Create KYC verifications'],
            ['POST', '/api/v1/admin/kyc/{id}/approve', 'Approve KYC'],
            ['POST', '/api/v1/admin/kyc/{id}/reject', 'Reject KYC'],
            ['POST', '/api/v1/storage/upload', 'Upload files'],
            ['GET', '/api/v1/health', 'Health check'],
        ]
    )
    
    # ===== 6. FRONTEND =====
    doc.add_page_break()
    add_heading_styled(doc, '6. Frontend - Views & Components', 1)
    
    add_heading_styled(doc, 'Application Routes', 2)
    add_table_from_data(doc,
        ['Route', 'Component', 'Description'],
        [
            ['/', 'Index.tsx', 'Landing page with hero, stats, categories, pros, jobs'],
            ['/jobs', 'Jobs.tsx', 'Job listing with filters'],
            ['/jobs/new', 'CreateJob.tsx', 'Form to post new job'],
            ['/jobs/:id', 'JobDetail.tsx', 'Job detail with bidding'],
            ['/pros', 'Professionals.tsx', 'Professional directory'],
            ['/pros/:id', 'ProProfile.tsx', 'Public profile with reviews'],
            ['/precios', 'Pricing.tsx', 'Subscription plans'],
            ['/dashboard', 'Dashboard.tsx', 'User panel'],
            ['/messages', 'Messages.tsx', 'Messaging system'],
            ['/disputes', 'Disputes.tsx', 'Dispute center'],
            ['/payment-success', 'PaymentSuccess.tsx', 'Payment confirmation'],
            ['/kyc', 'KycVerification.tsx', 'KYC form'],
            ['/admin', 'Admin.tsx', 'Admin panel'],
            ['/auth/callback', 'AuthCallback.tsx', 'OAuth callback'],
            ['/legal/:page', 'Legal.tsx', 'Legal pages'],
        ]
    )
    
    # ===== 7. AUTH =====
    doc.add_page_break()
    add_heading_styled(doc, '7. Authentication & Security', 1)
    
    auth_flow = [
        'User clicks "Sign In"',
        'Frontend calls authApi.login()',
        'Backend redirects to OAuth provider (OIDC)',
        'User authenticates with provider',
        'Callback to /auth/callback with code',
        'Backend sets session cookie (httpOnly)',
        'Frontend gets user with client.auth.me()',
    ]
    for i, step in enumerate(auth_flow, 1):
        doc.add_paragraph(f'{i}. {step}')
    
    add_heading_styled(doc, 'Auth Code (Frontend)', 2)
    auth_code = """// src/lib/auth.ts
class RPApi {
  private client = axios.create({ withCredentials: true });

  async getCurrentUser() {
    return (await this.client.get('/api/v1/auth/me')).data;
  }
  async login() {
    const res = await this.client.get('/api/v1/auth/login');
    window.location.href = res.data.redirect_url;
  }
  async logout() {
    const res = await this.client.get('/api/v1/auth/logout');
    window.location.href = res.data.redirect_url;
  }
}"""
    add_code_block(doc, auth_code)
    
    # ===== 8. PAYMENTS =====
    add_heading_styled(doc, '8. Payment System (Stripe)', 1)
    payment_flow = [
        'User selects plan (Pro €19 or Enterprise €29)',
        'Frontend calls client.payment.createPaymentSession()',
        'Stripe generates checkout URL',
        'User completes payment on Stripe',
        'Redirect to /payment-success?session_id=xxx',
        'Frontend verifies with client.payment.verifyPayment()',
        'Backend updates user subscription',
        'Redirect to /kyc for identity verification',
    ]
    for i, step in enumerate(payment_flow, 1):
        doc.add_paragraph(f'{i}. {step}')
    
    # ===== 9-12 =====
    doc.add_page_break()
    add_heading_styled(doc, '9. Internationalization (i18n)', 1)
    add_table_from_data(doc,
        ['Code', 'Language', 'Flag'],
        [['es', 'Spanish', '🇪🇸'], ['en', 'English', '🇺🇸'], ['pt', 'Portuguese', '🇧🇷'], ['fr', 'French', '🇫🇷']]
    )
    doc.add_paragraph('localStorage-based system with automatic browser language detection.')
    
    add_heading_styled(doc, '10. Seed Data - Spain', 1)
    add_heading_styled(doc, 'Spanish Professionals (14)', 2)
    add_table_from_data(doc,
        ['Name', 'Specialty', 'Location', 'Rating'],
        [
            ['María García López', 'Pruning', 'La Rioja', '4.8'],
            ['Miguel Ángel Ruiz', 'Plowing', 'Andalusia', '4.6'],
            ['Carlos Martínez Herrera', 'Irrigation', 'Jaén', '4.9'],
            ['Laura Sánchez Moreno', 'Drones', 'Castilla-La Mancha', '4.8'],
            ['Javier Fernández Ortega', 'Topography', 'Aragon', '4.7'],
            ['Ana Rodríguez Vega', 'Soil Analysis', 'Valencia', '4.9'],
            ['Pedro Navarro Gil', 'Harvesting', 'Castilla y León', '4.6'],
            ['Isabel Torres Muñoz', 'Livestock', 'Extremadura', '4.8'],
            ['Francisco López Castillo', 'Spraying', 'Andalusia', '4.5'],
            ['Carmen Díaz Romero', 'Consulting', 'Andalusia', '4.9'],
            ['Antonio Gómez Serrano', 'Seeding', 'Castilla-La Mancha', '4.7'],
            ['Elena Martín Blanco', 'Pruning', 'Murcia', '4.8'],
            ['David Ruiz Peña', 'Transport', 'All Spain', '4.6'],
            ['Sofía Hernández Rivas', 'Drones', 'Lleida', '4.8'],
        ]
    )
    
    add_heading_styled(doc, '11. Deployment', 1)
    env_vars = """VITE_API_BASE_URL=<backend URL>
DATABASE_URL=postgresql://user:pass@host:5432/dbname
STRIPE_SECRET_KEY=sk_live_xxxxx
RESEND_API_KEY=re_xxxxx"""
    add_code_block(doc, env_vars)
    
    # Notes
    doc.add_page_break()
    add_heading_styled(doc, 'Developer Notes', 1)
    notes = [
        'Web SDK: Frontend uses @metagptx/web-sdk. To replicate, implement HTTP client with cookie auth and standard REST CRUD.',
        'Avatars: Generated with DiceBear API: https://api.dicebear.com/7.x/initials/svg?seed={name}',
        'Images: Hero/category images on CDN. Use own images or Unsplash for replication.',
        'Stripe: Requires Stripe account with Pro (€19) and Enterprise (€29) products.',
        'Resend: For transactional emails. Alternative: SendGrid, Mailgun, SMTP.',
        'Seed Data: Initial data shown as sample until real users register. Merges with real DB data.',
        'UI Components: shadcn/ui (Radix-based) with 40+ pre-configured components copied to project.',
    ]
    for i, note in enumerate(notes, 1):
        doc.add_paragraph(f'{i}. {note}')
    
    doc.save('/workspace/AGRIVO_Documentation_EN.docx')
    print('✅ English document generated: AGRIVO_Documentation_EN.docx')


if __name__ == '__main__':
    generate_spanish_doc()
    generate_english_doc()