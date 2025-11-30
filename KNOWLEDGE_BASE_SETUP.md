# Knowledge Base Setup Guide

Your knowledge base schema is ready! Here's what to do:

## 1. Apply the New Migration

Run this command to apply the admin role migration:

```bash
npx supabase db push
```

This will:
- Add the `role` column to profiles (defaults to 'user')
- Create admin check function `is_admin()`
- Add helpful indexes and constraints
- Fix the admin policies in your knowledge base

## 2. Make Yourself an Admin

After the migration runs, update your profile to admin:

1. Go to Supabase Dashboard → SQL Editor
2. Run this (replace with your actual email):

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Or use this to find your user_id first:
```sql
SELECT id, email, role FROM profiles;
```

Then:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id-here';
```

## 3. Verify Knowledge Base is Working

Check that all tables and policies exist:

```sql
-- Check tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'knowledge%';

-- Check policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('knowledge_documents', 'knowledge_chunks');

-- Check your admin status
SELECT is_admin();  -- Should return true after you update your role
```

## 4. Test with Your Upload Script

Your upload script at `scripts/upload-all-books.ts` is ready to use:

```bash
npx tsx scripts/upload-all-books.ts
```

This will:
- Find all PDFs in `C:\Users\maddo\Desktop\interpreter_books`
- Skip duplicates
- Auto-categorize books
- Upload them with embeddings
- Track progress

## Schema Summary

### Tables Created:
- ✅ `knowledge_documents` - Stores PDF metadata
- ✅ `knowledge_chunks` - Stores text chunks with embeddings
- ✅ `profiles.role` - Admin permission column

### Functions Created:
- ✅ `search_knowledge(query_embedding, match_threshold, match_count)` - Semantic search
- ✅ `is_admin()` - Check if current user is admin

### Policies:
- ✅ All authenticated users can read knowledge base
- ✅ Only admins can upload/modify documents and chunks

### Indexes:
- ✅ IVFFLAT index on embeddings for fast similarity search
- ✅ Document lookup index
- ✅ Active documents filter index
- ✅ Unique constraint on (document_id, chunk_index)

## How Elya Uses This

In your `app/api/chat/route.ts`, the knowledge base is already integrated:

1. User asks Elya a question
2. Question is embedded using OpenAI
3. `search_knowledge()` finds relevant chunks from your PDFs
4. Chunks are added to Elya's context
5. Elya responds with cited information

## Performance Tips

After bulk uploading books:

```sql
-- Analyze table for better query planning
ANALYZE knowledge_chunks;

-- For higher recall in searches, use:
SET LOCAL ivfflat.probes = 10;
```

## Troubleshooting

**If admin policies fail:**
- Make sure you ran the migration: `npx supabase db push`
- Check your role: `SELECT role FROM profiles WHERE id = auth.uid();`
- Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename LIKE 'knowledge%';`

**If search returns no results:**
- Check embeddings exist: `SELECT COUNT(*) FROM knowledge_chunks WHERE embedding IS NOT NULL;`
- Check documents are active: `SELECT COUNT(*) FROM knowledge_documents WHERE is_active = true;`
- Lower the threshold: Call `search_knowledge(embedding, 0.5, 10)` instead of default 0.7

**If uploads fail:**
- Verify you're admin: `SELECT is_admin();`
- Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'knowledge_documents';`
- Ensure OpenAI API key is set in `.env.local`

## Next Steps

1. ✅ Apply migration: `npx supabase db push`
2. ✅ Make yourself admin (SQL above)
3. ✅ Upload books: `npx tsx scripts/upload-all-books.ts`
4. ✅ Test Elya's knowledge: Ask her about interpreting techniques!

Your knowledge base is production-ready! 🎉
