/**
 * Groq LLM client — primary chat provider.
 * Uses Llama 3.3 70B by default (fast, free tier available).
 * Docs: https://console.groq.com/docs/openai
 */
import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY || 'missing';
const groq = new Groq({
  apiKey,
});

const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatWithGroq(
  messages: LLMMessage[],
  modelOverride?: string
): Promise<{ content: string; model: string }> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY environment variable');
  }

  const model = modelOverride || DEFAULT_GROQ_MODEL;

  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.1,
    max_tokens: 2048,
    top_p: 1,
  });

  const content = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
  return { content, model: completion.model || model };
}

export { groq, DEFAULT_GROQ_MODEL as GROQ_MODEL };
