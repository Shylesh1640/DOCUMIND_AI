// Core types for DocuMind AI

export interface Document {
  id: string;
  filename: string;
  filesize: number;
  filetype: string;
  created_at: string;
  chunk_count: number;
  status: 'processing' | 'indexed' | 'error';
  error_message?: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  token_count: number;
  metadata: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: SourceCitation[];
  isLoading?: boolean;
  model_used?: string;
  provider?: string;
}

export interface SourceCitation {
  document_id: string;
  document_name: string;
  chunk_index: number;
  content: string;
  similarity: number;
  reference_number: number;
}

export interface ChatRequest {
  message: string;
  conversation_history?: { role: 'user' | 'assistant'; content: string }[];
  provider?: 'groq' | 'openrouter';
  model?: string;
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  model_used?: string;
  provider?: string;
}

export interface UploadResponse {
  success: boolean;
  document_id?: string;
  filename?: string;
  chunk_count?: number;
  error?: string;
}

export interface SearchResult {
  chunk_id: string;
  document_id: string;
  document_name: string;
  content: string;
  chunk_index: number;
  similarity: number;
}

export interface ApiError {
  error: string;
  details?: string;
  status?: number;
}
