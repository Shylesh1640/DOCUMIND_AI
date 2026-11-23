'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Trash2, Bot, User, Loader2, AlertCircle, BookOpen, Cpu, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
import { SourcePanel } from '@/components/chat/SourcePanel';
import { cn } from '@/lib/utils';
import type { ChatMessage, Document } from '@/types';

interface ChatPanelProps {
  documents: Document[];
}

const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Fast & Smart)', provider: 'groq' as const },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Ultra Fast)', provider: 'groq' as const },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (MoE)', provider: 'groq' as const },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B (Google)', provider: 'groq' as const },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (OpenRouter)', provider: 'openrouter' as const },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B Free (OpenRouter)', provider: 'openrouter' as const },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Free (OpenRouter)', provider: 'openrouter' as const },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku (OpenRouter)', provider: 'openrouter' as const },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenRouter)', provider: 'openrouter' as const },
];

export function ChatPanel({ documents }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Build conversation history for context
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_history: history,
          provider: selectedModel.provider,
          model: selectedModel.id,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${response.status})`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        sources: data.sources || [],
        model_used: data.model_used || selectedModel.id,
        provider: data.provider || selectedModel.provider,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMsg);

      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `❌ Error: ${errorMsg}`,
        timestamp: new Date(),
        sources: [],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, selectedModel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleClear = useCallback(() => {
    setMessages([]);
    setError(null);
    setExpandedSources(null);
  }, []);

  const autoResize = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-dark-800 bg-dark-900/60 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-white">DocuMind AI</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-navy-900/70 text-navy-300 border border-navy-700/50">
              RAG
            </span>
          </div>
          <p className="text-xs text-dark-400 mt-0.5">
            {documents.length > 0
              ? `${documents.filter((d) => d.status === 'indexed').length} document(s) indexed in ChromaDB`
              : 'No documents uploaded — go to Documents tab to upload'}
          </p>
        </div>

        {/* Model Selector & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-dark-800/90 border border-dark-700/80 rounded-lg px-2.5 py-1.5 text-xs text-dark-200">
            <Cpu className="w-3.5 h-3.5 text-navy-400" />
            <select
              value={selectedModel.id}
              onChange={(e) => {
                const found = AVAILABLE_MODELS.find((m) => m.id === e.target.value);
                if (found) setSelectedModel(found);
              }}
              className="bg-transparent text-white text-xs outline-none cursor-pointer pr-1"
            >
              <optgroup label="Groq (Lightning Fast)">
                {AVAILABLE_MODELS.filter((m) => m.provider === 'groq').map((m) => (
                  <option key={m.id} value={m.id} className="bg-dark-900 text-white">
                    {m.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="OpenRouter (Multi-model)">
                {AVAILABLE_MODELS.filter((m) => m.provider === 'openrouter').map((m) => (
                  <option key={m.id} value={m.id} className="bg-dark-900 text-white">
                    {m.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-900/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {messages.length === 0 ? (
          <EmptyState hasDocuments={documents.some((d) => d.status === 'indexed')} />
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              expandedSources={expandedSources}
              onToggleSources={(id) => setExpandedSources(expandedSources === id ? null : id)}
            />
          ))
        )}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="p-2 bg-navy-800/40 rounded-full border border-navy-700/30">
              <Bot className="w-4 h-4 text-navy-300" />
            </div>
            <div className="message-bubble-assistant flex items-center gap-2">
              <div className="animate-typing flex gap-1">
                <span className="w-2 h-2 bg-navy-400 rounded-full inline-block" />
                <span className="w-2 h-2 bg-navy-400 rounded-full inline-block" />
                <span className="w-2 h-2 bg-navy-400 rounded-full inline-block" />
              </div>
              <span className="text-dark-400 text-sm">
                Searching ChromaDB & generating response with {selectedModel.provider === 'groq' ? 'Groq' : 'OpenRouter'}…
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-dark-800 p-4 bg-dark-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3 bg-dark-800 border border-dark-700 rounded-xl p-3 focus-within:border-navy-600 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={autoResize}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents…"
              className="flex-1 bg-transparent text-white placeholder-dark-500 resize-none outline-none text-sm leading-relaxed min-h-[24px] max-h-[160px]"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                'p-2 rounded-lg transition-all duration-200 flex-shrink-0',
                input.trim() && !isLoading
                  ? 'bg-navy-600 hover:bg-navy-500 text-white'
                  : 'bg-dark-700 text-dark-500 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-dark-500 mt-2 px-1">
            <span>Enter to send · Shift+Enter for new line</span>
            <span className="inline-flex items-center gap-1 text-dark-400">
              <Sparkles className="w-3 h-3 text-navy-400" />
              Model: {selectedModel.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  expandedSources,
  onToggleSources,
}: {
  message: ChatMessage;
  expandedSources: string | null;
  onToggleSources: (id: string) => void;
}) {
  const isUser = message.role === 'user';
  const hasSources = message.sources && message.sources.length > 0;

  return (
    <div className={cn('flex items-start gap-3 animate-slide-up', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'p-2 rounded-full border flex-shrink-0',
          isUser
            ? 'bg-navy-700/40 border-navy-600/30'
            : 'bg-dark-800/60 border-dark-700/30'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-navy-300" />
        ) : (
          <Bot className="w-4 h-4 text-dark-300" />
        )}
      </div>

      {/* Message content */}
      <div className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start', 'max-w-[85%]')}>
        <div className={isUser ? 'message-bubble-user' : 'message-bubble-assistant'}>
          {isUser ? (
            <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="markdown-content text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Model info and sources toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {message.model_used && (
            <span className="text-[10px] text-dark-500 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-navy-500" />
              {message.provider ? `${message.provider} / ` : ''}{message.model_used}
            </span>
          )}

          {hasSources && (
            <button
              onClick={() => onToggleSources(message.id)}
              className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-navy-300 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {message.sources!.length} source{message.sources!.length !== 1 ? 's' : ''} retrieved
              <span className="text-dark-600">{expandedSources === message.id ? '▲' : '▼'}</span>
            </button>
          )}

          <span className="text-[10px] text-dark-600">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {hasSources && expandedSources === message.id && (
          <div className="w-full">
            <SourcePanel sources={message.sources!} />
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasDocuments }: { hasDocuments: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="p-4 bg-navy-900/30 rounded-2xl border border-navy-800/30 mb-6">
        <Bot className="w-10 h-10 text-navy-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">DocuMind AI</h2>
      {hasDocuments ? (
        <>
          <p className="text-dark-400 max-w-md mb-6 text-sm leading-relaxed">
            Your documents are indexed in ChromaDB. Ask questions and get answers strictly grounded in your documents with exact source citations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md w-full">
            {[
              'Summarize the main topics in my documents',
              'What are the key findings?',
              'List the most important dates or deadlines',
              'What conclusions does the document draw?',
            ].map((prompt) => (
              <div
                key={prompt}
                className="text-left px-3 py-2.5 bg-dark-800/50 border border-dark-700/50 rounded-lg text-xs text-dark-300 cursor-default hover:border-dark-600"
              >
                {prompt}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-dark-400 max-w-md mb-6 text-sm leading-relaxed">
            No documents are indexed yet. Switch to the{' '}
            <strong className="text-dark-200">Documents</strong> tab to upload PDF, TXT, or DOCX files.
          </p>
          <p className="text-dark-500 text-xs">
            Text will be chunked, embedded, and stored in ChromaDB for instant vector search.
          </p>
        </>
      )}
    </div>
  );
}
