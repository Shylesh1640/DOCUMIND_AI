/**
 * OpenRouter LLM client — alternative/fallback chat provider.
 * Uses the OpenAI-compatible API at openrouter.ai.
 * Provides access to 100+ models including free-tier options.
 * Docs: https://openrouter.ai/docs
 */
import OpenAI from 'openai';

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || 'missing',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'DocuMind AI',
  },
});

const DEFAULT_OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatWithOpenRouter(
  messages: LLMMessage[],
  modelOverride?: string
): Promise<{ content: string; model: string }> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('Missing OPENROUTER_API_KEY environment variable');
  }

  const model = modelOverride || DEFAULT_OPENROUTER_MODEL;

  const completion = await openrouter.chat.completions.create({
    model,
    messages,
    temperature: 0.1,
    max_tokens: 2048,
  });

  const content = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
  return { content, model: completion.model || model };
}

export { openrouter, DEFAULT_OPENROUTER_MODEL as OPENROUTER_MODEL };
