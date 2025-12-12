# Design Document: Community Enhancements Phase 1-2

## Overview

This document outlines the technical design for implementing Community Enhancements Phase 1 (Foundation Fixes) and Phase 2 (Discovery & Engagement). The design builds upon the existing community infrastructure including `community_profiles`, `community_posts`, `connections`, and related tables.

**Design Goals:**
- Minimal disruption to existing functionality
- Consistent with existing component patterns and styling
- Performance-optimized queries with proper indexing
- Client-side state persistence via localStorage
- Clean separation between UI and API concerns

---

## Architecture Design

### System Architecture Diagram

```
+------------------------------------------------------------------+
|                        CLIENT (Next.js)                          |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+    +------------------+    +---------------+ |
|  | Community Page   |    | New Components   |    | localStorage  | |
|  | (page.tsx)       |    | (Phase 1 & 2)    |    | Manager       | |
|  +------------------+    +------------------+    +---------------+ |
|          |                       |                      |         |
|          +-------+---------------+----------------------+         |
|                  |                                                |
+------------------------------------------------------------------+
                   |
                   | REST API
                   |
+------------------------------------------------------------------+
|                     API ROUTES (Next.js)                         |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+  +------------------+  +------------------+ |
|  | /api/community/  |  | /api/community/  |  | /api/community/  | |
|  | posts (PATCH)    |  | hashtags         |  | link-preview     | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                   |
|  +------------------+  +------------------+  +------------------+ |
|  | /api/community/  |  | /api/community/  |  | /api/community/  | |
|  | mentors          |  | mentorship       |  | trending         | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                   |
+------------------------------------------------------------------+
                   |
                   | Supabase Client
                   |
+------------------------------------------------------------------+
|                       SUPABASE DATABASE                          |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+  +------------------+  +------------------+ |
|  | community_posts  |  | hashtags         |  | post_hashtags   | |
|  | (modified)       |  | (new)            |  | (new)           | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                   |
|  +------------------+  +------------------+  +------------------+ |
|  | link_previews    |  | mentorship_      |  | user_preferences| |
|  | (new)            |  | requests (new)   |  | (new)           | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                   |
+------------------------------------------------------------------+
```

### Data Flow Diagram

```
+-------------+     +----------------+     +-----------------+
| User Action |---->| Component      |---->| API Route       |
|             |     | State Update   |     | Handler         |
+-------------+     +----------------+     +-----------------+
                           |                       |
                           v                       v
                    +-------------+         +-------------+
                    | localStorage|         | Supabase DB |
                    | (UI state)  |         | (persistent)|
                    +-------------+         +-------------+
                           |                       |
                           +----------+------------+
                                      |
                                      v
                              +---------------+
                              | UI Re-render  |
                              +---------------+
```

---

## Database Schema Changes

### 1. New Tables

#### 1.1 `hashtags` Table

Stores unique hashtags with usage statistics.

```sql
CREATE TABLE hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL UNIQUE, -- lowercase, no special chars
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_hashtags_normalized ON hashtags(normalized_name);
CREATE INDEX idx_hashtags_usage ON hashtags(usage_count DESC) WHERE is_archived = false;
CREATE INDEX idx_hashtags_last_used ON hashtags(last_used_at DESC);
```

#### 1.2 `post_hashtags` Junction Table

Links posts to hashtags (many-to-many).

```sql
CREATE TABLE post_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, hashtag_id)
);

-- Indexes
CREATE INDEX idx_post_hashtags_post ON post_hashtags(post_id);
CREATE INDEX idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);
```

#### 1.3 `link_previews` Table

Caches Open Graph metadata for URLs.

```sql
CREATE TABLE link_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  url_hash TEXT NOT NULL UNIQUE, -- MD5 hash for faster lookups
  title TEXT,
  description TEXT,
  image_url TEXT,
  favicon_url TEXT,
  site_name TEXT,
  video_url TEXT, -- For YouTube/Vimeo embeds
  video_type TEXT, -- 'youtube' | 'vimeo' | null
  fetch_status TEXT DEFAULT 'pending' CHECK (fetch_status IN ('pending', 'success', 'failed')),
  fetched_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Cache expiration (30 days default)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_link_previews_hash ON link_previews(url_hash);
CREATE INDEX idx_link_previews_expires ON link_previews(expires_at) WHERE fetch_status = 'success';
```

#### 1.4 `post_link_previews` Junction Table

