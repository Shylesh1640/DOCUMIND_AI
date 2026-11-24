import { NextRequest, NextResponse } from 'next/server';
import { getDocsCollection, getChunksCollection } from '@/lib/chroma/client';
import { memoryStore } from '@/lib/rag/memory-store';
import { IncludeEnum } from 'chromadb';
import type { Document } from '@/types';

export const runtime = 'nodejs';

// GET /api/documents — list all documents
export async function GET(request: NextRequest) {
  const chromaUrl = request.headers.get('x-chroma-url') || undefined;

  // Start with documents from memory store
  const docMap = new Map<string, Document>();
  for (const doc of memoryStore.getDocuments()) {
    docMap.set(doc.id, doc);
  }

  // Also query ChromaDB if reachable
  try {
    const docsCollection = await getDocsCollection(chromaUrl);
    const result = await docsCollection.get({
      include: [IncludeEnum.Metadatas, IncludeEnum.Documents],
    });

    if (result.ids && result.ids.length > 0) {
      result.ids.forEach((id, i) => {
        const meta = (result.metadatas?.[i] || {}) as Record<string, string | number>;
        docMap.set(id, {
          id,
          filename: String(meta.filename || result.documents?.[i] || 'Unknown'),
          filesize: Number(meta.filesize || 0),
          filetype: String(meta.filetype || ''),
          created_at: String(meta.created_at || new Date().toISOString()),
          chunk_count: Number(meta.chunk_count || 0),
          status: (meta.status as Document['status']) || 'indexed',
          error_message: meta.error_message ? String(meta.error_message) : undefined,
        });
      });
    }
  } catch {
    // ChromaDB offline — graceful fallback to memory store
  }

  const documents = Array.from(docMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json({ documents });
}

// DELETE /api/documents?id=<document_id>
export async function DELETE(request: NextRequest) {
  const chromaUrl = request.headers.get('x-chroma-url') || undefined;

  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Delete from memory store
    memoryStore.deleteDocument(documentId);

    // Also delete from ChromaDB if reachable
    try {
      const docsCollection = await getDocsCollection(chromaUrl);
      await docsCollection.delete({ ids: [documentId] });

      const chunksCollection = await getChunksCollection(chromaUrl);
      await chunksCollection.delete({
        where: { document_id: { $eq: documentId } },
      });
    } catch {
      // Ignore Chroma error on delete
    }

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Documents DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
