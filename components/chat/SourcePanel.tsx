'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Hash } from 'lucide-react';
import { cn, truncateText } from '@/lib/utils';
import type { SourceCitation } from '@/types';

interface SourcePanelProps {
  sources: SourceCitation[];
}

export function SourcePanel({ sources }: SourcePanelProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2 space-y-2 w-full max-w-2xl">
      <div className="text-xs text-dark-500 font-medium uppercase tracking-wider mb-1">Retrieved Sources</div>
      {sources.map((source) => (
        <div key={source.reference_number} className="source-card">
          <button
            onClick={() => setExpanded(expanded === source.reference_number ? null : source.reference_number)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-navy-700/60 border border-navy-600/40 text-navy-300 rounded text-[10px] font-mono flex items-center justify-center">
                {source.reference_number}
              </span>
              <FileText className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" />
              <span className="text-sm text-dark-200 font-medium truncate max-w-[200px]">
                {source.document_name}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-dark-500">
                <Hash className="w-2.5 h-2.5" />
                chunk {source.chunk_index + 1}
              </div>
              <div
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full border',
                  source.similarity >= 0.7
                    ? 'bg-green-900/30 text-green-400 border-green-800/30'
                    : source.similarity >= 0.5
                    ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30'
                    : 'bg-dark-800 text-dark-500 border-dark-700'
                )}
              >
                {(source.similarity * 100).toFixed(0)}% match
              </div>
            </div>
            {expanded === source.reference_number ? (
              <ChevronDown className="w-3.5 h-3.5 text-dark-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-dark-500" />
            )}
          </button>

          {expanded === source.reference_number && (
            <div className="mt-2 pt-2 border-t border-dark-700/40">
              <p className="text-xs text-dark-300 leading-relaxed whitespace-pre-wrap">
                {truncateText(source.content, 600)}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