Associates link previews with posts.

```sql
CREATE TABLE post_link_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  link_preview_id UUID NOT NULL REFERENCES link_previews(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, link_preview_id)
);

-- Indexes
CREATE INDEX idx_post_link_previews_post ON post_link_previews(post_id);
```

#### 1.5 `mentorship_requests` Table

Formal mentorship request tracking.

```sql
CREATE TABLE mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  message TEXT, -- Optional intro message from requester
  response_message TEXT, -- Optional message from mentor
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, mentor_id),
  CHECK (requester_id != mentor_id)
);

-- Indexes
CREATE INDEX idx_mentorship_requests_requester ON mentorship_requests(requester_id);
CREATE INDEX idx_mentorship_requests_mentor ON mentorship_requests(mentor_id);
CREATE INDEX idx_mentorship_requests_status ON mentorship_requests(status);
```

#### 1.6 `user_preferences` Table

Stores user-specific settings and preferences.

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  sidebar_collapsed BOOLEAN DEFAULT false,
  guidelines_acknowledged BOOLEAN DEFAULT false,
  guidelines_acknowledged_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_dismissed BOOLEAN DEFAULT false,
  onboarding_dismissed_at TIMESTAMPTZ,
  feed_preferences JSONB DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
```

### 2. Modifications to Existing Tables

#### 2.1 `community_posts` Table Modifications

```sql
-- Add trending score column (computed/cached)
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS trending_score DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_engagement_at TIMESTAMPTZ;

-- Index for trending queries
CREATE INDEX idx_posts_trending ON community_posts(trending_score DESC, created_at DESC)
  WHERE is_deleted = false;

CREATE INDEX idx_posts_week ON community_posts(created_at DESC)
  WHERE is_deleted = false AND created_at > NOW() - INTERVAL '7 days';
```

#### 2.2 `connections` Table Modifications

```sql
-- Add mentorship flag to connections
ALTER TABLE connections
  ADD COLUMN IF NOT EXISTS is_mentorship BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mentorship_started_at TIMESTAMPTZ;

-- Index for mentorship connections
CREATE INDEX idx_connections_mentorship ON connections(is_mentorship)
  WHERE is_mentorship = true AND status = 'accepted';
```

#### 2.3 `community_profiles` Table Modifications

```sql
-- Add profile completion tracking
ALTER TABLE community_profiles
  ADD COLUMN IF NOT EXISTS profile_completion_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_post_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_connection_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mentor_statement TEXT; -- "What I offer" field

-- Add mentor availability enum
ALTER TABLE community_profiles
  ADD COLUMN IF NOT EXISTS mentor_availability TEXT DEFAULT 'available'
    CHECK (mentor_availability IN ('available', 'limited', 'unavailable'));
```

### 3. Row Level Security Policies

```sql
-- Hashtags: Public read, authenticated write
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hashtags are viewable by everyone" ON hashtags
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create hashtags" ON hashtags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Post Hashtags: Follow post permissions
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post hashtags viewable with post" ON post_hashtags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_posts
      WHERE id = post_hashtags.post_id AND is_deleted = false
    )
  );

CREATE POLICY "Users can tag their own posts" ON post_hashtags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_posts
      WHERE id = post_hashtags.post_id AND user_id = auth.uid()
    )
  );

-- Link Previews: Public read
ALTER TABLE link_previews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Link previews are public" ON link_previews
  FOR SELECT USING (true);

-- Mentorship Requests: Participants only
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own mentorship requests" ON mentorship_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = mentor_id);

CREATE POLICY "Users create mentorship requests" ON mentorship_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Participants update requests" ON mentorship_requests
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = mentor_id);

-- User Preferences: Owner only
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);
```

### 4. Database Functions

```sql
-- Function to extract and link hashtags from post content
CREATE OR REPLACE FUNCTION process_post_hashtags(
  p_post_id UUID,
  p_content TEXT
) RETURNS void AS $$
DECLARE
  v_hashtag TEXT;
  v_hashtag_id UUID;
  v_normalized TEXT;
  v_hashtag_array TEXT[];
