# AGRIVO - Documentación Técnica Completa
## Marketplace Global de Servicios Agrícolas

---

## 📋 ÍNDICE

1. [Descripción General](#1-descripción-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Base de Datos - Schemas](#4-base-de-datos---schemas)
5. [Backend - API y Servicios](#5-backend---api-y-servicios)
6. [Frontend - Vistas y Componentes](#6-frontend---vistas-y-componentes)
7. [Autenticación y Seguridad](#7-autenticación-y-seguridad)
8. [Sistema de Pagos (Stripe)](#8-sistema-de-pagos-stripe)
9. [Internacionalización (i18n)](#9-internacionalización-i18n)
10. [Datos Semilla (Seed Data)](#10-datos-semilla-seed-data)
11. [Despliegue](#11-despliegue)
12. [Estructura de Archivos](#12-estructura-de-archivos)

---

## 1. DESCRIPCIÓN GENERAL

**Agrivo** es un marketplace global que conecta agricultores con profesionales del campo. La plataforma permite:

- **Publicar trabajos agrícolas** con sistema de subasta inversa o precio fijo
- **Directorio de profesionales** verificados con KYC
- **Sistema de pujas** donde profesionales compiten por trabajos
- **Mensajería en tiempo real** entre usuarios
- **Reseñas y valoraciones** de profesionales
- **Planes de suscripción** (Free, Pro €19/mes, Enterprise €29/mes) con Stripe
- **Verificación KYC** post-pago con panel de administración
- **Centro de disputas** para resolución de conflictos
- **Soporte multiidioma** (Español, Inglés, Portugués, Francés)
- **10 países operativos**: España, Brasil, Argentina, USA, Portugal, Francia, India, Australia, Ucrania, México
- **12 categorías de servicio**: Drones, Cosecha, Poda, Arado, Siembra, Riego, Fumigación, Análisis de Suelo, Topografía, Ganadería, Consultoría, Transporte

### Modelo de Negocio

| Plan | Precio | Características |
|------|--------|-----------------|
| Free | €0 | 3 trabajos/mes, 5 ofertas/trabajo, perfil básico |
| Profesional | €19/mes | KYC verificado, insignia ✓, pujas ilimitadas, ranking priorizado |
| Empresa | €29/mes | Destacado en portada, insignia Top Pro ⭐, analíticas, soporte prioritario |

---

## 2. ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│   React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui   │
│                                                              │
│   Páginas: Index, Jobs, JobDetail, CreateJob, Professionals, │
│   ProProfile, Pricing, Dashboard, Messages, Disputes,        │
│   KycVerification, Admin, PaymentSuccess, Legal              │
└─────────────────────┬───────────────────────────────────────┘
                      │ @metagptx/web-sdk (HTTP + Auth)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Atoms Cloud)                     │
│              FastAPI + SQLAlchemy + PostgreSQL                │
│                                                              │
│   Routers: auth, jobs, bids, profiles, messages, reviews,    │
│   disputes, subscriptions, kyc_verifications, admin,         │
│   storage, aihub, health, settings, user                     │
│                                                              │
│   Servicios: payment (Stripe), email (Resend), storage       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICIOS EXTERNOS                         │
│   • Stripe (Pagos y suscripciones)                           │
│   • Resend (Notificaciones email)                            │
│   • Object Storage (Fotos KYC, avatares)                     │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos Principal

1. **Usuario publica trabajo** → Frontend → SDK → Backend → PostgreSQL
2. **Profesional puja** → Frontend → SDK → Backend → PostgreSQL + Email notification
3. **Pago suscripción** → Frontend → Stripe Checkout → Webhook → Backend → Actualiza plan
4. **KYC** → Frontend (formulario + foto) → Backend → Admin aprueba/rechaza → Email

---

## 3. STACK TECNOLÓGICO

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.5.3 | Tipado estático |
| Vite | 5.4.1 | Build tool |
| Tailwind CSS | 3.4.11 | Estilos utility-first |
| shadcn/ui | latest | Componentes UI (Radix) |
| React Router | 6.30.0 | Enrutamiento SPA |
| TanStack Query | 5.56.2 | Cache y fetching |
| Recharts | 2.12.7 | Gráficos |
| Lucide React | 0.462.0 | Iconos |
| @metagptx/web-sdk | latest | SDK backend |
| Sonner | 1.7.4 | Notificaciones toast |
| React Hook Form + Zod | latest | Formularios y validación |

### Backend
| Tecnología | Uso |
|-----------|-----|
| FastAPI | Framework API REST |
| SQLAlchemy | ORM para PostgreSQL |
| Alembic | Migraciones de BD |
| PostgreSQL | Base de datos relacional |
| Stripe SDK | Procesamiento de pagos |
| Resend | Envío de emails |

### Diseño Visual
| Aspecto | Valor |
|---------|-------|
| Color primario | Emerald/Green (#059669, #166534) |
| Color secundario | Earth/Amber (#92400e) |
| Color acento | Orange (#ea580c) |
| Fondo | Warm white (#fafaf5) |
| Tipografía headings | Poppins |
| Tipografía body | Open Sans |
| Estilo | Trust & Authority, marketplace |

---

## 4. BASE DE DATOS - SCHEMAS

### Tabla: `jobs` (Trabajos)
```json
{
  "title": "jobs",
  "type": "object",
  "properties": {
    "id": { "type": "integer", "autoincrement": true },
    "title": { "type": "string" },
    "description": { "type": "string" },
    "category": { "type": "string" },
    "country": { "type": "string" },
    "location": { "type": "string" },
    "hectares": { "type": "number" },
    "budget_min": { "type": "number" },
    "budget_max": { "type": "number" },
    "contract_type": { "type": "string", "enum": ["reverse_auction", "fixed_price"] },
    "status": { "type": "string", "default": "open", "enum": ["open", "in_progress", "completed", "cancelled"] },
    "user_id": { "type": "string" }
  },
  "required": ["title", "category", "country", "location", "contract_type", "user_id"],
  "auto_fields": ["created_at", "updated_at"]
}
```

### Tabla: `bids` (Pujas/Ofertas)
```json
{
  "title": "bids",
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "job_id": { "type": "integer" },
    "amount": { "type": "number" },
    "message": { "type": "string" },
    "status": { "type": "string", "default": "pending", "enum": ["pending", "accepted", "rejected"] },
    "user_id": { "type": "string" }
  },
  "required": ["job_id", "amount", "user_id"]
}
```

### Tabla: `profiles` (Perfiles de usuario)
```json
{
  "title": "profiles",
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "display_name": { "type": "string" },
    "role": { "type": "string", "enum": ["farmer", "professional"] },
    "country": { "type": "string" },
    "description": { "type": "string" },
    "avatar_url": { "type": "string" },
    "rating": { "type": "number", "default": 0 },
    "jobs_completed": { "type": "integer", "default": 0 },
    "service_radius_km": { "type": "integer", "default": 50 },
    "verified_kyc": { "type": "boolean", "default": false },
    "categories": { "type": "string", "description": "comma-separated categories" },
    "language": { "type": "string", "default": "es" },
    "user_id": { "type": "string" }
  },
  "required": ["display_name", "role", "user_id"]
}
```

### Tabla: `messages` (Mensajes)
```json
{
  "title": "messages",
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "job_id": { "type": "integer" },
    "sender_id": { "type": "string" },
    "receiver_id": { "type": "string" },
    "content": { "type": "string" },
    "user_id": { "type": "string" }
  },
  "required": ["job_id", "content", "user_id"]
}
```

### Tabla: `reviews` (Reseñas)
```json
{
  "title": "reviews",
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "professional_id": { "type": "string" },
    "job_id": { "type": "integer" },
    "rating": { "type": "integer", "min": 1, "max": 5 },
    "comment": { "type": "string" },
    "reviewer_name": { "type": "string" },
    "user_id": { "type": "string" }
  },
  "required": ["professional_id", "rating", "comment", "user_id"]
}
```

### Tabla: `disputes` (Disputas)
```json
{
  "title": "disputes",
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "job_title": { "type": "string" },
    "reason": { "type": "string" },
    "description": { "type": "string" },
    "amount_disputed": { "type": "number" },
    "status": { "type": "string", "enum": ["open", "in_review", "resolved", "closed"] },
    "resolution": { "type": "string" },
    "user_id": { "type": "string" }
  },
  "required": ["job_title", "reason", "description", "status", "user_id"]
}
```

### Tabla: `subscriptions` (Suscripciones)
```json
{
  "title": "subscriptions",
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "plan": { "type": "string", "enum": ["free", "pro", "enterprise"] },
    "status": { "type": "string", "default": "active" },
    "stripe_session_id": { "type": "string" },
    "user_id": { "type": "string" }
  },
  "required": ["plan", "user_id"]
}
```

### Tabla: `kyc_verifications` (Verificaciones KYC)
```json
{
  "title": "kyc_verifications",
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "full_name": { "type": "string" },
    "document_type": { "type": "string", "enum": ["dni", "passport", "license"] },
    "document_number": { "type": "string" },
    "country": { "type": "string" },
    "address": { "type": "string" },
    "specialty": { "type": "string" },
    "years_experience": { "type": "integer" },
    "certifications": { "type": "string" },
    "description": { "type": "string" },
    "document_photo_url": { "type": "string" },
    "status": { "type": "string", "enum": ["pending", "approved", "rejected"] },
    "plan": { "type": "string" },
    "user_id": { "type": "string" }
  },
  "required": ["full_name", "document_type", "document_number", "status", "user_id"]
}
```

---

## 5. BACKEND - API Y SERVICIOS

### Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/auth/login` | Iniciar login OAuth |
| GET | `/api/v1/auth/me` | Obtener usuario actual |
| GET | `/api/v1/auth/logout` | Cerrar sesión |
| GET/POST | `/api/v1/jobs/` | Listar/Crear trabajos |
| GET | `/api/v1/jobs/{id}` | Detalle de trabajo |
| GET/POST | `/api/v1/bids/` | Listar/Crear pujas |
| GET/POST | `/api/v1/profiles/` | Listar/Crear perfiles |
| GET/POST | `/api/v1/messages/` | Listar/Enviar mensajes |
| GET/POST | `/api/v1/reviews/` | Listar/Crear reseñas |
| GET/POST | `/api/v1/disputes/` | Listar/Crear disputas |
| GET/POST | `/api/v1/subscriptions/` | Listar/Crear suscripciones |
| GET/POST | `/api/v1/kyc_verifications/` | Listar/Crear verificaciones KYC |
| POST | `/api/v1/admin/kyc/{id}/approve` | Aprobar KYC |
| POST | `/api/v1/admin/kyc/{id}/reject` | Rechazar KYC |
| POST | `/api/v1/storage/upload` | Subir archivos |
| GET | `/api/v1/health` | Health check |

### Servicio de Email (Resend)

```python
# app/backend/services/email_service.py
# Envía notificaciones por email para:
# - KYC aprobado/rechazado
# - Nueva puja recibida
# - Nuevo mensaje recibido
```

### Servicio de Pagos (Stripe)

```python
# app/backend/services/payment.py
# - create_payment_session(): Crea sesión de checkout en Stripe
# - verify_payment(): Verifica el pago completado
# Planes: Pro (€19/mes), Enterprise (€29/mes)
```

### Estructura de Routers Backend

```
app/backend/
├── main.py                    # Entry point FastAPI
├── lambda_handler.py          # Handler para deploy serverless
├── core/
│   ├── auth.py               # Configuración auth
│   ├── config.py             # Variables de entorno
│   ├── database.py           # Conexión PostgreSQL
│   └── enums.py              # Enumeraciones
├── models/                    # Modelos SQLAlchemy
│   ├── jobs.py
│   ├── bids.py
│   ├── profiles.py
│   ├── messages.py
│   ├── reviews.py
│   ├── disputes.py
│   ├── subscriptions.py
│   └── kyc_verifications.py
├── routers/                   # Endpoints API
│   ├── admin.py              # Panel admin KYC
│   ├── auth.py               # Autenticación
│   ├── jobs.py
│   ├── bids.py
│   ├── profiles.py
│   ├── messages.py
│   ├── reviews.py
│   ├── disputes.py
│   ├── subscriptions.py
│   ├── kyc_verifications.py
│   ├── storage.py            # Upload archivos
│   └── aihub.py              # Capacidades IA
├── services/                  # Lógica de negocio
│   ├── email_service.py      # Emails con Resend
│   ├── payment.py            # Pagos con Stripe
│   ├── storage.py            # Object storage
│   └── mock_data.py          # Datos iniciales
└── data_models/               # JSON schemas de tablas
    ├── jobs.json
    ├── bids.json
    ├── profiles.json
    ├── messages.json
    ├── reviews.json
    ├── disputes.json
    ├── subscriptions.json
    └── kyc_verifications.json
```

---

## 6. FRONTEND - VISTAS Y COMPONENTES

### Rutas de la Aplicación

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | Index.tsx | Landing page con hero, stats, categorías, profesionales destacados, trabajos |
| `/jobs` | Jobs.tsx | Listado de trabajos con filtros (categoría, país, tipo) |
| `/jobs/new` | CreateJob.tsx | Formulario para publicar nuevo trabajo |
| `/jobs/:id` | JobDetail.tsx | Detalle del trabajo con sistema de pujas |
| `/pros` | Professionals.tsx | Directorio de profesionales con filtros |
| `/pros/:id` | ProProfile.tsx | Perfil público del profesional con reseñas |
| `/precios` | Pricing.tsx | Planes de suscripción con checkout Stripe |
| `/dashboard` | Dashboard.tsx | Panel del usuario (mis trabajos, mis pujas, perfil) |
| `/messages` | Messages.tsx | Sistema de mensajería entre usuarios |
| `/disputes` | Disputes.tsx | Centro de resolución de disputas |
| `/payment-success` | PaymentSuccess.tsx | Confirmación de pago exitoso |
| `/kyc` | KycVerification.tsx | Formulario de verificación KYC |
| `/admin` | Admin.tsx | Panel de administración (gestión KYC) |
| `/auth/callback` | AuthCallback.tsx | Callback OAuth |
| `/auth/error` | AuthError.tsx | Error de autenticación |
| `/legal/:page` | Legal.tsx | Páginas legales (privacidad, términos, cookies) |

### Componentes Compartidos

| Componente | Descripción |
|-----------|-------------|
| Header.tsx | Navegación principal, selector de idioma, login/logout, menú usuario |
| Footer.tsx | Links, categorías, legal, redes sociales |
| Badges.tsx | Insignias Verificado (✓) y Top Pro (⭐) |
| CookieConsent.tsx | Banner de consentimiento de cookies |
| LoadingSpinner.tsx | Indicador de carga |
| ProtectedAdminRoute.tsx | HOC para rutas admin |

### Landing Page (Index.tsx) - Secciones

1. **Hero**: Imagen de fondo con drone agrícola, título animado, CTAs, banderas de países
2. **Estadísticas animadas**: Profesionales activos, trabajos completados, países, satisfacción
3. **Cómo funciona**: 3 pasos (publicar → recibir ofertas → contratar)
4. **Categorías**: Grid de 12 categorías con iconos emoji
5. **Profesionales destacados**: Cards con avatar, rating, insignias, país
6. **Trabajos recientes**: Cards con presupuesto, ubicación, categoría
7. **CTA final**: Llamada a la acción para registrarse
8. **Footer**: Links, legal, idioma

### Sistema de Filtros (Jobs.tsx y Professionals.tsx)

- Búsqueda por texto
- Filtro por categoría (12 opciones)
- Filtro por país (10 opciones)
- Filtro por tipo de contrato (subasta inversa / precio fijo)
- Ordenación por fecha, presupuesto, rating

---

## 7. AUTENTICACIÓN Y SEGURIDAD

### Flujo de Autenticación

```
1. Usuario hace clic en "Iniciar Sesión"
2. Frontend llama a authApi.login()
3. Backend redirige a proveedor OAuth (OIDC)
4. Usuario se autentica
5. Callback a /auth/callback
6. Backend establece cookie de sesión
7. Frontend obtiene usuario con client.auth.me()
```

### Código de Auth (Frontend)

```typescript
// src/lib/auth.ts
import axios from 'axios';
import { getAPIBaseURL } from './config';

class RPApi {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getCurrentUser() {
    const response = await this.client.get(`${this.getBaseURL()}/api/v1/auth/me`);
    return response.data;
  }

  async login() {
    const response = await this.client.get(`${this.getBaseURL()}/api/v1/auth/login`);
    window.location.href = response.data.redirect_url;
  }

  async logout() {
    const response = await this.client.get(`${this.getBaseURL()}/api/v1/auth/logout`);
    window.location.href = response.data.redirect_url;
  }
}
```

### SDK para Entidades

```typescript
// src/lib/api.ts
import { createClient } from '@metagptx/web-sdk';
export const client = createClient();

// Uso en componentes:
// client.entities.jobs.queryAll({ country: 'España' })
// client.entities.jobs.queryMine()
// client.entities.jobs.create({ title: '...', ... })
// client.entities.bids.create({ job_id: 1, amount: 5000 })
// client.payment.createPaymentSession({ ... })
// client.payment.verifyPayment(sessionId)
```

---

## 8. SISTEMA DE PAGOS (STRIPE)

### Flujo de Pago

```
1. Usuario selecciona plan (Pro €19 o Enterprise €29)
2. Frontend llama a client.payment.createPaymentSession()
3. Stripe genera URL de checkout
4. Usuario completa pago en Stripe
5. Redirect a /payment-success?session_id=xxx
6. Frontend verifica con client.payment.verifyPayment()
7. Backend actualiza suscripción del usuario
8. Redirect a /kyc para verificación de identidad
```

### Proration (Upgrade de Plan)

- Si el usuario ya tiene plan Pro y quiere Enterprise, se aplica prorrateo
- Se calcula el crédito restante del plan actual
- Se cobra solo la diferencia

---

## 9. INTERNACIONALIZACIÓN (i18n)

### Idiomas Soportados

| Código | Idioma | Bandera |
|--------|--------|---------|
| es | Español | 🇪🇸 |
| en | English | 🇺🇸 |
| pt | Português | 🇧🇷 |
| fr | Français | 🇫🇷 |

### Implementación

```typescript
// src/lib/i18n.ts
// Sistema basado en localStorage con detección automática del navegador
// Uso: const label = t('nav.jobs'); // "Trabajos" en español
// Hook: const [locale, setLocale] = useLocale();
```

### Claves de Traducción Principales

- `nav.*` - Navegación
- `hero.*` - Sección hero
- `stats.*` - Estadísticas
- `how.*` - Cómo funciona
- `categories.*` - Categorías
- `jobs.*` - Página de trabajos
- `pros.*` - Página de profesionales
- `pricing.*` - Página de precios
- `footer.*` - Footer

---

## 10. DATOS SEMILLA (SEED DATA)

### Profesionales de España (14 perfiles)

| Nombre | Especialidad | Ubicación | Rating | Plan |
|--------|-------------|-----------|--------|------|
| María García López | Poda | La Rioja | 4.8 | Pro |
| Miguel Ángel Ruiz | Arado | Andalucía | 4.6 | Enterprise |
| Carlos Martínez Herrera | Riego | Jaén, Andalucía | 4.9 | Enterprise |
| Laura Sánchez Moreno | Drones | Castilla-La Mancha | 4.8 | Pro |
| Javier Fernández Ortega | Topografía | Aragón/Cataluña | 4.7 | Pro |
| Ana Rodríguez Vega | Análisis de Suelo | Valencia | 4.9 | Enterprise |
| Pedro Navarro Gil | Cosecha | Castilla y León | 4.6 | Pro |
| Isabel Torres Muñoz | Ganadería | Extremadura | 4.8 | Enterprise |
| Francisco López Castillo | Fumigación | Andalucía | 4.5 | Pro |
| Carmen Díaz Romero | Consultoría | Andalucía | 4.9 | Enterprise |
| Antonio Gómez Serrano | Siembra | Castilla-La Mancha | 4.7 | Pro |
| Elena Martín Blanco | Poda | Murcia/Almería | 4.8 | Pro |
| David Ruiz Peña | Transporte | Toda España | 4.6 | Enterprise |
| Sofía Hernández Rivas | Drones | Lleida | 4.8 | Pro |

### Trabajos en España (14 ofertas)

| Trabajo | Ubicación | Hectáreas | Presupuesto |
|---------|-----------|-----------|-------------|
| Poda de 3.000 olivos | Jaén, Andalucía | 45 | €8.000-12.000 |
| Riego por goteo en olivar | Jaén, Andalucía | 45 | €8.000-15.000 |
| Fumigación con drones en viñedo | Haro, La Rioja | 30 | €3.000-5.500 |
| Análisis de suelos para cítricos | Alzira, Valencia | 20 | €2.000-4.000 |
| Cosecha de cereal | Medina del Campo, Valladolid | 200 | €12.000-20.000 |
| Poda olivar superintensivo | Lucena, Córdoba | 60 | €5.000-9.000 |
| Consultoría ganadera en dehesa | Trujillo, Cáceres | 150 | €3.000-6.000 |
| Topografía y nivelación | Monzón, Huesca | 80 | €4.000-7.000 |
| Siembra directa de girasol | Manzanares, Ciudad Real | 100 | €5.000-8.000 |
| Fertilización de almendro | Cieza, Murcia | 35 | €2.500-4.500 |
| Riego hidropónico invernadero | El Ejido, Almería | 5 | €15.000-25.000 |
| Fumigación terrestre cereal | Toro, Zamora | 150 | €3.500-5.000 |
| Transporte de aceituna | Baena, Córdoba | 80 | €4.000-6.000 |
| Arado para viñedo | Aranda de Duero, Burgos | 25 | €6.000-9.000 |

---

## 11. DESPLIEGUE

### Variables de Entorno Necesarias

```env
# Frontend
VITE_API_BASE_URL=<URL del backend>

# Backend
DATABASE_URL=postgresql://user:pass@host:5432/dbname
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
RESEND_API_KEY=re_xxxxx
JWT_SECRET=<secret>
OIDC_CLIENT_ID=<client_id>
OIDC_CLIENT_SECRET=<client_secret>
OIDC_ISSUER_URL=<issuer_url>
```

### Comandos de Build

```bash
# Frontend
cd app/frontend
pnpm install
pnpm run build    # Genera dist/

# Backend
cd app/backend
pip install -r requirements.txt
alembic upgrade head    # Migraciones
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 12. ESTRUCTURA DE ARCHIVOS

```
app/
├── backend/
│   ├── main.py
│   ├── lambda_handler.py
│   ├── alembic/
│   │   └── versions/          # Migraciones
│   ├── core/
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── enums.py
│   ├── data_models/           # JSON schemas
│   │   ├── jobs.json
│   │   ├── bids.json
│   │   ├── profiles.json
│   │   ├── messages.json
│   │   ├── reviews.json
│   │   ├── disputes.json
│   │   ├── subscriptions.json
│   │   └── kyc_verifications.json
│   ├── models/                # SQLAlchemy models
│   │   ├── jobs.py
│   │   ├── bids.py
│   │   ├── profiles.py
│   │   ├── messages.py
│   │   ├── reviews.py
│   │   ├── disputes.py
│   │   ├── subscriptions.py
│   │   └── kyc_verifications.py
│   ├── routers/               # API endpoints
│   │   ├── admin.py
│   │   ├── auth.py
│   │   ├── jobs.py
│   │   ├── bids.py
│   │   ├── profiles.py
│   │   ├── messages.py
│   │   ├── reviews.py
│   │   ├── disputes.py
│   │   ├── subscriptions.py
│   │   ├── kyc_verifications.py
│   │   ├── storage.py
│   │   └── aihub.py
│   ├── services/              # Business logic
│   │   ├── email_service.py
│   │   ├── payment.py
│   │   ├── storage.py
│   │   └── mock_data.py
│   └── schemas/
│       ├── auth.py
│       ├── aihub.py
│       └── storage.py
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx            # Router principal
│   │   ├── index.css          # Estilos globales + tema
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Badges.tsx
│   │   │   ├── CookieConsent.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ProtectedAdminRoute.tsx
│   │   │   └── ui/           # shadcn/ui components (40+)
│   │   ├── pages/
│   │   │   ├── Index.tsx      # Landing page
│   │   │   ├── Jobs.tsx       # Listado trabajos
│   │   │   ├── JobDetail.tsx  # Detalle + pujas
│   │   │   ├── CreateJob.tsx  # Crear trabajo
│   │   │   ├── Professionals.tsx  # Directorio
│   │   │   ├── ProProfile.tsx # Perfil profesional
│   │   │   ├── Pricing.tsx    # Planes
│   │   │   ├── Dashboard.tsx  # Panel usuario
│   │   │   ├── Messages.tsx   # Mensajería
│   │   │   ├── Disputes.tsx   # Disputas
│   │   │   ├── KycVerification.tsx  # Formulario KYC
│   │   │   ├── Admin.tsx      # Panel admin
│   │   │   ├── PaymentSuccess.tsx
│   │   │   ├── AuthCallback.tsx
│   │   │   ├── AuthError.tsx
│   │   │   └── Legal.tsx
│   │   ├── lib/
│   │   │   ├── api.ts        # SDK client
│   │   │   ├── auth.ts       # Auth API
│   │   │   ├── config.ts     # Configuración
│   │   │   ├── constants.ts  # Datos seed, categorías, países
│   │   │   ├── i18n.ts       # Internacionalización
│   │   │   └── utils.ts      # Utilidades
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   └── hooks/
│   │       ├── use-mobile.tsx
│   │       └── use-toast.ts
│   └── public/
│       └── assets/            # Imágenes estáticas
```

---

## NOTAS PARA EL DESARROLLADOR

1. **SDK Web**: El frontend usa `@metagptx/web-sdk` que abstrae las llamadas al backend. Para replicar sin este SDK, implementar un cliente HTTP que maneje auth con cookies y CRUD de entidades.

2. **Avatares**: Se generan dinámicamente con DiceBear API: `https://api.dicebear.com/7.x/initials/svg?seed={nombre}`

3. **Imágenes**: Las imágenes del hero y categorías están alojadas en CDN. Para replicar, usar imágenes propias o servicios como Unsplash.

4. **Stripe**: Requiere cuenta de Stripe con productos configurados para los planes Pro y Enterprise.

5. **Resend**: Para emails transaccionales. Alternativa: SendGrid, Mailgun, o cualquier servicio SMTP.

6. **Datos Seed**: Los datos iniciales (profesionales y trabajos) se muestran como contenido de ejemplo hasta que usuarios reales se registren. Se mezclan con datos reales de la BD.

---

*Documento generado el 11 de julio de 2026*
*Versión: 1.0*
*Plataforma: Agrivo - Marketplace Global de Servicios Agrícolas*