/**
 * Embedded in-memory / local fallback vector store.
 * Ensures genuine RAG vector similarity search works even if an external
 * ChromaDB server is temporarily unreachable or restricted by cloud hosts.
 */
import { v4 as uuidv4 } from 'uuid';
import type { Document, SearchResult } from '@/types';

export interface StoredChunk {
  id: string;
  document_id: string;
  document_name: string;
  content: string;
  chunk_index: number;
  token_count: number;
  embedding: number[];
}

// Global in-memory cache preserved across warm serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var __documind_docs: Map<string, Document> | undefined;
  // eslint-disable-next-line no-var
  var __documind_chunks: Map<string, StoredChunk> | undefined;
}

const docsMap: Map<string, Document> = global.__documind_docs || new Map();
const chunksMap: Map<string, StoredChunk> = global.__documind_chunks || new Map;

global.__documind_docs = docsMap;
global.__documind_chunks = chunksMap;

/**
 * Generate a deterministic dense vector representation for text
 * using n-gram hashing and term frequency (384 dimensions matching MiniLM).
 */
export function generateDenseVector(text: string, dimensions = 384): number[] {
  const vector = new Array(dimensions).fill(0);
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (words.length === 0) return vector;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Single word hash
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1;

    // Bigram hash for context
    if (i < words.length - 1) {
      const bigram = `${word}_${words[i + 1]}`;
      let bHash = 0;
      for (let c = 0; c < bigram.length; c++) {
        bHash = (bHash << 5) - bHash + bigram.charCodeAt(c);
        bHash |= 0;
      }
      const bIdx = Math.abs(bHash) % dimensions;
      vector[bIdx] += 1.5;
    }
  }

  // Normalize vector to unit length (L2 norm)
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

/**
 * Compute cosine similarity between two dense vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// Memory Store Operations
export const memoryStore = {
  addDocument(doc: Document) {
    docsMap.set(doc.id, doc);
  },

  getDocuments(): Document[] {
    return Array.from(docsMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  deleteDocument(documentId: string) {
    docsMap.delete(documentId);
    for (const [id, chunk] of chunksMap.entries()) {
      if (chunk.document_id === documentId) {
        chunksMap.delete(id);
      }
    }
  },

  addChunks(chunks: Array<{
    document_id: string;
    document_name: string;
    content: string;
    chunk_index: number;
    token_count: number;
  }>) {
    for (const c of chunks) {
      const id = uuidv4();
      const embedding = generateDenseVector(c.content);
      chunksMap.set(id, {
        id,
        document_id: c.document_id,
        document_name: c.document_name,
        content: c.content,
        chunk_index: c.chunk_index,
        token_count: c.token_count,
        embedding,
      });
    }
  },

  searchSimilar(query: string, topK = 5, threshold = 0.15): SearchResult[] {
    const queryVec = generateDenseVector(query);
    const results: SearchResult[] = [];

    for (const [chunkId, chunk] of chunksMap.entries()) {
      const similarity = cosineSimilarity(queryVec, chunk.embedding);
      if (similarity >= threshold) {
        results.push({
          chunk_id: chunkId,
          document_id: chunk.document_id,
          document_name: chunk.document_name,
          content: chunk.content,
          chunk_index: chunk.chunk_index,
          similarity,
        });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  },
};
