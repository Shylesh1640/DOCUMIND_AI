'use client';

import { Brain, MessageSquare, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: 'chat' | 'documents';
  onTabChange: (tab: 'chat' | 'documents') => void;
  documentCount: number;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ activeTab, onTabChange, documentCount, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-dark-900 border-r border-dark-800 transition-all duration-300 relative z-10',
          isOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-16 px-4 border-b border-dark-800', isOpen ? 'gap-3' : 'justify-center')}>
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="p-1.5 bg-navy-600/20 rounded-lg border border-navy-500/30 group-hover:bg-navy-600/30 transition-colors">
              <Brain className="w-5 h-5 text-navy-300" />
            </div>
            {isOpen && (
              <div>
                <span className="text-sm font-bold text-white">DocuMind</span>
                <span className="text-sm font-bold text-navy-400"> AI</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => onTabChange('chat')}
            className={cn('sidebar-item w-full', activeTab === 'chat' && 'active', !isOpen && 'justify-center px-0')}
            title={!isOpen ? 'Chat' : undefined}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="text-sm font-medium">Chat</span>}
          </button>

          <button
            onClick={() => onTabChange('documents')}
            className={cn('sidebar-item w-full', activeTab === 'documents' && 'active', !isOpen && 'justify-center px-0')}
            title={!isOpen ? 'Documents' : undefined}
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            {isOpen && (
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm font-medium">Documents</span>
                {documentCount > 0 && (
                  <span className="text-xs bg-navy-700/60 text-navy-300 px-1.5 py-0.5 rounded-full border border-navy-600/30">
                    {documentCount}
                  </span>
                )}
              </div>
            )}
          </button>
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-dark-800">
          <button
            onClick={onToggle}
            className={cn('sidebar-item w-full text-xs', !isOpen && 'justify-center px-0')}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? (
              <>
                <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs">Collapse</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
