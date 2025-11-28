# InterpreterOS Architecture & Roadmap

## Your Questions Answered

### 1. Skills Route on Front Page
**Question**: "Is the skills route with skills dashboard listed on the front page?"

**Current State**: The Skills Dashboard exists at `/skills` but is NOT prominently linked from the homepage.

**Recommendation**: Add a direct link in the navigation and/or add a section on the homepage that previews the Skills Dashboard with a CTA to access it. The Skills Dashboard is a core differentiator and should be featured.

**Where to add**:
- NavBar component: Add "Skills" link alongside Dashboard, Coach
- Homepage: Add a section after OSPreview that highlights the Skills tracking with visual preview
- Footer: Include in main navigation links

---

### 2. CEU Requirements & Structure

**Question**: "Do you think Basic $12 without CEUs and Pro $25 with CEUs will cover us? We have the CEU sponsor packet in our codebase."

**Answer**: Yes, this pricing structure makes sense. Here's why:

**Basic ($12/mo)** - Core professional tools:
- Assignment prep & reflection
- Burnout tracking
- Skills dashboard (self-assessment)
- No CEU automation

**Pro ($25/mo)** - Professional development tier:
- Everything in Basic
- CEU alignment & tracking
- Automated evidence collection
- Agent access (Catalyst coach)
- This tier is for interpreters who need to maintain certification

**CEU Implementation Requirements**:

Based on typical interpreter certification requirements (RID, state certifications):

1. **CEU Tracking Features** (Pro tier only):
   - Track hours by category (Professional Studies, Professional Development, etc.)
   - Link reflections/activities to CEU categories
   - Auto-generate CEU evidence reports
   - Export formatted CEU logs for submission

2. **Database Schema** (already have foundation):
   ```sql
   -- Add CEU tracking columns to practice_sessions
   ALTER TABLE practice_sessions ADD COLUMN ceu_category TEXT;
   ALTER TABLE practice_sessions ADD COLUMN ceu_hours DECIMAL(4,2);

   -- Add CEU exports table
   CREATE TABLE ceu_exports (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     period_start DATE,
     period_end DATE,
     total_hours DECIMAL(4,2),
     export_data JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **CEU Categories** (align with RID standards):
   - Professional Studies (0.1 CEU = 1 hour)
   - Professional Development
   - Ethical/Professional Conduct
   - Performance/Language
   - Self-study with verification

**Next Step**: Need to see the CEU sponsor packet you mentioned to ensure alignment with specific certification body requirements.

---

### 3. Interpreter Resources Repository

**Question**: "I was going to build a repository with a LOT of interpreter books and resources that will inform our multiagent system. How will that work and tie in?"

**Answer**: This is a powerful idea. Here's the recommended architecture:

**Resource Repository Structure**:

```
/resources/
  /books/
    - medical-interpreting-handbook.pdf
    - legal-terminology-guide.pdf
    - role-space-ethics.pdf
  /articles/
    - burnout-research/
    - power-dynamics/
    - ethical-frameworks/
  /glossaries/
    - medical-terms.json
    - legal-terms.json
    - asl-classifiers.json
  /case-studies/
    - difficult-assignments/
    - ethical-dilemmas/
```

**Integration with Multiagent System**:

1. **Vector Database** (Recommended: Supabase pgvector or Pinecone):
   - Chunk and embed all PDF/text content
   - Store embeddings in vector DB
   - Enables semantic search across all resources

2. **Agent Access Pattern**:
   ```typescript
   // When user asks for prep help
   Catalyst Agent →
     1. Understand context (medical, legal, etc.)
     2. Query vector DB for relevant sections
     3. Retrieve: terminology, best practices, ethical considerations
     4. Generate personalized prep guidance
   ```

3. **RAG (Retrieval Augmented Generation)**:
   - Agent queries: "What are the ethical considerations for this type of assignment?"
   - System retrieves relevant passages from your book collection
   - Agent synthesizes answer grounded in expert resources

4. **Knowledge Base Tables**:
   ```sql
   CREATE TABLE resource_library (
     id UUID PRIMARY KEY,
     title TEXT,
     author TEXT,
     type TEXT, -- 'book', 'article', 'glossary'
     category TEXT, -- 'medical', 'legal', 'ethics', etc.
     content_chunks JSONB, -- chunked text
     embeddings vector(1536), -- OpenAI embeddings
     metadata JSONB
   );
   ```

**Why This Matters**:
- Agents give advice grounded in authoritative interpreter education
- Not just generic AI responses
- Can cite sources ("According to 'Medical Interpreter Handbook'...")
- Continuously improves as you add more resources

---

### 4. Multiagent Architecture

**Question**: "Is the multiagent going to be centralized like Microsoft Copilot?"

**Answer**: Recommended architecture is **Hybrid Centralized-Specialized**:

**Microsoft Copilot Model** (Centralized):
- One main AI that handles all queries
- Simple for users, but less specialized

**InterpretReflect Model** (Specialized Agents with Central Orchestration):

```
User Input
    ↓
┌───────────────────────────────┐
│   Central Orchestrator        │
│   (Routes to right agent)     │
└───────────────────────────────┘
         ↓
    ┌────┴────┬─────────┬──────────┐
    ↓         ↓         ↓          ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Catalyst│ │ Prep   │ │ Skills │ │Reflect │
│ Coach  │ │ Agent  │ │ Agent  │ │ Agent  │
└────────┘ └────────┘ └────────┘ └────────┘
    │         │         │          │
    └─────────┴─────────┴──────────┘
              ↓
    Knowledge Base (Your Books)