BEGIN
  -- Extract hashtags using regex (max 5)
  SELECT ARRAY_AGG(DISTINCT lower(m[1]))
  INTO v_hashtag_array
  FROM regexp_matches(p_content, '#([a-zA-Z][a-zA-Z0-9_]{1,29})', 'g') AS m
  LIMIT 5;

  -- Clear existing hashtags for this post
  DELETE FROM post_hashtags WHERE post_id = p_post_id;

  -- Process each hashtag
  IF v_hashtag_array IS NOT NULL THEN
    FOREACH v_hashtag IN ARRAY v_hashtag_array LOOP
      v_normalized := lower(regexp_replace(v_hashtag, '[^a-z0-9]', '', 'g'));

      -- Upsert hashtag
      INSERT INTO hashtags (name, normalized_name, usage_count, last_used_at)
      VALUES (v_hashtag, v_normalized, 1, NOW())
      ON CONFLICT (normalized_name) DO UPDATE
      SET usage_count = hashtags.usage_count + 1,
          last_used_at = NOW()
      RETURNING id INTO v_hashtag_id;

      -- Link to post
      INSERT INTO post_hashtags (post_id, hashtag_id)
      VALUES (p_post_id, v_hashtag_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(
  p_likes INTEGER,
  p_comments INTEGER,
  p_created_at TIMESTAMPTZ
) RETURNS DECIMAL AS $$
DECLARE
  v_engagement DECIMAL;
  v_hours_ago DECIMAL;
  v_decay DECIMAL;
BEGIN
  -- Comments worth 2x likes
  v_engagement := p_likes + (p_comments * 2);

  -- Hours since creation
  v_hours_ago := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 3600;

  -- Decay factor (0.1 per hour)
  v_decay := v_hours_ago * 0.1;

  -- Score with minimum 0
  RETURN GREATEST(0, v_engagement - v_decay);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get trending hashtags
CREATE OR REPLACE FUNCTION get_trending_hashtags(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  name TEXT,
  post_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id,
    h.name,
    COUNT(ph.id) AS post_count
  FROM hashtags h
  JOIN post_hashtags ph ON ph.hashtag_id = h.id
  JOIN community_posts cp ON cp.id = ph.post_id
  WHERE cp.created_at > NOW() - INTERVAL '7 days'
    AND cp.is_deleted = false
    AND h.is_archived = false
  GROUP BY h.id, h.name
  ORDER BY post_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive stale hashtags (cron job candidate)
CREATE OR REPLACE FUNCTION archive_stale_hashtags()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH stale AS (
    SELECT id FROM hashtags
    WHERE last_used_at < NOW() - INTERVAL '90 days'
      AND usage_count < 5
      AND is_archived = false
  )
  UPDATE hashtags SET is_archived = true
  WHERE id IN (SELECT id FROM stale);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## API Endpoints

### Phase 1 Endpoints

#### 1.1 User Preferences API

**File:** `app/api/community/preferences/route.ts`

```typescript
// GET /api/community/preferences
// Returns user preferences including sidebar state, guidelines acknowledgment
Request: None (uses auth token)
Response: {
  preferences: {
    sidebar_collapsed: boolean;
    guidelines_acknowledged: boolean;
    onboarding_completed: boolean;
    onboarding_dismissed: boolean;
    feed_preferences: object;
  }
}

// PUT /api/community/preferences
// Updates user preferences
Request: {
  sidebar_collapsed?: boolean;
  guidelines_acknowledged?: boolean;
  onboarding_dismissed?: boolean;
  feed_preferences?: object;
}
Response: {
  success: boolean;
  preferences: UserPreferences;
}
```

#### 1.2 Modified Posts API

**File:** `app/api/community/posts/route.ts` (existing, modified)

```typescript
// GET /api/community/posts (modified)
// Add combined filter support
Request Query Params:
  - post_type?: string  // Single type filter
  - sort?: 'recent' | 'top' | 'following' | 'trending'
  - hashtag?: string    // Filter by hashtag
  - search?: string     // Search content + authors

Response: {
  posts: Post[];
  has_more: boolean;
  trending_hashtags?: TrendingHashtag[]; // Include when sort=trending
}

// POST /api/community/posts (modified)
// Add hashtag processing
Request: {
  content: string;
  post_type: string;
  // ... existing fields
}
// Server extracts hashtags from content automatically
```

### Phase 2 Endpoints

#### 2.1 Hashtags API

**File:** `app/api/community/hashtags/route.ts`

```typescript
// GET /api/community/hashtags
// Returns hashtag suggestions
Request Query Params:
  - query?: string      // Search prefix
  - trending?: boolean  // Get trending only
  - limit?: number      // Default 10

Response: {
  hashtags: {
    id: string;
    name: string;
    usage_count: number;
    is_trending: boolean;
  }[];
}

// GET /api/community/hashtags/[name]
// Returns posts with specific hashtag
Request Params: { name: string }
Response: {
  hashtag: Hashtag;
  posts: Post[];
  has_more: boolean;
}
```

#### 2.2 Link Preview API

**File:** `app/api/community/link-preview/route.ts`

```typescript
// GET /api/community/link-preview
// Fetches or retrieves cached Open Graph data
Request Query Params:
  - url: string (required)

Response: {
  preview: {
    url: string;
    title: string | null;
    description: string | null;
    image_url: string | null;
    favicon_url: string | null;
    site_name: string | null;
    video_url: string | null;  // For YouTube/Vimeo
    video_type: string | null;
  } | null;
  cached: boolean;
  error?: string;
}
```

#### 2.3 Mentors API

**File:** `app/api/community/mentors/route.ts`

```typescript
// GET /api/community/mentors
// Returns filterable list of mentors
Request Query Params:
  - specialty?: string        // Filter by specialty
  - experience?: string       // '0-2' | '3-5' | '6-10' | '10+'
  - availability?: string     // 'available' | 'limited' | 'unavailable'
  - search?: string          // Search name/bio
  - limit?: number
  - offset?: number

Response: {
  mentors: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    years_experience: string;
    specialties: string[];
    mentor_availability: string;
    mentor_statement: string | null;
    open_to_mentoring: boolean;
    connection_status: 'none' | 'pending' | 'connected' | 'mentoring';
  }[];
  total: number;
  has_more: boolean;
}
```

#### 2.4 Mentorship Requests API

**File:** `app/api/community/mentorship/route.ts`

```typescript
// GET /api/community/mentorship
// Returns user's mentorship requests (as requester or mentor)
Request Query Params:
  - type?: 'sent' | 'received' | 'all'
  - status?: 'pending' | 'accepted' | 'declined'

Response: {
  requests: MentorshipRequest[];
}

// POST /api/community/mentorship
// Creates mentorship request
Request: {
  mentor_id: string;
  message?: string;
}
Response: {
  success: boolean;
  request: MentorshipRequest;
}

// PUT /api/community/mentorship
// Accept or decline request
Request: {
  request_id: string;
  action: 'accept' | 'decline';
  response_message?: string;
}
Response: {
  success: boolean;
  request: MentorshipRequest;
}
```

#### 2.5 Trending API

**File:** `app/api/community/trending/route.ts`

```typescript
// GET /api/community/trending
// Returns trending content
Request Query Params:
  - type?: 'posts' | 'hashtags' | 'all'
  - period?: 'day' | 'week' | 'month'  // Default 'week'

Response: {
  trending_posts: Post[];       // Top 20 by engagement
  trending_hashtags: {
    id: string;
    name: string;
    post_count: number;
  }[];
}
```

#### 2.6 Onboarding API

**File:** `app/api/community/onboarding/route.ts`

```typescript
// GET /api/community/onboarding
// Returns onboarding state and suggestions
Response: {
  completed: boolean;
  dismissed: boolean;
  profile_completion: {
    score: number;  // 0-100
    items: {
      has_avatar: boolean;       // 20%
      has_bio: boolean;          // 20%
      has_specialties: boolean;  // 20%
      has_first_post: boolean;   // 20%
      has_connection: boolean;   // 20%
    };
  };
  suggested_people: CommunityProfile[];  // 3-5 users
  popular_posts: Post[];                  // 3-5 posts
}

// PUT /api/community/onboarding
// Update onboarding state
Request: {
  dismissed?: boolean;
}
Response: {
  success: boolean;
}
```

---

## Component Architecture

### New Components

#### Phase 1 Components

```
components/community/
├── SidebarCollapseButton.tsx     # Persistent collapse toggle
├── CombinedFilterBar.tsx         # Combined sort + type filters
├── CommentThread.tsx             # Nested comment display
├── CommentConnector.tsx          # Visual connector lines
├── GuidelinesModal.tsx           # First-post guidelines reminder
├── ChatMetricTooltip.tsx         # Chats tooltip/click handler
└── FilterChips.tsx               # Active filter display chips
```

#### Phase 2 Components

```
components/community/
├── MentorsTab.tsx                # Mentors discovery view
├── MentorCard.tsx                # Individual mentor display
├── MentorFilters.tsx             # Mentor filter controls
├── MentorshipRequestModal.tsx    # Request mentorship modal
├── MentorshipBadge.tsx           # Badge indicator
├── HashtagInput.tsx              # Hashtag entry with suggestions
├── HashtagSuggestions.tsx        # Autocomplete dropdown
├── HashtagChip.tsx               # Displayed hashtag tag
├── TrendingTopics.tsx            # Sidebar trending section
├── TrendingBadge.tsx             # Post trending indicator
├── LinkPreviewCard.tsx           # Rich link preview
├── VideoEmbed.tsx                # YouTube/Vimeo embed
├── OnboardingDashboard.tsx       # New user welcome
├── ProfileCompletionCard.tsx     # Completion checklist
├── SuggestedPeopleList.tsx       # People recommendations
└── PopularPostsList.tsx          # Recommended posts
```

### Modifications to Existing Components

#### `app/community/page.tsx`

```typescript
// New state additions
const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
  // Initialize from localStorage or user preferences
  if (typeof window !== 'undefined') {
    return localStorage.getItem('community_sidebar_collapsed') === 'true';
  }
  return false;
});

const [activeFilters, setActiveFilters] = useState<{
  sort: 'recent' | 'top' | 'following' | 'trending';
  postType: string | null;
  hashtag: string | null;
}>({ sort: 'recent', postType: null, hashtag: null });

const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
const [guidelinesAcknowledged, setGuidelinesAcknowledged] = useState(false);
```

### State Management Approach

The design follows the existing pattern in the codebase:

1. **Component State:** React `useState` for UI state
2. **Persistence:** localStorage for client-side preferences
3. **Server State:** API calls with response caching
4. **URL State:** Query parameters for shareable filter states

```typescript
// URL-based filter state sync
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  setActiveFilters({
    sort: (params.get('sort') as any) || 'recent',
    postType: params.get('type'),
    hashtag: params.get('hashtag')
  });
}, []);

// Update URL when filters change
useEffect(() => {
  const params = new URLSearchParams();
  if (activeFilters.sort !== 'recent') params.set('sort', activeFilters.sort);
  if (activeFilters.postType) params.set('type', activeFilters.postType);
  if (activeFilters.hashtag) params.set('hashtag', activeFilters.hashtag);

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params}`
    : window.location.pathname;
  window.history.replaceState({}, '', newUrl);
}, [activeFilters]);
```

---

## Business Process Diagrams

### Process 1: Hashtag Extraction Flow

```
+------------------+
| User Creates Post|
+--------+---------+
         |
         v
