# Architecture Design

## System Overview
AgroTask World is a full-stack agricultural marketplace connecting farmers with professionals. It uses React + Tailwind + shadcn/ui on the frontend with Atoms Cloud providing authentication, database, file storage, and payment processing on the backend.

## Tech Stack
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query
- Backend: Atoms Cloud (Auth, Database, Payments, Storage)
- Payment: Stripe via Atoms Cloud payment module
- Styling: Custom green/earth agricultural theme with Poppins + Open Sans fonts

## Module Design
| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| Landing | Hero, stats, categories, featured content | src/pages/Index.tsx |
| Jobs | Job listing, filtering, detail, bidding | src/pages/Jobs.tsx, JobDetail.tsx, CreateJob.tsx |
| Professionals | Directory with filters | src/pages/Professionals.tsx |
| Pricing | Subscription plans with Stripe checkout | src/pages/Pricing.tsx |
| Dashboard | User panel with jobs/bids management | src/pages/Dashboard.tsx |
| Auth | Login/register/callback flows | src/pages/AuthCallback.tsx, AuthError.tsx |
| Layout | Header, Footer shared components | src/components/Header.tsx, Footer.tsx |

## Tech Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | React hooks + TanStack Query | Simple, sufficient for entity CRUD |
| Routing | React Router v6 | Standard SPA routing |
| Auth | Atoms Cloud auth (client.auth) | Built-in, no custom auth needed |
| Payment | Atoms Cloud payment (Stripe) | Secure checkout sessions |
| Database | Atoms Cloud entities | Auto-generated CRUD APIs |

## File Tree Plan
```
src/
├── App.tsx (routes)
├── index.css (theme + fonts)
├── components/
│   ├── Header.tsx
│   └── Footer.tsx
├── pages/
│   ├── Index.tsx (landing)
│   ├── Jobs.tsx (listing)
│   ├── JobDetail.tsx (detail + bidding)
│   ├── CreateJob.tsx (form)
│   ├── Professionals.tsx (directory)
│   ├── Pricing.tsx (plans)
│   ├── Dashboard.tsx (user panel)
│   ├── PaymentSuccess.tsx
│   ├── AuthCallback.tsx
│   └── AuthError.tsx
```

## Implementation Guide
1. Database tables: jobs, bids, profiles, messages, subscriptions (created via BackendManager)
2. Frontend uses @metagptx/web-sdk for all backend communication
3. Auth flow: client.auth.toLogin() → callback → client.auth.me()
4. Payment flow: client.payment.createPaymentSession() → Stripe → /payment-success → verifyPayment
5. Entity CRUD: client.entities.[table].queryAll/queryMine/create