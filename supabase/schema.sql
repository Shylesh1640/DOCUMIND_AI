-- ============================================================
-- DocuMind AI — Supabase PostgreSQL + pgvector Database Schema
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Table: documents
-- Stores document metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename        TEXT NOT NULL,
    filesize        BIGINT NOT NULL DEFAULT 0,
    filetype        TEXT NOT NULL DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'processing' 
                        CHECK (status IN ('processing', 'indexed', 'error')),
    chunk_count     INTEGER NOT NULL DEFAULT 0,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: document_chunks
-- Stores text chunks with their vector embeddings
-- ============================================================
CREATE TABLE IF NOT EXISTS document_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    chunk_index     INTEGER NOT NULL DEFAULT 0,
    token_count     INTEGER NOT NULL DEFAULT 0,
    embedding       VECTOR(1536),   -- text-embedding-3-small dimension
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================

-- Index for document lookups
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Index for chunk lookups by document
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);

-- HNSW vector index for fast approximate nearest neighbor search
-- (better performance than IVFFlat for smaller datasets)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
    ON document_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ============================================================
-- Function: search_document_chunks
-- Performs cosine similarity vector search with document join
-- ============================================================
CREATE OR REPLACE FUNCTION search_document_chunks(
    query_embedding  VECTOR(1536),
    match_threshold  FLOAT    DEFAULT 0.3,
    match_count      INTEGER  DEFAULT 5
)
RETURNS TABLE (
    chunk_id        UUID,
    document_id     UUID,
    document_name   TEXT,
    content         TEXT,
    chunk_index     INTEGER,
    similarity      FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id              AS chunk_id,
        dc.document_id     AS document_id,
        d.filename         AS document_name,
        dc.content         AS content,
        dc.chunk_index     AS chunk_index,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE d.status = 'indexed'
      AND 1 - (dc.embedding <=> query_embedding) >= match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================================
-- Function: auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Enable RLS on both tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by backend API only)
CREATE POLICY "service_role_all_documents"
    ON documents FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_all_chunks"
    ON document_chunks FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- Grant execute permission on the search function
-- ============================================================
GRANT EXECUTE ON FUNCTION search_document_chunks(VECTOR(1536), FLOAT, INTEGER) TO service_role;

-- ============================================================
-- Verification query — run after setup to confirm tables exist
-- ============================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
