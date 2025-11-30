# Elya Knowledge Base Management

This directory contains scripts for managing Elya's PDF knowledge base.

## Setup

1. **Environment Variables Required:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `OPENAI_API_KEY` - Your OpenAI API key (for embeddings)

2. **Database Migration:**
   Run the migration to set up the knowledge base tables:
   ```bash
   # Apply the migration through Supabase Studio or CLI
   # File: supabase/migrations/20250130_knowledge_base.sql
   ```

## Uploading PDFs

### Upload a Single PDF

```bash
npx tsx scripts/upload-pdf.ts "path/to/file.pdf" "Document Title" "category"
```

**Examples:**

```bash
# Medical terminology book
npx tsx scripts/upload-pdf.ts "./books/medical-interpreting.pdf" "Medical Interpreting Guide" "medical_terminology"

# Legal interpreting reference
npx tsx scripts/upload-pdf.ts "./books/legal-interpreting.pdf" "Legal Interpreting Handbook" "legal_interpreting"

# General interpreter theory
npx tsx scripts/upload-pdf.ts "./books/interpreter-theory.pdf" "Interpreter Theory & Practice" "interpreter_theory"

# ASL/Sign language specific
npx tsx scripts/upload-pdf.ts "./books/asl-linguistics.pdf" "ASL Linguistics" "sign_language"
```

### Categories

Recommended categories:
- `interpreter_theory` - General interpreting theory and best practices
- `medical_terminology` - Medical/healthcare interpreting resources
- `legal_interpreting` - Legal/court interpreting resources
- `sign_language` - ASL/sign language linguistics
- `ethics` - Professional ethics and standards
- `cultural_competency` - Cultural mediation resources
- `general` - Uncategorized documents

## How It Works

1. **PDF Processing:**
   - Script reads the PDF and extracts all text
   - Text is chunked into ~1000 character segments with 200 character overlap
   - This ensures context continuity across chunks

2. **Embeddings:**
   - Each chunk is converted to a vector embedding using OpenAI's `text-embedding-ada-002` model
   - Embeddings are 1536-dimensional vectors that capture semantic meaning
   - Cost: ~$0.0001 per 1,000 tokens (very cheap)

3. **Storage:**
   - Document metadata stored in `knowledge_documents` table
   - Chunks and embeddings stored in `knowledge_chunks` table
   - pgvector extension enables fast similarity search

4. **RAG (Retrieval Augmented Generation):**
   - When a user asks Elya a question, the question is converted to an embedding
   - pgvector finds the 5 most semantically similar chunks (using cosine similarity)
   - These chunks are injected into Claude's context
   - Claude answers using both its general knowledge AND your uploaded documents

## Example Workflow

Let's say you have 3 books to upload:

```bash
# Create a folder for your books
mkdir books

# Put your PDFs in there, then upload them
npx tsx scripts/upload-pdf.ts "./books/medical-terminology-guide.pdf" "Medical Terminology for Interpreters" "medical_terminology"
npx tsx scripts/upload-pdf.ts "./books/interpreter-ethics.pdf" "Professional Ethics in Interpreting" "ethics"
npx tsx scripts/upload-pdf.ts "./books/asl-grammar.pdf" "ASL Grammar and Linguistics" "sign_language"
```

## Testing

After uploading, test it by asking Elya questions related to your uploaded content:

**User:** "What are the best practices for medical interpreting?"

**Elya will respond with:**
- Relevant passages from your uploaded "Medical Terminology for Interpreters" book
- Citations like "According to Medical Terminology for Interpreters, page 42..."
- Combined with Claude's general knowledge

## Managing Documents

### List all documents in knowledge base

```sql
SELECT
  id,
  title,
  category,
  page_count,
  upload_date,
  (SELECT COUNT(*) FROM knowledge_chunks WHERE document_id = knowledge_documents.id) as chunk_count
FROM knowledge_documents
WHERE is_active = true
ORDER BY upload_date DESC;
```

### Deactivate a document (soft delete)

```sql
UPDATE knowledge_documents
SET is_active = false
WHERE id = 'document-uuid-here';
```

### Hard delete a document (removes chunks too)

```sql
DELETE FROM knowledge_documents
WHERE id = 'document-uuid-here';
-- Chunks are automatically deleted due to CASCADE
```

## Cost Estimation

**OpenAI Embeddings:**
- Model: `text-embedding-ada-002`
- Cost: $0.0001 per 1,000 tokens
- A 200-page book ≈ 100,000 tokens
- Cost to embed: ~$0.01 per book

**Claude API:**
- Elya uses `claude-3-5-haiku-20241022`
- Input: $0.80 per million tokens
- Output: $4.00 per million tokens
- Knowledge base adds ~2-3k tokens per query (5 chunks × ~500 tokens)
- Additional cost per query: ~$0.002

**Total:** Very affordable! You can upload dozens of books for just a few dollars.

## Troubleshooting

**Error: "PDF contains no extractable text"**
- Your PDF might be scanned images rather than text
- Solution: Use OCR software to convert it to searchable PDF first

**Error: "OpenAI API rate limit"**
- You're processing chunks too fast
- The script processes in batches of 10 to avoid this
- For very large books, you might need to reduce batch size

**Error: "Failed to create document"**
- Check that you've run the database migration
- Verify your `SUPABASE_SERVICE_ROLE_KEY` is correct
- Make sure pgvector extension is enabled in Supabase

## Next Steps

1. Run the database migration
2. Add your OPENAI_API_KEY to `.env.local`
3. Upload your first PDF using the script
4. Test by asking Elya about content from that PDF
5. Upload more books as needed

Elya will automatically search the knowledge base on every query and cite sources when responding!
