-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base documents table
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  category TEXT, -- e.g., "interpreter_theory", "medical_terminology", "legal_interpreting"
  metadata JSONB DEFAULT '{}',
  page_count INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- Knowledge base chunks table (for RAG)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL, -- Order within the document
  page_number INTEGER, -- Original page number in PDF
  embedding VECTOR(1536), -- OpenAI ada-002 embeddings are 1536 dimensions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
ON knowledge_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for document lookup
CREATE INDEX IF NOT EXISTS knowledge_chunks_document_id_idx
ON knowledge_chunks(document_id);

-- Function to search knowledge base by semantic similarity
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  document_title TEXT,
  chunk_text TEXT,
  page_number INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kd.title as document_title,
    kc.chunk_text,
    kc.page_number,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kc.document_id = kd.id
  WHERE kd.is_active = true
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read knowledge base
CREATE POLICY "Allow authenticated users to read documents"
ON knowledge_documents FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Allow authenticated users to read chunks"
ON knowledge_chunks FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Allow admins to manage documents"
ON knowledge_documents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Allow admins to manage chunks"
ON knowledge_chunks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
