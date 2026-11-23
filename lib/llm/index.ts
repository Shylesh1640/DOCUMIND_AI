/**
 * Unified LLM router — selects Groq or OpenRouter based on request or LLM_PROVIDER env var.
 * Default: Groq (faster, free-tier friendly).
 */
import type { LLMMessage } from './groq';

export async function chat(
  messages: LLMMessage[],
  preferredProvider?: 'groq' | 'openrouter',
  modelOverride?: string
): Promise<{ content: string; model: string; provider: string }> {
  const provider = (preferredProvider || process.env.LLM_PROVIDER || 'groq').toLowerCase();

  if (provider === 'openrouter') {
    const { chatWithOpenRouter } = await import('./openrouter');
    const result = await chatWithOpenRouter(messages, modelOverride);
    return { ...result, provider: 'openrouter' };
  }

  // Default: Groq
  const { chatWithGroq } = await import('./groq');
  const result = await chatWithGroq(messages, modelOverride);
  return { ...result, provider: 'groq' };
}

export type { LLMMessage };
