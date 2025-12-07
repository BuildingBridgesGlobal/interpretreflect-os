# Essence Profile: Integration Plan

## Philosophy

The Essence Profile system embodies a **trauma-informed, low-friction approach** to community building:

- ✅ **Minimal upfront data collection** - Only essentials at onboarding
- ✅ **Gradual reveal through platform use** - Profile grows organically
- ✅ **Automatic ECCI detection** - No self-assessment required
- ✅ **Pod matching, not checkbox alignment** - Complementary strengths, not identical profiles
- ✅ **Privacy-respecting** - Users control what they share

---

## Current State (Before)

### The Problem: Overwhelming Upfront Form

The previous "Become a Mentor" tab asked users to manually declare:

- ❌ All 4 ECCI domains (Linguistic, Cultural, Cognitive, Interpersonal)
- ❌ All 6 specialty settings (Medical, Legal, Educational, Mental Health, VRS, Community)
- ❌ Full bio and LinkedIn profile
- ❌ Self-assessment of strengths (cognitive overload)

**Issues:**
- High barrier to entry
- Cognitive burden during vulnerable onboarding
- Self-assessment inaccuracy (people don't know their gaps)
- Contradicts platform's trauma-informed philosophy

---

## New State (After)

### Simplified Onboarding Flow (3 Steps, ~2 minutes)

#### Step 1: Basic Identity
- Display Name (required)
- Short Bio (optional, 1-2 sentences)
- Deaf Interpreter toggle
- Years of Experience (categorical)

#### Step 2: Primary Settings (1-3 max)
- Pick 1-3 specialty settings (not all 6)
- Educational messaging: "We'll learn more as you use the platform"

#### Step 3: Community Intent
- Single-choice: Connect with peers / Find guidance / Share expertise / All of the above
- Educational messaging about organic pod matching

### What's Auto-Detected (Not Asked)

- **ECCI Domain Strengths** - Populated from debrief performance data
- **Skill Gaps** - Identified through pattern analysis in debriefs
- **Mentorship Fit** - Calculated algorithmically based on complementary profiles

---

## Implementation Components

### 1. Frontend Component Created ✅

**File:** `components/community/EssenceProfileOnboarding.tsx`

**Features:**
- 3-step progressive wizard
- Clear progress indicators
- Contextual help text explaining gradual reveal
- Minimal required fields
- Educational cards about ECCI auto-detection and pod matching

**Props:**
```typescript
interface EssenceProfileOnboardingProps {
  onComplete: (profileData: {
    display_name: string;
    bio: string;
    is_deaf_interpreter: boolean;
    years_experience: string;
    primary_settings: string[];
    community_intent: string;
  }) => void;
  onSkip?: () => void;
}
```

### 2. Community Page Updated ✅

**File:** `app/community/page.tsx`

**Changes:**
- Replaced overwhelming form with simplified profile status card
- Added educational messaging about ECCI emergence
- Added messaging about pod matching philosophy
- "Get Started (2 min)" button to launch onboarding

### 3. Database Schema (Existing - Ready to Use)

**Table:** `community_profiles`

**Relevant Fields:**
```sql
-- Basic Identity (from onboarding)
display_name TEXT
bio TEXT
is_deaf_interpreter BOOLEAN
years_experience TEXT

-- Settings (1-3 picked during onboarding)
settings_work_in TEXT[]  -- Primary specialty settings

-- ECCI Data (AUTO-POPULATED, not from onboarding)
offer_support_in TEXT[]   -- Strong domains (detected from debriefs)
seeking_guidance_in TEXT[] -- Growth areas (detected from debriefs)

-- Mentorship (calculated algorithmically)
open_to_mentoring BOOLEAN
looking_for_mentor BOOLEAN

-- Additional fields for future use
certifications TEXT[]
is_searchable BOOLEAN
```

**Related Tables:**
- `mentorship_suggestions` - Stores AI-generated mentor matches
- `connections` - Manages peer connections
- `wellness_checkins` - Source data for emotional patterns
- `free_write_sessions` - Source data for theme detection

---

## Integration Roadmap

### Phase 1: Launch Simplified Onboarding ⏳ (Next Step)

**Tasks:**
1. Wire up `EssenceProfileOnboarding` component to API
2. Create/update API route: `POST /api/community/profile/onboard`
3. Handle profile creation with minimal fields
4. Update Community page to conditionally show onboarding vs. profile view
5. Add "Get Started" modal trigger

**API Payload:**
```typescript
POST /api/community/profile/onboard
{
  display_name: string,
  bio?: string,
  is_deaf_interpreter: boolean,
  years_experience: string,
  primary_settings: string[], // 1-3 items
  community_intent: string    // 'connect' | 'guidance' | 'share' | 'all'
}
```

**Success State:**
- Profile created with `is_searchable: false` (private by default)
- User sees profile dashboard instead of onboarding
- Stats cards update with real data

---

### Phase 2: Auto-Detect ECCI Domains from Debriefs 🔄 (Future)

**Goal:** Automatically populate `offer_support_in` and `seeking_guidance_in` based on debrief performance.

**Data Sources:**
- PostAssignmentDebrief responses (from dashboard)
- ECCI Radar scores (from competency tracking)
- Assignment difficulty vs. performance patterns

**Implementation:**
1. Create background job: `jobs/updateECCIProfiles.ts`
2. Trigger on debrief completion
3. Algorithm:
   ```
   IF domain_score >= 80% across last 5 debriefs:
     ADD to offer_support_in
   IF domain_score < 60% and declining:
     ADD to seeking_guidance_in
   ```
4. Store confidence scores in `auto_detected_domains` JSONB field
5. Update community profile display to show "Auto-detected" badges

**Database Migration Needed:**
```sql
ALTER TABLE community_profiles
ADD COLUMN auto_detected_domains JSONB DEFAULT '{
  "linguistic": {"score": 0, "confidence": 0, "trend": "neutral"},
  "cultural": {"score": 0, "confidence": 0, "trend": "neutral"},
  "cognitive": {"score": 0, "confidence": 0, "trend": "neutral"},
  "interpersonal": {"score": 0, "confidence": 0, "trend": "neutral"}
}'::jsonb;
```

---

### Phase 3: Implement Pod Matching Algorithm 🎯 (Future)

**Goal:** Match interpreters into "pods" based on complementary strengths, not identical checkboxes.

**Matching Criteria:**
1. **Inverse ECCI Alignment** - Mentee's weak domain = Mentor's strong domain
2. **Specialty Overlap** - At least 1 shared primary setting
3. **Experience Delta** - 3+ years difference for mentorship
4. **Availability** - `open_to_mentoring: true`
5. **Growth Pattern Similarity** - Similar emotional regulation needs (from wellness data)

**Database Function (Already Exists):**
```sql
-- Function: find_mentorship_matches(user_id)
-- Returns: Ranked list of compatible mentors
-- Located in: supabase/migrations/20250202_community_system.sql
```

**Implementation:**
1. Call `find_mentorship_matches()` when user completes profile
2. Store top 5 matches in `mentorship_suggestions` table
3. Display in "Suggested Connections" tab with match reasoning
4. Update suggestions weekly as ECCI data evolves

**API Route:**
```typescript
GET /api/community/suggestions
// Returns personalized mentor/peer matches with reasoning
Response: {
  matches: [
    {
      profile: { ... },
      match_score: 0.87,
      reason: "Strong in Cultural domain (88%) - matches your growth area",
      based_on_domain: "Cultural"
    }
  ]
}
```

---

### Phase 4: Progressive Reveal in Profile View 📈 (Future)

**Goal:** Show users how their profile is "growing" over time as they use the platform.

**Visual Design:**
- Profile completeness meter (not a nag, just transparency)
- Timeline view: "Your ECCI profile emerged from 12 debriefs"
- Unlock indicators: "Complete 3 more debriefs to unlock pod matching"

**Gamification (Light Touch):**
- Badges for milestones (not competition)
- "Your profile is 60% complete" (informational, not pressuring)
- Celebration when ECCI domains are first detected

**Privacy Controls:**
- Granular toggles for what's visible to others
- Essence Profile vs. Full Profile tiers
- Opt-in for anonymous data sharing

---

### Phase 5: Integration with Wellness & Free Write 🧘 (Future)

**Goal:** Use emotional processing data to improve pod matching accuracy.

**Data Sources:**
- `wellness_checkins` - Mood patterns and stress signals
- `free_write_sessions` - Detected themes and emotional arcs

**Integration Points:**
1. **Theme Alignment in Matching**
   - If free write shows "burnout" themes, prioritize mentors with high Interpersonal domain
   - If wellness checkins show consistent stress, match with peers in same specialty

2. **Empathy-Based Pod Formation**
   - Group interpreters experiencing similar challenges
   - Not just skill-based matching, but emotional support alignment

**Database View (Already Created):**
```sql
-- View: wellness_insights
-- Combines wellness_checkins + free_write_sessions
-- Use for holistic profile assessment
```

---

## Privacy & Ethics Considerations

### Data Minimization
- Only collect what's needed for matching
- Don't store raw debrief content in community profiles
- Aggregate ECCI scores, not individual response details

### Consent Model
- Opt-in for profile visibility (`is_searchable` flag)
- Granular privacy controls for each field
- Ability to pause matching without deleting profile

### Transparency
- Show users how their ECCI scores were calculated
- Explain match reasoning ("Based on your Cultural domain growth")
- Allow manual override of auto-detected domains

### Psychological Safety
- No public skill ratings or rankings
- No "you need improvement in X" messaging
- Frame as "growth opportunities" not deficits

---

## Success Metrics

### Adoption Metrics (Phase 1)
- % of users who complete simplified onboarding (target: 80%+)
- Average time to complete onboarding (target: <3 min)
- Profile completion rate (target: 60%+ complete all 3 steps)

### Engagement Metrics (Phase 2-3)
- % of users with auto-detected ECCI domains (target: 70% after 5 debriefs)
- % of users who act on suggested connections (target: 40%+)
- Average # of connections per user (target: 3-5)

### Quality Metrics (Phase 4-5)
- User satisfaction with matches (survey after 30 days)
- Retention rate of mentorship relationships
- Time to first meaningful connection (target: <7 days)

---

## Next Steps (Immediate Action Items)

### For Developer:
1. ✅ Create `EssenceProfileOnboarding.tsx` component
2. ✅ Update Community page with simplified messaging
3. ⏳ Wire up onboarding component to API
4. ⏳ Create `POST /api/community/profile/onboard` route
5. ⏳ Add modal trigger for "Get Started" button

### For Product Owner:
1. ⏳ Review simplified onboarding flow (UX approval)
2. ⏳ Approve messaging about ECCI auto-detection
3. ⏳ Plan user education content (tooltips, help docs)
4. ⏳ Define privacy defaults and granular controls

### For Future Phases:
1. ⏳ Design ECCI auto-detection algorithm (Phase 2)
2. ⏳ Test pod matching function with sample data (Phase 3)
3. ⏳ Create profile "growth" visualization mockups (Phase 4)
4. ⏳ Define wellness integration logic (Phase 5)

---

## Files Modified/Created

### Created:
- ✅ `components/community/EssenceProfileOnboarding.tsx`
- ✅ `docs/ESSENCE_PROFILE_INTEGRATION.md` (this file)

### Modified:
- ✅ `app/community/page.tsx` (replaced mentor form with simplified profile card)

### To Create (Phase 1):
- ⏳ `app/api/community/profile/onboard/route.ts`
- ⏳ `components/community/ProfileDashboard.tsx` (post-onboarding view)

### To Modify (Phase 1):
- ⏳ `app/community/page.tsx` (add modal for onboarding)
- ⏳ `app/api/community/profile/route.ts` (extend for minimal profile creation)

---

## Technical Notes

### API Route Design Pattern
```typescript
// POST /api/community/profile/onboard
export async function POST(request: Request) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { display_name, bio, is_deaf_interpreter, years_experience, primary_settings, community_intent } = await request.json();

  // Create minimal profile
  const { data, error } = await supabase
    .from("community_profiles")
    .insert({
      user_id: session.user.id,
      display_name,
      bio,
      is_deaf_interpreter,
      years_experience,
      settings_work_in: primary_settings,
      // Leave ECCI fields empty - will be auto-populated
      offer_support_in: [],
      seeking_guidance_in: [],
      // Store intent for matching algorithm
      // (Note: may need to add community_intent field to schema)
      is_searchable: false // Private by default
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data });
}
```

### Conditional Rendering Pattern
```typescript
// In app/community/page.tsx
const [hasProfile, setHasProfile] = useState(false);
const [showOnboarding, setShowOnboarding] = useState(false);

useEffect(() => {
  // Check if user has community profile
  const checkProfile = async () => {
    const { data } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    setHasProfile(!!data);
  };
  checkProfile();
}, []);

// In mentor tab:
{selectedTab === "mentor" && (
  <>
    {!hasProfile && (
      <EssenceProfileOnboarding
        onComplete={(data) => createProfile(data)}
        onSkip={() => setShowOnboarding(false)}
      />
    )}
    {hasProfile && <ProfileDashboard />}
  </>
)}
```

---

## References

- Database Schema: `supabase/migrations/20250202_community_system.sql`
- Profile Fields: `supabase/migrations/20250202_community_profile_fields.sql`
- Free Write Integration: `supabase/migrations/20250202_free_write_sessions.sql`
- Wellness Integration: `supabase/migrations/20250202_wellness_checkins.sql`

---

**Last Updated:** 2025-12-02
**Status:** Phase 1 in progress (simplified onboarding component created)
**Next Review:** After Phase 1 launch + user feedback
