import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSION = 1536;
const MAX_TOKENS_PER_BATCH = 8000;

/**
 * Generate a single embedding for a text string.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\n+/g, ' ').trim();

  if (!cleanText) {
    throw new Error('Cannot generate embedding for empty text');
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleanText,
    dimensions: EMBEDDING_DIMENSION,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batches.
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  // Process in batches to respect token limits
  const batchSize = 20;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map((t) => t.replace(/\n+/g, ' ').trim());

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: EMBEDDING_DIMENSION,
    });

    // Sort by index to ensure correct order
    const sorted = response.data.sort((a, b) => a.index - b.index);
    results.push(...sorted.map((d) => d.embedding));
  }

  return results;
}

export { openai, EMBEDDING_MODEL, EMBEDDING_DIMENSION, MAX_TOKENS_PER_BATCH };
