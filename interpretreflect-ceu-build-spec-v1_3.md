# InterpretReflect CEU System
## Complete Build Specification v1.3

**Document Purpose:** Single source of truth for implementing the Elya-guided micro-learning CEU system. Ready for Claude Code operationalization.

**Last Updated:** December 6, 2025
**Version:** 1.3 (Pricing Correction + NC Integration + Canvas Asset Mapping + CEUBridge Relationship + Platform Strategy)
**Authors:** Sarah Wheeler, Claude

---

# CHANGELOG v1.3

| Change | Section | Description |
|--------|---------|-------------|
| Pricing Correction | §1, §2 | Fixed inconsistency: Basic → Free/Growth/Pro throughout |
| BREATHE Positioning | §5, Appendix A | Renamed to "Interpreter Grounding Protocol" (applies CBT to interpreter context) |
| NC HB-854 Integration | NEW §15 | State-specific tracking for educational interpreter licensure |
| CEUBridge Relationship | NEW §16 | Defines InterpretReflect ↔ CEUBridge integration |
| Canvas Asset Mapping | §14 | Maps Sarah's unpublished courses to module catalog |
| Platform Strategy | NEW §17 | Web-first PWA approach for interpreter workflows |
| CATIE Partnership | §14, NEW §18 | Leverages Sarah's Designer role for content partnerships |
| Content Production | §14 | Updated timeline with Canvas course repurposing |

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
15. [NC HB-854 Integration](#15-nc-hb-854-integration) ← NEW
16. [CEUBridge Relationship](#16-ceubridge-relationship) ← NEW
17. [Platform Strategy](#17-platform-strategy) ← NEW
18. [Partnership Opportunities](#18-partnership-opportunities) ← NEW

## Appendices
- [Appendix A: Complete Module Catalog](#appendix-a-complete-module-catalog)
- [Appendix B: Elya Prompt Templates](#appendix-b-elya-prompt-templates)
- [Appendix C: Emotional Literacy Framework](#appendix-c-emotional-literacy-framework)
- [Appendix D: Unfolding Case Study Format](#appendix-d-unfolding-case-study-format)
- [Appendix E: Sample Deep Dive Module](#appendix-e-sample-deep-dive-module)
- [Appendix F: Journal & Insights System](#appendix-f-journal--insights-system)
- [Appendix G: Admin Portal (RID Compliance)](#appendix-g-admin-portal-rid-compliance)
- [Appendix H: Credential-Based Personalization](#appendix-h-credential-based-personalization)
- [Appendix I: Canvas Course Asset Inventory](#appendix-i-canvas-course-asset-inventory) ← NEW

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
| Free | $0 forever | Elya (5/month), wellness tracking, no CEU content |
| Growth | $15/month | Elya (unlimited), full insights, no CEU content |
| Pro | $30/month | Everything + 4 credits/month for CEU content |
| Top-Up | $5-14 | Additional credits when needed (Pro users only) |

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
│   GROWTH ($15/month) ← Working interpreters, full Elya + insights       │
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
- State license tracking (NC, TX, etc.)
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
| State license tracking | ❌ | ❌ | ✅ |
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
- Interpreter Grounding Protocol (applies BREATHE to interpreter context)
- Quick boundary script practice
- Emotion labeling exercise
- Cognitive reset technique

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
- Ethical dilemma analysis (DECIDE framework application)
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
| QP-001 | Interpreter Grounding Protocol | 15 min | 0.5 | 0.025 | Stress mentioned |
| QP-002 | Emotion Labeling Drill | 15 min | 0.5 | 0.025 | Emotional confusion |
| QP-003 | Quick Boundary Script | 15 min | 0.5 | 0.025 | Boundary issue |
| QP-004 | Pre-Assignment Mental Prep | 15 min | 0.5 | 0.025 | Pre-assignment |
| QP-005 | Cognitive Reset Technique | 15 min | 0.5 | 0.025 | Overwhelm |
| QP-006 | Post-Assignment Decompression | 15 min | 0.5 | 0.025 | Tough assignment |

**Note on QP-001:** The Interpreter Grounding Protocol applies established regulation techniques (similar to BREATHE frameworks in clinical literature) specifically to interpreter workflows. This is ECCI Model application, not a proprietary protocol claim.

### Standard Practices (PRACTICE - 30 min)

| ID | Title | Duration | Credits | CEU | Elya Trigger |
|----|-------|----------|---------|-----|--------------|
| SP-001 | Boundary Role-Play Scenarios | 30 min | 1.0 | 0.05 | Boundary patterns |
| SP-002 | Emotional Regulation Deep Practice | 30 min | 1.0 | 0.05 | Regulation struggles |
| SP-003 | Ethical Dilemma Analysis | 30 min | 1.0 | 0.05 | Ethics uncertainty |
| SP-004 | Vicarious Trauma Processing | 30 min | 1.0 | 0.05 | Trauma exposure |
| SP-005 | Confidence Building Session | 30 min | 1.0 | 0.05 | Self-doubt |
| SP-006 | Cognitive Load Management | 30 min | 1.0 | 0.05 | Overwhelm patterns |
| SP-007 | Assertive Communication Practice | 30 min | 1.0 | 0.05 | Communication issues |
| SP-008 | Burnout Prevention Check-In | 30 min | 1.0 | 0.05 | Burnout indicators |

**Note on SP-003:** Ethical Dilemma Analysis applies the DECIDE framework (established ethical decision-making model) to interpreter-specific scenarios. DECIDE is not proprietary ECCI content.

### Deep Dives (LEARN + PRACTICE - 60 min)

| ID | Title | Duration | Credits | CEU | Components |
|----|-------|----------|---------|-----|------------|
| DD-001 | EI Foundations Complete | 60 min | 2.0 | 0.1 | TV-001 + Extended practice |
| DD-002 | Boundary Mastery | 60 min | 2.0 | 0.1 | TV-004 + Role-play series |
| DD-003 | Trauma-Informed Practice | 60 min | 2.0 | 0.1 | TV-003 + Processing session |
| DD-004 | The ECCI Model in Action | 60 min | 2.0 | 0.1 | TV-002 + Application exercises |

## Phase 2 Modules (Post-Launch)

- Cultural Intelligence series (PPO eligible)
- Domain-specific modules (Medical, Legal, VRS, Educational)
- Advanced cognitive performance
- Leadership and mentoring
- NC Educational Interpreter Prep (aligned with HB-854)

---

# 6. ELYA INTEGRATION

## Elya's Roles in CEU System

### 1. Skill Recommender

**Trigger:** Patterns detected in reflections/check-ins

**Logic:**
```
IF reflection.contains(stress_keywords) AND user.has_credits
  THEN recommend(QP-001: Interpreter Grounding Protocol)
  
IF reflection.mentions(boundary) COUNT > 2 IN last_30_days
  THEN recommend(SP-001: Boundary Role-Play)
  
IF user.completed(TV-001) AND NOT user.completed(SP-002)
  THEN suggest("Ready to practice what you learned?")
```

**Conversation Example:**
```
Elya: "I noticed you mentioned feeling overwhelmed after that 
medical assignment. The Interpreter Grounding Protocol is a quick 
15-minute practice that might help. You have 3 credits left this 
month. Want to try it?"

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
1. User signs up (Free tier)
   └─> Onboarding: Name, role, experience level

2. Elya introduction conversation (free)
   └─> "Tell me about your interpreting work..."
   └─> Collects: domains, challenges, goals

3. User explores Free features
   └─> 5 reflections/month
   └─> Sees value, hits limit

4. Elya suggests Growth upgrade
   └─> "Want unlimited Elya access? Growth is $15/month."
   └─> OR suggests Pro if user mentions CEUs

5. User upgrades to Pro
   └─> Stripe checkout
   └─> 4 credits available immediately

6. First module recommendation
   └─> Elya: "Let's start with [relevant module]. It's 15 minutes."
   └─> User completes module
   └─> Credit deducted, progress tracked

7. Post-module debrief (free)
   └─> Elya processes experience, updates growth profile
   
8. CEU accumulates toward certificate
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
  monthly_credits_total INT DEFAULT 0,  -- 0 for Free/Growth, 4 for Pro
  monthly_credits_used INT DEFAULT 0,
  topup_credits_balance INT DEFAULT 0,
  credits_reset_date TIMESTAMP,
  
  -- Subscription
  subscription_tier ENUM('free', 'growth', 'pro') DEFAULT 'free',
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
  - "Apply ethical decision-making frameworks to boundary-related dilemmas"
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
│  • EI Foundations + Grounding Protocol (0.05 PS) - Nov 28       │
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
│   the grounding practices.                                      │
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
  Free: 1,700 (69%)
  Growth: 250 (10%)
  Pro: 500 (20%)
  New this month: 125
  Churned this month: 18
  
Revenue
  MRR: $18,750 (250 × $15 + 500 × $30)
  Top-ups this month: $1,240
  Avg revenue per paid user: $26.65
  
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
  Free → Growth: 8.2%
  Growth → Pro: 12%
  Free → Pro (direct): 4.2%
  Top-up purchase rate: 8% of Pro users
```

---

# 12. STRIPE INTEGRATION

## Products to Create

```javascript
// Stripe Products Configuration

const products = {
  // Subscriptions
  growth_monthly: {
    name: "InterpretReflect Growth",
    description: "Unlimited Elya + full insights",
    price: 1500, // $15.00
    currency: "usd",
    interval: "month",
    metadata: {
      tier: "growth",
      credits_monthly: 0
    }
  },
  
  pro_monthly: {
    name: "InterpretReflect Pro",
    description: "Everything + 4 CEU credits/month",
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

// 1. New subscription (Growth or Pro)
'customer.subscription.created': async (event) => {
  const subscription = event.data.object;
  const userId = subscription.metadata.user_id;
  const tier = subscription.metadata.tier;
  
  const updateData = {
    subscription_tier: tier,
    subscription_status: 'active',
    stripe_subscription_id: subscription.id,
    credits_reset_date: new Date(subscription.current_period_end * 1000)
  };
  
  if (tier === 'pro') {
    updateData.monthly_credits_total = 4;
    updateData.monthly_credits_used = 0;
    await createCreditTransaction(userId, 'monthly_grant', 4);
  }
  
  await db.users.update(userId, updateData);
  await sendEmail(userId, `welcome_to_${tier}`);
};

// 2. Subscription renewed (monthly)
'invoice.payment_succeeded': async (event) => {
  const invoice = event.data.object;
  if (invoice.subscription) {
    const userId = await getUserByStripeCustomer(invoice.customer);
    const user = await db.users.findById(userId);
    
    if (user.subscription_tier === 'pro') {
      // Expire unused monthly credits
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
    }
    
    await sendEmail(userId, 'subscription_renewed');
  }
};

// 3. Subscription cancelled
'customer.subscription.deleted': async (event) => {
  const subscription = event.data.object;
  const userId = subscription.metadata.user_id;
  
  await db.users.update(userId, {
    subscription_tier: 'free',
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

## Phase 0: Critical Fixes (Immediate)

- [ ] Fix authentication issues for existing paying customers
- [ ] Audit current subscription states in database
- [ ] Ensure Stripe webhook handlers are operational

## Phase 1: MVP (Weeks 1-4)

### Week 1: Foundation
- [ ] Update database schema (add tier fields, credit tracking)
- [ ] Create Stripe products (Growth + Pro + Top-ups)
- [ ] Implement credit tracking system
- [ ] Build credit transaction logging

### Week 2: Content Infrastructure
- [ ] Create modules table and CRUD
- [ ] Build module catalog UI
- [ ] Repurpose 2 Canvas courses as text-based content (see §14)
- [ ] Create Elya scripts for 2 Quick Practices (QP-001, QP-002)

### Week 3: User Flows
- [ ] Implement Growth + Pro upgrade flows
- [ ] Build module completion tracking
- [ ] Create top-up purchase flow
- [ ] Add credit balance UI to dashboard

### Week 4: Certificates & Polish
- [ ] Build certificate generator
- [ ] Create certificate storage/download
- [ ] Add RID number collection
- [ ] Update website pricing (Free/Growth/Pro)
- [ ] QA and bug fixes

**MVP Launch Deliverables:**
- 2 Theory modules (repurposed from Canvas)
- 2 Quick Practices  
- 1 Standard Practice
- Working credit system
- Certificate generation
- Growth + Pro subscription flows

## Phase 2: Full Content Library (Weeks 5-8)

- [ ] Record remaining theory videos (or expand text versions)
- [ ] Create remaining quick practices
- [ ] Build all standard practices
- [ ] Create 2 deep dive modules
- [ ] Implement Elya recommendation engine
- [ ] Build competency tracking
- [ ] Create growth dashboard

## Phase 3: Advanced Features (Weeks 9-12)

- [ ] Implement automated RID reporting
- [ ] Build NC state license tracking (HB-854 prep)
- [ ] Add learning paths (grouped modules)
- [ ] Create admin analytics dashboard
- [ ] Implement email automation (nudges, reminders)
- [ ] Build Journal & Insights system (Appendix F)
- [ ] Deploy Admin Portal (Appendix G)

---

# 14. CONTENT PRODUCTION STRATEGY

## Overview

Technical build: 12 weeks
Content production: Parallel track, leveraging existing Canvas assets

## Canvas Course Asset Inventory

**Critical Discovery:** Sarah has 15+ unpublished Canvas courses as Teacher that can be repurposed for InterpretReflect content. This accelerates MVP without video production funding.

### Direct Mapping: Canvas → InterpretReflect Modules

| Canvas Course | InterpretReflect Module | Repurposing Effort |
|--------------|------------------------|-------------------|
| Emotional Intelligence Foundations | TV-001, DD-001 | Low - core content ready |
| Professional EI Skills | SP-002, SP-005, SP-007 | Medium - needs Elya scripts |
| Understanding Emotions | QP-002 Emotion Labeling Drill | Low - framework exists |
| Body Language and Emotional Communication | NEW Deep Dive candidate | Medium - needs structuring |
| Emotion Practice Through Monologues | Practice scenarios | Low - content exists |
| Interpersonal Communication | SP-007 Assertive Communication | Low - needs Elya integration |
| Ethics & Interpreting | SP-003 Ethical Dilemma Analysis | Medium - needs DECIDE framing |

### Repurposing Strategy

**Phase 1 (MVP - No Funding Required):**

1. **Emotional Intelligence Foundations** → TV-001 + DD-001
   - Extract core content as text-based learning
   - Create reading + comprehension format
   - Add Elya reflection prompts
   - Estimated time: 1 week

2. **Understanding Emotions** → QP-002 Emotion Labeling Drill
   - Framework already developed (see Appendix C)
   - Convert to Elya-guided practice
   - Estimated time: 3 days

3. **Professional EI Skills** → SP-002 Emotional Regulation
   - Structure as Elya practice scenarios
   - Create role-play scripts
   - Estimated time: 1 week

**Phase 2 (With Funding):**

4. Record video versions of text content
5. Hire Deaf presenters for relevant modules
6. Add ASL versions of key modules

## Content Development Prioritization

### Must Have for Launch (4-6 Modules)

| Module | Why Priority | Source |
|--------|--------------|--------|
| TV-001 (What is EI?) | Foundational, showcases ECCI | Canvas: EI Foundations |
| QP-001 (Interpreter Grounding) | Immediate practical value | New creation |
| QP-002 (Emotion Labeling) | Emotional literacy showcase | Canvas: Understanding Emotions |
| SP-001 (Boundaries) | Most common reflection theme | New creation |

### Add in Month 2 (4-6 More Modules)

| Module | Why Priority | Source |
|--------|--------------|--------|
| DD-001 (EI Complete) | Showcase Deep Dive format | Canvas: EI Foundations expanded |
| TV-003 (Vicarious Trauma) | High demand topic | New creation |
| SP-002 (Emotional Regulation) | Emotional literacy showcase | Canvas: Professional EI Skills |
| TV-002 (ECCI Model) | Core differentiator | New creation |

### Add Weekly After Launch

- 1-2 new modules per week
- Based on user demand signals
- Deep Dives take longer (2-week cycles)

## CATIE Center Collaboration Opportunity

**Sarah's Position:** Designer role on 8 CATIE Center courses establishes peer relationship, not vendor relationship.

**Complementary Content Strategy:**
- CATIE courses: Free foundational content
- InterpretReflect: ECCI Model application + personalized practice
- Users get free prep → come to InterpretReflect for guided skill development

**Potential Partnership Pitch:**
"CATIE provides the knowledge foundation. InterpretReflect provides the personalized practice with Elya. Together we create complete interpreter development."

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
├── Research topic (or pull from Canvas course)
├── Write full script with Elya prompts
├── Internal review
└── Finalize learning objectives

Week 2: Production Prep
├── Slide/visual design
├── Talent scheduling (if video)
└── Technical setup

Week 3: Recording (if video) OR Text Finalization
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
| Script writing (per module) | $0 (Sarah) | $200 (contractor) | Canvas assets reduce this |
| Video talent (per module) | $300 | $1,000 | Depends on expertise |
| Video production (per module) | $100 | $500 | Editing, graphics |
| Platform (hosting, streaming) | $50/month | $200/month | Scales with users |

**Bootstrap Budget (10 modules, text-based):** $500-1,000
**Bootstrap Budget (10 modules, video):** $3,000-5,000
**Funded Budget (26 modules, full production):** $15,000-25,000

---

# 15. NC HB-854 INTEGRATION

## Overview

North Carolina House Bill 854 requires licensure for educational interpreters, effective October 1, 2026. This creates:

- **TAM Expansion:** 115 school districts × estimated 3-5 interpreters = 345-575 new potential users
- **Competitive Advantage:** First platform with NC-specific compliance tracking
- **Content Opportunity:** Educational interpreter-focused modules

## Timeline

| Date | Milestone | InterpretReflect Action |
|------|-----------|------------------------|
| Present | HB-854 passed House | Monitor Senate movement |
| Q1 2026 | Expected Senate passage | Publish "NC Educational Interpreter Licensure Guide" |
| Oct 1, 2026 | Law effective | Launch NC-specific features |
| Sept 30, 2027 | Provisional license window closes | Marketing push to provisionals |

## Database Schema Additions

```sql
-- Extend state_ceu_requirements for NC specifics
INSERT INTO state_ceu_requirements VALUES
('NC', true, 2.0, 1, 
 '{"any": 2.0}', 
 'Annual license renewal. HB-854 (Oct 2026) adds educational interpreter licensure. EIPA 3.5+ or NCITLB-approved equivalent required.',
 '2025-12-06');

-- NC-specific license types
ALTER TABLE user_state_licenses ADD COLUMN license_category VARCHAR(50);
-- Values: 'general', 'educational', 'provisional'

-- Track EIPA scores (relevant for NC educational)
ALTER TABLE user_credentials ADD COLUMN eipa_score DECIMAL(2,1);
ALTER TABLE user_credentials ADD COLUMN eipa_test_date DATE;
```

## User Dashboard: NC License Tracking

```
┌─────────────────────────────────────────────────────────────────┐
│  NC STATE LICENSE                                                │
│  ════════════════                                                │
│  Status: Active (#NC-12345)                                      │
│  Type: General Interpreter                                       │
│  Expires: June 30, 2026                                          │
│  This Year: ████████████░░░░ 1.6 / 2.0 CEUs                     │
│  ⚠️ Complete 0.4 CEUs by June 30                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  📢 NC EDUCATIONAL INTERPRETER UPDATE                       ││
│  │  HB-854 requires licensure for K-12 interpreters            ││
│  │  starting October 2026.                                     ││
│  │  [Learn More] [Check My Eligibility]                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## NC-Specific Module Content (Phase 2)

| Module | Title | CEU | Notes |
|--------|-------|-----|-------|
| NC-001 | Understanding NC ITLB Requirements | 0.05 PS | Regulatory overview |
| NC-002 | Educational Interpreting Foundations | 0.1 PS | K-12 specific skills |
| NC-003 | IEP Meeting Navigation | 0.1 PS | Special education context |
| NC-004 | Working with School Personnel | 0.05 PS | Role clarity in schools |

## Kyle Kiser IEP Partnership Integration

**Current Relationship:** Kyle Kiser runs interpreter preparation program

**Integration Opportunity:**
- IEP graduates → InterpretReflect for ongoing CEU management
- Kyle recommends InterpretReflect as post-graduation tool
- We provide Kyle's graduates first-month discount

**Value for Kyle's Graduates:**
- Credential tracking from day one
- NC license requirement monitoring
- Continuation of skills developed in IEP

---

# 16. CEUBRIDGE RELATIONSHIP

## Strategic Question

How does InterpretReflect CEU system relate to CEUBridge (your separate CEU management platform)?

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER PERSPECTIVE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  InterpretReflect                    CEUBridge                   │
│  ═══════════════                     ═════════                   │
│  • Earn CEUs (our content)           • Track ALL CEUs            │
│  • Elya-guided learning              • Any provider's CEUs       │
│  • Emotional intelligence focus      • Certificate storage       │
│  • Personalized skill practice       • Compliance calendar       │
│  • Growth tracking                   • Multi-credential mgmt     │
│                                                                  │
│                         ↓                                        │
│                                                                  │
│  CEUs earned in InterpretReflect automatically sync to          │
│  CEUBridge for unified compliance tracking                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Options

### Option A: Separate Products (Recommended for MVP)

**InterpretReflect:** Earn CEUs through ECCI-focused content
**CEUBridge:** Track all CEUs from any provider

**User Journey:**
1. User earns CEU in InterpretReflect
2. Certificate generated with unique ID
3. User can manually add to CEUBridge OR
4. One-click export to CEUBridge (future integration)

**Pros:**
- Clear product boundaries
- Each product has focused value proposition
- Can sell separately or bundle
- Easier MVP development

**Cons:**
- User manages two accounts initially
- Integration work needed later

### Option B: CEUBridge as Feature of InterpretReflect Pro

**All CEU tracking lives inside InterpretReflect Pro**

**User Journey:**
1. User earns CEU in InterpretReflect → auto-tracked
2. User uploads external certificates → tracked
3. Single dashboard for all compliance

**Pros:**
- Single product, simpler for user
- Higher Pro tier value

**Cons:**
- Feature bloat in InterpretReflect
- Loses CEUBridge as separate revenue stream
- Harder to serve non-interpreter markets

### Option C: CEUBridge as Separate Product with Deep Integration

**Both products exist, with API connection**

**User Journey:**
1. User signs up for InterpretReflect
2. Option to connect CEUBridge account
3. InterpretReflect CEUs auto-sync to CEUBridge
4. CEUBridge shows unified compliance view

**Pros:**
- Best of both worlds
- CEUBridge can serve other verticals
- InterpretReflect stays focused

**Cons:**
- More complex to build
- Requires API development

## Recommendation

**MVP (Now):** Option A - Keep products separate, manual certificate export
**Phase 2:** Option C - Build API integration between products
**Future:** Evaluate bundle pricing (InterpretReflect Pro + CEUBridge = $40/month)

## Cross-Product User Flow

```
InterpretReflect Pro User ($30/month)
├── Earns CEUs through InterpretReflect content
├── Downloads certificates
├── Tracks InterpretReflect CEUs in app
└── [Optional] Upgrades to add CEUBridge for external CEU tracking

CEUBridge User (pricing TBD)
├── Tracks CEUs from any provider
├── Uploads certificates from conferences, workshops
├── Gets compliance reminders
└── [Optional] Subscribes to InterpretReflect for ECCI content

Bundle User ($40/month future)
├── Full InterpretReflect Pro access
├── Full CEUBridge access
├── Seamless sync between products
└── Unified compliance dashboard
```

---

# 17. PLATFORM STRATEGY

## Target Platform: Web-First PWA

Given interpreter workflows (mobile-heavy, often between assignments), the recommended approach is:

**Progressive Web App (PWA)**
- Works on any device with a browser
- Can be "installed" on home screen
- Offline capability for core features
- Single codebase for web + mobile
- No app store approval delays

## Technical Stack Recommendation

```
Frontend: Next.js 14+ (App Router)
├── React Server Components for performance
├── Tailwind CSS for styling
├── PWA manifest for installability
└── Service worker for offline support

Backend: Next.js API Routes + Supabase
├── Supabase for auth, database, storage
├── Edge functions for Elya integration
└── Stripe for payments

AI: Anthropic Claude API
├── Elya conversations
├── Pattern detection
├── Content generation

Hosting: Vercel
├── Automatic deployments
├── Edge network for global performance
└── Analytics built-in
```

## Mobile-Specific Considerations

### VRS Interpreter Workflow

Many InterpretReflect users (like Sarah) work VRS shifts with:
- Breaks between calls (5-15 minutes)
- Mobile phone as primary device during shifts
- Need for quick access to grounding practices

**Optimizations:**
- Quick Practice modules designed for 15-min breaks
- One-tap access to QP-001 (Interpreter Grounding Protocol)
- Offline access to recently used content
- Push notifications for credit reminders (opt-in)

### Assignment Context

Interpreters often reflect immediately after assignments:
- In car before driving home
- In waiting room between appointments
- On break at multi-day conference

**Optimizations:**
- Voice input for reflections (speech-to-text)
- Quick mood capture without typing
- Auto-save drafts if connection drops
- Low-bandwidth mode for poor connectivity

## Feature Availability by Platform

| Feature | Web (Desktop) | Web (Mobile) | PWA Installed |
|---------|--------------|--------------|---------------|
| All core features | ✅ | ✅ | ✅ |
| Video playback | ✅ | ✅ | ✅ |
| Elya conversations | ✅ | ✅ | ✅ |
| Push notifications | ❌ | ❌ | ✅ |
| Offline access | ❌ | ❌ | ✅ (limited) |
| Home screen icon | N/A | Manual | ✅ |
| Full-screen mode | ❌ | ❌ | ✅ |

## Future: Native Apps

If user demand and funding justify it:

**Phase 3+ Consideration:**
- React Native for iOS/Android
- Share business logic with web
- Native push notifications
- Better offline support
- App store presence (marketing value)

**Trigger for Native Development:**
- 5,000+ active users
- Significant mobile usage (>60% of sessions)
- User feedback requesting native features
- Funding secured for maintenance

---

# 18. PARTNERSHIP OPPORTUNITIES

## CATIE Center Partnership

### Current Position

Sarah has **Designer role** on 8 CATIE Center courses:
- Dealing with Microaggressions
- Ethical Decision-Making for Novice Interpreters
- Interpreting for Job Interviews
- Interpreting in Video Remote Settings
- Language at Work: Deliberate Practice
- Preparing for Interpreter Performance Exams
- Reflective Self-Assessment for Novice Interpreters
- Step by Step: Effective Skill-focused Practice
- Virtual Interpreter Video Excellence

**This positions Sarah as a peer/collaborator, not a vendor.**

### Partnership Pitch

**To CATIE Center:**

"CATIE provides excellent foundational content for novice interpreters. InterpretReflect extends this with:

1. **Personalized practice:** Elya adapts to individual patterns
2. **ECCI Model application:** Emotional intelligence focus missing in traditional IEPs
3. **Ongoing development:** Post-graduation continued learning

Proposal: CATIE courses as recommended foundation → InterpretReflect for personalized skill practice and CEU earning. We reference CATIE content, you reference InterpretReflect for ongoing development."

### Mutual Benefits

| CATIE Gets | InterpretReflect Gets |
|------------|----------------------|
| Extended value for their content | Credibility through association |
| Graduates have clear next step | User pipeline from CATIE completers |
| Usage data on skill application | Content partnership validation |
| Potential revenue share (future) | Access to CATIE's network |

## Kyle Kiser IEP Partnership

### Current Relationship

Kyle Kiser runs interpreter preparation program in NC. Potential for:
- Graduate pipeline to InterpretReflect
- NC educational interpreter focus (HB-854 alignment)
- Academic validation for ECCI Model

### Partnership Structure

```
Kyle Kiser IEP
├── Students complete IEP curriculum
├── Graduate with foundational skills
└── Recommended: InterpretReflect for ongoing development

InterpretReflect
├── Offers IEP graduates 30-day free Pro trial
├── Provides credential tracking from day one
├── NC-specific compliance monitoring
└── Continuation of skills developed in IEP
```

## UNC-IRIS Project

### Sarah's Position

Teacher role on 4 UNC-IRIS courses:
- UNC-IRIS Project: Induction
- UNC-IRIS Project: RID Alternative Pathway Program
- UNC-IRIS Project: VR Self-Directed Course
- UNC-IRIS Project: Rural Interpreting Module

### Academic Validation Opportunity

- ECCI Model alignment with academic research
- Potential co-authored papers on EI in interpreting
- Grant application support (academic partner)
- Credential for "developed in partnership with UNC"

## Carol Patrie Connection

### Relationship

Sarah has CIT Deep Dive connection with Carol Patrie (legendary interpreter educator).

### Potential Value

- Endorsement quote for marketing
- Content collaboration (future)
- Conference introduction network
- Academic credibility by association

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

## QP-001: Interpreter Grounding Protocol

Upon completion, participants will be able to:
1. Execute a six-step grounding sequence adapted for interpreter workflows
2. Identify situations where grounding techniques are most applicable
3. Demonstrate at least one regulation technique within the protocol
4. Self-assess their stress level before and after protocol application
5. Plan for integrating grounding practices into their professional routine

**Note:** This module applies established somatic and cognitive regulation techniques (found in clinical literature as BREATHE and similar protocols) specifically to interpreter contexts. The application to interpreter-specific scenarios is ECCI Model content; the underlying techniques are not proprietary.

## SP-001: Boundary Role-Play Scenarios

Upon completion, participants will be able to:
1. Identify three types of professional boundaries in interpreting settings
2. Demonstrate assertive language techniques for boundary-setting
3. Apply ethical frameworks to boundary-related dilemmas
4. Practice recovery strategies when boundaries are crossed
5. Develop personalized boundary scripts for common scenarios

## SP-003: Ethical Dilemma Analysis

Upon completion, participants will be able to:
1. Apply structured ethical decision-making frameworks to interpreter scenarios
2. Identify stakeholders and their interests in ethical dilemmas
3. Evaluate multiple courses of action using ethical principles
4. Articulate reasoning for ethical decisions to colleagues
5. Recognize when to seek consultation on ethical matters

**Note:** This module applies the DECIDE framework (established ethical decision-making model used across healthcare and other fields) to interpreter-specific scenarios. DECIDE is not proprietary ECCI content.

[Additional learning objectives for all modules to be documented]

---

# APPENDIX B: ELYA TRIGGER KEYWORDS

## Stress/Overwhelm Detection
```
Keywords: stressed, overwhelmed, anxious, can't cope, too much, 
drowning, exhausted, burned out, falling apart, losing it
→ Recommend: QP-001 Interpreter Grounding Protocol
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
- You're holding onto past grievances
- There may be unresolved conflict or unmet needs

**How to respond:**
- Identify the source of your resentment and address it directly if possible
- Practice forgiveness (for your own peace, not to excuse the behavior)
- Set boundaries to prevent future hurt

### Jealousy
**What it might be telling you:**
- You feel insecure about your position or relationships
- You perceive a threat to something you value
- There may be unmet needs for recognition or attention

**How to respond:**
- Acknowledge the feeling without acting on it impulsively
- Examine what's driving the jealousy (insecurity, fear of loss)
- Communicate openly with those involved and work on building trust

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
| Anxiety | High-stakes assignment approaching | Pre-assignment prep, grounding |
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
| Anxiety + upcoming assignment | QP-001 Interpreter Grounding | "Quick regulation before the assignment" |
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

**Elya Feedback:** [Framework application - ECCI, etc.]

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

[Content preserved from v1.2 - see original document for full details]

---

# APPENDIX G: ADMIN PORTAL (RID COMPLIANCE)

[Content preserved from v1.2 - see original document for full details]

---

# APPENDIX H: CREDENTIAL-BASED PERSONALIZATION

[Content preserved from v1.2 - see original document for full details]

---

# APPENDIX I: CANVAS COURSE ASSET INVENTORY

## Overview

Sarah Wheeler has significant content assets in Canvas LMS that can be repurposed for InterpretReflect, reducing content production time and cost.

## CATIE Center Courses (Designer Role)

These courses establish Sarah as a **peer/collaborator** with CATIE Center:

| Course | Strategic Value |
|--------|----------------|
| Dealing with Microaggressions | Diversity/inclusion content, PPO eligible |
| Ethical Decision-Making for Novice Interpreters | SP-003 alignment |
| Interpreting for Job Interviews | Professional development content |
| Interpreting in Video Remote Settings | VRS-specific, relevant to Sarah's experience |
| Language at Work: Deliberate Practice | Skill development methodology |
| Preparing for Interpreter Performance Exams | Certification prep value |
| Reflective Self-Assessment for Novice Interpreters | Core ECCI alignment |
| Step by Step: Effective Skill-focused Practice | Learning methodology |
| Virtual Interpreter Video Excellence | Technical skills, modern relevance |

## Sarah's Unpublished Courses (Teacher Role)

**Directly Repurposable for InterpretReflect:**

| Canvas Course | Target Module(s) | Repurposing Notes |
|--------------|-----------------|-------------------|
| Emotional Intelligence Foundations | TV-001, DD-001 | Core content for launch |
| Professional EI Skills | SP-002, SP-005, SP-007 | Multiple practice modules |
| Understanding Emotions | QP-002 | Emotion labeling framework |
| Body Language and Emotional Communication | NEW Deep Dive | Non-verbal intelligence |
| Emotion Practice Through Monologues | Practice scenarios | Elya role-play content |
| Interpersonal Communication | SP-007 | Assertive communication |
| Ethics & Interpreting | SP-003 | Ethical dilemma scenarios |
| Communication | Foundational content | Cross-module application |

**Supporting/Reference Content:**

| Canvas Course | Potential Use |
|--------------|---------------|
| Emotions in Music | Creative teaching approach |
| Art | Supplementary/engagement |
| Book Club | Community feature (future) |
| CATIE Center Archive | Historical reference |

## UNC-IRIS Project Courses (Teacher Role)

**Academic Partnership Potential:**

| Course | Value |
|--------|-------|
| UNC-IRIS Project: Induction | IEP curriculum insight |
| UNC-IRIS Project: RID Alternative Pathway Program | Certification pathway content |
| UNC-IRIS Project: VR Self-Directed Course | Self-paced learning model |
| UNC-IRIS Project: Rural Interpreting Module | Specialized content for underserved areas |

## CIT Conference Connections

| Course | Relationship Value |
|--------|-------------------|
| CIT: Deep Dive with Carol Patrie | Carol Patrie endorsement potential |
| Learning to Interpret: Deep Dive with Campbell McDermid | Academic credibility (Sarah was TA) |

## Repurposing Workflow

```
Step 1: Content Audit
├── Review Canvas course materials
├── Identify core concepts
├── Extract reusable content
└── Note gaps requiring new creation

Step 2: Module Mapping
├── Align content to InterpretReflect modules
├── Identify Elya practice opportunities
├── Define learning objectives
└── Create assessment criteria

Step 3: Adaptation
├── Rewrite for self-paced format
├── Create Elya conversation scripts
├── Add ECCI Model framing
└── Design practice scenarios

Step 4: Production
├── Text-based version first (MVP)
├── Video recording when funded
├── Accessibility review
└── QA and testing
```

---

**END OF BUILD SPECIFICATION**

*Document Version: 1.3*
*Updated: December 6, 2025*
*Changes: Pricing correction (Free/Growth/Pro), BREATHE→Interpreter Grounding Protocol, NC HB-854 integration, CEUBridge relationship, Canvas asset mapping, Platform strategy, Partnership opportunities*
*Ready for Claude Code Implementation*
