import { NextRequest, NextResponse } from 'next/server';
import { searchSimilarChunks, buildRAGContext, buildSystemPrompt } from '@/lib/rag/retrieval';
import { chat } from '@/lib/llm';
import type { ChatRequest, ChatResponse, SourceCitation } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest & {
      groqApiKey?: string;
      openrouterApiKey?: string;
      chromaUrl?: string;
    } = await request.json();

    const {
      message,
      conversation_history = [],
      provider,
      model,
      groqApiKey,
      openrouterApiKey,
      chromaUrl,
    } = body;

    // Also check headers if sent via headers
    const reqGroqKey = groqApiKey || request.headers.get('x-groq-api-key') || undefined;
    const reqOpenRouterKey = openrouterApiKey || request.headers.get('x-openrouter-api-key') || undefined;
    const reqChromaUrl = chromaUrl || request.headers.get('x-chroma-url') || undefined;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 4000) {
      return NextResponse.json({ error: 'Message too long (max 4000 characters)' }, { status: 400 });
    }

    // Step 1: Retrieve relevant chunks via ChromaDB vector similarity search
    let relevantChunks: Awaited<ReturnType<typeof searchSimilarChunks>> = [];
    try {
      relevantChunks = await searchSimilarChunks(message.trim(), 5, 0.3, reqChromaUrl);
    } catch (chromaErr) {
      console.warn('Chroma retrieval notice:', chromaErr);
      // If ChromaDB is not yet connected/running, we proceed with 0 retrieved chunks and note it
    }

    // Step 2: Build RAG context from retrieved chunks
    const ragContext = buildRAGContext(relevantChunks);

    // Step 3: Build system prompt with retrieved context
    const systemPrompt = buildSystemPrompt(ragContext);

    // Step 4: Build conversation messages
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    const recentHistory = conversation_history.slice(-12);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    messages.push({ role: 'user', content: message.trim() });

    // Step 5: Choose active API key based on provider
    const activeApiKey = (provider === 'openrouter') ? reqOpenRouterKey : reqGroqKey;

    // Step 6: Generate answer via Groq or OpenRouter
    const { content: answer, model: modelUsed, provider: providerUsed } = await chat(
      messages,
      provider,
      model,
      activeApiKey
    );

    // Step 7: Build source citations
    const sources: SourceCitation[] = relevantChunks.map((chunk, index) => ({
      document_id: chunk.document_id,
      document_name: chunk.document_name,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      similarity: chunk.similarity,
      reference_number: index + 1,
    }));

    const response: ChatResponse = {
      answer,
      sources,
      model_used: modelUsed,
      provider: providerUsed,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
