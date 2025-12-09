# InterpretReflect Documentation

**An Operating System for Interpreter Careers**

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Architecture](#architecture)
5. [Features](#features)
6. [Routes & Pages](#routes--pages)
7. [API Endpoints](#api-endpoints)
8. [Database Schema](#database-schema)
9. [Components](#components)
10. [Elya AI System](#elya-ai-system)
11. [CEU Compliance System](#ceu-compliance-system)
12. [Skills & ECCI Domains](#skills--ecci-domains)
13. [Wellness & Burnout Tracking](#wellness--burnout-tracking)
14. [Community System](#community-system)
15. [Billing & Subscriptions](#billing--subscriptions)
16. [Environment Variables](#environment-variables)
17. [Deployment](#deployment)

---

## Overview

InterpretReflect is a comprehensive career management platform designed specifically for professional interpreters. It provides:

- **Assignment Management**: Track, prepare for, and debrief assignments
- **AI Coaching (Elya)**: Multi-mode AI assistant for prep, debrief, research, and emotional support
- **Skills Development**: ECCI-domain based training with drills and assessments
- **CEU Compliance**: RID-compliant continuing education tracking with certificate generation
- **Wellness Tracking**: Burnout prevention through emotional load monitoring
- **Community**: Connect with other interpreters, find mentors, share insights

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| AI | Anthropic Claude API |
| Payments | Stripe |
| Email | Resend |
| Charts | Recharts |
| Animations | Framer Motion |
| Calendar | Google Calendar API |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)
- Anthropic API key (for Elya)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ir_new

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Scripts

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
npm run check    # TypeScript type checking
```

---

## Architecture

### Directory Structure

```
ir_new/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard
│   ├── assignments/       # Assignment management
│   ├── skills/            # Skills training
│   ├── drills/            # Practice drills
│   ├── ceu/               # CEU compliance
│   ├── community/         # Community features
│   ├── wellness/          # Wellness tracking
│   └── ...
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific
│   ├── skills/            # Skills-related
│   ├── history/           # History/analytics
│   ├── onboarding/        # Onboarding wizard
│   ├── ui/                # Reusable UI components
│   └── ...
├── lib/                   # Utilities and helpers
├── supabase/
│   └── migrations/        # Database migrations
├── public/                # Static assets
└── types/                 # TypeScript type definitions
```

### Key Patterns

1. **Client Components**: Use `"use client"` directive for interactive features
2. **Server Components**: Default for data fetching and SEO
3. **API Routes**: RESTful endpoints in `app/api/`
4. **Row-Level Security**: Database-level access control via Supabase RLS
5. **Protected Routes**: HOC wrapper for authenticated pages

---

## Features

### Phase 1: Quick Wins (Completed)

| Task | Description | Status |
|------|-------------|--------|
| 1.1 | Fix CEU Claims on Landing Page | ✅ Complete |
| 1.2 | Add Emotional Intensity to Assignments | ✅ Complete |
| 1.3 | Weekly Load Visualization | ✅ Complete |
| 1.4 | Burnout Drift Indicator | ✅ Complete |

### Phase 2: AI-Powered Prep Features (Completed)

| Task | Description | Status |
|------|-------------|--------|
| 2.1 | AI Participant Research | ✅ Complete |
| 2.2 | AI Domain Vocabulary Generator | ✅ Complete |
| 2.3 | AI Topic Anticipation | ✅ Complete |
| 2.4 | Mental Model Builder | ✅ Complete |
| 2.5 | Prep Mode Quick Actions UI | ✅ Complete |

---

## Routes & Pages

### Public Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing homepage |
| `/start` | New user entry point |
| `/for-agencies` | Agency-focused landing |
| `/login`, `/signin` | Authentication |
| `/signup` | User registration |
| `/signup/agency` | Agency registration |

### Authenticated Routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Main user dashboard |
| `/assignments` | Assignment list and management |
| `/assignments/[id]` | Assignment detail |
| `/assignments/[id]/debrief` | Post-assignment debrief |
| `/skills` | Skills training hub |
| `/skills/[moduleCode]` | Module content |
| `/drills/[category]` | Practice drills |
| `/ceu` | CEU compliance dashboard |
| `/community` | Community feed |
| `/journal` | Free-write journal |
| `/wellness` | Wellness tracking |
| `/settings` | Account settings |
| `/history` | Performance history |

### Admin Routes

| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard |
| `/admin/ceu` | CEU management |
| `/agency` | Agency management |

---

## API Endpoints

### Authentication & Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/interpreter/agencies` | Manage agency affiliations |
| GET/POST | `/api/interpreter/invitations` | Handle invitations |
| POST | `/api/interpreter/join-org` | Join organization |

### Chat & AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Elya AI conversation |
| POST | `/api/conversation/generate-metadata` | Auto-generate titles |

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assignments/create` | Create assignment |
| GET/POST | `/api/assignments/team` | Team assignments |
| GET/POST | `/api/assignments/templates` | Assignment templates |

### Skills & Drills

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drills` | Fetch drills |
| POST | `/api/drills/attempts` | Record attempt |
| GET | `/api/drills/scenario` | Get scenario |

### CEU System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ceu?action=summary` | CEU summary |
| GET | `/api/ceu?action=dashboard` | Full dashboard |
| POST | `/api/ceu` (action: submit_assessment) | Submit assessment |
| POST | `/api/ceu` (action: issue_certificate) | Issue certificate |
| GET | `/api/ceu/certificate-pdf` | Generate PDF |

### Wellness

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/wellness` | Wellness check-ins |
| POST | `/api/behavioral` | Behavioral logging |

### Community

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/community/posts` | Feed posts |
| POST | `/api/community/posts/[id]/like` | Like post |
| GET/POST | `/api/community/connections` | Connections |
| GET/POST | `/api/community/messages` | Direct messages |

### Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/create-checkout` | Stripe checkout |
| POST | `/api/create-portal` | Customer portal |
| POST | `/api/webhooks/stripe` | Stripe webhooks |

---

## Database Schema

### Core Tables

#### `profiles`
Extended user profiles linked to Supabase auth.

```sql
- id: UUID (FK to auth.users)
- email: TEXT
- full_name: TEXT
- subscription_tier: TEXT (trial/basic/pro)
- stripe_customer_id: TEXT
- years_experience: INTEGER
- primary_goal: TEXT
- onboarding_completed: BOOLEAN
- settings: JSONB
```

#### `assignments`
Track interpreter assignments.

```sql
- id: UUID
- user_id: UUID (FK)
- title: TEXT
- assignment_type: TEXT (Medical/Legal/Educational/etc)
- date: DATE
- time: TIME
- duration_minutes: INTEGER
- location: TEXT
- location_type: TEXT (in-person/remote/hybrid)
- setting: TEXT
- description: TEXT
- prep_status: TEXT
- completed: BOOLEAN
- debriefed: BOOLEAN
- emotional_intensity: TEXT (low/moderate/high/very_high)
```

#### `wellness_checkins`
Quick emotional state tracking.

```sql
- id: UUID
- user_id: UUID (FK)
- feeling: TEXT (energized/calm/okay/drained/overwhelmed)
- hours_worked_this_week: INTEGER
- rest_days_this_month: INTEGER
- notes: TEXT
- created_at: TIMESTAMPTZ
```

#### `skill_modules`
Training modules with CEU values.

```sql
- id: UUID
- module_code: TEXT (unique)
- title: TEXT
- description: TEXT
- duration_minutes: INTEGER
- ceu_value: DECIMAL
- rid_category: TEXT
- assessment_questions: JSONB
- learning_objectives: TEXT[]
- ceu_eligible: BOOLEAN
```

#### `ceu_certificates`
Issued CEU certificates.

```sql
- id: UUID
- user_id: UUID (FK)
- module_id: UUID (FK)
- certificate_number: TEXT (IR-YYYY-XXXXXX)
- ceu_value: DECIMAL
- rid_category: TEXT
- assessment_score: INTEGER
- issued_at: TIMESTAMPTZ
- status: TEXT (active/revoked/expired)
```

#### `elya_conversations`
Chat conversation history.

```sql
- id: UUID
- user_id: UUID (FK)
- mode: TEXT (chat/prep/debrief/research/patterns/free-write)
- messages: JSONB[]
- assignment_id: UUID (optional FK)
- mood_emoji: TEXT
- ai_title: TEXT
- is_active: BOOLEAN
```

### Key Database Functions

```sql
-- Get CEU dashboard data
get_user_ceu_dashboard(p_user_id UUID)

-- Issue CEU certificate
issue_ceu_certificate(p_user_id, p_module_id, p_series_id, p_assessment_score)

-- Apply subscription updates from Stripe
apply_subscription_update(p_user_id, p_status, p_tier, ...)
```

---

## Components

### Dashboard Components

| Component | File | Description |
|-----------|------|-------------|
| ElyaInterface | `dashboard/ElyaInterface.tsx` | Multi-mode AI chat |
| WeeklyLoadChart | `dashboard/WeeklyLoadChart.tsx` | Weekly workload visualization |
| BurnoutDriftIndicator | `dashboard/BurnoutDriftIndicator.tsx` | Wellness trend indicator |
| WellnessCheckinModal | `dashboard/WellnessCheckinModal.tsx` | Quick check-in modal |
| TodaySnapshot | `dashboard/TodaySnapshot.tsx` | Today's assignments |
| QuickStats | `dashboard/QuickStats.tsx` | Key metrics |

### Skills Components

| Component | File | Description |
|-----------|------|-------------|
| SkillsDashboard | `skills/SkillsDashboard.tsx` | Skills overview |
| CompetencyRadar | `skills/CompetencyRadar.tsx` | ECCI radar chart |
| GrowthTimeline | `skills/GrowthTimeline.tsx` | Progress over time |
| PracticeQueue | `skills/PracticeQueue.tsx` | Drill queue |

### UI Components

| Component | File | Description |
|-----------|------|-------------|
| ThinkingDots | `ui/ai-typing.tsx` | AI typing animation |
| SkeletonDashboard | `ui/skeleton.tsx` | Loading skeletons |
| Toast | `ui/toast.tsx` | Notifications |

---

## Elya AI System

Elya is the AI coaching assistant with six operational modes:

### Modes

| Mode | Color | Purpose |
|------|-------|---------|
| Chat | Violet | General conversation |
| Prep | Teal | Assignment preparation |
| Debrief | Blue | Post-assignment reflection |
| Research | Amber | Vocabulary & terminology |
| Patterns | Purple | Trend analysis |
| Free-Write | Rose | Emotional processing |

### Prep Mode Features

When in Prep mode with an assignment selected, quick action buttons appear:

1. **Generate Vocabulary** - Domain-specific terminology
2. **Anticipate Topics** - Predict discussion topics
3. **Explain This Setting** - Mental model builder

### System Prompts

The chat API (`/api/chat`) uses context-aware system prompts:

```typescript
// Prep mode detection
const isPrepMode = context?.type === "prep";

// Mode-specific prompt selection
if (isPrepMode) {
  finalSystemPrompt = prepModeSystemPrompt;
}
```

### Context Passing

Assignment context is passed to Elya:

```typescript
context: {
  type: mode,
  assignment_id: selectedAssignment,
  assignment_title: selectedAssignmentData?.title,
  assignment_type: selectedAssignmentData?.assignment_type,
  assignment_date: selectedAssignmentData?.date,
  assignment_setting: selectedAssignmentData?.setting,
  assignment_description: selectedAssignmentData?.description,
}
```

---

## CEU Compliance System

### RID Compliance

- **Sponsor Number**: 2309
- **Certificate Format**: `IR-YYYY-XXXXXX`

### CEU Categories

| Category | Required | Description |
|----------|----------|-------------|
| Professional Studies | 6.0 CEU | Core interpreting skills |
| Professional Practice Opportunities | 1.0 CEU | Practical experience |
| General Studies | 2.0 CEU max | Related learning |
| **Total** | **8.0 CEU** | Per 4-year cycle |

### Certificate Flow

1. User completes module content
2. User passes assessment (80% threshold)
3. User submits evaluation form
4. System issues certificate with unique number
5. Certificate available for PDF download
6. Public verification at `/verify-certificate/[id]`

---

## Skills & ECCI Domains

### Four ECCI Domains

| Domain | Description |
|--------|-------------|
| **Linguistic** | Language proficiency, register, terminology |
| **Cultural** | Cultural mediation, awareness, sensitivity |
| **Cognitive** | Memory, processing, decision-making |
| **Interpersonal** | Communication, ethics, professionalism |

### Skill Tracking

- Skills rated 0-100 mastery level
- Tracked via debriefs, assessments, self-ratings
- Visualized in competency radar chart
- Growth timeline shows progress over time

### Drills

| Type | Description |
|------|-------------|
| Scenario Decision | Choose best action in scenario |
| Best/Worst Ranking | Rank responses |
| Red Flag Identification | Spot ethical issues |
| Quick Fire | Rapid response drills |

---

## Wellness & Burnout Tracking

### Weekly Load Chart

Visualizes assignment intensity by day:

- **Data Source**: `assignments.emotional_intensity`
- **Intensity Values**: low=1, moderate=2, high=3, very_high=4
- **Color Coding**: Green (low) → Red (high)
- **Location**: Dashboard "Wellness & Load Tracking" section

### Burnout Drift Indicator

Tracks wellness trend over 4 weeks:

- **Data Source**: `wellness_checkins.feeling`
- **Score Mapping**: energized=1, calm=2, okay=3, drained=4, overwhelmed=5
- **Trend States**:
  - Improving (green): Score decreased >0.5
  - Stable (gray): Within 0.5
  - Drifting toward burnout (red): Score increased >0.5

### Wellness Check-ins

Quick emotional state logging:

```typescript
type Feeling = 'energized' | 'calm' | 'okay' | 'drained' | 'overwhelmed';
```

- Available from dashboard modal
- Post-debrief prompt (after 3+ messages)
- Dedicated `/wellness` page

---

## Community System

### Features

| Feature | Description |
|---------|-------------|
| Posts | Text-only feed (general/win/question/insight/reflection) |
| Connections | Two-way system (both must accept) |
| Messages | Direct messages and group chats |
| Profiles | Display name, bio, specialties, mentoring status |

### Post Types

- **General**: Regular posts
- **Win**: Celebrate successes
- **Question**: Ask community
- **Insight**: Share learnings
- **Reflection**: Professional reflections

### Mentorship

- Users can mark "open to mentoring"
- System suggests matches based on ECCI domain gaps
- Strong domain users matched with those developing

---

## Billing & Subscriptions

### Tiers

| Tier | Features |
|------|----------|
| Trial | 7 days, limited features |
| Basic | Core features, monthly/yearly |
| Pro | All features, priority support |

### Stripe Integration

```typescript
// Create checkout session
POST /api/create-checkout
{ priceId, userId, successUrl, cancelUrl }

// Customer portal
POST /api/create-portal
{ customerId }

// Webhook handling
POST /api/webhooks/stripe
// Handles: checkout.session.completed, customer.subscription.*
```

### Discounts

- Student discount available
- New interpreter discount (within 2 years of certification)

---

## Environment Variables

### Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Anthropic (for Elya)
ANTHROPIC_API_KEY=sk-ant-...
```

### Optional

```env
# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Analytics
NEXT_PUBLIC_GTAG_ID=
NEXT_PUBLIC_META_PIXEL_ID=

# Email
RESEND_API_KEY=
```

---

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy

### Manual

```bash
# Build
npm run build

# Start
npm start
```

### Database Migrations

```bash
# Apply migrations
npx supabase db push

# Generate types
npx supabase gen types typescript --local > types/supabase.ts
```

---

## Security

### Authentication

- Supabase Auth with JWT tokens
- Protected routes via `ProtectedRoute` HOC
- API routes validate auth header

### Row-Level Security

All user-owned tables have RLS policies:

```sql
-- Example: Users can only see their own data
CREATE POLICY "Users can view own data"
ON assignments FOR SELECT
USING (auth.uid() = user_id);
```

### API Security

```typescript
// Validate auth on API routes
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## Contributing

1. Create feature branch
2. Make changes
3. Run `npm run lint` and `npm run check`
4. Submit pull request

---

## Support

For issues or questions:
- GitHub Issues: [repository-url]/issues
- Documentation: This file
- Contact: [support email]

---

*Last Updated: December 2024*
