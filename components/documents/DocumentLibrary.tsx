'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  File,
} from 'lucide-react';
import { cn, formatFileSize, formatRelativeTime, getFileIcon } from '@/lib/utils';
import type { Document } from '@/types';

interface DocumentLibraryProps {
  onDocumentsChange: (docs: Document[]) => void;
}

export function DocumentLibrary({ onDocumentsChange }: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { name: string; progress: 'uploading' | 'processing' | 'done' | 'error'; error?: string }>>(new Map());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState<string | null>(null);

  const getChromaUrl = () => {
    try {
      const saved = localStorage.getItem('documind_api_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.chromaUrl || undefined;
      }
    } catch {
      // ignore
    }
    return undefined;
  };

  const fetchDocuments = useCallback(async () => {
    try {
      setFetchError(null);
      const chromaUrl = getChromaUrl();
      const res = await fetch('/api/documents', {
        headers: chromaUrl ? { 'x-chroma-url': chromaUrl } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data.documents || []);
      onDocumentsChange(data.documents || []);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [onDocumentsChange]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = useCallback(async (acceptedFiles: File[]) => {
    setUploadError(null);

    for (const file of acceptedFiles) {
      const uploadId = `${file.name}-${Date.now()}`;

      setUploadingFiles((prev) => new Map(prev).set(uploadId, { name: file.name, progress: 'uploading' }));

      const formData = new FormData();
      formData.append('file', file);

      try {
        setUploadingFiles((prev) => new Map(prev).set(uploadId, { name: file.name, progress: 'processing' }));

        const chromaUrl = getChromaUrl();
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: chromaUrl ? { 'x-chroma-url': chromaUrl } : {},
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Upload failed');
        }

        setUploadingFiles((prev) => new Map(prev).set(uploadId, { name: file.name, progress: 'done' }));

        // Refresh documents list
        await fetchDocuments();

        // Remove successful upload indicator after 3s
        setTimeout(() => {
          setUploadingFiles((prev) => {
            const next = new Map(prev);
            next.delete(uploadId);
            return next;
          });
        }, 3000);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setUploadingFiles((prev) =>
          new Map(prev).set(uploadId, { name: file.name, progress: 'error', error: errorMsg })
        );
        setUploadError(errorMsg);

        setTimeout(() => {
          setUploadingFiles((prev) => {
            const next = new Map(prev);
            next.delete(uploadId);
            return next;
          });
        }, 5000);
      }
    }
  }, [fetchDocuments]);

  const handleDelete = useCallback(async (documentId: string) => {
    if (!confirm('Delete this document and all its indexed chunks?')) return;

    setDeletingIds((prev) => new Set(prev).add(documentId));

    try {
      const chromaUrl = getChromaUrl();
      const res = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
        headers: chromaUrl ? { 'x-chroma-url': chromaUrl } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      await fetchDocuments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
    }
  }, [fetchDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 bg-dark-900/50">
        <div>
          <h1 className="text-lg font-semibold text-white">Document Library</h1>
          <p className="text-xs text-dark-400">
            {documents.length > 0
              ? `${documents.length} document${documents.length !== 1 ? 's' : ''} · ${documents.filter((d) => d.status === 'indexed').length} indexed`
              : 'Upload documents to build your knowledge base'}
          </p>
        </div>
        <button
          onClick={fetchDocuments}
          className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Upload zone */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
            isDragActive
              ? 'border-navy-500 bg-navy-900/20'
              : 'border-dark-700 hover:border-dark-600 hover:bg-dark-800/30'
          )}
        >
          <input {...getInputProps()} />
          <Upload className={cn('w-10 h-10 mx-auto mb-3', isDragActive ? 'text-navy-400' : 'text-dark-500')} />
          <p className="text-sm font-medium text-dark-200 mb-1">
            {isDragActive ? 'Drop files here' : 'Drag & drop documents here'}
          </p>
          <p className="text-xs text-dark-500 mb-3">
            or click to browse · PDF, TXT, DOCX · Max 50MB
          </p>
          <span className="btn-primary text-xs px-4 py-2 inline-block">Choose Files</span>
        </div>

        {/* Upload error */}
        {uploadError && (
          <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {uploadError}
          </div>
        )}

        {/* Uploading files */}
        {uploadingFiles.size > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-dark-400 uppercase tracking-wider">Uploading</h3>
            {Array.from(uploadingFiles.entries()).map(([id, file]) => (
              <div key={id} className="glass-card p-3 flex items-center gap-3">
                <div className="p-2 bg-dark-800 rounded-lg">
                  <File className="w-4 h-4 text-dark-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className={cn(
                    'text-xs',
                    file.progress === 'error' ? 'text-red-400' :
                    file.progress === 'done' ? 'text-green-400' : 'text-dark-400'
                  )}>
                    {file.progress === 'uploading' && 'Uploading…'}
                    {file.progress === 'processing' && 'Extracting text & generating embeddings…'}
                    {file.progress === 'done' && '✓ Indexed successfully'}
                    {file.progress === 'error' && `Error: ${file.error}`}
                  </p>
                </div>
                {(file.progress === 'uploading' || file.progress === 'processing') && (
                  <Loader2 className="w-4 h-4 text-navy-400 animate-spin flex-shrink-0" />
                )}
                {file.progress === 'done' && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
                {file.progress === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Documents list */}
        <div>
          <h3 className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-3">
            Knowledge Base
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-navy-400 animate-spin" />
            </div>
          ) : fetchError ? (
            <div className="text-center py-12">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-400">{fetchError}</p>
              <button onClick={fetchDocuments} className="btn-secondary text-xs mt-3">Retry</button>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-dark-700 mx-auto mb-3" />
              <p className="text-sm text-dark-500">No documents uploaded yet.</p>
              <p className="text-xs text-dark-600 mt-1">Upload a PDF, TXT, or DOCX to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  isDeleting={deletingIds.has(doc.id)}
                  onDelete={() => handleDelete(doc.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentCard({
  document: doc,
  isDeleting,
  onDelete,
}: {
  document: Document;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="glass-card p-4 flex items-center gap-3 hover:border-dark-600/50 transition-all">
      <div className="text-2xl flex-shrink-0">{getFileIcon(doc.filename)}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-white truncate">{doc.filename}</p>
          <span className={cn('status-badge', doc.status)}>
            {doc.status === 'indexed' && '✓ Indexed'}
            {doc.status === 'processing' && '⏳ Processing'}
            {doc.status === 'error' && '✗ Error'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-dark-500">
          <span>{formatFileSize(doc.filesize)}</span>
          {doc.chunk_count > 0 && <span>{doc.chunk_count} chunks</span>}
          <span>{formatRelativeTime(doc.created_at)}</span>
        </div>
        {doc.error_message && (
          <p className="text-xs text-red-400 mt-1">{doc.error_message}</p>
        )}
      </div>

      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="btn-danger flex-shrink-0 p-2"
        title="Delete document"
      >
        {isDeleting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
