# AGRIVO - Detailed Platform Views Documentation

## Complete Visual Guide of All Screens

---

## 📋 VIEWS INDEX

1. [Header (Global Navigation)](#1-header-global-navigation)
2. [Footer](#2-footer)
3. [Landing Page (Home)](#3-landing-page-home)
4. [Jobs Listing](#4-jobs-listing)
5. [Job Detail](#5-job-detail)
6. [Create Job](#6-create-job)
7. [Professionals Directory](#7-professionals-directory)
8. [Professional Profile](#8-professional-profile)
9. [Plans & Pricing](#9-plans--pricing)
10. [Dashboard (User Panel)](#10-dashboard-user-panel)
11. [Messaging](#11-messaging)
12. [Disputes Center](#12-disputes-center)
13. [KYC Verification](#13-kyc-verification)
14. [Admin Panel](#14-admin-panel)
15. [Payment Success](#15-payment-success)
16. [Legal Pages](#16-legal-pages)
17. [Authentication](#17-authentication)

---

## 1. HEADER (GLOBAL NAVIGATION)

### Description
Fixed (sticky) navigation bar at the top of all pages. Adapts on scroll with backdrop-blur effect and shadow.

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Agrivo Logo]  │  Home  Jobs  Professionals  Pricing  │ 🇪🇸 ES ▼ │ [Login] [Register] │
└─────────────────────────────────────────────────────────────────────┘
```

### UI Elements

| Element | Component | Description |
|---------|-----------|-------------|
| Logo | `<img>` + `<span>` | 36x36px logo with "Agrivo" name in Poppins bold |
| Navigation | `<Link>` | 4 links: Home, Jobs, Professionals, Pricing |
| Language selector | `DropdownMenu` | Flags with code (ES, EN, PT, FR) |
| Login | `Button ghost` | "Sign In" text |
| Register | `Button gradient` | Emerald-to-teal gradient, "Register" text |
| User menu | `DropdownMenu` | Circular avatar + name (when logged in) |
| Mobile menu | `Sheet` (right side) | Hamburger visible only on mobile |

### States

**Unauthenticated:**
- Shows "Sign In" and "Register" buttons
- Buttons display immediately without waiting for auth verification

**Authenticated:**
- Shows avatar + username
- Dropdown with: Dashboard, Messages, Disputes, Admin Panel, Log Out

**Scroll:**
- No scroll: solid background, no border
- With scroll (>10px): `bg-background/95 backdrop-blur-md shadow-sm border-b`

### Active Link
- Primary color with `bg-primary/5` background
- Others: `text-muted-foreground`

### Responsive
- Desktop (md+): Full horizontal navigation
- Mobile: Hamburger → Side Sheet with vertical menu

---

## 2. FOOTER

### Description
Page footer with company information, quick links, categories, and legal data.

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Agrivo Logo]          │ Quick Links        │ Categories        │ Legal           │
│ Short description      │ • Jobs             │ • Drones          │ • Privacy       │
│                        │ • Professionals    │ • Harvest         │ • Terms         │
│ Country flags          │ • Pricing          │ • Pruning         │ • Cookies       │
│                        │ • Dashboard        │ • Irrigation      │                 │
├─────────────────────────────────────────────────────────────────────┤
│ © 2026 Agrivo. All rights reserved.                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Elements
- 4-column grid (responsive: 1 col on mobile, 2 on tablet, 4 on desktop)
- Flags of 10 operating countries
- Links to legal pages (`/legal/privacidad`, `/legal/terminos`, `/legal/cookies`)
- Copyright with current year

---

## 3. LANDING PAGE (HOME)

**Route:** `/`  
**File:** `src/pages/Index.tsx`

### Sections

#### 3.1 Hero Section
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Background image: Agricultural drone flying over fields]            │
│ ┌─────────────────────────────────────────────────────────┐         │
│ │ ● Global Agricultural Services Marketplace              │         │
│ │                                                         │         │
│ │ Connect with the best                                   │         │
│ │ field professionals  (emerald gradient)                 │         │
│ │                                                         │         │
│ │ Post your job, receive competitive offers...            │         │
│ │                                                         │         │
│ │ [Post a Job →]  [Explore Professionals]                 │         │
│ │                                                         │         │
│ │ Operating in: 🇪🇸🇧🇷🇦🇷🇺🇸🇵🇹🇫🇷🇮🇳🇦🇺🇺🇦🇲🇽              │         │
│ └─────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Full-screen background image (min-height 600px)
- Dark gradient overlay (`from-slate-900/90 via-slate-900/70 to-slate-900/40`)
- Animated badge with pulsing green dot
- h1 title with emerald-to-teal gradient text
- Subtitle in slate-300
- 2 CTA buttons: primary (gradient) and secondary (white outline)
- Row of country flags with tooltips

#### 3.2 Animated Statistics
```
┌─────────────────────────────────────────────────────────────────────┐
│    5,000+           2,800            10              98%            │
│  Active           Jobs            Operating      Satisfaction      │
│ Professionals    Completed       Countries                         │
└─────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- 4-column grid (2 on mobile)
- Numbers with counting animation (2 seconds)
- Poppins bold typography in emerald-600
- White background with bottom border

#### 3.3 How It Works
```
┌─────────────────────────────────────────────────────────────────────┐
│              How does Agrivo work?                                    │
│                                                                      │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│ │ [🌐]         │  │ [🛡️]         │  │ [⚡]         │               │
│ │ Post your    │  │ Receive      │  │ Hire and     │               │
│ │ job          │  │ verified     │  │ pay safely   │               │
│ │              │  │ offers       │  │              │               │
│ │ Describe what│  │ KYC-verified │  │ Choose the   │               │
│ │ you need...  │  │ professionals│  │ best...      │               │
│ │           1  │  │           2  │  │           3  │               │
│ └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- "Simple and Effective" badge in emerald
- 3 cards with hover effect (border-emerald + shadow)
- Each card: gradient icon, title, description, large number in corner
- Icons: Globe, Shield, Zap (from lucide-react)
- Slate-50 background

#### 3.4 Service Categories
```
┌─────────────────────────────────────────────────────────────────────┐
│ Service Categories                             [View all →]          │
│                                                                      │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                         │
│ │ 🚁 │ │ 🌾 │ │ ✂️ │ │ 🚜 │ │ 🌱 │ │ 💧 │                         │
│ │Dron│ │Harv│ │Prun│ │Plow│ │Seed│ │Irri│                         │
│ ├────┤ ├────┤ ├────┤ ├────┤ ├────┤ ├────┤                         │
│ │ 🧪 │ │ 🔬 │ │ 📐 │ │ 🐄 │ │ 📋 │ │ 🚛 │                         │
│ │Fumi│ │Soil│ │Topo│ │Live│ │Cons│ │Tran│                         │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- 6-column grid (2 on mobile, 3 on tablet)
- 12 categories with emoji + name
- Each category is a Link to `/jobs?category=X`
- Hover: scale-110 on emoji, border-emerald, bg-emerald-50/50
- White background

#### 3.5 Latest Published Jobs
```
┌─────────────────────────────────────────────────────────────────────┐
│ Latest Published Jobs                          [View all →]          │
│                                                                      │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │
│ │ 🇪🇸 Pruning│ Open │ │ 🇪🇸 Irrig.│ Open │ │ 🇧🇷 Drones│ Open │     │
│ │                  │ │                  │ │                  │     │
│ │ Pruning 3,000    │ │ Drip irrigation  │ │ Drone spraying   │     │
│ │ olive trees      │ │ in olive grove   │ │ in vineyard      │     │
│ │                  │ │                  │ │                  │     │
│ │ Description...   │ │ Description...   │ │ Description...   │     │
│ │──────────────────│ │──────────────────│ │──────────────────│     │
│ │ 📍 Jaén  $8,000  │ │ 📍 Jaén  $8,000  │ │ 📍 Haro  $3,000  │     │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- 3-column grid (1 on mobile, 2 on tablet)
- 6 job cards
- Each card: country flag + category badge + status badge, title, description (2 lines), location + budget
- Data: mix of real DB + seed data (minimum 6 shown)
- Hover: shadow-lg + border-emerald-200
- Slate-50 background

#### 3.6 Featured Professionals
```
┌─────────────────────────────────────────────────────────────────────┐
│ Featured Professionals                         [View all →]          │
│                                                                      │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │
│ │ [Avatar] María   │ │ [Avatar] Miguel  │ │ [Avatar] Carlos  │     │
│ │ ⭐ 4.8 · 45 jobs │ │ ⭐ 4.6 · 38 jobs │ │ ⭐ 4.9 · 52 jobs │     │
│ │ 🇪🇸 Spain · Prun. │ │ 🇪🇸 Spain · Plow.│ │ 🇪🇸 Spain · Irrig│     │
│ │ Description...   │ │ Description...   │ │ Description...   │     │
│ │ [✓ Verified]     │ │ [⭐ Top Pro]      │ │ [⭐ Top Pro]      │     │
│ │ [Contact]        │ │ [Contact]        │ │ [Contact]        │     │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- 3-column grid (1 on mobile, 2 on tablet)
- 6 professional cards
- DiceBear avatar (gold background for Enterprise, green for Pro)
- Top Pro: golden border (border-amber-300 ring-1 ring-amber-200/50)
- Plan badges: PlanBadge (Verified green or Top Pro gold)
- "Contact" button with MessageSquare icon
- Sorted: Enterprise first, then Pro
- White background

#### 3.7 Final CTA
```
┌─────────────────────────────────────────────────────────────────────┐
│          (Gradient background emerald-700 → teal-700 → emerald-800) │
│                                                                      │
│              Ready to transform your field?                          │
│                                                                      │
│     Join thousands of farmers and professionals already             │
│     revolutionizing agriculture in 10 countries.                    │
│                                                                      │
│         [Post a Job →]  [I'm a Professional]                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Gradient background with decorative blur spheres
- White centered text
- 2 buttons: primary (white with emerald text) and secondary (white outline)

#### 3.8 Cookie Consent
- Floating banner at the bottom
- Appears on first access
- "Accept" and "Reject" buttons
- Saved in localStorage

---

## 4. JOBS LISTING

**Route:** `/jobs`  
**File:** `src/pages/Jobs.tsx`

### General Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Header]                                                             │
├─────────────────────────────────────────────────────────────────────┤
│ Available Jobs                                 [+ Post a Job]        │
│ Find agricultural opportunities in 10 countries                      │
├─────────────────────────────────────────────────────────────────────┤
│ [🔍 Search...] [Category ▼] [Country ▼] [Type ▼]                    │
├─────────────────────────────────────────────────────────────────────┤
│ 14 jobs found                                                        │
│                                                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                             │
│ │ Card 1   │ │ Card 2   │ │ Card 3   │                             │
│ └──────────┘ └──────────┘ └──────────┘                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                             │
│ │ Card 4   │ │ Card 5   │ │ Card 6   │                             │
│ └──────────┘ └──────────┘ └──────────┘                             │
│ ...                                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ [Footer]                                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Filter Section (Sticky)
- Sticky bar below header (top-16 z-40)
- White background with shadow
- 4 controls in row (column on mobile):
  1. **Search input** with Search icon (searches by title)
  2. **Category select** (12 options + "All")
  3. **Country select** (10 options + "All")
  4. **Type select** ("Reverse Auction" / "Fixed Price" + "All")

### Job Card
```
┌──────────────────────────────────────────┐
│ 🇪🇸 [Pruning] [Auction] .......... [Open] │
│                                          │
│ Pruning 3,000 olive trees                │
│ We need a professional team for...       │
│──────────────────────────────────────────│
│ 📍 Jaén, Andalucía      $8,000 - $12,000│
└──────────────────────────────────────────┘
```

**Card elements:**
- Country flag (16px image)
- Category badge (outline)
- Contract type badge (outline)
- Status badge (emerald for "Open", amber for "In Progress")
- Title in Poppins semibold (1 line, truncated)
- Description (2 lines, truncated)
- Separator
- Location with MapPin icon
- Budget range in emerald-700 bold

### States
- **Loading:** 6 skeleton cards (animate-pulse)
- **No results:** Large Search icon + message + "Post a Job" button
- **With data:** Card grid + results counter

---

## 5. JOB DETAIL

**Route:** `/jobs/:id`  
**File:** `src/pages/JobDetail.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ [← Back to jobs]                                                     │
│                                                                      │
│ ┌───────────────────────────────────┐ ┌─────────────────────────┐   │
│ │ JOB DETAIL                        │ │ SUBMIT BID              │   │
│ │                                   │ │                         │   │
│ │ 🇪🇸 [Pruning] [Auction] [Open]    │ │ Amount (USD) *          │   │
│ │                                   │ │ [________]              │   │
│ │ Pruning 3,000 olive trees         │ │                         │   │
│ │                                   │ │ Message                 │   │
│ │ Full job description with all     │ │ [________________]      │   │
│ │ details...                        │ │                         │   │
│ │                                   │ │ [Submit Bid]            │   │
│ │ ─────────────────────────────     │ │                         │   │
│ │ 📍 Location: Jaén, Andalucía      │ └─────────────────────────┘   │
│ │ 🌾 Hectares: 45                   │                               │
│ │ 💰 Budget: $8,000-$12,000         │ ┌─────────────────────────┐   │
│ │ 📋 Type: Reverse Auction          │ │ BIDS RECEIVED (3)       │   │
│ │ 📅 Posted: 07/07/2026             │ │                         │   │
│ │                                   │ │ [Avatar] María G.       │   │
│ └───────────────────────────────────┘ │ $7,500 · Pending        │   │
│                                       │ "I have experience..."  │   │
│                                       │                         │   │
│                                       │ [Avatar] Carlos M.      │   │
│                                       │ $8,200 · Pending        │   │
│                                       │ "Equipment available.." │   │
│                                       └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Elements
- **Left column (2/3):** Full job detail
- **Right column (1/3):** Bid form + bid list
- "Back" button with ArrowLeft icon
- Job information: badges, title, description, metadata
- Bid form: amount (number input), message (textarea), submit button
- Bid list: avatar + name + amount + status + message

### Interactions
- Submitting a bid requires authentication (redirects to login if not logged in)
- Job owner sees bids and can accept/reject
- Confirmation toast on bid submission
- Validation: amount is required

---

## 6. CREATE JOB

**Route:** `/jobs/new`  
**File:** `src/pages/CreateJob.tsx`

### Form Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Title | Input text | ✓ | Min 5 characters |
| Description | Textarea | ✓ | Min 20 characters |
| Category | Select (12 options) | ✓ | - |
| Country | Select (10 options) | ✓ | - |
| Location | Input text | ✓ | - |
| Hectares | Input number | - | Positive |
| Minimum budget | Input number | - | Positive |
| Maximum budget | Input number | - | > minimum |
| Contract type | Radio buttons | ✓ | - |

### Interactions
- Requires authentication (redirects to login if not logged in)
- Real-time validation with React Hook Form + Zod
- Success toast on publish
- Redirects to `/jobs/:id` after creation

---

## 7. PROFESSIONALS DIRECTORY

**Route:** `/pros`  
**File:** `src/pages/Professionals.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ Verified Professionals                                               │
│ Find agricultural experts in your area                               │
├─────────────────────────────────────────────────────────────────────┤
│ [🔍 Search...] [Category ▼] [Country ▼]                             │
├─────────────────────────────────────────────────────────────────────┤
│ 14 professionals found                                               │
│                                                                      │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │
│ │ [Gold avatar]    │ │ [Green avatar]   │ │ [Gold avatar]    │     │
│ │ Miguel Ángel R.  │ │ María García L.  │ │ Carlos Martínez  │     │
│ │ ⭐ 4.6 · 38 jobs │ │ ⭐ 4.8 · 45 jobs │ │ ⭐ 4.9 · 52 jobs │     │
│ │ 🇪🇸 Spain         │ │ 🇪🇸 Spain         │ │ 🇪🇸 Spain         │     │
│ │ Plowing          │ │ Pruning          │ │ Irrigation       │     │
│ │ Description...   │ │ Description...   │ │ Description...   │     │
│ │ [⭐ Top Pro]      │ │ [✓ Verified]     │ │ [⭐ Top Pro]      │     │
│ │ [Contact]        │ │ [Contact]        │ │ [Contact]        │     │
│ │ [View Profile]   │ │ [View Profile]   │ │ [View Profile]   │     │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### Visual Differentiation
- **Top Pro (Enterprise):** Gold border, avatar with gold ring
- **Verified (Pro):** Avatar with green background
- **Free:** No special badge

---

## 8. PROFESSIONAL PROFILE

**Route:** `/pros/:id`  
**File:** `src/pages/ProProfile.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ [← Back to directory]                                                │
│                                                                      │
│ ┌─────────────────┐  ┌─────────────────────────────────────────┐   │
│ │ PROFILE         │  │ ABOUT ME                                  │   │
│ │                 │  │                                           │   │
│ │ [Avatar 96px]   │  │ Full professional description with       │   │
│ │                 │  │ experience, equipment, and services...   │   │
│ │ Carlos Martínez │  │                                           │   │
│ │ ⭐ 4.9 · 52 jobs│  ├─────────────────────────────────────────┤   │
│ │                 │  │ REVIEWS (5)                               │   │
│ │ [⭐ Top Pro]     │  │                                           │   │
│ │                 │  │ ⭐⭐⭐⭐⭐  07/07/2026                      │   │
│ │ 🇪🇸 Spain        │  │ "Excellent work, very professional"     │   │
│ │ 💼 Irrigation    │  │ — Juan Pérez                            │   │
│ │ 📅 15 years exp. │  │                                           │   │
│ │ 🏆 Agr. Engineer │  │ ⭐⭐⭐⭐☆  05/07/2026                      │   │
│ │                 │  │ "Good service, punctual"                 │   │
│ │ [Contact]       │  │ — Ana López                              │   │
│ └─────────────────┘  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Left Column (1/3) - Profile Card
- Large avatar (96px) with DiceBear
- Name in Poppins h2
- Rating + completed jobs
- Plan badge
- Metadata: country (with flag), specialty, experience, certifications
- Full-width "Contact" button (emerald gradient)

### Right Column (2/3)
- **"About Me" card:** Long professional description
- **"Reviews" card:** Review list with stars, date, comment, and reviewer name

---

## 9. PLANS & PRICING

**Route:** `/precios`  
**File:** `src/pages/Pricing.tsx`

### Plan Cards

| Aspect | Free | Pro | Enterprise |
|--------|------|-----|-----------|
| Icon | Zap (⚡) | Crown (👑) | Rocket (🚀) |
| Icon bg | slate-100 | emerald gradient | amber gradient |
| Border | slate-200 | emerald-500 + ring | slate-200 |
| Scale | normal | scale-[1.02] | normal |
| Badge | - | "Most Popular" | - |
| Price | Free | €19/month | €29/month |
| CTA | "Get Started" | "Subscribe" | "Subscribe" |
| CTA color | outline | emerald gradient | amber gradient |

### Interactions
- Click "Subscribe" → verify auth → create Stripe session → redirect to checkout
- If already subscribed: disabled button "Current Plan"
- Automatic proration on upgrade
- Expandable FAQ with common questions

---

## 10. DASHBOARD (USER PANEL)

**Route:** `/dashboard`  
**File:** `src/pages/Dashboard.tsx`

### Stats Cards (4 columns)
| Card | Icon | Background | Data |
|------|------|------------|------|
| My Jobs | Briefcase | emerald-100 | Own jobs count |
| My Bids | DollarSign | amber-100 | Own bids count |
| Active | TrendingUp | teal-100 | Jobs with "open" status |
| Messages | MessageSquare | blue-100 | Message count |

### Tabs
- **"My Jobs":** List of jobs published by the user
  - Each item: title + status badge + category + location + budget + date
  - Click navigates to `/jobs/:id`
  - Empty state: icon + message + "Post a Job" button

- **"My Bids":** List of submitted bids
  - Each item: "Bid #ID" + status badge (Pending/Accepted/Rejected) + amount + message
  - Empty state: icon + message + "Explore Jobs" button

### Protection
- Requires authentication
- If not logged in → automatically redirects to login

---

## 11. MESSAGING

**Route:** `/messages`  
**File:** `src/pages/Messages.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ Messages                                                             │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌─────────────────────────────────────────┐   │
│ │ Conversations   │  │ [Avatar] María García                    │   │
│ │                 │  ├─────────────────────────────────────────┤   │
│ │ ┌─────────────┐│  │                                           │   │
│ │ │[👤] María G. ││  │         Hi, I'm interested in your       │   │
│ │ │ Last msg... ││  │         pruning service                   │   │
│ │ └─────────────┘│  │                              14:30        │   │
│ │ ┌─────────────┐│  │                                           │   │
│ │ │[👤] Carlos M.││  │    Perfect, I have availability          │   │
│ │ │ Last msg... ││  │    next week                              │   │
│ │ └─────────────┘│  │    14:32                                  │   │
│ │                 │  │                                           │   │
│ │                 │  │         How many hectares?                │   │
│ │                 │  │                              14:35        │   │
│ │                 │  │                                           │   │
│ │                 │  ├─────────────────────────────────────────┤   │
│ │                 │  │ [Type a message...            ] [Send]    │   │
│ └─────────────────┘  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Left Panel (1/3) - Conversation List
- "Conversations" title
- Scrollable list (540px height)
- Each conversation: circular avatar + name + last message (truncated)
- Selected conversation: emerald-50 background + left emerald border
- Unread message badge (emerald-500)
- Empty state: MessageSquare icon + "No conversations yet"

### Right Panel (2/3) - Chat Area
- **Header:** Avatar + contact name
- **Messages:** Chat bubbles
  - Own messages: right-aligned, emerald-600 background, white text
  - Received messages: left-aligned, slate-100 background, dark text
  - Time below each message
- **Input:** Text field + send button (Send icon)
  - Enter to send
  - Button disabled if field is empty

---

## 12. DISPUTES CENTER

**Route:** `/disputes`  
**File:** `src/pages/Disputes.tsx`

### New Dispute Form
| Field | Type | Required |
|-------|------|----------|
| Related job | Input text | ✓ |
| Reason | Select (7 options) | ✓ |
| Disputed amount | Input number | - |
| Description | Textarea (5 rows) | ✓ |

**Available reasons:**
- Unsatisfactory work quality
- Work not completed
- Professional didn't show up
- Overcharging
- Damages caused
- Lack of communication
- Other reason

### Dispute List
- Each dispute: status icon + title + description + badges (reason, amount) + status badge
- Status colors:
  - Under review: amber (Clock)
  - Resolved: emerald (CheckCircle)
  - Rejected: red (XCircle)

---

## 13. KYC VERIFICATION

**Route:** `/kyc?plan=pro|enterprise`  
**File:** `src/pages/KycVerification.tsx`

### Form Fields
| Section | Field | Type | Required |
|---------|-------|------|----------|
| Personal | Full name | Input | ✓ |
| Personal | Document type | Select (DNI/Passport/License/Tax ID) | ✓ |
| Personal | Document number | Input | ✓ |
| Personal | Country | Select (10 countries) | ✓ |
| Personal | Address | Input | - |
| Document | Document photo | File upload (JPG/PNG/PDF, max 5MB) | ✓ |
| Professional | Main specialty | Select (12 categories) | ✓ |
| Professional | Years of experience | Input number | - |
| Professional | Certifications | Input | - |
| Professional | Description | Textarea | - |

### Flow
1. User arrives after paying Pro/Enterprise plan
2. Fills form with personal and professional data
3. Uploads identity document photo
4. Submits → creates record in `kyc_verifications` with status "pending"
5. Creates/updates professional profile
6. Shows confirmation screen
7. Admin reviews and approves/rejects from Admin Panel

---

## 14. ADMIN PANEL

**Route:** `/admin`  
**File:** `src/pages/Admin.tsx`

### Stats Cards (3 columns)
| Card | Icon | Color | Data |
|------|------|-------|------|
| Pending | Clock | amber-100 | Pending count |
| Approved | CheckCircle | emerald-100 | Approved count |
| Rejected | XCircle | red-100 | Rejected count |

### Tabs
- **Pending:** Expanded cards with full info + action buttons
- **All:** Compact list with name + doc type + country + specialty + date + status badge

### Pending KYC Card
- Avatar + name + user ID (truncated)
- Metadata grid (2-4 columns): document, number, country, specialty, experience, certifications, date
- Action buttons:
  - "Approve" (emerald-600, CheckCircle icon)
  - "Reject" (destructive/red, XCircle icon)
- Processing state (disabled during action)

### Interactions
- Approve: updates status to "approved" + sends notification email
- Reject: updates status to "rejected" + sends notification email
- Confirmation toast after each action
- Automatic data reload

---

## 15. PAYMENT SUCCESS

**Route:** `/payment-success?session_id=xxx&plan=pro|enterprise`  
**File:** `src/pages/PaymentSuccess.tsx`

### Flow
1. Stripe redirects here after successful payment
2. Payment is verified with `client.payment.verifyPayment(sessionId)`
3. Subscription record is created in DB
4. Shows confirmation with animation
5. Primary CTA: go to KYC verification
6. Secondary CTA: go to dashboard

---

## 16. LEGAL PAGES

**Route:** `/legal/:page` (privacidad, terminos, cookies)  
**File:** `src/pages/Legal.tsx`

### Available Pages
- `/legal/privacidad` - Privacy Policy
- `/legal/terminos` - Terms and Conditions
- `/legal/cookies` - Cookie Policy

### Elements
- Content rendered in prose (max-width 3xl)
- Readable typography with spacing
- "Back" button at the top
- Navigation between legal pages

---

## 17. AUTHENTICATION

### Auth Callback (`/auth/callback`)
**File:** `src/pages/AuthCallback.tsx`

- Loading screen with spinner
- Processes OAuth callback
- Retry logic (up to 3 attempts) for session propagation
- Redirects to Dashboard on success
- Redirects to `/auth/error` on failure

### Auth Error (`/auth/error`)
**File:** `src/pages/AuthError.tsx`

- Error icon
- "Authentication Error" message
- Problem description
- "Back to Home" button
- "Try Again" button

### Logout Callback (`/auth/logout`)
**File:** `src/pages/LogoutCallbackPage.tsx`

- Processes logout
- Clears local state
- Redirects to home page

---

## UI COMPONENTS SUMMARY

### shadcn/ui Components
| Component | Primary Use |
|-----------|-------------|
| Button | CTAs, actions, navigation |
| Card, CardContent, CardHeader, CardTitle | Information containers |
| Badge | States, categories, plans |
| Input | Text fields |
| Textarea | Long text fields |
| Select, SelectContent, SelectItem, SelectTrigger, SelectValue | Dropdowns |
| Tabs, TabsContent, TabsList, TabsTrigger | Tab navigation |
| Sheet, SheetContent, SheetTrigger | Mobile side menu |
| DropdownMenu, DropdownMenuContent, DropdownMenuItem | Dropdown menus |
| Label | Form labels |

### Lucide React Icons
| Icon | Use |
|------|-----|
| Star | Ratings |
| MapPin | Locations |
| ArrowRight, ArrowLeft | Navigation, CTAs |
| Shield | Security, KYC, admin |
| Globe | International |
| Zap | Basic plan, speed |
| MessageSquare | Messages, contact |
| Search | Search |
| Plus | Create new |
| Briefcase | Jobs |
| DollarSign | Bids, payments |
| TrendingUp | Statistics |
| Send | Send message |
| User | Avatar, profile |
| LogOut | Log out |
| LayoutDashboard | Dashboard |
| AlertTriangle | Disputes, warnings |
| Upload | Upload files |
| CheckCircle | Success, approved |
| XCircle | Error, rejected |
| Clock | Pending |
| Crown | Pro plan |
| Rocket | Enterprise plan |
| Award | Certifications |
| Calendar | Dates, experience |
| FileText | Documents |
| Menu | Hamburger menu |
| Check | Feature list |

---

## COLOR PALETTE BY VIEW

| View | Dominant Color | Background |
|------|---------------|------------|
| Landing Hero | Emerald gradient over dark image | Image + overlay |
| Statistics | Emerald-600 (numbers) | White |
| How it works | Emerald-500 (icons) | Slate-50 |
| Categories | Emerald hover | White |
| Jobs | Emerald-700 (prices) | Slate-50 |
| Professionals | Emerald (Pro) / Amber (Enterprise) | White |
| Pricing | Emerald (Pro) / Amber (Enterprise) | Slate-50 |
| Dashboard | Emerald + Amber + Teal + Blue | Slate-50 |
| Messages | Emerald-600 (own bubbles) | White |
| Disputes | Amber (pending) / Emerald (resolved) | Slate-50 |
| KYC | Emerald gradient (buttons) | Slate-50 |
| Admin | Emerald + Amber + Red (states) | Slate-50 |

---

## TYPOGRAPHY

| Element | Font | Weight | Use |
|---------|------|--------|-----|
| Headings (h1-h4) | Poppins | 600-700 | Section titles, names |
| Body text | Open Sans (system) | 400 | Paragraphs, descriptions |
| Numbers/Stats | Poppins | 700 | Counters, prices |
| Badges/Labels | System | 500-600 | Tags, states |
| Buttons | System | 500 | Button text |

---

## RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Mobile | < 768px | 1 column, hamburger menu, stacked cards |
| Tablet (md) | 768px+ | 2 columns, visible navigation |
| Desktop (lg) | 1024px+ | 3 columns, full layout |
| Wide (xl) | 1280px+ | 6 columns for categories |

---

*Document generated on July 11, 2026*
*Version: 1.0*
*Platform: Agrivo - Global Agricultural Services Marketplace*