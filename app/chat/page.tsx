'use client';

import { useState, useCallback } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { DocumentLibrary } from '@/components/documents/DocumentLibrary';
import { Sidebar } from '@/components/layout/Sidebar';
import type { Document } from '@/types';

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleDocumentsChange = useCallback((docs: Document[]) => {
    setDocuments(docs);
  }, []);

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        documentCount={documents.length}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content */}
      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
        {activeTab === 'chat' ? (
          <ChatPanel documents={documents} />
        ) : (
          <DocumentLibrary onDocumentsChange={handleDocumentsChange} />
        )}
      </main>
    </div>
  );
}
