# Requirements Document: Community Enhancements Phase 1-2

## Introduction

This document defines the requirements for enhancing the InterpretOS Community platform with foundational UI fixes and discovery/engagement features. These enhancements address user feedback regarding navigation persistence, filter functionality, content discovery, mentor engagement, and new user onboarding.

The implementation spans two phases:
- **Phase 1 (Foundation Fixes)**: Quick UI/UX improvements that enhance usability
- **Phase 2 (Discovery & Engagement)**: Features that improve content discovery and mentor/mentee connections

---

## Phase 1: Foundation Fixes

### Requirement 1.1: Sidebar Collapse State Persistence

**User Story:** As a user, I want my sidebar collapse preference to be remembered, so that I don't have to re-collapse it every time I visit the community page.

#### Acceptance Criteria

1. WHEN a user clicks the sidebar collapse button (<<) THEN the system SHALL store the collapsed state in localStorage.
2. WHEN a user returns to the community page THEN the system SHALL restore the sidebar to its previously saved state (collapsed or expanded).
3. WHEN a user has no saved preference THEN the system SHALL default to the expanded state.
4. WHEN the sidebar state changes THEN the system SHALL immediately persist the new state without requiring a page reload.

---

### Requirement 1.2: Combined Filter Functionality

**User Story:** As a user, I want to combine multiple filters (e.g., "Top Posts" + "Questions only"), so that I can find the most engaged posts of a specific type.

#### Acceptance Criteria

1. WHEN a user selects a sort option (Recent, Top, Following) AND a post type filter (Question, Win, Insight, Reflection) THEN the system SHALL apply both filters simultaneously.
2. WHEN combined filters are active THEN the UI SHALL clearly display all active filter selections.
3. WHEN a user clears one filter THEN the system SHALL retain the other active filters.
4. WHEN filters are applied THEN the URL query parameters SHALL reflect the current filter state for shareability.
5. WHEN a user navigates away and returns THEN the system SHALL restore the filter state from URL parameters if present.

---

### Requirement 1.3: Comment Threading UI Clarity

**User Story:** As a user, I want nested comment replies to be visually distinct and easy to follow, so that I can participate in complex discussions about interpreting scenarios.

#### Acceptance Criteria

1. WHEN a comment has replies THEN the system SHALL display nested replies with visual indentation (left margin/border).
2. WHEN viewing nested replies THEN each nesting level SHALL have progressively indented styling up to 3 levels deep.
3. WHEN replies exceed 3 levels of nesting THEN the system SHALL flatten subsequent replies with a "Replying to @username" indicator.
4. WHEN a user clicks "Reply" on a comment THEN the reply input SHALL appear directly below the target comment.
5. WHEN a comment thread is long (>5 replies) THEN the system SHALL show a "View more replies" link to expand.
6. WHEN viewing a thread THEN the system SHALL display a visual connector line from parent to child comments.

---

### Requirement 1.4: Community Guidelines Prominence

**User Story:** As a community member, I want community guidelines to be easily accessible and shown at key moments, so that I understand expected behavior before participating.

#### Acceptance Criteria

1. WHEN a user creates their first post THEN the system SHALL display a modal reminding them of community guidelines with a link to full guidelines.
2. WHEN the community guidelines link is in the footer THEN the system SHALL also display it in the sidebar under "Community Info".
3. WHEN a user views the guidelines modal THEN the system SHALL remember this (localStorage) and not show it again on subsequent posts.
4. WHEN a user clicks "Post" for the first time THEN the modal SHALL require acknowledgment before proceeding.

---

### Requirement 1.5: Chat Metric Clarification

**User Story:** As a user, I want the "6 Chats" metric in my profile to be understandable and actionable, so that I know what it represents and can access my conversations.

#### Acceptance Criteria

