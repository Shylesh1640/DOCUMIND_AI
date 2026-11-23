/**
 * ChromaDB client setup for DocuMind AI.
 * Connects to a running ChromaDB server (local or hosted).
 *
 * To start ChromaDB locally:
 *   Docker:  docker run -p 8000:8000 chromadb/chroma
 *   Python:  pip install chromadb && chroma run --path ./chroma_data
 */
import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb';

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';

export const CHUNKS_COLLECTION =
  process.env.CHROMA_CHUNKS_COLLECTION || 'documind_chunks';
export const DOCS_COLLECTION =
  process.env.CHROMA_DOCS_COLLECTION || 'documind_docs';

// Singleton ChromaDB client
let _client: ChromaClient | null = null;

export function getChromaClient(): ChromaClient {
  if (!_client) {
    _client = new ChromaClient({ path: CHROMA_URL });
  }
  return _client;
}

// Shared embedding function (all-MiniLM-L6-v2, 384-dim, runs locally via ONNX)
let _embeddingFn: DefaultEmbeddingFunction | null = null;

export function getEmbeddingFunction(): DefaultEmbeddingFunction {
  if (!_embeddingFn) {
    _embeddingFn = new DefaultEmbeddingFunction();
  }
  return _embeddingFn;
}

/**
 * Get or create the chunks collection (with embeddings).
 */
export async function getChunksCollection() {
  const client = getChromaClient();
  const ef = getEmbeddingFunction();
  return client.getOrCreateCollection({
    name: CHUNKS_COLLECTION,
    embeddingFunction: ef,
    metadata: { description: 'DocuMind AI document chunks with embeddings' },
  });
}

/**
 * Get or create the documents metadata collection.
 */
export async function getDocsCollection() {
  const client = getChromaClient();
  const ef = getEmbeddingFunction();
  return client.getOrCreateCollection({
    name: DOCS_COLLECTION,
    embeddingFunction: ef,
    metadata: { description: 'DocuMind AI document metadata' },
  });
}