```

**Agent Specializations**:

1. **Catalyst (Coaching Agent)** [Already in codebase]:
   - Wellbeing check-ins
   - Burnout pattern recognition
   - Emotional processing
   - Career guidance

2. **Prep Agent** [To build]:
   - Assignment research
   - Terminology generation
   - Participant background
   - Context building

3. **Skills Agent** [To build]:
   - Skill assessment
   - Practice recommendations
   - Growth tracking
   - Gap analysis

4. **Reflect Agent** [To build]:
   - Post-assignment debriefing
   - CEU evidence extraction
   - Pattern identification
   - Learning extraction

**Central Orchestrator**:
- User asks: "Help me prep for tomorrow's medical assignment"
- Orchestrator routes to Prep Agent
- Prep Agent accesses medical terminology from your resource library
- Returns personalized prep plan

**Why Not Fully Centralized**:
- Specialized agents have focused system prompts
- Better performance on domain-specific tasks
- Easier to maintain and improve individual agents
- Can use different models per agent (cheaper models for simple tasks)

**Implementation** (already have foundation):
- Agent events table already exists in Supabase
- CatalystChat component shows the pattern
- Need to add: orchestrator logic, additional specialized agents

---

### 5. Agency Platform

**Question**: "Are we building the agency platform?"

**Recommendation**: **Phase this carefully**

**Phase 1: Individual Interpreter Focus** (Current):
- All features for individual interpreters
- Basic team coordination (share prep with co-interpreter)
- This is what Basic and Pro tiers deliver

**Phase 2: Interpreter Team Features** (6-12 months):
- Team dashboards (current Contact Us tier)
- Anonymized load monitoring for supervisors
- This is the "Programs & Organizations" tier we already have in pricing

**Phase 3: Agency Platform** (12-24 months):
- **Only build if there's clear demand**
- Would include:
  - Assignment distribution/scheduling
  - Interpreter matching
  - Client management
  - Billing integration
  - Quality assurance workflows

**Recommendation**: DON'T build full agency platform yet. Here's why:
- Focus on making the interpreter experience exceptional first
- Agencies are a different buyer with complex procurement
- Most interpreters work across multiple agencies, not just one
- Your differentiator is being the interpreter's personal OS, not replacing agency systems

**Instead**: Build integrations
- Import assignments from agency platforms (calendar sync, API integrations)
- Export data to agency systems
- Partner with agencies rather than compete

---

### 6. CEU Process

**Question**: "Are we building the CEU process?"

**Answer**: **Yes, but automate what interpreters already do**

**Don't Build**:
- CEU approval/sponsorship system (too complex, regulatory)
- Become an actual CEU provider

**Do Build** (Pro tier):
1. **Automatic Evidence Collection**:
   - User reflects on assignment → system tags relevant learnings
   - Links reflection to CEU category
   - Tracks hours automatically

2. **CEU Export/Reporting**:
   - Generate formatted reports for certification submission
   - Export as PDF/CSV matching RID format
   - "CEU Portfolio" view showing all evidence

3. **Activity Mapping**:
   ```typescript
   Activity → CEU Category
   - Practice session (Medical terminology) → Professional Studies
   - Reflection on ethical dilemma → Ethical Conduct
   - Catalyst coaching conversation → Professional Development
   ```

4. **Dashboard View**:
   - "CEU Progress" widget on dashboard
   - Shows hours by category
   - Alerts when renewal period approaching

**Example User Flow**:
1. Interpreter completes medical assignment
2. Uses Reflect Agent for debrief
3. System automatically:
   - Logs 1.5 hours to "Professional Studies" (medical domain)
   - Captures evidence (reflection text, date, participants)
   - Updates CEU dashboard
4. At renewal time: Export all evidence with one click

**Implementation**:
- Already have: practice_sessions table
- Need to add: CEU mapping logic, export functionality
- Pro tier feature: automates what interpreters currently do manually in spreadsheets

---

## Recommended Build Order

### Phase 1 (Next 2 months):
1. ✅ Complete marketing site integration
2. ✅ Apply Supabase migrations (skills tables)
3. ⏳ Build basic CEU tracking (Pro tier)
4. ⏳ Enhance Prep workflow with resource library integration
5. ⏳ Add Skills route to homepage navigation

### Phase 2 (Months 3-4):
1. Vector database setup for resource library
2. Prep Agent implementation
3. Skills Agent implementation
4. Reflect Agent implementation
5. Central orchestrator

### Phase 3 (Months 5-6):
1. CEU export/reporting
2. Team features (Programs tier)
3. Advanced analytics

### Phase 4 (Months 7+):
1. Evaluate agency platform demand
2. Build integrations instead of full platform
3. Enterprise features based on actual customer requests

---

## Technical Architecture Summary

**Current Stack**:
- Frontend: Next.js 14 (App Router)
- Database: Supabase (PostgreSQL + Auth + RLS)
- Hosting: Vercel
- AI: OpenAI API (for agents)

**Recommended Additions**:
- Vector DB: Supabase pgvector extension (for resource library)
- File Storage: Supabase Storage (for PDFs, documents)
- Background Jobs: Vercel Cron or Supabase Edge Functions
- Email: Resend or SendGrid (for CEU reminders, reports)

**Agent Architecture**:
- Framework: LangChain or custom with OpenAI SDK
- Orchestration: Simple routing based on user intent
- Memory: Agent events table (already have)
- Knowledge: Vector DB (RAG pattern)

---

## Next Steps

1. **Find the CEU sponsor packet** you mentioned - review requirements
2. **Apply the Supabase migration** for skills tables
3. **Deploy current version** to Vercel
4. **Prioritize**: Resource library integration vs CEU automation
5. **User testing**: Get feedback on current features before building more

The architecture is solid. The pricing makes sense. The roadmap should focus on individual interpreters first, then expand to teams/programs based on actual demand.