+------------------+
| Submit to API    |
| POST /posts      |
+--------+---------+
         |
         v
+------------------------+
| Extract hashtags from  |
| content using regex    |
| (max 5 hashtags)       |
+--------+---------------+
         |
         v
+------------------------+
| For each hashtag:      |
| 1. Normalize name      |
| 2. Upsert to hashtags  |
| 3. Update usage_count  |
+--------+---------------+
         |
         v
+------------------------+
| Insert post_hashtags   |
| junction records       |
+--------+---------------+
         |
         v
+------------------------+
| Return post with       |
| extracted hashtags     |
+------------------------+
```

### Process 2: Link Preview Fetching Flow

```
+------------------+     +------------------+
| User pastes URL  |---->| Detect URL in    |
| in post composer |     | content (client) |
+------------------+     +--------+---------+
                                  |
                                  v
                         +------------------+
                         | Call link-preview|
                         | API with URL     |
                         +--------+---------+
                                  |
                         +--------+---------+
                         |                  |
                    Cached?           Not Cached
                         |                  |
                         v                  v
                  +-------------+    +-------------+
                  | Return from |    | Fetch OG    |
                  | cache       |    | metadata    |
                  +-------------+    | (5s timeout)|
                                     +------+------+
                                            |
                              +-------------+-------------+
                              |                           |
                         Success                      Failure
                              |                           |
                              v                           v
                       +-------------+             +-------------+
                       | Store in DB |             | Return null |
                       | (30d cache) |             | (show URL)  |
                       +------+------+             +-------------+
                              |
                              v
                       +-------------+
                       | Return      |
                       | preview data|
                       +-------------+
