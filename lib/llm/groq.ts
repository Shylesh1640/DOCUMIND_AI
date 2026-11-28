/**
 * Groq LLM client — primary chat provider.
 * Uses Llama 3.3 70B by default (fast, free tier available).
 * Docs: https://console.groq.com/docs/openai
 */
import Groq from 'groq-sdk';

const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatWithGroq(
  messages: LLMMessage[],
  modelOverride?: string,
  apiKeyOverride?: string
): Promise<{ content: string; model: string }> {
  const key = apiKeyOverride || process.env.GROQ_API_KEY;

  if (!key) {
    throw new Error('Groq API Key is not set. Please click the ⚙️ Settings / Key icon in the top right to enter your Groq API key.');
  }

  const groq = new Groq({ apiKey: key });
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

export { DEFAULT_GROQ_MODEL as GROQ_MODEL };