1. WHEN a user hovers over the "X Chats" metric THEN the system SHALL display a tooltip explaining "Active direct message conversations".
2. WHEN a user clicks the "X Chats" metric THEN the system SHALL navigate to the messages/conversations page.
3. WHEN displaying the chat count THEN the system SHALL only count conversations with at least one message.
4. WHEN the chat count is 0 THEN the system SHALL display "No chats yet" instead of "0 Chats".

---

## Phase 2: Discovery & Engagement

### Requirement 2.1: Mentors Tab Structure & Filtering

**User Story:** As a user seeking mentorship, I want to search and filter mentors by their specialties, experience, and availability, so that I can find the right mentor for my needs.

#### Acceptance Criteria

1. WHEN a user views the Mentors tab THEN the system SHALL display filter options for:
   - Specialty (VRS, Medical, Legal, Educational, Conference, etc.)
   - Years of experience (ranges: 0-2, 3-5, 6-10, 10+)
   - Availability status (Available, Limited, Not Available)
2. WHEN filters are applied THEN the mentor list SHALL update in real-time without page reload.
3. WHEN viewing a mentor card THEN the system SHALL display:
   - Name and profile photo
   - Years of experience
   - Primary specialties (up to 3)
   - Availability status with visual indicator (green/yellow/red)
   - Brief "What I offer" statement (from bio or dedicated field)
4. WHEN a user clicks "Request Mentorship" on a mentor profile THEN the system SHALL:
   - Create a mentorship connection request (new status type)
   - Send a notification to the mentor
   - Update the button to "Request Pending"
5. WHEN a mentor receives a mentorship request THEN they SHALL be able to Accept or Decline.
6. WHEN a mentorship is accepted THEN both users SHALL see a "Mentoring" badge on their connection.

---

### Requirement 2.2: Hashtag/Topic Tagging System

**User Story:** As a user, I want to add and discover hashtags on posts, so that I can find content about specific topics and increase my posts' discoverability.

#### Acceptance Criteria