```

### Process 3: Mentorship Request Flow

```
+------------------+
| User clicks      |
| "Request         |
| Mentorship"      |
+--------+---------+
         |
         v
+------------------------+
| Check existing request |
| or connection status   |
+--------+---------------+
         |
    +----+----+
    |         |
 Exists    No Request
    |         |
    v         v
+-------+  +------------------------+
| Show  |  | POST /mentorship       |
| status|  | {mentor_id, message?}  |
+-------+  +--------+---------------+
                    |
                    v
           +------------------------+
           | Create mentorship_     |
           | request record         |
           | status: 'pending'      |
           +--------+---------------+
                    |
                    v
           +------------------------+
           | Update UI:             |
           | Button -> "Pending"    |
           +------------------------+

--- Mentor Response ---

+------------------------+
| Mentor receives        |
| notification/sees      |
| pending request        |
+--------+---------------+
         |
         v
+------------------------+
| PUT /mentorship        |
| {action: accept/decline|
+--------+---------------+
         |
    +----+----+
    |         |
 Accept    Decline
    |         |
    v         v
+--------+ +--------+
| Update | | Update |
| status | | status |
| Create | | Notify |
| connect| | user   |
+--------+ +--------+
```

### Process 4: Combined Filter Application

```
+------------------+
| User selects     |
| filter options   |
+--------+---------+
         |
         v
+------------------------+
| Update activeFilters   |
| state object           |
+--------+---------------+
         |
    +----+----+
    |         |
    v         v
+--------+ +------------------+
| Update | | Trigger loadPosts|
| URL    | | with new filters |
+--------+ +--------+---------+
                    |
                    v
           +------------------------+
           | Build API query params |
           | from activeFilters     |
           +--------+---------------+
                    |
                    v
           +------------------------+
           | GET /posts?sort=...    |
           | &post_type=...         |
           | &hashtag=...           |
           +--------+---------------+
                    |
                    v
           +------------------------+
           | Apply filters on       |
           | server (Supabase)      |
           +--------+---------------+
                    |
                    v
           +------------------------+
           | Return filtered posts  |
           | Update UI              |
           +------------------------+
```

---

## localStorage Keys

All localStorage keys are prefixed with `community_` for namespace isolation.

| Key | Data Type | Purpose | Default |
|-----|-----------|---------|---------|
| `community_sidebar_collapsed` | `"true" \| "false"` | Sidebar collapse state | `"false"` |
| `community_guidelines_acknowledged_{userId}` | `"true" \| ISO date` | Guidelines modal shown | Not set |
| `community_onboarding_dismissed_{userId}` | `"true"` | Onboarding dashboard dismissed | Not set |
| `community_feed_filters` | JSON string | Last used filter state | `{}` |
| `community_friends_feed_last_viewed_{userId}` | ISO date string | Friends feed read timestamp | Not set (existing) |

### localStorage Manager Pattern

```typescript
// lib/communityStorage.ts

const KEYS = {
  SIDEBAR_COLLAPSED: 'community_sidebar_collapsed',
  GUIDELINES_ACK: (userId: string) => `community_guidelines_acknowledged_${userId}`,
  ONBOARDING_DISMISSED: (userId: string) => `community_onboarding_dismissed_${userId}`,
  FEED_FILTERS: 'community_feed_filters',
} as const;

export const communityStorage = {
  // Sidebar
  getSidebarCollapsed: (): boolean => {
    return localStorage.getItem(KEYS.SIDEBAR_COLLAPSED) === 'true';
  },
  setSidebarCollapsed: (collapsed: boolean): void => {
    localStorage.setItem(KEYS.SIDEBAR_COLLAPSED, String(collapsed));
  },

  // Guidelines
  hasAcknowledgedGuidelines: (userId: string): boolean => {
    return localStorage.getItem(KEYS.GUIDELINES_ACK(userId)) !== null;
  },
  acknowledgeGuidelines: (userId: string): void => {
    localStorage.setItem(KEYS.GUIDELINES_ACK(userId), new Date().toISOString());
  },

  // Onboarding
  hasOnboardingDismissed: (userId: string): boolean => {
    return localStorage.getItem(KEYS.ONBOARDING_DISMISSED(userId)) === 'true';
  },
  dismissOnboarding: (userId: string): void => {
    localStorage.setItem(KEYS.ONBOARDING_DISMISSED(userId), 'true');
  },

  // Feed Filters
  getFeedFilters: (): { sort?: string; postType?: string } => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.FEED_FILTERS) || '{}');
    } catch {
      return {};
    }
  },
  setFeedFilters: (filters: { sort?: string; postType?: string }): void => {
    localStorage.setItem(KEYS.FEED_FILTERS, JSON.stringify(filters));
  },
};
```

---

## Integration Points

### Files to Modify

#### Existing Files

| File | Modifications |
|------|---------------|
| `app/community/page.tsx` | Add filter state, sidebar persistence, URL params sync, guidelines modal trigger |
| `app/api/community/posts/route.ts` | Add hashtag processing, combined filter support, trending sort |
| `app/api/community/profile/route.ts` | Add profile completion calculation |
| `app/api/community/connections/route.ts` | Add mentorship flag support |
| `components/community/EssenceProfileOnboarding.tsx` | Integrate with onboarding dashboard |

#### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/YYYYMMDD_community_enhancements_phase1.sql` | Phase 1 schema changes |
| `supabase/migrations/YYYYMMDD_community_enhancements_phase2.sql` | Phase 2 schema changes |
| `app/api/community/preferences/route.ts` | User preferences API |
| `app/api/community/hashtags/route.ts` | Hashtag management API |
| `app/api/community/link-preview/route.ts` | Link preview fetching |
| `app/api/community/mentors/route.ts` | Mentor discovery API |
| `app/api/community/mentorship/route.ts` | Mentorship requests API |
| `app/api/community/trending/route.ts` | Trending content API |
| `app/api/community/onboarding/route.ts` | Onboarding state API |
| `lib/communityStorage.ts` | localStorage management |
| `components/community/SidebarCollapseButton.tsx` | Sidebar toggle |
| `components/community/CombinedFilterBar.tsx` | Filter controls |
| `components/community/CommentThread.tsx` | Nested comments |
| `components/community/GuidelinesModal.tsx` | Guidelines reminder |
| `components/community/MentorsTab.tsx` | Mentors view |
| `components/community/MentorCard.tsx` | Mentor display |
| `components/community/HashtagInput.tsx` | Hashtag entry |
| `components/community/TrendingTopics.tsx` | Trending sidebar |
| `components/community/LinkPreviewCard.tsx` | Link previews |
| `components/community/OnboardingDashboard.tsx` | New user welcome |

