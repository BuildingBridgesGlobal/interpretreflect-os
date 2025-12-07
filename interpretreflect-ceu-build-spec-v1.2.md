# InterpretReflect CEU System
## Complete Build Specification v1.2

**Document Purpose:** Single source of truth for implementing the Elya-guided micro-learning CEU system. Ready for Claude Code operationalization.

**Last Updated:** December 6, 2025
**Version:** 1.2 (3-Tier Structure + Journal/Insights + Admin Portal)
**Authors:** Sarah Wheeler, Claude

---

# TABLE OF CONTENTS

## Core Sections
1. [System Overview](#1-system-overview)
2. [Pricing & Tiers (3-Tier)](#2-pricing--tiers)
3. [Credit System](#3-credit-system)
4. [Content Architecture](#4-content-architecture)
5. [Module Catalog](#5-module-catalog)
6. [Elya Integration](#6-elya-integration)
7. [User Flows](#7-user-flows)
8. [Database Schema](#8-database-schema)
9. [Certificate System](#9-certificate-system)
10. [RID Compliance](#10-rid-compliance)
11. [Dashboard & Analytics](#11-dashboard--analytics)
12. [Stripe Integration](#12-stripe-integration)
13. [Implementation Phases](#13-implementation-phases)
14. [Content Production Strategy](#14-content-production-strategy)

## Appendices
- [Appendix A: Complete Module Catalog](#appendix-a-complete-module-catalog)
- [Appendix B: Elya Prompt Templates](#appendix-b-elya-prompt-templates)
- [Appendix C: Emotional Literacy Framework](#appendix-c-emotional-literacy-framework)
- [Appendix D: Unfolding Case Study Format](#appendix-d-unfolding-case-study-format)
- [Appendix E: Sample Deep Dive Module](#appendix-e-sample-deep-dive-module)
- [Appendix F: Journal & Insights System](#appendix-f-journal--insights-system)
- [Appendix G: Admin Portal (RID Compliance)](#appendix-g-admin-portal-rid-compliance)
- [Appendix H: Credential-Based Personalization](#appendix-h-credential-based-personalization)

---

# 1. SYSTEM OVERVIEW

## Core Concept

InterpretReflect's CEU system is **Elya-guided micro-learning** - not traditional workshops. Interpreters develop skills through:

- **LEARN:** 15-minute theory videos (foundational knowledge)
- **PRACTICE:** Interactive skill work with Elya (application)
- **REFLECT:** Free journaling and debrief (processing)
- **TRACK:** Competency growth over time (retention)

## Key Differentiators

| Traditional CEUs | InterpretReflect |
|------------------|------------------|
| 2-hour passive videos | 15-30 min active modules |
| Watch when you remember | Elya prompts at right moment |
| Generic content | Personalized to your patterns |
| Certificate = done | Ongoing growth tracking |
| "I sat through it" | "I actually got better" |

## Business Model Summary

| Tier | Price | Access |
|------|-------|--------|
| Basic | Free forever | Elya (limited), wellness tracking, no CEU content |
| Pro | $30/month | Elya (unlimited), 4 credits/month, all CEU content |
| Top-Up | $5-14 | Additional credits when needed |

---

# 2. PRICING & TIERS

## Strategic Overview: The Conversion Staircase

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CONVERSION STAIRCASE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   PRO ($30/month) ← Full CEU access, unlimited everything               │
│        ↑                                                                │
│   GROWTH ($15/month) ← Working interpreters, full Elya + assignments    │
│        ↑                                                                │
│   FREE ($0) ← Students, curious, taste the value                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Design Philosophy:**
- FREE: Sticky but hungry (creates investment, shows value)
- GROWTH: Working interpreter essentials (daily use, no CEUs)
- PRO: Full professional toolkit (CEUs + everything)

## Tier Definitions

### FREE ($0 Forever)

**Target Users:** Students, curious interpreters, "tire-kickers"

**Included:**
- Elya conversations: 5 per month (wellness check-ins only)
- Basic mood tracking after reflections (emoji picker: 😤😢😐😊🌟)
- Conversation history (chronological list, read-only)
- AI-generated titles for conversations
- Simple calendar view (dots showing reflection days)
- Basic search by date
- Dark/light mode toggle
- Profile management

**Not Included:**
- Pre/post assignment workflows
- Extended Elya features
- Any CEU content or credits
- Insights dashboard
- Pattern detection
- AI tagging
- Sentiment filtering
- Color-coded mood calendar
- Competency tracking
- Certificates

**Conversion Triggers:**
- "You've used 5/5 reflections this month. Upgrade to Growth for unlimited Elya access."
- "🔒 Unlock Insights to see patterns in your reflections"
- "Ready for assignment support? Upgrade to Growth"

**Why this works:** Creates switching costs (conversation history is valuable). After 6 months of journaling, users won't leave. But limited access creates hunger for more.

---

### GROWTH ($15/month)

**Target Users:** Working interpreters who want daily support but don't need CEUs yet

**Included:**
- Everything in FREE, PLUS:
- Unlimited Elya conversations
- Pre-assignment prep workflow ("I have an assignment coming up...")
- Post-assignment debrief workflow ("I just finished interpreting...")
- Burnout drift monitoring
- Wellness tracking dashboard
- AI-generated insights ("40% of reflections show boundary challenges")
- Sentiment filtering (show all "difficult" entries)
- AI auto-tags (themes, skills, topics) with tag frequency cloud
- Calendar view with color-coded mood heatmap
- Pattern detection ("You tend to feel overwhelmed on Mondays")
- Forward-looking suggestions ("Based on patterns, prep for...")
- Export/download conversation history

**Not Included:**
- CEU content (theory videos, skill practices, case studies)
- CEU credits
- CEU certificates
- RID compliance tracking
- Competency profile/tracking
- Deep Dive modules

**Conversion Triggers:**
- "Based on your patterns, we recommend the Emotional Boundaries module. Upgrade to Pro to access CEUs."
- "You've been reflecting on [topic] a lot. There's a targeted learning module for this. Upgrade to Pro."
- "Need CEUs for RID certification? Upgrade to Pro for 4 credits/month."

**Why this works:** Perfect for students (don't need CEUs) and interpreters between certification cycles. Full Elya access = daily stickiness. Insights = value demonstration. CEU content locked = clear upgrade path.

---

### PRO ($30/month)

**Target Users:** Certified interpreters needing CEUs, serious professionals

**Included:**
- Everything in GROWTH, PLUS:
- 4 credits/month for CEU content
- All theory videos
- All skill practice modules
- All Deep Dive case studies
- CEU certificates on completion
- RID compliance tracking (automatic logging)
- Competency profile and growth tracking
- Elya skill recommendations based on reflections + completions
- Priority support
- Enterprise features (if bulk seats)

**Credit Reset:** Monthly on billing date. No rollover.

**Cancellation:** 
- Access continues until end of billing period
- Downgrades to GROWTH features if paid
- Downgrades to FREE if cancelled entirely
- CEU records and certificates retained permanently

---

### Top-Up Credits (Pro Users Only)

| Package | Credits | Price | Per Credit |
|---------|---------|-------|------------|
| Small | 2 credits | $5 | $2.50 |
| Medium | 4 credits | $8 | $2.00 |
| Large | 8 credits | $14 | $1.75 |

**Top-Up Rules:**
- Only available to active Pro subscribers
- Never expire (unlike monthly credits)
- Used after monthly credits depleted
- Non-refundable

---

## Value Gate Summary

| Feature | FREE | GROWTH | PRO |
|---------|------|--------|-----|
| Elya conversations | 5/month | Unlimited | Unlimited |
| Mood tracking (basic) | ✅ | ✅ | ✅ |
| Conversation history | ✅ | ✅ | ✅ |
| AI titles | ✅ | ✅ | ✅ |
| Calendar (dots) | ✅ | ✅ | ✅ |
| Dark/light mode | ✅ | ✅ | ✅ |
| Assignment prep/debrief | ❌ | ✅ | ✅ |
| Burnout monitoring | ❌ | ✅ | ✅ |
| AI Insights | ❌ | ✅ | ✅ |
| Pattern detection | ❌ | ✅ | ✅ |
| Sentiment filtering | ❌ | ✅ | ✅ |
| AI tagging + cloud | ❌ | ✅ | ✅ |
| Color-coded calendar | ❌ | ✅ | ✅ |
| Export history | ❌ | ✅ | ✅ |
| CEU content | ❌ | ❌ | ✅ |
| CEU credits | ❌ | ❌ | 4/month |
| Certificates | ❌ | ❌ | ✅ |
| RID tracking | ❌ | ❌ | ✅ |
| Competency profile | ❌ | ❌ | ✅ |

---

## Pricing Strategy Rationale

**$15 GROWTH:**
- Accessible for students (many have limited budgets)
- Lower barrier than $30 creates stepping stone
- Daily use features justify monthly cost
- Enough value to stick; not enough for serious professionals

**$30 PRO:**
- 2 hours of CEU content = $15/hour equivalent
- Traditional RID workshops = $50-100 for 2 hours
- Pro = 60-70% cheaper than alternatives
- Plus all the Elya features
- Plus personalization
- **This is a steal. Don't go lower.**

**Annual Option (Future):**
- GROWTH Annual: $144/year ($12/month equivalent, 20% savings)
- PRO Annual: $288/year ($24/month equivalent, 20% savings)

---

# 3. CREDIT SYSTEM

## Credit Values

| Module Type | Duration | Credits | CEU Value |
|-------------|----------|---------|-----------|
| Quick Practice | 15 min | 0.5 | 0.025 |
| Theory Video | 15 min | 0.5 | 0.025 |
| Standard Practice | 30 min | 1.0 | 0.05 |
| Deep Dive | 45-60 min | 2.0 | 0.1 |

**Note:** RID minimum trackable CEU is 0.05. We group two 0.025 activities = 0.05 CEU for certificate purposes.

## Monthly Allowance Math

| Metric | Value |
|--------|-------|
| Monthly credits | 4 |
| Monthly hours | 2 |
| Monthly CEU potential | 0.2 |
| Annual CEU potential | 2.4 |
| RID annual requirement | 2.0 (8.0 over 4 years) |
| Coverage | 120% of requirement |

## Credit Usage Rules

1. Monthly credits used first
2. Top-up credits used after monthly depleted
3. Monthly credits reset on billing date
4. Top-up credits never expire
5. Credits cannot be transferred between users
6. Partial module = no credit charged (must complete)

## Credit Tracking States

```
User Credit Status:
- monthly_credits_total: 4 (fixed for Pro)
- monthly_credits_used: 2
- monthly_credits_remaining: 2
- topup_credits_balance: 6
- credits_reset_date: 2025-01-06T00:00:00Z
- last_credit_activity: 2025-12-06T14:30:00Z
```

---

# 4. CONTENT ARCHITECTURE

## The Learning Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│    LEARN (0.5 credits)              PRACTICE (0.5-2.0 credits)   │
│    ═══════════════════              ═════════════════════════    │
│    Theory Videos                    Elya-Guided Skills           │
│    • 15 minutes                     • 15-60 minutes              │
│    • Foundational concepts          • Interactive exercises      │
│    • Watch/absorb                   • Real-time feedback         │
│    • "What is this?"                • "Let's try it"             │
│                                                                   │
│              ↓                              ↓                     │
│                                                                   │
│    TRACK (Automatic)                REFLECT (Free - no credits)  │
│    ════════════════                 ═══════════════════════════  │
│    Growth Dashboard                 Elya Debrief + Journal       │
│    • Competency scores              • Processing conversations   │
│    • Pattern insights               • Assignment reflections     │
│    • Progress over time             • No credit cost             │
│    • Elya observations              • Feeds recommendations      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Content Types

### 1. Theory Videos (LEARN)

**Format:** Pre-recorded video with Sarah presenting
**Duration:** 15 minutes
**Credits:** 0.5
**CEU:** 0.025 (paired with another 0.025 for RID minimum)

**Structure:**
- Introduction (1 min): What and why
- Core concept (10 min): The knowledge
- Application preview (3 min): How this applies to interpreting
- Reflection prompt (1 min): Question to consider

**Production Notes:**
- Professional but warm
- Visual aids, not talking head only
- Captions required
- ASL version for key modules (future)

### 2. Quick Practice (PRACTICE)

**Format:** Elya-guided interactive exercise
**Duration:** 15 minutes
**Credits:** 0.5
**CEU:** 0.025

**Structure:**
- Setup (2 min): Elya explains the exercise
- Practice (10 min): Interactive skill work
- Feedback (3 min): Elya provides insights, logs growth

**Examples:**
- Fingerspelling drill
- BREATHE Protocol walkthrough
- Quick boundary script practice
- Emotion labeling exercise

### 3. Standard Practice (PRACTICE)

**Format:** Elya-guided comprehensive skill session
**Duration:** 30 minutes
**Credits:** 1.0
**CEU:** 0.05

**Structure:**
- Context setting (5 min): Elya discusses relevance to user's patterns
- Skill introduction (5 min): Framework or technique
- Practice rounds (15 min): Multiple scenarios with feedback
- Integration (5 min): How to apply in real work, growth notes

**Examples:**
- Boundary role-play scenarios
- Ethical dilemma analysis
- Cognitive load management techniques
- Cultural scenario navigation

### 4. Deep Dive (LEARN + PRACTICE Combined)

**Format:** Theory video + Extended Elya practice
**Duration:** 45-60 minutes
**Credits:** 2.0
**CEU:** 0.1

**Structure:**
- Theory video (15 min): Foundational knowledge
- Transition (5 min): Elya connects theory to user's experience
- Extended practice (30-40 min): Multiple exercises with coaching
- Synthesis (5 min): Key takeaways, growth tracking

**Examples:**
- EI Foundations Complete
- Boundary Mastery Workshop
- Trauma-Informed Practice Deep Dive

### 5. Reflection (FREE - No Credits)

**Format:** Elya conversation
**Duration:** Unlimited
**Credits:** 0 (free)
**CEU:** Not directly, but contributes to documentation

**Types:**
- Post-assignment debrief
- Free journaling
- Wellness check-in
- Pattern exploration

**Purpose:** Processing without "spending" - encourages engagement

---

# 5. MODULE CATALOG

## Phase 1 Launch Modules (MVP)

### Theory Videos (LEARN)

| ID | Title | Duration | Credits | CEU | Content Area |
|----|-------|----------|---------|-----|--------------|
| TV-001 | What is Emotional Intelligence? | 15 min | 0.5 | 0.025 | PS |
| TV-002 | The ECCI Model Explained | 15 min | 0.5 | 0.025 | PS |
| TV-003 | Understanding Vicarious Trauma | 15 min | 0.5 | 0.025 | PS |
| TV-004 | Boundary Types & Functions | 15 min | 0.5 | 0.025 | PS |
| TV-005 | The Interpreter Brain: How We Process | 15 min | 0.5 | 0.025 | PS |
| TV-006 | What is Burnout? | 15 min | 0.5 | 0.025 | PS |
| TV-007 | Role-Space: What It Really Means | 15 min | 0.5 | 0.025 | PS |
| TV-008 | Introduction to Reflective Practice | 15 min | 0.5 | 0.025 | PS |

### Quick Practices (PRACTICE - 15 min)

| ID | Title | Duration | Credits | CEU | Elya Trigger |
|----|-------|----------|---------|-----|--------------|
| QP-001 | BREATHE Protocol | 15 min | 0.5 | 0.025 | Stress mentioned |
| QP-002 | Emotion Labeling Drill | 15 min | 0.5 | 0.025 | Emotional confusion |
| QP-003 | Quick Boundary Script | 15 min | 0.5 | 0.025 | Boundary issue |
| QP-004 | Fingerspelling Warm-Up | 15 min | 0.5 | 0.025 | Pre-assignment |
| QP-005 | Cognitive Reset Technique | 15 min | 0.5 | 0.025 | Overwhelm |
| QP-006 | Post-Assignment Decompression | 15 min | 0.5 | 0.025 | Tough assignment |

### Standard Practices (PRACTICE - 30 min)

| ID | Title | Duration | Credits | CEU | Elya Trigger |
|----|-------|----------|---------|-----|--------------|
| SP-001 | Boundary Role-Play Scenarios | 30 min | 1.0 | 0.05 | Boundary patterns |
| SP-002 | Emotional Regulation Deep Practice | 30 min | 1.0 | 0.05 | Regulation struggles |
| SP-003 | Ethical Dilemma Analysis (DECIDE) | 30 min | 1.0 | 0.05 | Ethics uncertainty |
| SP-004 | Vicarious Trauma Processing | 30 min | 1.0 | 0.05 | Trauma exposure |
| SP-005 | Confidence Building Session | 30 min | 1.0 | 0.05 | Self-doubt |
| SP-006 | Cognitive Load Management | 30 min | 1.0 | 0.05 | Overwhelm patterns |
| SP-007 | Assertive Communication Practice | 30 min | 1.0 | 0.05 | Communication issues |
| SP-008 | Burnout Prevention Check-In | 30 min | 1.0 | 0.05 | Burnout indicators |

### Deep Dives (LEARN + PRACTICE - 60 min)

| ID | Title | Duration | Credits | CEU | Components |
|----|-------|----------|---------|-----|------------|
| DD-001 | EI Foundations Complete | 60 min | 2.0 | 0.1 | TV-001 + Extended practice |
| DD-002 | Boundary Mastery | 60 min | 2.0 | 0.1 | TV-004 + Role-play series |
| DD-003 | Trauma-Informed Practice | 60 min | 2.0 | 0.1 | TV-003 + Processing session |
| DD-004 | The ECCI Model in Action | 60 min | 2.0 | 0.1 | TV-002 + Application exercises |

## Phase 2 Modules (Post-Launch)

- Cultural Intelligence series (PPO eligible)
- Domain-specific modules (Medical, Legal, VRS)
- Advanced cognitive performance
- Leadership and mentoring
- CADI (AI integration) track

---

# 6. ELYA INTEGRATION

## Elya's Roles in CEU System

### 1. Skill Recommender

**Trigger:** Patterns detected in reflections/check-ins

**Logic:**
```
IF reflection.contains(stress_keywords) AND user.has_credits
  THEN recommend(QP-001: BREATHE Protocol)
  
IF reflection.mentions(boundary) COUNT > 2 IN last_30_days
  THEN recommend(SP-001: Boundary Role-Play)
  
IF user.completed(TV-001) AND NOT user.completed(SP-002)
  THEN suggest("Ready to practice what you learned?")
```

**Conversation Example:**
```
Elya: "I noticed you mentioned feeling overwhelmed after that 
medical assignment. The BREATHE Protocol is a quick 15-minute 
practice that might help. You have 3 credits left this month. 
Want to try it?"

User: "Yes"

Elya: [Launches QP-001 module]
```

### 2. Practice Facilitator

**Role:** Guide user through skill practice modules

**Capabilities:**
- Present scenarios
- Role-play counterpart
- Provide real-time feedback
- Adjust difficulty based on performance
- Track progress and insights

**Conversation Example:**
```
Elya: "Let's practice boundary-setting. I'll play a family member 
who keeps asking personal questions during an assignment. Ready?"

User: "Ready"

Elya: "So, do you have kids? How long have you been interpreting? 
Do you know sign language because someone in your family is deaf?"

User: [Responds with boundary-setting language]

Elya: "That was really direct - I like how you acknowledged their 
curiosity while redirecting to the task. Let's try a harder one..."
```

### 3. Growth Tracker

**Role:** Observe patterns, provide insights, update competency scores

**Data Collected:**
- Module completion and performance
- Response patterns during practice
- Reflection themes over time
- Self-reported challenges and wins

**Insight Generation:**
```
Elya: "Looking at the past month, I've noticed:
- Your boundary-setting confidence has improved significantly
- You're still processing assignments longer than before (that's okay!)
- Stress mentions have decreased by 30%

Your next growth edge might be cognitive load management - 
you've mentioned feeling 'overwhelmed' in complex assignments. 
There's a module for that when you're ready."
```

### 4. Credit Manager

**Role:** Track usage, prompt upgrades, handle limits

**At Module Start:**
```
Elya: "This practice is 30 minutes (1 credit). You have 2 credits 
remaining this month. Want to continue?"
```

**At Credit Depletion:**
```
Elya: "You've used all 4 credits this month - amazing engagement! 
Your credits reset on January 6th. 

If you'd like to keep going, top-up credits start at $5 for 
2 credits (1 hour of content). Want to add some?"
```

**Near Reset (Nudge):**
```
Elya: "Heads up - you have 2 unused credits that reset in 3 days. 
I'd recommend the Cognitive Reset Technique practice based on 
your recent reflections. It's 15 minutes. Want to use a credit?"
```

## Elya Conversation Modes

| Mode | Credits | Purpose |
|------|---------|---------|
| Free Chat | 0 | General support, wellness check-in |
| Reflection | 0 | Processing assignments, journaling |
| Module Delivery | Per module | Guided skill practice |
| Recommendation | 0 | Suggesting relevant modules |

---

# 7. USER FLOWS

## Flow 1: New User Signup → First CEU

```
1. User signs up (Basic - free)
   └─> Onboarding: Name, role, experience level

2. Elya introduction conversation (free)
   └─> "Tell me about your interpreting work..."
   └─> Collects: domains, challenges, goals

3. Elya suggests Pro upgrade
   └─> "Based on what you shared, I have skill practices that 
        could help with [specific challenge]. Pro members get 
        CEU content. Want to try it for $30/month?"

4. User upgrades to Pro
   └─> Stripe checkout
   └─> 4 credits available immediately

5. First module recommendation
   └─> Elya: "Let's start with [relevant module]. It's 15 minutes."
   └─> User completes module
   └─> Credit deducted, progress tracked

6. Post-module debrief (free)
   └─> Elya processes experience, updates growth profile
   
7. CEU accumulates toward certificate
```

## Flow 2: Pro User Monthly Cycle

```
Day 1 (Billing Date):
└─> Credits reset to 4
└─> Email: "Your credits have refreshed!"

Day 1-25:
└─> User completes reflections (free)
└─> Elya recommends modules based on patterns
└─> User completes 2-4 modules (1-4 credits)

Day 25 (Nudge):
└─> If credits_remaining > 0:
    └─> Elya: "You have [X] credits expiring in 5 days..."

Day 28 (Urgent):
└─> If credits_remaining > 0:
    └─> Email: "Last chance! [X] credits expire in 2 days"

Day 30 (Reset):
└─> Unused credits expire
└─> New credits granted
└─> Cycle repeats
```

## Flow 3: Module Completion → CEU Certificate

```
1. User completes enough modules for CEU threshold
   └─> Minimum: 2 activities × 0.025 = 0.05 CEU (RID minimum)
   └─> Or: 1 activity × 0.05 = 0.05 CEU
   └─> Or: 1 Deep Dive × 0.1 = 0.1 CEU

2. System checks certificate eligibility
   └─> Has user provided RID Member #? 
   └─> If no: Prompt to add for certificate

3. Certificate generated
   └─> PDF created with all required fields
   └─> Stored in user's account
   └─> Download link provided

4. RID reporting queued
   └─> Activity report data compiled
   └─> Submitted to RID within 45 days
   └─> CEUs appear in member account within 60 days
```

## Flow 4: Top-Up Purchase

```
1. User attempts module with 0 credits remaining
   └─> Elya: "You're out of credits this month. Want to top up?"

2. User views top-up options
   └─> Small (2 credits) - $5
   └─> Medium (4 credits) - $8
   └─> Large (8 credits) - $14

3. User selects and purchases
   └─> Stripe one-time charge
   └─> Credits added to topup_balance immediately

4. Module continues
   └─> Uses topup credit
   └─> Elya: "Great! You now have [X] top-up credits remaining."
```

---

# 8. DATABASE SCHEMA

## Users Table (Additions)

```sql
ALTER TABLE users ADD COLUMN (
  -- RID Information
  rid_member_number VARCHAR(20),
  rid_certification_expiry DATE,
  rid_cycle_start DATE,
  rid_cycle_end DATE,
  
  -- Location (required for CEU)
  city VARCHAR(100),
  state VARCHAR(50),
  
  -- Credit Tracking
  monthly_credits_total INT DEFAULT 0,  -- 0 for Basic, 4 for Pro
  monthly_credits_used INT DEFAULT 0,
  topup_credits_balance INT DEFAULT 0,
  credits_reset_date TIMESTAMP,
  
  -- Subscription
  subscription_tier ENUM('basic', 'pro') DEFAULT 'basic',
  subscription_status ENUM('active', 'cancelled', 'past_due'),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  -- CEU Preferences
  ceu_goal_annual DECIMAL(3,1) DEFAULT 2.0,
  preferred_content_areas JSON,  -- ['PS', 'GS', 'PPO']
  
  -- Competency Profile
  competency_scores JSON
  -- Format: {"ei": 0.75, "cultural": 0.42, "cognitive": 0.55, "professional": 0.65, "wellness": 0.28}
);
```

## Modules Table

```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY,
  
  -- Identity
  module_code VARCHAR(20) UNIQUE NOT NULL,  -- e.g., 'TV-001', 'SP-003'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Classification
  module_type ENUM('theory_video', 'quick_practice', 'standard_practice', 'deep_dive') NOT NULL,
  content_area ENUM('PS', 'GS') DEFAULT 'PS',
  sub_category VARCHAR(50),  -- 'PPO', 'Studies of Healthy Minds', etc.
  knowledge_level ENUM('little_none', 'some', 'extensive') DEFAULT 'some',
  
  -- Credit/CEU
  credits_cost DECIMAL(2,1) NOT NULL,  -- 0.5, 1.0, 2.0
  ceu_value DECIMAL(4,3) NOT NULL,  -- 0.025, 0.05, 0.1
  duration_minutes INT NOT NULL,
  
  -- Content
  video_url VARCHAR(500),  -- MUX or Vimeo URL
  elya_script_id VARCHAR(100),  -- Reference to Elya practice script
  
  -- Learning Objectives (RID required)
  learning_objectives JSON,  -- Array of 3-5 objectives
  
  -- Competency Tags
  competency_tags JSON,  -- {"ei": 0.3, "wellness": 0.5, "professional": 0.2}
  
  -- Elya Triggers
  elya_trigger_keywords JSON,  -- ["stress", "overwhelmed", "anxious"]
  elya_trigger_patterns JSON,  -- Complex pattern definitions
  
  -- Metadata
  presenter VARCHAR(255) DEFAULT 'Sarah Wheeler, MA',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  sort_order INT
);
```

## Module Completions Table

```sql
CREATE TABLE module_completions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  module_id UUID REFERENCES modules(id),
  
  -- Completion Data
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration_actual_seconds INT,  -- Actual time spent
  
  -- Credit Tracking
  credits_charged DECIMAL(2,1),
  credit_source ENUM('monthly', 'topup'),
  
  -- Performance (for practices)
  performance_data JSON,  -- Elya's assessment data
  elya_feedback TEXT,  -- Summary feedback from Elya
  
  -- CEU Status
  ceu_credited BOOLEAN DEFAULT false,
  certificate_id UUID REFERENCES certificates(id),
  
  -- Status
  status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress'
);
```

## Certificates Table

```sql
CREATE TABLE certificates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  
  -- Certificate Identity
  certificate_number VARCHAR(50) UNIQUE NOT NULL,  -- UUID or formatted number
  
  -- Content
  title VARCHAR(255) NOT NULL,  -- Module title or "Multiple Activities"
  
  -- CEU Details
  ceu_value DECIMAL(3,2) NOT NULL,
  content_area ENUM('PS', 'GS') NOT NULL,
  sub_category VARCHAR(50),
  knowledge_level ENUM('little_none', 'some', 'extensive'),
  
  -- Learning Objectives
  learning_objectives JSON NOT NULL,
  
  -- Modules Included
  module_completion_ids JSON,  -- Array of completion IDs
  
  -- User Info (snapshot at time of certificate)
  participant_name VARCHAR(255) NOT NULL,
  rid_member_number VARCHAR(20),
  
  -- Dates
  completion_date DATE NOT NULL,
  issued_at TIMESTAMP DEFAULT NOW(),
  
  -- Document
  pdf_url VARCHAR(500),
  
  -- RID Reporting
  rid_reported BOOLEAN DEFAULT false,
  rid_reported_at TIMESTAMP,
  rid_report_batch_id VARCHAR(100)
);
```

## Credit Transactions Table

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  
  -- Transaction Details
  transaction_type ENUM('monthly_grant', 'monthly_use', 'monthly_expire', 'topup_purchase', 'topup_use'),
  credits_amount DECIMAL(2,1) NOT NULL,  -- Positive for grants, negative for usage
  
  -- Context
  module_completion_id UUID REFERENCES module_completions(id),
  stripe_payment_id VARCHAR(255),  -- For purchases
  
  -- Balances After Transaction
  monthly_balance_after INT,
  topup_balance_after INT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);
```

## Competency Tracking Table

```sql
CREATE TABLE competency_updates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  
  -- Competency Area
  competency_area ENUM('ei', 'cultural', 'cognitive', 'professional', 'wellness'),
  
  -- Score Change
  previous_score DECIMAL(3,2),
  new_score DECIMAL(3,2),
  change_reason TEXT,  -- "Completed SP-001", "Pattern detected in reflections"
  
  -- Source
  source_type ENUM('module_completion', 'elya_assessment', 'self_assessment'),
  source_id UUID,  -- module_completion_id or assessment_id
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

# 9. CERTIFICATE SYSTEM

## Certificate Template

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                    CERTIFICATE OF COMPLETION                      │
│                                                                   │
│  Building Bridges Global LLC                                      │
│  RID CMP Approved Sponsor #2309                                   │
│                                                                   │
│  This certifies that                                              │
│                                                                   │
│                     {PARTICIPANT_NAME}                            │
│                     RID Member #{RID_NUMBER}                      │
│                                                                   │
│  has successfully completed                                       │
│                                                                   │
│               {MODULE_TITLE}                                      │
│                                                                   │
│  Date Completed: {COMPLETION_DATE}                                │
│  CEUs Earned: {CEU_VALUE} | Content Area: {CONTENT_AREA}         │
│  Content Knowledge Level: {KNOWLEDGE_LEVEL}                       │
│                                                                   │
│  Learning Objectives:                                             │
│  • {OBJECTIVE_1}                                                  │
│  • {OBJECTIVE_2}                                                  │
│  • {OBJECTIVE_3}                                                  │
│  • {OBJECTIVE_4}                                                  │
│  • {OBJECTIVE_5}                                                  │
│                                                                   │
│  Presenter: Sarah Wheeler, MA                                     │
│  Completion verified by InterpretReflect platform                 │
│  Certificate ID: {CERTIFICATE_NUMBER}                             │
│                                                                   │
│  {SIGNATURE_IMAGE}                                                │
│  Sarah Wheeler, MA                                                │
│  Founder, Building Bridges Global LLC                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Certificate Generation Rules

1. **Minimum CEU:** 0.05 (RID minimum)
2. **Grouping:** Multiple 0.025 activities can be grouped into single certificate
3. **RID Number:** Required field - prompt user if missing
4. **PDF Generation:** Use library like PDFKit or Puppeteer
5. **Storage:** Save to user's account, cloud storage for PDF

## Certificate Triggers

| Trigger | Certificate Type |
|---------|------------------|
| Complete 1 Deep Dive (0.1 CEU) | Individual module certificate |
| Complete 1 Standard Practice (0.05 CEU) | Individual module certificate |
| Complete 2 Quick/Theory (0.025 × 2) | Combined certificate (0.05 CEU) |
| Complete Learning Path | Path completion certificate |

---

# 10. RID COMPLIANCE

## Required Documentation Per Module

### Activity Plan (Internal)

```yaml
module_code: "SP-001"
title: "Boundary Role-Play Scenarios"
educational_objectives:
  - "Identify three types of professional boundaries in interpreting settings"
  - "Demonstrate assertive language techniques for boundary-setting"
  - "Apply the DECIDE framework to boundary-related ethical dilemmas"
  - "Practice recovery strategies when boundaries are crossed"
  - "Develop personalized boundary scripts for common scenarios"
content_area: "PS"
sub_category: "Studies of Healthy Minds and Bodies"
ceu_value: 0.05
duration: "30 minutes"
target_audience: "Practicing ASL interpreters seeking to strengthen boundary-setting skills"
knowledge_level: "Some"
presenter: "Sarah Wheeler, MA"
presenter_credentials: "20+ years interpreting experience, MA Interpreter Pedagogy, MA Psychology"
assessment_method: "Interactive practice with AI-guided feedback and scenario completion"
```

### Promotional Page (Public)

Must include all 12 RID-required elements:

1. ✅ Sponsor statement with approval language
2. ✅ Educational objectives
3. ✅ Target audience
4. ✅ CEU value and content area
5. ✅ Cancellation policy
6. ✅ Refund policy
7. ✅ Accommodations statement
8. ✅ Non-discrimination statement
9. ✅ Instructor name/credentials
10. ✅ Duration information
11. ✅ Access information
12. ✅ Contact information

### Standard Policy Statements

**Sponsor Statement:**
```
Building Bridges Global LLC is approved by RID CMP to sponsor 
continuing education activities. This program is offered for 
{CEU_VALUE} CEUs in {CONTENT_AREA}. Participants should have 
{KNOWLEDGE_LEVEL} prior knowledge of the topic.

RID CMP Sponsor #2309
```

**Cancellation Policy:**
```
Self-paced content is available 24/7. Pro subscriptions may be 
cancelled at any time; access continues until end of billing period.
```

**Refund Policy:**
```
Full refund within 7 days of Pro subscription if no CEU modules 
completed. Top-up credits are non-refundable. Contact 
support@interpretreflect.com for refund requests.
```

**Accommodations Statement:**
```
InterpretReflect is committed to accessible learning. All video 
content includes captions. For additional accommodations, contact 
support@interpretreflect.com at least 7 days before planned use.
```

**Non-Discrimination Statement:**
```
Building Bridges Global LLC and InterpretReflect welcome learners 
of all backgrounds, identities, and experience levels. We foster 
an inclusive learning environment free from discrimination.
```

---

# 11. DASHBOARD & ANALYTICS

## User Dashboard: CEU Progress

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR CEU PROGRESS                              December 2025    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  This Month                                                      │
│  ══════════                                                      │
│  Credits: ██████░░░░░░ 2.5 of 4 remaining                       │
│  CEUs Earned: 0.075                                              │
│  [Top Up Credits]                                                │
│                                                                  │
│  This Certification Cycle (2024-2028)                           │
│  ════════════════════════════════════                           │
│  CEUs Earned: 2.4 of 8.0 required                               │
│  ████████████░░░░░░░░░░░░░░░░░░ 30%                             │
│  On track: ✓ (2.0/year pace needed, you're at 2.4)             │
│                                                                  │
│  By Content Area                                                 │
│  ═══════════════                                                │
│  Professional Studies: 2.2 CEUs                                  │
│  General Studies: 0.2 CEUs                                       │
│  PPO Sub-category: 0.0 CEUs                                      │
│                                                                  │
│  Recent Certificates                                             │
│  ══════════════════                                             │
│  • Boundary Role-Play Scenarios (0.05 PS) - Dec 4               │
│  • EI Foundations + BREATHE Protocol (0.05 PS) - Nov 28         │
│  [View All Certificates]                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## User Dashboard: Growth Profile

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR GROWTH WITH ELYA                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Competency Profile                                              │
│  ══════════════════                                             │
│  Emotional Intelligence  ████████████░░░░ 78% (+12% this month) │
│  Professional Boundaries ██████████░░░░░░ 65% (+8%)             │
│  Cognitive Performance   ██████░░░░░░░░░░ 42%                   │
│  Wellness & Resilience   █████░░░░░░░░░░░ 35% (+5%)             │
│  Cultural Competence     ████░░░░░░░░░░░░ 28%                   │
│                                                                  │
│  Elya's Observations                                            │
│  ═══════════════════                                            │
│  "You've made real progress on boundaries this month. I've      │
│   noticed you're using more direct language in our role-plays.  │
│   Your stress mentions have decreased 30% since you started     │
│   the BREATHE practices.                                        │
│                                                                  │
│   Suggested focus: Your cognitive load management could use     │
│   some attention - you've mentioned overwhelm in complex        │
│   assignments several times."                                   │
│                                                                  │
│  Recent Wins 🎉                                                  │
│  ════════════                                                   │
│  • 3 boundary practices completed this month                     │
│  • Stress mentions down 30%                                      │
│  • First Deep Dive completed!                                    │
│                                                                  │
│  Recommended Next                                                │
│  ════════════════                                                │
│  → Cognitive Load Management (Standard Practice, 1 credit)       │
│  → The Interpreter Brain (Theory Video, 0.5 credits)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Admin Analytics (For Sarah)

```
Platform Metrics - December 2025
════════════════════════════════

Users
  Total: 2,450
  Basic: 1,950 (80%)
  Pro: 500 (20%)
  New this month: 125
  Churned this month: 18
  
Revenue
  MRR: $15,000
  Top-ups this month: $1,240
  Avg revenue per Pro user: $32.48
  
Engagement
  Modules completed: 1,847
  Credits used: 1,623 of 2,000 granted (81%)
  Avg modules per Pro user: 3.7
  Most popular: SP-001 Boundary Role-Play (312 completions)
  
Certificates
  Issued this month: 892
  Total CEUs awarded: 58.4
  Pending RID submission: 156
  
Elya Conversations
  Total this month: 12,450
  Avg per user: 5.1
  Free reflections: 8,200
  Module-guided: 4,250
  
Conversion
  Basic → Pro: 4.2%
  Free trial → Paid: 18%
  Top-up purchase rate: 8% of Pro users
```

---

# 12. STRIPE INTEGRATION

## Products to Create

```javascript
// Stripe Products Configuration

const products = {
  // Subscription
  pro_monthly: {
    name: "InterpretReflect Pro",
    description: "Unlimited Elya + 4 CEU credits/month",
    price: 3000, // $30.00
    currency: "usd",
    interval: "month",
    metadata: {
      tier: "pro",
      credits_monthly: 4
    }
  },
  
  // Top-Up Products (one-time)
  topup_small: {
    name: "Credit Top-Up: Small",
    description: "2 additional CEU credits",
    price: 500, // $5.00
    currency: "usd",
    metadata: {
      credits: 2,
      type: "topup"
    }
  },
  
  topup_medium: {
    name: "Credit Top-Up: Medium",
    description: "4 additional CEU credits",
    price: 800, // $8.00
    currency: "usd",
    metadata: {
      credits: 4,
      type: "topup"
    }
  },
  
  topup_large: {
    name: "Credit Top-Up: Large",
    description: "8 additional CEU credits",
    price: 1400, // $14.00
    currency: "usd",
    metadata: {
      credits: 8,
      type: "topup"
    }
  }
};
```

## Webhook Handlers

```javascript
// Stripe Webhook Events to Handle

// 1. New Pro subscription
'customer.subscription.created': async (event) => {
  const subscription = event.data.object;
  const userId = subscription.metadata.user_id;
  
  await db.users.update(userId, {
    subscription_tier: 'pro',
    subscription_status: 'active',
    stripe_subscription_id: subscription.id,
    monthly_credits_total: 4,
    monthly_credits_used: 0,
    credits_reset_date: new Date(subscription.current_period_end * 1000)
  });
  
  await createCreditTransaction(userId, 'monthly_grant', 4);
  await sendEmail(userId, 'welcome_to_pro');
};

// 2. Subscription renewed (monthly)
'invoice.payment_succeeded': async (event) => {
  const invoice = event.data.object;
  if (invoice.subscription) {
    const userId = await getUserByStripeCustomer(invoice.customer);
    
    // Expire unused monthly credits
    const user = await db.users.findById(userId);
    if (user.monthly_credits_used < user.monthly_credits_total) {
      const unused = user.monthly_credits_total - user.monthly_credits_used;
      await createCreditTransaction(userId, 'monthly_expire', -unused);
    }
    
    // Reset credits
    await db.users.update(userId, {
      monthly_credits_used: 0,
      credits_reset_date: new Date(invoice.lines.data[0].period.end * 1000)
    });
    
    await createCreditTransaction(userId, 'monthly_grant', 4);
    await sendEmail(userId, 'credits_refreshed');
  }
};

// 3. Subscription cancelled
'customer.subscription.deleted': async (event) => {
  const subscription = event.data.object;
  const userId = subscription.metadata.user_id;
  
  await db.users.update(userId, {
    subscription_tier: 'basic',
    subscription_status: 'cancelled',
    monthly_credits_total: 0
    // Keep topup_credits_balance - they paid for those
  });
  
  await sendEmail(userId, 'subscription_cancelled');
};

// 4. Top-up purchase
'checkout.session.completed': async (event) => {
  const session = event.data.object;
  if (session.metadata.type === 'topup') {
    const userId = session.metadata.user_id;
    const credits = parseInt(session.metadata.credits);
    
    await db.users.increment(userId, 'topup_credits_balance', credits);
    await createCreditTransaction(userId, 'topup_purchase', credits, {
      stripe_payment_id: session.payment_intent
    });
  }
};

// 5. Payment failed
'invoice.payment_failed': async (event) => {
  const invoice = event.data.object;
  const userId = await getUserByStripeCustomer(invoice.customer);
  
  await db.users.update(userId, {
    subscription_status: 'past_due'
  });
  
  await sendEmail(userId, 'payment_failed');
};
```

---

# 13. IMPLEMENTATION PHASES

## Phase 1: MVP (Weeks 1-4)

### Week 1: Foundation
- [ ] Update database schema
- [ ] Create Stripe products
- [ ] Implement credit tracking system
- [ ] Build credit transaction logging

### Week 2: Content Infrastructure
- [ ] Create modules table and CRUD
- [ ] Build module catalog UI
- [ ] Record 2 theory videos (TV-001, TV-002)
- [ ] Create Elya scripts for 2 Quick Practices (QP-001, QP-002)

### Week 3: User Flows
- [ ] Implement Pro upgrade flow
- [ ] Build module completion tracking
- [ ] Create top-up purchase flow
- [ ] Add credit balance UI to dashboard

### Week 4: Certificates & Polish
- [ ] Build certificate generator
- [ ] Create certificate storage/download
- [ ] Add RID number collection
- [ ] Fix website pricing inconsistency
- [ ] QA and bug fixes

**MVP Launch Deliverables:**
- 2 Theory Videos
- 2 Quick Practices  
- 1 Standard Practice
- Working credit system
- Certificate generation
- Pro subscription flow

## Phase 2: Full Content Library (Weeks 5-8)

- [ ] Record remaining 6 theory videos
- [ ] Create remaining quick practices
- [ ] Build all standard practices
- [ ] Create 2 deep dive modules
- [ ] Implement Elya recommendation engine
- [ ] Build competency tracking
- [ ] Create growth dashboard

## Phase 3: Advanced Features (Weeks 9-12)

- [ ] Implement automated RID reporting
- [ ] Build agency dashboard (B2B)
- [ ] Add learning paths (grouped modules)
- [ ] Create admin analytics dashboard
- [ ] Implement email automation (nudges, reminders)
- [ ] Add community features (Phase 3+)

---

# APPENDIX A: LEARNING OBJECTIVES BY MODULE

## TV-001: What is Emotional Intelligence?

Upon completion, participants will be able to:
1. Define emotional intelligence and distinguish it from IQ and personality
2. Identify the four core components of EI (self-awareness, self-regulation, social awareness, relationship management)
3. Explain why EI is particularly critical for interpreting work
4. Recognize three ways EI impacts interpreter effectiveness
5. Assess their own EI strengths and growth areas

## TV-002: The ECCI Model Explained

Upon completion, participants will be able to:
1. Define the ECCI (Emotional and Cultural Competence in Interpreting) framework
2. Identify the four domains of the ECCI Model
3. Explain how ECCI differs from traditional interpreter competency models
4. Apply ECCI concepts to analyze an interpreted interaction
5. Identify their own ECCI development priorities

## QP-001: BREATHE Protocol

Upon completion, participants will be able to:
1. Execute the six steps of the BREATHE Protocol in sequence
2. Identify situations where the BREATHE Protocol is most applicable
3. Demonstrate at least one regulation technique within the protocol
4. Self-assess their stress level before and after protocol application
5. Plan for integrating BREATHE into their professional practice

## SP-001: Boundary Role-Play Scenarios

Upon completion, participants will be able to:
1. Identify three types of professional boundaries in interpreting settings
2. Demonstrate assertive language techniques for boundary-setting
3. Apply the DECIDE framework to boundary-related ethical dilemmas
4. Practice recovery strategies when boundaries are crossed
5. Develop personalized boundary scripts for common scenarios

[Additional learning objectives for all modules to be documented]

---

# APPENDIX B: ELYA TRIGGER KEYWORDS

## Stress/Overwhelm Detection
```
Keywords: stressed, overwhelmed, anxious, can't cope, too much, 
drowning, exhausted, burned out, falling apart, losing it
→ Recommend: QP-001 BREATHE Protocol
```

## Boundary Issues Detection
```
Keywords: boundary, asked me to, didn't know how to say, 
overstepped, inappropriate, uncomfortable request, pushed
→ Recommend: QP-003 Quick Boundary Script, SP-001 Boundary Role-Play
```

## Emotional Intensity Detection
```
Keywords: heavy, intense, couldn't stop thinking, still feeling, 
affected me, hard to let go, stayed with me, haunted
→ Recommend: QP-006 Post-Assignment Decompression, SP-004 VT Processing
```

## Confidence Issues Detection
```
Keywords: imposter, fraud, not good enough, failed, messed up,
incompetent, doubting myself, should I even be doing this
→ Recommend: SP-005 Confidence Building
```

## Cognitive Overload Detection
```
Keywords: couldn't keep up, lost track, blanked, brain fog,
too fast, complex, technical, couldn't process
→ Recommend: QP-005 Cognitive Reset, SP-006 Cognitive Load Management
```

---

# APPENDIX C: EMOTIONAL LITERACY FRAMEWORK

## Overview

This framework powers Elya's emotional understanding and the Emotion Labeling Drill (QP-002). It's core ECCI Model content that distinguishes InterpretReflect from generic wellness apps.

**24 Emotions Covered:** Each includes "What it might be telling you" (meaning) and "How to respond" (regulation strategy).

---

## Primary Emotions

### Anger
**What it might be telling you:**
- Something feels unfair or out of your control
- Your boundaries are being crossed
- There's a need for change or protection

**How to respond:**
- Identify the root cause of your anger
- Express your feelings in a healthy way (conversation, writing)
- Set boundaries or make changes where needed

### Sadness
**What it might be telling you:**
- You've experienced a loss or disappointment
- You need comfort or rest
- There's a need for reflection and emotional release

**How to respond:**
- Allow yourself to grieve or process
- Reach out to supportive people
- Practice self-care / give time to heal

### Fear or Anxiety
**What it might be telling you:**
- Something feels threatening or uncertain
- You may be facing a challenge or unfamiliar situation
- There's a need for safety or preparation

**How to respond:**
- Acknowledge your fears without judgment
- Assess the real risks and prepare where necessary
- Practice grounding techniques or mindfulness to calm the mind

### Joy
**What it might be telling you:**
- You're in alignment with what you value or enjoy
- Your needs are being met
- You are present and engaged in a meaningful activity

**How to respond:**
- Savor the moment and practice gratitude
- Reflect on what brought you joy and how to create more of it
- Share your happiness with others

### Guilt
**What it might be telling you:**
- You feel responsible for something that happened
- You may have acted against your values
- There's a desire to make amends or change your behavior

**How to respond:**
- Acknowledge your actions and their impact
- Apologize or make things right if needed
- Learn from the situation and strive to act in alignment with your values

### Shame
**What it might be telling you:**
- You feel flawed or unworthy in some way
- There's a fear of judgment or rejection
- You may need reassurance or self-compassion

**How to respond:**
- Challenge the negative beliefs about yourself
- Practice self-compassion and affirm your worth
- Reach out for support from trusted people

### Frustration
**What it might be telling you:**
- Things aren't going as expected or planned
- You feel stuck or blocked from achieving a goal
- There's a need for change or a new approach

**How to respond:**
- Take a step back and reassess the situation
- Break the problem down into smaller steps
- Seek help or look for alternative solutions

### Embarrassment
**What it might be telling you:**
- You feel exposed or judged in a social situation
- You've made a mistake or done something awkward
- There's a desire to fit in or be accepted

**How to respond:**
- Remember that everyone makes mistakes
- Laugh it off or acknowledge it without harsh self-criticism
- Reflect on the situation and move on without dwelling

### Disgust
**What it might be telling you:**
- Something feels wrong, repulsive, or violates your values or senses
- You want to distance yourself from a harmful situation or action
- You may need to reassess your boundaries or environment

**How to respond:**
- Identify what's causing the feeling
- Take action to protect yourself if needed
- Set boundaries or distance yourself from situations or people that trigger this emotion

### Loneliness
**What it might be telling you:**
- You're craving connection and companionship
- You may feel isolated, misunderstood, or disconnected from others
- There's a need for emotional intimacy or social interaction

**How to respond:**
- Reach out to friends, family, or support groups
- Engage in activities that bring a sense of community
- Reflect on what type of connection you're seeking and how you can foster it

### Relief
**What it might be telling you:**
- A stressful or tense situation has been resolved
- You feel safe, unburdened, or freed from anxiety
- There's a chance to relax and recover from the challenging experience

**How to respond:**
- Take time to acknowledge and appreciate the resolution
- Reflect on what helped you overcome the stress or challenge
- Use this moment to recharge and focus on self-care

### Confusion
**What it might be telling you:**
- You don't fully understand a situation
- There's a lack of clarity or direction
- You might be overwhelmed by too much information

**How to respond:**
- Take a step back and break things down
- Ask questions or seek help to gain clarity
- Give yourself time to process the information

---

## Secondary Emotions

### Resentment
**What it might be telling you:**
- You feel wronged or hurt by someone's actions
- There's unresolved anger or bitterness toward a situation or person
- You may feel that your needs or boundaries were ignored

**How to respond:**
- Reflect on whether you need to set boundaries or address the issue
- Consider having an open, honest conversation with the person involved
- Work on letting go of grudges through forgiveness or self-care

### Excitement
**What it might be telling you:**
- You're looking forward to something positive
- You feel energized by an upcoming event or opportunity
- There's a sense of anticipation or adventure

**How to respond:**
- Channel your excitement into preparation or action
- Enjoy the build-up and stay present in the moment
- Share your excitement with others to enhance the experience

### Contentment
**What it might be telling you:**
- You feel satisfied with where you are in life
- Your needs are met, and you're at peace with the present moment
- You're aligned with your values and priorities

**How to respond:**
- Savor the moment and enjoy the peace
- Reflect on what contributes to your sense of contentment
- Maintain balance and continue nurturing this state

### Empathy
**What it might be telling you:**
- You can understand and feel someone else's emotions
- There's a desire to support or connect with others
- You may feel moved to offer help or kindness

**How to respond:**
- Offer a listening ear or comfort to the person
- Practice compassionate actions or words
- Take care of your own emotional boundaries as well

### Insecurity
**What it might be telling you:**
- You feel unsure of yourself or your abilities
- There's a fear of failure, rejection, or not being good enough
- You may need reassurance or validation

**How to respond:**
- Challenge negative self-talk and focus on your strengths
- Practice self-compassion and self-affirmation
- Surround yourself with supportive people who boost your confidence

### Regret
**What it might be telling you:**
- You wish you had done something differently in the past
- There's a sense of missed opportunity or error
- You may feel guilt or disappointment in yourself

**How to respond:**
- Acknowledge the past, but avoid dwelling on it
- Learn from the experience and apply those lessons in the future
- Practice self-forgiveness and move forward with a new perspective

### Overwhelm
**What it might be telling you:**
- You're dealing with too many tasks, emotions, or responsibilities
- You feel out of control or unable to manage everything on your plate
- There's a need to slow down or prioritize

**How to respond:**
- Break tasks into smaller, manageable steps
- Prioritize what's most important and let go of less critical items
- Take a break to recharge and ask for help if needed

### Impatience
**What it might be telling you:**
- You're eager for progress or a result, but it's not happening quickly enough
- There's a frustration with delays or the slow pace of a situation
- You may need to reassess your expectations or practice patience

**How to respond:**
- Remind yourself that progress takes time and focus on the process
- Practice mindfulness or grounding techniques to stay present
- Adjust your expectations and look for things you can enjoy or appreciate in the meantime

### Vulnerability
**What it might be telling you:**
- You feel exposed or open to emotional risk
- There's a fear of judgment, rejection, or emotional pain
- You're in a position where trust or honesty is required

**How to respond:**
- Embrace vulnerability as part of growth and connection
- Communicate your feelings openly, while ensuring emotional safety
- Practice self-compassion and remind yourself that vulnerability fosters deeper connections

### Apathy
**What it might be telling you:**
- You feel disconnected or indifferent toward situations or people
- There's a lack of interest, motivation, or emotional investment
- You may be emotionally drained or need a break

**How to respond:**
- Reflect on whether this feeling comes from burnout or unmet needs
- Engage in activities that reignite your passion or interest
- Consider resting or recharging to prevent further emotional exhaustion

### Compassion
**What it might be telling you:**
- You feel empathy and a desire to help others who are suffering
- There's an instinct to provide care, understanding, or support
- You're connected to your sense of kindness and human connection

**How to respond:**
- Offer help or a listening ear to those in need
- Practice self-compassion and be gentle with yourself as well
- Engage in acts of kindness that contribute to others' well-being

### Anticipation
**What it might be telling you:**
- You're looking forward to a future event or outcome
- There's excitement or anxiety about what's to come
- You may need to prepare or stay patient as you await the future

**How to respond:**
- Channel your energy into productive preparation or planning
- Stay present and enjoy the buildup
- Balance your expectations with flexibility to manage any surprises

---

## Interpreter-Specific Applications

### Emotions Commonly Triggered in Interpreting Work

| Emotion | Common Trigger in Interpreting | ECCI Response |
|---------|-------------------------------|---------------|
| Frustration | Consumer doesn't understand role limits | Boundary module recommendation |
| Sadness | Heavy emotional content (medical, legal) | Vicarious trauma processing |
| Anxiety | High-stakes assignment approaching | Pre-assignment prep, BREATHE |
| Guilt | Felt like interpretation wasn't good enough | Confidence building, reframe |
| Overwhelm | Cognitive load exceeded capacity | Cognitive reset techniques |
| Empathy | Deep connection with consumer's situation | Boundary reminder, self-care |
| Resentment | Agency/client treatment issues | Professional boundaries, advocacy |
| Apathy | Burnout symptoms emerging | Burnout assessment, wellness plan |

### How Elya Uses This Framework

**Pattern Detection:**
```
IF user.mentions_emotion(frustration) COUNT > 3 IN last_14_days
  AND context.contains(boundary OR consumer OR client)
THEN
  elya.insight("I've noticed frustration coming up often around boundaries. 
               This might be telling you something needs to change - either 
               in how you're setting limits, or recognizing what isn't yours 
               to control.")
  elya.recommend(SP-001: Boundary Role-Play)
```

**Validation + Guidance:**
```
User: "I felt so guilty after that assignment. Like I should have done more."

Elya: "Guilt often shows up when we feel responsible for something, or when 
      we've acted against our values. In interpreting, this can get tricky - 
      sometimes we take on responsibility that isn't actually ours.
      
      Can you tell me more about what happened? I'm curious whether this is 
      about something you did, or something you couldn't control."
```

---

# APPENDIX D: ELYA EMOTIONAL RESPONSE TEMPLATES

## Response Structure

When a user expresses or identifies an emotion, Elya follows this structure:

1. **Validate** - Acknowledge the emotion without judgment
2. **Illuminate** - Share what this emotion might be telling them
3. **Explore** - Ask a curious question to deepen understanding
4. **Guide** - Offer a response strategy or module recommendation

---

## Template Examples by Emotion

### Anger Response
```
"Anger often comes up when something feels unfair or when our boundaries 
have been crossed. It's actually a protective emotion - it's trying to 
tell you something needs to change.

What specifically triggered this feeling? Was it something that happened 
in the assignment, or the situation around it?

[If pattern detected] I've noticed anger coming up in your reflections 
a few times this month. Want to explore what might be underneath it?"
```

### Overwhelm Response
```
"That sounds like a lot to carry. Overwhelm usually shows up when we're 
dealing with more than feels manageable - too many tasks, too much emotional 
weight, or too many demands at once.

What feels most pressing right now? Sometimes just naming the biggest 
thing can help create a bit of space.

[If appropriate] The Cognitive Load Management practice might help here - 
it's about creating strategies for when your brain feels maxed out. 
It's 30 minutes (1 credit). Want to try it?"
```

### Guilt Response (Interpreter-Specific)
```
"Guilt in interpreting work can be tricky. Sometimes it points to something 
real we need to address. But often, interpreters carry guilt for things 
that weren't actually their responsibility - the outcome of an appointment, 
a consumer's reaction, or systemic barriers we can't control.

Tell me more about what happened. I want to understand whether this is 
guilt about something you did, or something you couldn't change."
```

### Relief Response
```
"Relief is such a valuable signal - it tells us that something stressful 
has passed, and we can exhale. It's worth pausing to acknowledge that.

What helped you get through whatever was weighing on you? Sometimes 
understanding what worked can help us the next time we're in a tough spot.

This might be a good moment for some intentional recovery. How are you 
planning to recharge?"
```

### Apathy Response (Burnout Warning)
```
"When we start feeling disconnected or indifferent toward our work, it's 
worth paying attention. Apathy can be a sign of emotional exhaustion - 
like our system is trying to protect us by turning down the volume.

How long have you been feeling this way? Has anything changed recently 
in your workload or the types of assignments you're taking?

[If pattern detected] I'm noticing some patterns that might indicate 
early burnout. Want to do a wellness check-in together?"
```

---

## Module Recommendation Triggers

| Emotion Pattern | Recommended Module | Elya Framing |
|-----------------|-------------------|--------------|
| Anger + boundary context | SP-001 Boundary Role-Play | "Practice assertive responses" |
| Anxiety + upcoming assignment | QP-001 BREATHE Protocol | "Quick regulation before the assignment" |
| Guilt + "should have" language | SP-005 Confidence Building | "Reframe expectations of yourself" |
| Overwhelm + cognitive words | SP-006 Cognitive Load Management | "Strategies for when your brain is maxed" |
| Sadness + heavy content | SP-004 Vicarious Trauma Processing | "Process what you absorbed" |
| Frustration + repeated pattern | TV-004 Boundary Types & Functions | "Understand what's triggering this" |
| Apathy + duration > 2 weeks | Burnout Assessment + Care Plan | "Let's check in on your wellbeing" |

---

# APPENDIX E: UNFOLDING CASE STUDY FORMAT

## Overview

Deep Dive modules (2.0 credits, 0.1 CEU) use the Unfolding Case Study format - adapted from nursing education for interpreter training. This creates active, decision-based learning rather than passive content consumption.

## Structure Template

```
MODULE: [Title]
FORMAT: Unfolding Case Study
DURATION: 45-60 minutes
CREDITS: 2.0
CEU: 0.1
CONTENT AREA: [PS/GS]

═══════════════════════════════════════════════════════════════

SCENARIO OVERVIEW
─────────────────
[Brief description of the interpreting context]
[Domain: Medical/Legal/Educational/VRS/Mental Health]
[Complexity level: Standard/Complex/High-stakes]

═══════════════════════════════════════════════════════════════

STAGE 1: [TIME] - [Title]
─────────────────────────

**Situation:**
[What the interpreter encounters]

**Assessment Data:**
- Assignment type: [details]
- Consumer info: [relevant details]
- Setting: [environment description]
- Your state: [interpreter's current condition]

**Elya Asks:**
1. [Decision point question]
2. [Application question]
3. [Self-awareness question]

**User Response:** [Text/voice input]

**Elya Feedback:** [Validation + teaching point]

═══════════════════════════════════════════════════════════════

STAGE 2: [TIME] - [Title]
─────────────────────────

[Scenario evolves based on realistic progression]

**New Development:**
[What changes or escalates]

**Assessment Data:**
[Updated information]

**Elya Asks:**
1. [New decision point]
2. [Ethical consideration]
3. [Emotional awareness check]

**User Response:** [Text/voice input]

**Elya Feedback:** [Framework application - DECIDE, ECCI, etc.]

═══════════════════════════════════════════════════════════════

STAGE 3: [TIME] - [Title]
─────────────────────────

[Critical moment or climax of scenario]

**The Challenge:**
[Most difficult moment - where skills are truly tested]

**Elya Asks:**
1. [In-the-moment decision]
2. [Boundary navigation]
3. [Emotional regulation check]

**User Response:** [Text/voice input]

**Elya Feedback:** [Real-time coaching, alternative approaches]

═══════════════════════════════════════════════════════════════

STAGE 4: [TIME] - Debrief
─────────────────────────

**Elya Processing:**
- "Let's walk through what happened..."
- Review of key decision points
- What went well
- What could be approached differently
- Emotional processing of the scenario
- Connection to real-world application

**Growth Tracking:**
- Competencies demonstrated
- Areas for continued development
- Pattern connections to user's history

**Learning Objectives Confirmed:**
1. [Objective 1 - demonstrated through Stage X response]
2. [Objective 2 - demonstrated through Stage Y response]
3. [Objective 3 - demonstrated through debrief reflection]

═══════════════════════════════════════════════════════════════

CERTIFICATE DATA
────────────────
Title: [Module title]
CEU: 0.1
Content Area: PS
Sub-category: [If PPO applicable]
Knowledge Level: [Little/Some/Extensive]
Learning Objectives: [List all 3-5]
```

---

## Sample Case Studies to Develop

| ID | Title | Domain | Key Learning | Emotional Core |
|----|-------|--------|--------------|----------------|
| DD-005 | The Difficult Diagnosis | Medical/Oncology | Boundaries, role-space | Sadness, empathy management |
| DD-006 | The Hostile Deposition | Legal | Neutrality under pressure | Frustration, anxiety |
| DD-007 | The IEP Breakdown | Educational | De-escalation, advocacy limits | Overwhelm, guilt |
| DD-008 | The Crisis Call | VRS | Emergency protocols, self-care | Fear, vicarious trauma |
| DD-009 | The Therapy Session | Mental Health | Trauma exposure, boundaries | Empathy, vulnerability |
| DD-010 | The Family Conflict | Community | Neutrality, cultural navigation | Frustration, discomfort |

---

# APPENDIX F: JOURNAL & INSIGHTS SYSTEM

## Overview

The Journal & Insights system is the heart of user retention and conversion. It creates:
- **Switching costs:** Months of conversation history = valuable asset
- **Value demonstration:** Pattern detection shows AI actually understands user
- **Conversion trigger:** "Unlock Insights" becomes the $15/month moment

## User Experience Architecture

### FREE User View

```
┌─────────────────────────────────────────────────────────────┐
│  REFLECT (Elya Conversations)                               │
│  └── Chat with Elya (5 free/month)                          │
│  └── After chat: "How did this feel?" 😤😢😐😊🌟             │
│  └── AI generates title automatically                        │
├─────────────────────────────────────────────────────────────┤
│  MY JOURNAL                                                  │
│  └── Chronological list of all reflections                  │
│  └── Tap to re-read any conversation                        │
│  └── Simple calendar (dots = reflected days)                │
│  └── Search by date                                         │
│  └── [🔒 Unlock Insights → Upgrade to Growth]               │
├─────────────────────────────────────────────────────────────┤
│  SETTINGS                                                    │
│  └── Dark/Light mode toggle                                 │
│  └── Profile                                                │
│  └── Notification preferences                               │
└─────────────────────────────────────────────────────────────┘
```

### GROWTH/PRO User View

```
┌─────────────────────────────────────────────────────────────┐
│  MY JOURNAL (Enhanced)                                       │
│  ├── Everything in Free, PLUS:                              │
│  ├── Mood heatmap calendar (color-coded by emotion)         │
│  ├── Filter by sentiment (Difficult | Joyful | Neutral)     │
│  ├── AI-generated tags on each entry                        │
│  └── Tag cloud with frequency visualization                 │
├─────────────────────────────────────────────────────────────┤
│  INSIGHTS DASHBOARD                                          │
│  ├── "Your patterns this month..."                          │
│  ├── Key themes detected                                    │
│  ├── Emotional trends over time (graph)                     │
│  ├── Forward-looking suggestions                            │
│  └── [PRO only] Growth profile (ECCI competencies)          │
├─────────────────────────────────────────────────────────────┤
│  CEU LIBRARY (PRO only)                                      │
│  └── [All module content and certificates]                  │
└─────────────────────────────────────────────────────────────┘
```

## Feature Specifications

### 1. Conversation History (FREE)

**Display:**
- Chronological list, newest first
- Each entry shows: AI-generated title, date, mood emoji
- Tap to expand full conversation
- Read-only (cannot edit past conversations)

**Data Retained:**
- 12 months rolling (with account)
- Unlimited history for paid tiers
- Deleted only on account deletion

### 2. AI-Generated Titles (FREE)

**Generation Logic:**
```
On conversation completion:
1. Analyze full conversation
2. Identify: primary topic, key emotion, setting (if mentioned)
3. Generate title: "[Emotion] + [Topic/Context]"
4. Examples:
   - "Processing a Tough Medical Appointment"
   - "Boundaries with a Demanding Client"
   - "Celebrating a Connection Moment"
   - "Overwhelmed Before IEP Meeting"
```

**Technical Implementation:**
- Run title generation async after conversation ends
- Store in `conversations.ai_title` field
- Allow user to edit title (optional, future)

### 3. Mood Picker (FREE basic / GROWTH enhanced)

**After each conversation, Elya asks:**
"Before we wrap up, how did this reflection feel?"

**FREE Version:**
```
😤 Difficult  😢 Heavy  😐 Neutral  😊 Good  🌟 Great
```
Stored as: `mood_rating: 1-5`

**GROWTH/PRO Version:**
Same picker, but also:
- AI detects secondary emotions from conversation
- Tags stored: `["frustrated", "relieved", "boundary_challenge"]`
- Powers insights and filtering

### 4. Calendar View (FREE basic / GROWTH enhanced)

**FREE Version:**
```
┌──────────────────────────────────────┐
│  DECEMBER 2025                       │
├──────────────────────────────────────┤
│  S   M   T   W   T   F   S           │
│      1   2   3   4   5   6           │
│      •       •       •   •           │
│  7   8   9  10  11  12  13           │
│  •   •               •               │
│ 14  15  16  17  18  19  20           │
│      •   •                           │
└──────────────────────────────────────┘
• = Reflection recorded that day
```

**GROWTH/PRO Version:**
```
┌──────────────────────────────────────┐
│  DECEMBER 2025                       │
├──────────────────────────────────────┤
│  S   M   T   W   T   F   S           │
│      1   2   3   4   5   6           │
│      🟡      🔴      🟢  🟢           │
│  7   8   9  10  11  12  13           │
│  🔴 🟡              🟢               │
│ 14  15  16  17  18  19  20           │
│      🟢  🟡                           │
└──────────────────────────────────────┘
🔴 = Difficult (mood 1-2)
🟡 = Neutral (mood 3)
🟢 = Positive (mood 4-5)

Tap any day to see entries
```

### 5. AI Tagging (GROWTH/PRO only)

**Auto-Tag Categories:**

| Category | Example Tags |
|----------|--------------|
| Settings | Medical, Legal, Educational, VRS, Mental Health, Community |
| Emotions | Frustrated, Anxious, Relieved, Proud, Overwhelmed, Conflicted |
| Skills | Boundary-setting, Self-advocacy, Emotional regulation, Role clarity |
| Themes | Power dynamics, Vicarious trauma, Team interpreting, Consumer conflict |
| ECCI Areas | Self-awareness, Regulation, Empathy, Cultural navigation |

**Display:**
- Tags shown as pills under conversation title
- Tappable to filter all entries with that tag
- Tag cloud shows frequency (word size = occurrence count)

### 6. Insights Dashboard (GROWTH/PRO only)

**Components:**

**a) Pattern Summary Card**
```
┌─────────────────────────────────────────────┐
│  📊 YOUR PATTERNS THIS MONTH                │
├─────────────────────────────────────────────┤
│  You reflected 12 times in December         │
│                                             │
│  Most common theme: Boundary challenges     │
│  Most common setting: Medical               │
│  Emotional trend: ↗️ Improving               │
│                                             │
│  "You tend to feel overwhelmed on Mondays   │
│   after weekend VRS shifts."                │
└─────────────────────────────────────────────┘
```

**b) Emotional Trend Graph**
```
Mood over time (last 30 days)
   5 |         🟢     🟢
   4 |    🟢        🟢   🟢 🟢
   3 | 🟡   🟡 🟡
   2 |                         🔴
   1 |
     └────────────────────────────→
       Dec 1                    Dec 20
```

**c) Theme Breakdown**
```
Top Themes (30 days):
████████████ Boundaries (8)
████████ Emotional regulation (5)
█████ Vicarious trauma (3)
███ Team dynamics (2)
```

**d) Forward-Looking Suggestions**
```
💡 BASED ON YOUR PATTERNS:
- You have a medical assignment tomorrow. 
  Consider reviewing boundary strategies.
- Your last 3 Mondays were difficult.
  Extra self-care this weekend?
- You haven't reflected on [specific topic] 
  in 2 weeks. Check in with yourself?
```

### 7. Sentiment Filtering (GROWTH/PRO only)

**Filter Options:**
- Show All
- Difficult (mood 1-2)
- Neutral (mood 3)
- Positive (mood 4-5)
- By Tag (dropdown)
- By Date Range

**Implementation:**
```sql
-- Example query for "Difficult" filter
SELECT * FROM conversations 
WHERE user_id = ? 
AND mood_rating IN (1, 2)
ORDER BY created_at DESC;
```

## Database Schema Additions

```sql
-- Extend conversations table
ALTER TABLE conversations ADD COLUMN ai_title VARCHAR(255);
ALTER TABLE conversations ADD COLUMN mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5);
ALTER TABLE conversations ADD COLUMN mood_emoji VARCHAR(10);
ALTER TABLE conversations ADD COLUMN ai_detected_emotions JSONB;
ALTER TABLE conversations ADD COLUMN ai_tags JSONB;
ALTER TABLE conversations ADD COLUMN setting_type VARCHAR(50);

-- New table: user_insights (regenerated periodically)
CREATE TABLE user_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    insight_type VARCHAR(50), -- 'monthly_summary', 'pattern', 'suggestion'
    insight_data JSONB,
    generated_at TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    UNIQUE(user_id, insight_type)
);

-- New table: conversation_tags (for querying)
CREATE TABLE conversation_tags (
    conversation_id UUID REFERENCES conversations(id),
    tag VARCHAR(100),
    tag_category VARCHAR(50),
    confidence DECIMAL(3,2),
    PRIMARY KEY (conversation_id, tag)
);

-- Index for fast filtering
CREATE INDEX idx_conversations_mood ON conversations(user_id, mood_rating);
CREATE INDEX idx_conversations_created ON conversations(user_id, created_at DESC);
CREATE INDEX idx_tags_tag ON conversation_tags(tag);
```

## Insight Generation Logic

**Daily Job (2 AM):**
```python
def generate_user_insights(user_id):
    # Get last 30 days of conversations
    conversations = get_recent_conversations(user_id, days=30)
    
    # Calculate patterns
    patterns = {
        'total_reflections': len(conversations),
        'mood_average': avg([c.mood_rating for c in conversations]),
        'mood_trend': calculate_trend(conversations),
        'top_themes': count_tags(conversations, category='theme'),
        'top_settings': count_tags(conversations, category='setting'),
        'day_of_week_patterns': analyze_by_day(conversations),
        'emotional_patterns': detect_emotional_patterns(conversations)
    }
    
    # Generate forward-looking suggestions
    suggestions = generate_suggestions(patterns, user_id)
    
    # Store in user_insights table
    upsert_insights(user_id, patterns, suggestions)
```

**On Conversation Complete:**
```python
def post_conversation_processing(conversation_id):
    conversation = get_conversation(conversation_id)
    
    # Generate title
    title = generate_ai_title(conversation.messages)
    
    # Detect emotions and themes
    emotions = detect_emotions(conversation.messages)
    tags = generate_tags(conversation.messages)
    
    # Update conversation
    update_conversation(conversation_id, {
        'ai_title': title,
        'ai_detected_emotions': emotions,
        'ai_tags': tags
    })
    
    # Insert into conversation_tags for querying
    for tag in tags:
        insert_conversation_tag(conversation_id, tag)
```

## Deferred Features (Phase 2)

### Photo/Snapshot Ingestion
- Upload handwritten prep notes
- OCR processing
- Link to conversation
- **Deferred because:** High complexity, medium value, most users will talk to Elya directly

### AI Collages
- Visual representation of month's reflections
- Generated artwork from themes
- **Deferred because:** Cool but doesn't serve job-to-be-done; users want understanding, not art

### Multi-Year Views
- 3-year historical heatmap
- Long-term trend analysis
- **Deferred because:** Build 12-month first, expand when user base matures

---

# APPENDIX G: ADMIN PORTAL (RID COMPLIANCE)

## Overview

As RID CEU Sponsor #2309, InterpretReflect must maintain comprehensive records for:
- Audit compliance
- Grievance handling
- Certificate verification
- Activity reporting

The Admin Portal is a **separate login** for Sarah/Maddox/designated staff to manage all compliance functions.

## Access Control

```
Admin Portal URL: admin.interpretreflect.com

Roles:
- SUPER_ADMIN (Sarah, Maddox): Full access
- COMPLIANCE_ADMIN: Audit, certificates, grievances
- SUPPORT_ADMIN: User issues, certificate reissue
- VIEWER: Read-only access for auditors
```

## Core Functions

### 1. Certificate Management

**View:**
- All issued certificates (searchable)
- By user, by date, by module
- Certificate status (valid, revoked)

**Actions:**
- Verify certificate authenticity (by certificate ID)
- Reissue certificate (user request)
- Revoke certificate (fraud, grievance outcome)
- Bulk export for RID reporting

**Data Displayed:**
```
Certificate #: IR-2025-001234
User: Jane Doe (RID #12345)
Module: EM-001 Understanding Your Emotional Dashboard
CEU Value: 0.05
Content Area: PS
Completed: December 6, 2025, 3:45 PM EST
Status: Valid
Verification URL: interpretreflect.com/verify/IR-2025-001234
```

### 2. Activity Reporting

**Standard Reports:**
- CEUs issued by month
- Certificates issued by module
- Completion rates by module
- User engagement metrics

**RID Audit Reports:**
- Per-user CEU transcripts
- Module completion evidence
- Learning objective verification
- Time-on-task documentation

**Export Formats:**
- CSV, PDF, Excel
- RID-required format templates

### 3. Grievance Management

**Grievance Types:**
- Certificate dispute
- Content accuracy complaint
- Technical issue affecting completion
- Discrimination/harassment claim
- Refund request

**Workflow:**
```
1. Grievance submitted (user or third-party)
2. Logged in system with timestamp
3. Assigned to handler
4. Investigation notes recorded
5. Resolution documented
6. User notified of outcome
7. Appeal option (if applicable)
8. Closed with full audit trail
```

**Required Fields:**
- Grievance ID (auto-generated)
- Submitted by (name, email, RID# if applicable)
- Date submitted
- Category
- Description
- Evidence/attachments
- Assigned to
- Status (Open, Under Review, Resolved, Appealed, Closed)
- Resolution summary
- Resolution date

### 4. User Management (Compliance View)

**View:**
- User CEU history
- Credential verification status
- Subscription status
- Grievance history
- Certificate history

**Actions:**
- Force password reset
- Suspend/reactivate account
- Merge duplicate accounts
- Export user data (GDPR/privacy requests)

### 5. Module Management

**View:**
- All modules and status
- Completion statistics
- Average time-on-task
- Drop-off points

**Actions:**
- Enable/disable module
- Update module metadata (not content)
- Flag for content review
- View feedback/ratings

### 6. Audit Preparation

**Pre-Audit Checklist:**
- [ ] All certificates accessible and verifiable
- [ ] Completion records match certificate count
- [ ] Time-on-task logs available
- [ ] Learning objectives documented per module
- [ ] Grievance log up to date
- [ ] Instructor qualifications on file
- [ ] CEU calculation methodology documented

**Audit Mode:**
- Read-only access for external auditors
- Temporary login credentials
- Activity logging of auditor actions
- Watermarked exports

## Database Schema

```sql
-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- SUPER_ADMIN, COMPLIANCE_ADMIN, SUPPORT_ADMIN, VIEWER
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Admin activity log
CREATE TABLE admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50), -- user, certificate, grievance, module
    target_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Grievances table
CREATE TABLE grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_number VARCHAR(50) UNIQUE NOT NULL, -- GR-2025-0001
    submitted_by_name VARCHAR(255) NOT NULL,
    submitted_by_email VARCHAR(255) NOT NULL,
    submitted_by_rid VARCHAR(50),
    related_user_id UUID REFERENCES users(id),
    related_certificate_id UUID REFERENCES certificates(id),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    attachments JSONB,
    assigned_to UUID REFERENCES admin_users(id),
    status VARCHAR(50) DEFAULT 'open', -- open, under_review, resolved, appealed, closed
    resolution_summary TEXT,
    resolution_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Grievance notes (internal)
CREATE TABLE grievance_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID REFERENCES grievances(id),
    admin_user_id UUID REFERENCES admin_users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit sessions
CREATE TABLE audit_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditor_name VARCHAR(255) NOT NULL,
    auditor_organization VARCHAR(255),
    access_code_hash VARCHAR(255) NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Cross-Vertical Opportunity

**If this works well for RID, the same infrastructure supports:**

| Vertical | Certifying Body | CEU Term |
|----------|-----------------|----------|
| Lawyers | State Bar Associations | CLE (Continuing Legal Education) |
| Doctors | State Medical Boards | CME (Continuing Medical Education) |
| Social Workers | NASW / State Boards | CE (Continuing Education) |
| Teachers | State Dept. of Education | PD (Professional Development) |
| Nurses | State Nursing Boards | CNE (Continuing Nursing Education) |
| Psychologists | APA / State Boards | CE (Continuing Education) |

**What changes per vertical:**
- Certificate template and terminology
- Compliance tracking fields
- Audit report formats
- Content area categories

**What stays the same:**
- Core infrastructure
- Admin portal
- Grievance system
- Certificate verification
- Reporting engine

---

# APPENDIX H: CREDENTIAL-BASED PERSONALIZATION

## Overview

InterpretReflect collects user credentials during onboarding to provide:
- Personalized CEU recommendations
- Compliance deadline reminders
- State-specific requirements
- RID certification tracking

## Credential Data Collected

### During Onboarding

```
1. RID Certification
   - RID Member? [Yes/No]
   - RID Number (if yes)
   - Certification Level (NIC, CI, CT, CDI, Ed:K-12, SC:L)
   - Certification Date
   - Next Renewal Date

2. State Licensure
   - State(s) of Practice (multi-select)
   - License Number(s)
   - License Expiration Date(s)
   
3. Other Certifications
   - BEI Level (if applicable)
   - EIPA Score (if applicable)
   - Other state credentials
```

### CEU Requirement Matrix

| Credential | Requirement | Period | Notes |
|------------|-------------|--------|-------|
| RID Certification | 8.0 CEUs | 4 years | 2.0/year average |
| NC State License | 2.0 CEUs | Annual | Separate from RID |
| TX BEI | 2.4 CEUs | Annual | Court-specific may differ |
| Other States | Varies | Varies | Pull from database |

## Personalization Logic

### Dashboard Messages

```python
def get_personalized_ceu_message(user):
    credentials = user.credentials
    messages = []
    
    # RID tracking
    if credentials.rid_certified:
        rid_ceus_needed = 8.0 - user.rid_ceus_earned_this_cycle
        rid_months_left = months_until(credentials.rid_renewal_date)
        
        if rid_months_left < 6 and rid_ceus_needed > 2:
            messages.append({
                'priority': 'high',
                'text': f"⚠️ You need {rid_ceus_needed} RID CEUs and only have {rid_months_left} months. Consider increasing your learning pace."
            })
    
    # State license tracking
    for license in credentials.state_licenses:
        state_req = get_state_requirement(license.state)
        state_ceus_needed = state_req.annual_ceus - user.state_ceus_earned(license.state, current_year)
        months_left = months_until(license.expiration)
        
        if months_left < 3 and state_ceus_needed > 0:
            messages.append({
                'priority': 'high',
                'text': f"⚠️ Your {license.state} license requires {state_ceus_needed} more CEUs before {license.expiration}."
            })
    
    return messages
```

### Module Recommendations

```python
def get_personalized_recommendations(user):
    # Consider:
    # 1. User's reflection patterns (from insights)
    # 2. CEU content areas needed for balance
    # 3. Credential-specific requirements
    # 4. Modules not yet completed
    
    recommendations = []
    
    # Pattern-based
    if 'boundary_challenges' in user.top_themes:
        recommendations.append({
            'module': 'EM-002',
            'reason': "Based on your recent reflections about boundaries"
        })
    
    # Content area balance
    ps_vs_gs = user.get_ceu_balance()
    if ps_vs_gs['ps'] < 0.3:  # Less than 30% Professional Studies
        recommendations.append({
            'module': 'PS-001',
            'reason': "Balance your CEU portfolio with Professional Studies content"
        })
    
    return recommendations
```

## Database Schema

```sql
-- User credentials table
CREATE TABLE user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE,
    
    -- RID
    is_rid_certified BOOLEAN DEFAULT false,
    rid_number VARCHAR(50),
    rid_certification_level VARCHAR(50),
    rid_certification_date DATE,
    rid_renewal_date DATE,
    rid_cycle_start DATE,
    
    -- General
    years_interpreting INTEGER,
    primary_setting VARCHAR(50),
    specializations JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- State licenses (separate table for multi-state)
CREATE TABLE user_state_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    state CHAR(2) NOT NULL,
    license_number VARCHAR(100),
    license_type VARCHAR(100),
    issue_date DATE,
    expiration_date DATE,
    ceu_requirement_annual DECIMAL(4,2),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, state)
);

-- State CEU requirements reference table
CREATE TABLE state_ceu_requirements (
    state CHAR(2) PRIMARY KEY,
    requires_license BOOLEAN,
    annual_ceus DECIMAL(4,2),
    cycle_length_years INTEGER DEFAULT 1,
    content_area_requirements JSONB,
    notes TEXT,
    last_updated DATE
);

-- Insert known requirements
INSERT INTO state_ceu_requirements VALUES
('NC', true, 2.0, 1, '{"any": 2.0}', 'Annual license renewal', '2025-01-01'),
('TX', true, 2.4, 1, '{"court": 0.6, "any": 1.8}', 'BEI certification', '2025-01-01');
-- Add more states as research completed
```

## Compliance Tracking View

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR COMPLIANCE STATUS                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RID CERTIFICATION                                          │
│  ══════════════════                                         │
│  Status: Active (NIC)                                       │
│  Cycle: 2024-2028                                          │
│  Progress: ████████░░░░░░░░ 4.2 / 8.0 CEUs                 │
│  Time Remaining: 28 months                                  │
│  ✅ On Track                                                │
│                                                             │
│  NC STATE LICENSE                                           │
│  ════════════════                                           │
│  Status: Active (#NC-12345)                                 │
│  Expires: June 30, 2026                                     │
│  This Year: ████████████░░░░ 1.6 / 2.0 CEUs                │
│  ⚠️ Complete 0.4 CEUs by June 30                           │
│                                                             │
│  [View Full Transcript]  [Download Certificates]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# APPENDIX I: CONTENT PRODUCTION STRATEGY

## Overview

Technical build: 12 weeks
Content production: Parallel track, phased approach

## Phase 1: Launch Content (Months 1-2)

**Scripts & Transcripts (Immediate):**
- Write full scripts for all 26 modules
- Include visual/slide notes
- Ready for text-based delivery if needed
- Foundation for video production

**Video Production (When Funded):**
- Hire Deaf talent for visual diversity
- Multiple presenters for different backgrounds
- Sarah for introductory/foundational content
- Guest experts for specialized topics

## Content Development Prioritization

### Must Have for Launch (4-6 Modules)

| Module | Why Priority |
|--------|--------------|
| EM-001 (Emotional Dashboard) | Foundational, showcases ECCI |
| EM-002 (Boundaries) | Most common reflection theme |
| SP-001 (Quick Skill: Grounding) | Immediate practical value |
| WS-001 (DECIDE in Action) | Core framework demonstration |

### Add in Month 2 (4-6 More Modules)

| Module | Why Priority |
|--------|--------------|
| DD-005 (Difficult Diagnosis) | Showcase Deep Dive format |
| EM-003 (Vicarious Trauma) | High demand topic |
| SP-002 (Emotional Labeling) | Emotional literacy showcase |
| WS-002 (Pre-Assignment Prep) | Workflow integration |

### Add Weekly After Launch

- 1-2 new modules per week
- Based on user demand signals
- Deep Dives take longer (2-week cycles)

## Talent Strategy

**Immediate (Sarah):**
- Record foundational modules
- Establish tone and style
- Create pilot content for investor demos

**With Funding:**
- Hire Deaf presenter(s) for relevant content
- Recruit interpreters from diverse backgrounds
- Partner with subject matter experts
- Compensate fairly (budget $500-1000/module for talent)

**Benefits of Diversity:**
- Content resonates with broader audience
- Authentic perspectives on Deaf experience
- Reduces "Sarah fatigue" in long-term users
- Marketing asset (representation matters)

## Production Workflow

```
Week 1: Script Writing
├── Research topic
├── Write full script with Elya prompts
├── Internal review
└── Finalize learning objectives

Week 2: Production Prep
├── Slide/visual design
├── Talent scheduling
└── Technical setup

Week 3: Recording
├── Video recording (15-30 min raw)
├── Edit to final (15 min)
├── Accessibility (captions, ASL considerations)
└── Upload and test

Week 4: Integration
├── Build Elya practice module
├── Connect to skill prompts
├── Test full user flow
└── QA and launch
```

## Cost Estimates

| Item | Low | High | Notes |
|------|-----|------|-------|
| Script writing (per module) | $0 (Sarah) | $200 (contractor) | |
| Video talent (per module) | $300 | $1,000 | Depends on expertise |
| Video production (per module) | $100 | $500 | Editing, graphics |
| Platform (hosting, streaming) | $50/month | $200/month | Scales with users |

**Bootstrap Budget (10 modules):** $3,000-5,000
**Funded Budget (26 modules):** $15,000-25,000

---

**END OF BUILD SPECIFICATION**

*Document Version: 1.2*
*Updated: December 6, 2025*
*Changes: 3-Tier Structure, Journal & Insights System, Admin Portal, Credential Personalization, Content Production Strategy*
*Ready for Claude Code Implementation*