1. WHEN a user creates or edits a post THEN the system SHALL allow adding up to 5 hashtags.
2. WHEN typing a hashtag (starting with #) THEN the system SHALL suggest existing hashtags based on input.
3. WHEN a post is saved with hashtags THEN the system SHALL:
   - Extract hashtags from the post content automatically
   - Store hashtags in a dedicated `post_hashtags` junction table
   - Increment usage count for each hashtag
4. WHEN a user clicks on a hashtag THEN the system SHALL filter the feed to show only posts with that hashtag.
5. WHEN viewing hashtag suggestions THEN the system SHALL prioritize hashtags by usage frequency.
6. WHEN a hashtag has not been used in 90 days AND has fewer than 5 total uses THEN the system MAY archive it from suggestions.

---

### Requirement 2.3: Trending/Popular Posts View

**User Story:** As a user, I want to see trending and popular posts, so that I can discover engaging content from the community.

#### Acceptance Criteria

1. WHEN a user selects "Trending" sort option THEN the system SHALL display posts ranked by a trending score calculated as:
   - Engagement (likes + comments × 2 + reactions) weighted by recency
   - Posts from the last 7 days weighted higher than older posts
2. WHEN a user selects "Popular This Week" THEN the system SHALL display the top 20 posts by engagement from the current week.
3. WHEN viewing the feed THEN the system SHALL display a "Trending Topics" section in the sidebar showing:
   - Top 5 hashtags by usage in the last 7 days
   - Each hashtag with post count
4. WHEN a post is trending THEN the system MAY display a "Trending" badge on the post card.
5. WHEN no posts meet trending criteria THEN the system SHALL fall back to showing recent posts with a message "No trending posts yet this week".

---

### Requirement 2.4: Enhanced New User Onboarding

**User Story:** As a new community member, I want guidance on who to follow, what to read, and how to complete my profile, so that I can quickly become an engaged member.

#### Acceptance Criteria

1. WHEN a user completes initial onboarding THEN the system SHALL display a "Welcome to the Community" dashboard with:
   - "Suggested People to Follow" (3-5 active members matching their interests)
   - "Popular Posts to Read" (3-5 highly-engaged posts relevant to their specialties)
   - "Complete Your Profile" checklist with progress indicator
2. WHEN suggesting people to follow THEN the system SHALL prioritize:
   - Users with matching specialties/settings
   - Users who are active (posted in last 30 days)
   - Users who are open to mentoring (if user indicated they want guidance)
3. WHEN displaying profile completion THEN the system SHALL track:
   - Profile photo added (20%)
   - Bio written (20%)
   - Specialties selected (20%)
   - First post created (20%)
   - First connection made (20%)
4. WHEN profile completion reaches 100% THEN the system SHALL:
   - Display a celebration message
   - Optionally award a "Profile Complete" badge
5. WHEN a user dismisses the onboarding dashboard THEN the system SHALL remember this preference and not show it again.
6. WHEN a user has not completed onboarding steps after 7 days THEN the system MAY send a gentle reminder email.

---

### Requirement 2.5: Link Preview Cards

**User Story:** As a user, I want links I share to display rich previews with title, description, and image, so that my posts are more engaging and informative.

#### Acceptance Criteria

1. WHEN a user pastes a URL into the post composer THEN the system SHALL attempt to fetch Open Graph metadata (title, description, image).
2. WHEN metadata is successfully fetched THEN the system SHALL display a preview card below the post content showing:
   - Site favicon or logo
   - Title (truncated to 100 characters)
   - Description (truncated to 200 characters)
   - Preview image (if available)
   - Domain name
3. WHEN a post with a link is saved THEN the system SHALL store the preview metadata with the post.
4. WHEN viewing a post with a link THEN the system SHALL display the preview card.
5. WHEN clicking the preview card THEN the system SHALL open the link in a new tab.
6. WHEN metadata fetch fails THEN the system SHALL display the URL as a simple clickable link.
7. WHEN a URL points to YouTube or Vimeo THEN the system SHALL display an embedded video player preview.
8. WHEN fetching metadata THEN the system SHALL timeout after 5 seconds and fallback to simple link display.
9. WHEN a user removes the URL from the post THEN the system SHALL also remove the preview card.

---

## Non-Functional Requirements

### NFR-1: Performance

1. Filter changes SHALL update the UI within 200ms.
2. Hashtag suggestions SHALL appear within 100ms of typing.
3. Link preview metadata fetching SHALL not block post submission.
4. Sidebar state changes SHALL persist without noticeable delay.

### NFR-2: Accessibility

1. All new UI elements SHALL be keyboard navigable.
2. Filter selections and active states SHALL be announced by screen readers.
3. Color-based status indicators (mentor availability) SHALL have text labels.
4. Comment threading visual indicators SHALL not rely solely on color.

### NFR-3: Mobile Responsiveness

1. All features SHALL function correctly on mobile viewports (320px - 768px).
2. Filter UI on mobile SHALL use a collapsible/modal pattern to save space.
3. Sidebar collapse state on mobile SHALL default to collapsed.
4. Touch targets SHALL be at least 44x44 pixels.

### NFR-4: Data Integrity

1. Hashtag extraction SHALL handle edge cases (hashtags in URLs, special characters).
2. Link preview data SHALL be cached to avoid repeated fetches.
3. Mentorship request status SHALL be tracked with timestamps for audit purposes.

---

## Out of Scope

- Video upload/hosting (only embeds from YouTube/Vimeo)
- Real-time notifications (future WebSocket implementation)
- Advanced recommendation algorithms (ML-based)
- Mobile native app features
- Post analytics dashboard (Phase 3)
- Polls and voting (Phase 4)
- Private group discussions (Phase 4)
- Badge/recognition system (Phase 4)

---

## Dependencies

- Existing `community_profiles` table for mentor data
- Existing `community_posts` table for content
- Existing `community_connections` table for mentorship tracking
- Existing engagement scoring logic in posts API
- localStorage API for client-side persistence
- Server-side URL metadata fetching capability

