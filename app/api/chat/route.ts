import { NextRequest, NextResponse } from 'next/server';
import { searchSimilarChunks, buildRAGContext, buildSystemPrompt } from '@/lib/rag/retrieval';
import { chat } from '@/lib/llm';
import type { ChatRequest, ChatResponse, SourceCitation } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversation_history = [], provider, model } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 4000) {
      return NextResponse.json({ error: 'Message too long (max 4000 characters)' }, { status: 400 });
    }

    // Step 1: Retrieve relevant chunks via ChromaDB vector similarity search
    const relevantChunks = await searchSimilarChunks(message.trim());

    // Step 2: Build RAG context from retrieved chunks
    const ragContext = buildRAGContext(relevantChunks);

    // Step 3: Build system prompt with retrieved context
    const systemPrompt = buildSystemPrompt(ragContext);

    // Step 4: Build conversation messages
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add recent conversation history (last 6 exchanges = 12 messages)
    const recentHistory = conversation_history.slice(-12);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Add current user message
    messages.push({ role: 'user', content: message.trim() });

    // Step 5: Generate answer via Groq or OpenRouter with selected model
    const { content: answer, model: modelUsed, provider: providerUsed } = await chat(
      messages,
      provider,
      model
    );

    // Step 6: Build source citations
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
      if (error.message.includes('API_KEY') || error.message.includes('api_key')) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (error.message.includes('rate_limit') || error.message.includes('rate limit')) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment.' }, { status: 429 });
      }
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ChromaDB')) {
        return NextResponse.json({ error: 'ChromaDB not reachable. Please ensure ChromaDB is running.' }, { status: 503 });
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