---

## Error Handling Strategy

### API Error Handling

```typescript
// Consistent error response format
interface APIError {
  error: string;
  details?: string;
  code?: string;
}

// Error codes
const ERROR_CODES = {
  UNAUTHORIZED: 'E001',
  NOT_FOUND: 'E002',
  VALIDATION: 'E003',
  RATE_LIMITED: 'E004',
  EXTERNAL_FAILURE: 'E005', // Link preview fetch failed
  DATABASE_ERROR: 'E006',
};
```

### Link Preview Error Handling

```typescript
// Graceful degradation for link previews
try {
  const preview = await fetchLinkPreview(url);
  return preview;
} catch (error) {
  // Log error but don't fail the post
  console.error('Link preview fetch failed:', error);
  return {
    url,
    title: null,
    description: null,
    image_url: null,
    error: 'Failed to fetch preview'
  };
}
```

### Client-Side Error Recovery

```typescript
// localStorage error handling
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    // localStorage might be disabled or full
    console.warn('localStorage access failed');
    return null;
  }
};
```

---

## Testing Strategy

### Unit Tests

- API route handlers
- Database functions
- localStorage manager
- Hashtag extraction regex
- Trending score calculation

### Integration Tests

- Filter combinations
- Mentorship request flow
- Link preview caching
- Onboarding completion tracking

### E2E Tests

- Sidebar collapse persistence
- Combined filter URL sync
- Guidelines modal first-post trigger
- Mentor search and request

---

## Performance Considerations

1. **Hashtag Suggestions:** Debounced input (150ms) with server-side limit
2. **Link Preview:** 5-second timeout, 30-day cache
3. **Trending Calculation:** Pre-computed scores updated via triggers
4. **Filter Changes:** Optimistic UI updates, <200ms response target
5. **Mentor List:** Paginated (20 per page), indexed queries

---

## Migration Order

1. Phase 1 Schema Migration
2. Phase 1 API Routes
3. Phase 1 UI Components
4. Phase 2 Schema Migration
5. Phase 2 API Routes
6. Phase 2 UI Components

---

Does the design look good? If so, we can move on to the implementation plan.
