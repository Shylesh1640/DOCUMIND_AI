/**
 * Text chunking utilities for RAG pipeline.
 * Splits documents into ~500-800 token chunks with ~100 token overlap.
 */

// Approximate token count: 1 token ≈ 4 characters for English text
const CHARS_PER_TOKEN = 4;
const TARGET_CHUNK_TOKENS = 650; // Middle of 500-800 range
const OVERLAP_TOKENS = 100;
const TARGET_CHUNK_CHARS = TARGET_CHUNK_TOKENS * CHARS_PER_TOKEN; // ~2600 chars
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN; // ~400 chars

export interface TextChunk {
  content: string;
  chunk_index: number;
  token_count: number;
  char_start: number;
  char_end: number;
}

/**
 * Estimate token count from character count.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Clean extracted text by removing excess whitespace, null bytes, etc.
 */
export function cleanText(text: string): string {
  return text
    .replace(/\0/g, '') // Remove null bytes
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\t/g, '    ') // Replace tabs
    .replace(/[ ]{3,}/g, '  ') // Collapse excessive spaces
    .replace(/\n{4,}/g, '\n\n\n') // Collapse excessive newlines
    .trim();
}

/**
 * Split text into overlapping chunks.
 * Uses sentence/paragraph boundaries when possible.
 */
export function chunkText(text: string): TextChunk[] {
  const cleaned = cleanText(text);

  if (!cleaned) return [];

  const totalTokens = estimateTokenCount(cleaned);

  // If text is short enough, return as single chunk
  if (totalTokens <= TARGET_CHUNK_TOKENS) {
    return [
      {
        content: cleaned,
        chunk_index: 0,
        token_count: totalTokens,
        char_start: 0,
        char_end: cleaned.length,
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let startPos = 0;
  let chunkIndex = 0;

  while (startPos < cleaned.length) {
    let endPos = Math.min(startPos + TARGET_CHUNK_CHARS, cleaned.length);

    // Try to end at a natural boundary (paragraph > sentence > word)
    if (endPos < cleaned.length) {
      // Look for paragraph break
      const paragraphBreak = cleaned.lastIndexOf('\n\n', endPos);
      if (paragraphBreak > startPos + TARGET_CHUNK_CHARS * 0.5) {
        endPos = paragraphBreak + 2;
      } else {
        // Look for sentence boundary (. ! ?)
        const sentenceBreak = findSentenceBreak(cleaned, endPos);
        if (sentenceBreak > startPos + TARGET_CHUNK_CHARS * 0.4) {
          endPos = sentenceBreak;
        } else {
          // Fall back to word boundary
          const wordBreak = cleaned.lastIndexOf(' ', endPos);
          if (wordBreak > startPos) {
            endPos = wordBreak + 1;
          }
        }
      }
    }

    const chunkContent = cleaned.slice(startPos, endPos).trim();

    if (chunkContent) {
      chunks.push({
        content: chunkContent,
        chunk_index: chunkIndex++,
        token_count: estimateTokenCount(chunkContent),
        char_start: startPos,
        char_end: endPos,
      });
    }

    // Move start with overlap
    if (endPos >= cleaned.length) break;
    startPos = Math.max(startPos + 1, endPos - OVERLAP_CHARS);

    // Find a good restart point
    const nextSentence = findNextSentenceStart(cleaned, startPos);
    if (nextSentence > startPos && nextSentence < endPos) {
      startPos = nextSentence;
    }
  }

  return chunks;
}

/**
 * Find the end of a sentence near a given position.
 */
function findSentenceBreak(text: string, nearPos: number): number {
  const searchStart = Math.max(0, nearPos - 200);
  const searchArea = text.slice(searchStart, nearPos);

  // Find last sentence ending (. ! ?) followed by space or newline
  const match = searchArea.match(/[.!?]+[\s\n]+(?=[A-Z\n])/g);
  if (match && match.length > 0) {
    const lastMatch = searchArea.lastIndexOf(match[match.length - 1]);
    if (lastMatch !== -1) {
      return searchStart + lastMatch + match[match.length - 1].length;
    }
  }

  return nearPos;
}

/**
 * Find the start of the next sentence from a given position.
 */
function findNextSentenceStart(text: string, fromPos: number): number {
  const searchArea = text.slice(fromPos, fromPos + 300);
  const match = searchArea.match(/[.!?]+[\s\n]+([A-Z])/);
  if (match && match.index !== undefined) {
    return fromPos + match.index + match[0].length - 1;
  }
  return fromPos;
}
