import { NextRequest, NextResponse } from 'next/server';
import { getChunksCollection, getDocsCollection } from '@/lib/chroma/client';
import { extractTextFromFile, validateFile } from '@/lib/rag/document-processor';
import { chunkText } from '@/lib/rag/chunker';
import { memoryStore } from '@/lib/rag/memory-store';
import { v4 as uuidv4 } from 'uuid';
import type { UploadResponse, Document } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let documentId: string | null = null;
  const chromaUrl = request.headers.get('x-chroma-url') || undefined;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const formChromaUrl = (formData.get('chromaUrl') as string) || chromaUrl;

    if (!file) {
      return NextResponse.json<UploadResponse>({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const { valid, error: validationError } = validateFile(file.name, file.type, file.size);
    if (!valid) {
      return NextResponse.json<UploadResponse>({ success: false, error: validationError }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    documentId = uuidv4();

    // Step 1: Extract text from file
    let extractedText: string;
    try {
      extractedText = await extractTextFromFile(buffer, file.type, file.name);
    } catch {
      return NextResponse.json<UploadResponse>({ success: false, error: 'Failed to extract text from document' }, { status: 422 });
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json<UploadResponse>({ success: false, error: 'Document appears to be empty or unreadable' }, { status: 422 });
    }

    // Step 2: Chunk the text
    const chunks = chunkText(extractedText);
    if (chunks.length === 0) {
      return NextResponse.json<UploadResponse>({ success: false, error: 'Could not process document content' }, { status: 422 });
    }

    const docRecord: Document = {
      id: documentId,
      filename: file.name,
      filesize: file.size,
      filetype: file.type || 'application/octet-stream',
      status: 'indexed',
      chunk_count: chunks.length,
      created_at: new Date().toISOString(),
    };

    // Step 3: Always index in local vector memory store (instant, zero network latency)
    memoryStore.addDocument(docRecord);
    memoryStore.addChunks(
      chunks.map((c) => ({
        document_id: documentId as string,
        document_name: file.name,
        content: c.content,
        chunk_index: c.chunk_index,
        token_count: c.token_count,
      }))
    );

    // Step 4: If ChromaDB is configured / available, also sync to ChromaDB
    try {
      const docsCollection = await getDocsCollection(formChromaUrl);
      await docsCollection.add({
        ids: [documentId],
        documents: [file.name],
        metadatas: [
          {
            filename: file.name,
            filesize: file.size,
            filetype: file.type || 'application/octet-stream',
            status: 'indexed',
            chunk_count: chunks.length,
            created_at: new Date().toISOString(),
            error_message: '',
          },
        ],
      });

      const chunksCollection = await getChunksCollection(formChromaUrl);
      const batchSize = 50;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        await chunksCollection.add({
          ids: batch.map(() => uuidv4()),
          documents: batch.map((c) => c.content),
          metadatas: batch.map((c) => ({
            document_id: documentId as string,
            filename: file.name,
            chunk_index: c.chunk_index,
            token_count: c.token_count,
            char_start: c.char_start,
            char_end: c.char_end,
          })),
        });
      }
    } catch (chromaErr) {
      console.info('ChromaDB sync optional:', chromaErr instanceof Error ? chromaErr.message : chromaErr);
    }

    return NextResponse.json<UploadResponse>({
      success: true,
      document_id: documentId,
      filename: file.name,
      chunk_count: chunks.length,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json<UploadResponse>({ success: false, error: 'Internal server error during document processing' }, { status: 500 });
  }
}
