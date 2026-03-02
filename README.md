# ⚡ DPOS — Daily Performance Operating System

A full-stack productivity web app to track your daily performance through time blocks, gym sessions, notes, and an auto-calculated daily score.

🔗 **Live:** [dpos-production.up.railway.app](https://dpos-production.up.railway.app)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5, React 19 |
| **Styling** | Tailwind CSS 4 |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma 5.22 |
| **Auth** | JWT with HTTP-only cookies |
| **State** | Zustand 5 (persisted) |
| **Email** | Brevo HTTP API |
| **Hosting** | Railway (auto-deploy from `main`) |

---

## Features

### 🔐 Authentication
- **Register with OTP** — Multi-step registration with email verification (4-digit OTP via Brevo)
- **Login** — Email + password, JWT stored in HTTP-only cookie
- **Forgot Password** — Email → OTP → New password (3-step flow)
- **Auth Guard** — Client-side route protection, auto-redirect to login
- **Email Validation** — Rejects invalid email formats before sending OTP
- **Password Toggle** — Eye/EyeOff visibility button on all password fields

### 📊 Dashboard
- Daily overview with auto-calculated performance score
- **Performance Graph** — Score history chart that auto-refreshes on updates
- **Mini Calendar** — Date picker to navigate between days

### 🕐 Time Blocks
- Create, edit, and delete time blocks for daily scheduling
- Optimistic deletion for instant UI feedback
- Score auto-updates when blocks are completed

### 🏋️ Gym Tracker
- Log gym sessions with exercises and sets
- Auto-refreshes on new entries

### 📝 Sticky Notes
- Create and manage quick notes

### 👤 Profile System
- **Profile Panel** — Slide-up panel from sidebar avatar
- **Profile Picture** — Upload with base64 encoding (500KB max), initials fallback
- **Edit Name & Bio** — Update display info
- **Change Password** — Requires current password verification (bcrypt)

### 🎨 UI / Visual Design
- **Dark Theme** — Slate-950/900 palette with violet accents
- **Animated Auth Pages** — Floating gradient orbs, grid overlay, particles, scanlines
- **Glass-morphism** — Auth cards with `backdrop-blur-xl` and violet-tinted borders
- **Fixed Sidebar** — Navigation with brand, links, and clickable profile avatar

---

## Database Models

```
User · TimeBlock · FocusSession · GymSession · ExerciseEntry
DailyScore · DailyNote · StickyNote · OtpCode
```

---

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Protected routes (dashboard, blocks, gym, notes)
│   ├── api/
│   │   ├── auth/           # login, register, logout, me, send-otp, verify-otp, reset-password
│   │   ├── profile/        # GET/PATCH profile, POST password change
│   │   ├── blocks/         # CRUD time blocks
│   │   ├── gym/            # CRUD gym sessions
│   │   ├── notes/          # CRUD sticky notes
│   │   └── score/          # Daily score calculation
│   ├── login/              # Login page
│   ├── register/           # Multi-step registration with OTP
│   └── forgot-password/    # Password reset flow
├── components/
│   ├── Sidebar.tsx         # Navigation + profile avatar
│   ├── ProfilePanel.tsx    # Profile management panel
│   ├── AuthBackground.tsx  # Animated auth page background
│   ├── PerformanceGraph.tsx
│   ├── MiniCalendar.tsx
│   └── ui/                 # Input, PasswordInput, Textarea, Select
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── api-client.ts       # Typed API client
│   ├── email.ts            # Brevo HTTP API integration
│   ├── auth.ts             # JWT helpers
│   └── utils.ts            # Utility functions
├── stores/
│   └── authStore.ts        # Zustand auth state
├── types/
│   └── index.ts            # Shared TypeScript interfaces
└── prisma/
    └── schema.prisma       # Database schema (9 models)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)
- [Brevo](https://brevo.com) account for email (free: 300 emails/day)

### Setup

```bash
# Clone the repo
git clone https://github.com/arpitpandey0307/dpos.git
cd dpos

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values (see below)

# Push schema to database
npx prisma db push

# Run development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL=            # PostgreSQL connection string (pooled)
DIRECT_URL=              # PostgreSQL direct connection string
JWT_SECRET=              # Secret key for JWT signing
JWT_EXPIRES_IN=7d        # Token expiry duration
BREVO_API_KEY=           # Brevo API key (starts with xkeysib-)
SENDER_EMAIL=            # Verified sender email for OTP
NEXT_PUBLIC_APP_URL=     # App URL (e.g. http://localhost:3000)
```

---

## Deployment

Deployed on **Railway** with auto-deploy from the `main` branch.

```bash
git push origin main    # Triggers automatic deployment
```

Railway runs `npx prisma generate` during build and serves the Next.js app.

---

## Author

**Arpit Pandey** — [@arpitpandey0307](https://github.com/arpitpandey0307)
