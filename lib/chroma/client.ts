import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb';

const DEFAULT_CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';

export const CHUNKS_COLLECTION =
  process.env.CHROMA_CHUNKS_COLLECTION || 'documind_chunks';
export const DOCS_COLLECTION =
  process.env.CHROMA_DOCS_COLLECTION || 'documind_docs';

const clientCache = new Map<string, ChromaClient>();

export function getChromaClient(urlOverride?: string): ChromaClient {
  const targetUrl = (urlOverride && urlOverride.trim().length > 0) ? urlOverride.trim() : DEFAULT_CHROMA_URL;
  if (!clientCache.has(targetUrl)) {
    clientCache.set(targetUrl, new ChromaClient({ path: targetUrl }));
  }
  return clientCache.get(targetUrl)!;
}

let _embeddingFn: DefaultEmbeddingFunction | null = null;

export function getEmbeddingFunction(): DefaultEmbeddingFunction {
  if (!_embeddingFn) {
    _embeddingFn = new DefaultEmbeddingFunction();
  }
  return _embeddingFn;
}

export async function getChunksCollection(urlOverride?: string) {
  const client = getChromaClient(urlOverride);
  const ef = getEmbeddingFunction();
  return client.getOrCreateCollection({
    name: CHUNKS_COLLECTION,
    embeddingFunction: ef,
    metadata: { description: 'DocuMind AI document chunks with embeddings' },
  });
}

export async function getDocsCollection(urlOverride?: string) {
  const client = getChromaClient(urlOverride);
  const ef = getEmbeddingFunction();
  return client.getOrCreateCollection({
    name: DOCS_COLLECTION,
    embeddingFunction: ef,
    metadata: { description: 'DocuMind AI document metadata' },
  });
}
