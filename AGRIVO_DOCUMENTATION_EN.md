# AGRIVO - Complete Technical Documentation
## Global Agricultural Services Marketplace

---

## 📋 TABLE OF CONTENTS

1. [General Description](#1-general-description)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database - Schemas](#4-database---schemas)
5. [Backend - API & Services](#5-backend---api--services)
6. [Frontend - Views & Components](#6-frontend---views--components)
7. [Authentication & Security](#7-authentication--security)
8. [Payment System (Stripe)](#8-payment-system-stripe)
9. [Internationalization (i18n)](#9-internationalization-i18n)
10. [Seed Data](#10-seed-data)
11. [Deployment](#11-deployment)
12. [File Structure](#12-file-structure)

---

## 1. GENERAL DESCRIPTION

**Agrivo** is a global marketplace connecting farmers with field professionals. The platform enables:

- **Post agricultural jobs** with reverse auction or fixed price system
- **Professional directory** with KYC verification
- **Bidding system** where professionals compete for jobs
- **Real-time messaging** between users
- **Reviews and ratings** for professionals
- **Subscription plans** (Free, Pro €19/month, Enterprise €29/month) with Stripe
- **KYC verification** post-payment with admin panel
- **Dispute resolution center** for conflict management
- **Multi-language support** (Spanish, English, Portuguese, French)
- **10 operating countries**: Spain, Brazil, Argentina, USA, Portugal, France, India, Australia, Ukraine, Mexico
- **12 service categories**: Drones, Harvesting, Pruning, Plowing, Seeding, Irrigation, Spraying, Soil Analysis, Topography, Livestock, Consulting, Transport

### Business Model

| Plan | Price | Features |
|------|-------|----------|
| Free | €0 | 3 jobs/month, 5 bids/job, basic profile |
| Professional | €19/month | Verified KYC, ✓ badge, unlimited bids, priority ranking |
| Enterprise | €29/month | Featured on homepage, Top Pro ⭐ badge, analytics, priority support |

---

## 2. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│   React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui   │
│                                                              │
│   Pages: Index, Jobs, JobDetail, CreateJob, Professionals,   │
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
│   Services: payment (Stripe), email (Resend), storage        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                          │
│   • Stripe (Payments & subscriptions)                        │
│   • Resend (Email notifications)                             │
│   • Object Storage (KYC photos, avatars)                     │
└─────────────────────────────────────────────────────────────┘
```

### Main Data Flow

1. **User posts job** → Frontend → SDK → Backend → PostgreSQL
2. **Professional bids** → Frontend → SDK → Backend → PostgreSQL + Email notification
3. **Subscription payment** → Frontend → Stripe Checkout → Webhook → Backend → Updates plan
4. **KYC** → Frontend (form + photo) → Backend → Admin approves/rejects → Email

---

## 3. TECHNOLOGY STACK

### Frontend
| Technology | Version | Usage |
|-----------|---------|-------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.5.3 | Static typing |
| Vite | 5.4.1 | Build tool |
| Tailwind CSS | 3.4.11 | Utility-first styles |
| shadcn/ui | latest | UI Components (Radix) |
| React Router | 6.30.0 | SPA routing |
| TanStack Query | 5.56.2 | Cache & fetching |
| Recharts | 2.12.7 | Charts |
| Lucide React | 0.462.0 | Icons |
| @metagptx/web-sdk | latest | Backend SDK |
| Sonner | 1.7.4 | Toast notifications |
| React Hook Form + Zod | latest | Forms & validation |

### Backend
| Technology | Usage |
|-----------|-------|
| FastAPI | REST API framework |
| SQLAlchemy | PostgreSQL ORM |
| Alembic | DB migrations |
| PostgreSQL | Relational database |
| Stripe SDK | Payment processing |
| Resend | Email delivery |

### Visual Design
| Aspect | Value |
|--------|-------|
| Primary color | Emerald/Green (#059669, #166534) |
| Secondary color | Earth/Amber (#92400e) |
| Accent color | Orange (#ea580c) |
| Background | Warm white (#fafaf5) |
| Heading font | Poppins |
| Body font | Open Sans |
| Style | Trust & Authority, marketplace |

---

## 4. DATABASE - SCHEMAS

### Table: `jobs` (Jobs/Work Orders)
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

### Table: `bids` (Bids/Offers)
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

### Table: `profiles` (User Profiles)
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

### Table: `messages` (Messages)
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

### Table: `reviews` (Reviews)
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

### Table: `disputes` (Disputes)
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

### Table: `subscriptions` (Subscriptions)
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

### Table: `kyc_verifications` (KYC Verifications)
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

## 5. BACKEND - API & SERVICES

### Main Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/auth/login` | Initiate OAuth login |
| GET | `/api/v1/auth/me` | Get current user |
| GET | `/api/v1/auth/logout` | Logout |
| GET/POST | `/api/v1/jobs/` | List/Create jobs |
| GET | `/api/v1/jobs/{id}` | Job detail |
| GET/POST | `/api/v1/bids/` | List/Create bids |
| GET/POST | `/api/v1/profiles/` | List/Create profiles |
| GET/POST | `/api/v1/messages/` | List/Send messages |
| GET/POST | `/api/v1/reviews/` | List/Create reviews |
| GET/POST | `/api/v1/disputes/` | List/Create disputes |
| GET/POST | `/api/v1/subscriptions/` | List/Create subscriptions |
| GET/POST | `/api/v1/kyc_verifications/` | List/Create KYC verifications |
| POST | `/api/v1/admin/kyc/{id}/approve` | Approve KYC |
| POST | `/api/v1/admin/kyc/{id}/reject` | Reject KYC |
| POST | `/api/v1/storage/upload` | Upload files |
| GET | `/api/v1/health` | Health check |

### Email Service (Resend)

```python
# app/backend/services/email_service.py
# Sends email notifications for:
# - KYC approved/rejected
# - New bid received
# - New message received
```

### Payment Service (Stripe)

```python
# app/backend/services/payment.py
# - create_payment_session(): Creates Stripe checkout session
# - verify_payment(): Verifies completed payment
# Plans: Pro (€19/month), Enterprise (€29/month)
```

### Backend Router Structure

```
app/backend/
├── main.py                    # FastAPI entry point
├── lambda_handler.py          # Serverless deploy handler
├── core/
│   ├── auth.py               # Auth configuration
│   ├── config.py             # Environment variables
│   ├── database.py           # PostgreSQL connection
│   └── enums.py              # Enumerations
├── models/                    # SQLAlchemy models
│   ├── jobs.py
│   ├── bids.py
│   ├── profiles.py
│   ├── messages.py
│   ├── reviews.py
│   ├── disputes.py
│   ├── subscriptions.py
│   └── kyc_verifications.py
├── routers/                   # API endpoints
│   ├── admin.py              # Admin KYC panel
│   ├── auth.py               # Authentication
│   ├── jobs.py
│   ├── bids.py
│   ├── profiles.py
│   ├── messages.py
│   ├── reviews.py
│   ├── disputes.py
│   ├── subscriptions.py
│   ├── kyc_verifications.py
│   ├── storage.py            # File upload
│   └── aihub.py              # AI capabilities
├── services/                  # Business logic
│   ├── email_service.py      # Emails with Resend
│   ├── payment.py            # Payments with Stripe
│   ├── storage.py            # Object storage
│   └── mock_data.py          # Initial data
└── data_models/               # Table JSON schemas
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

## 6. FRONTEND - VIEWS & COMPONENTS

### Application Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Index.tsx | Landing page with hero, stats, categories, featured pros, jobs |
| `/jobs` | Jobs.tsx | Job listing with filters (category, country, type) |
| `/jobs/new` | CreateJob.tsx | Form to post a new job |
| `/jobs/:id` | JobDetail.tsx | Job detail with bidding system |
| `/pros` | Professionals.tsx | Professional directory with filters |
| `/pros/:id` | ProProfile.tsx | Professional public profile with reviews |
| `/precios` | Pricing.tsx | Subscription plans with Stripe checkout |
| `/dashboard` | Dashboard.tsx | User panel (my jobs, my bids, profile) |
| `/messages` | Messages.tsx | Messaging system between users |
| `/disputes` | Disputes.tsx | Dispute resolution center |
| `/payment-success` | PaymentSuccess.tsx | Successful payment confirmation |
| `/kyc` | KycVerification.tsx | KYC verification form |
| `/admin` | Admin.tsx | Admin panel (KYC management) |
| `/auth/callback` | AuthCallback.tsx | OAuth callback |
| `/auth/error` | AuthError.tsx | Authentication error |
| `/legal/:page` | Legal.tsx | Legal pages (privacy, terms, cookies) |

### Shared Components

| Component | Description |
|-----------|-------------|
| Header.tsx | Main navigation, language selector, login/logout, user menu |
| Footer.tsx | Links, categories, legal, social media |
| Badges.tsx | Verified (✓) and Top Pro (⭐) badges |
| CookieConsent.tsx | Cookie consent banner |
| LoadingSpinner.tsx | Loading indicator |
| ProtectedAdminRoute.tsx | HOC for admin routes |

### Landing Page (Index.tsx) - Sections

1. **Hero**: Background image with agricultural drone, animated title, CTAs, country flags
2. **Animated statistics**: Active professionals, completed jobs, countries, satisfaction
3. **How it works**: 3 steps (post → receive offers → hire)
4. **Categories**: Grid of 12 categories with emoji icons
5. **Featured professionals**: Cards with avatar, rating, badges, country
6. **Recent jobs**: Cards with budget, location, category
7. **Final CTA**: Call to action to register
8. **Footer**: Links, legal, language

### Filter System (Jobs.tsx & Professionals.tsx)

- Text search
- Category filter (12 options)
- Country filter (10 options)
- Contract type filter (reverse auction / fixed price)
- Sort by date, budget, rating

---

## 7. AUTHENTICATION & SECURITY

### Authentication Flow

```
1. User clicks "Sign In"
2. Frontend calls authApi.login()
3. Backend redirects to OAuth provider (OIDC)
4. User authenticates
5. Callback to /auth/callback
6. Backend sets session cookie
7. Frontend gets user with client.auth.me()
```

### Auth Code (Frontend)

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

### SDK for Entities

```typescript
// src/lib/api.ts
import { createClient } from '@metagptx/web-sdk';
export const client = createClient();

// Usage in components:
// client.entities.jobs.queryAll({ country: 'España' })
// client.entities.jobs.queryMine()
// client.entities.jobs.create({ title: '...', ... })
// client.entities.bids.create({ job_id: 1, amount: 5000 })
// client.payment.createPaymentSession({ ... })
// client.payment.verifyPayment(sessionId)
```

---

## 8. PAYMENT SYSTEM (STRIPE)

### Payment Flow

```
1. User selects plan (Pro €19 or Enterprise €29)
2. Frontend calls client.payment.createPaymentSession()
3. Stripe generates checkout URL
4. User completes payment on Stripe
5. Redirect to /payment-success?session_id=xxx
6. Frontend verifies with client.payment.verifyPayment()
7. Backend updates user subscription
8. Redirect to /kyc for identity verification
```

### Proration (Plan Upgrade)

- If user already has Pro plan and wants Enterprise, proration is applied
- Remaining credit from current plan is calculated
- Only the difference is charged

---

## 9. INTERNATIONALIZATION (i18n)

### Supported Languages

| Code | Language | Flag |
|------|----------|------|
| es | Spanish | 🇪🇸 |
| en | English | 🇺🇸 |
| pt | Portuguese | 🇧🇷 |
| fr | French | 🇫🇷 |

### Implementation

```typescript
// src/lib/i18n.ts
// localStorage-based system with automatic browser detection
// Usage: const label = t('nav.jobs'); // "Jobs" in English
// Hook: const [locale, setLocale] = useLocale();
```

### Main Translation Keys

- `nav.*` - Navigation
- `hero.*` - Hero section
- `stats.*` - Statistics
- `how.*` - How it works
- `categories.*` - Categories
- `jobs.*` - Jobs page
- `pros.*` - Professionals page
- `pricing.*` - Pricing page
- `footer.*` - Footer

---

## 10. SEED DATA

### Spanish Professionals (14 profiles)

| Name | Specialty | Location | Rating | Plan |
|------|-----------|----------|--------|------|
| María García López | Pruning | La Rioja | 4.8 | Pro |
| Miguel Ángel Ruiz | Plowing | Andalusia | 4.6 | Enterprise |
| Carlos Martínez Herrera | Irrigation | Jaén, Andalusia | 4.9 | Enterprise |
| Laura Sánchez Moreno | Drones | Castilla-La Mancha | 4.8 | Pro |
| Javier Fernández Ortega | Topography | Aragon/Catalonia | 4.7 | Pro |
| Ana Rodríguez Vega | Soil Analysis | Valencia | 4.9 | Enterprise |
| Pedro Navarro Gil | Harvesting | Castilla y León | 4.6 | Pro |
| Isabel Torres Muñoz | Livestock | Extremadura | 4.8 | Enterprise |
| Francisco López Castillo | Spraying | Andalusia | 4.5 | Pro |
| Carmen Díaz Romero | Consulting | Andalusia | 4.9 | Enterprise |
| Antonio Gómez Serrano | Seeding | Castilla-La Mancha | 4.7 | Pro |
| Elena Martín Blanco | Pruning | Murcia/Almería | 4.8 | Pro |
| David Ruiz Peña | Transport | All Spain | 4.6 | Enterprise |
| Sofía Hernández Rivas | Drones | Lleida | 4.8 | Pro |

### Spanish Jobs (14 listings)

| Job | Location | Hectares | Budget |
|-----|----------|----------|--------|
| Pruning 3,000 olive trees | Jaén, Andalusia | 45 | €8,000-12,000 |
| Drip irrigation for olive grove | Jaén, Andalusia | 45 | €8,000-15,000 |
| Drone spraying in vineyard | Haro, La Rioja | 30 | €3,000-5,500 |
| Soil analysis for citrus | Alzira, Valencia | 20 | €2,000-4,000 |
| Cereal harvesting | Medina del Campo, Valladolid | 200 | €12,000-20,000 |
| Super-intensive olive pruning | Lucena, Córdoba | 60 | €5,000-9,000 |
| Livestock consulting in dehesa | Trujillo, Cáceres | 150 | €3,000-6,000 |
| Topography and leveling | Monzón, Huesca | 80 | €4,000-7,000 |
| Direct sunflower seeding | Manzanares, Ciudad Real | 100 | €5,000-8,000 |
| Almond tree fertilization | Cieza, Murcia | 35 | €2,500-4,500 |
| Hydroponic greenhouse irrigation | El Ejido, Almería | 5 | €15,000-25,000 |
| Ground cereal spraying | Toro, Zamora | 150 | €3,500-5,000 |
| Olive transport | Baena, Córdoba | 80 | €4,000-6,000 |
| Plowing for vineyard | Aranda de Duero, Burgos | 25 | €6,000-9,000 |

---

## 11. DEPLOYMENT

### Required Environment Variables

```env
# Frontend
VITE_API_BASE_URL=<backend URL>

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

### Build Commands

```bash
# Frontend
cd app/frontend
pnpm install
pnpm run build    # Generates dist/

# Backend
cd app/backend
pip install -r requirements.txt
alembic upgrade head    # Migrations
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 12. FILE STRUCTURE

```
app/
├── backend/
│   ├── main.py
│   ├── lambda_handler.py
│   ├── alembic/
│   │   └── versions/          # Migrations
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
│   │   ├── App.tsx            # Main router
│   │   ├── index.css          # Global styles + theme
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
│   │   │   ├── Jobs.tsx       # Job listing
│   │   │   ├── JobDetail.tsx  # Detail + bids
│   │   │   ├── CreateJob.tsx  # Create job
│   │   │   ├── Professionals.tsx  # Directory
│   │   │   ├── ProProfile.tsx # Professional profile
│   │   │   ├── Pricing.tsx    # Plans
│   │   │   ├── Dashboard.tsx  # User panel
│   │   │   ├── Messages.tsx   # Messaging
│   │   │   ├── Disputes.tsx   # Disputes
│   │   │   ├── KycVerification.tsx  # KYC form
│   │   │   ├── Admin.tsx      # Admin panel
│   │   │   ├── PaymentSuccess.tsx
│   │   │   ├── AuthCallback.tsx
│   │   │   ├── AuthError.tsx
│   │   │   └── Legal.tsx
│   │   ├── lib/
│   │   │   ├── api.ts        # SDK client
│   │   │   ├── auth.ts       # Auth API
│   │   │   ├── config.ts     # Configuration
│   │   │   ├── constants.ts  # Seed data, categories, countries
│   │   │   ├── i18n.ts       # Internationalization
│   │   │   └── utils.ts      # Utilities
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   └── hooks/
│   │       ├── use-mobile.tsx
│   │       └── use-toast.ts
│   └── public/
│       └── assets/            # Static images
```

---

## NOTES FOR THE DEVELOPER

1. **Web SDK**: The frontend uses `@metagptx/web-sdk` which abstracts backend calls. To replicate without this SDK, implement an HTTP client that handles auth with cookies and entity CRUD.

2. **Avatars**: Dynamically generated with DiceBear API: `https://api.dicebear.com/7.x/initials/svg?seed={name}`

3. **Images**: Hero and category images are hosted on CDN. To replicate, use your own images or services like Unsplash.

4. **Stripe**: Requires a Stripe account with products configured for Pro and Enterprise plans.

5. **Resend**: For transactional emails. Alternative: SendGrid, Mailgun, or any SMTP service.

6. **Seed Data**: Initial data (professionals and jobs) is displayed as sample content until real users register. It merges with real DB data.

---

*Document generated on July 11, 2026*
*Version: 1.0*
*Platform: Agrivo - Global Agricultural Services Marketplace*