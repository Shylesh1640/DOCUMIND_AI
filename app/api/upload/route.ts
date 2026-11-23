import { NextRequest, NextResponse } from 'next/server';
import { getChunksCollection, getDocsCollection } from '@/lib/chroma/client';
import { extractTextFromFile, validateFile } from '@/lib/rag/document-processor';
import { chunkText } from '@/lib/rag/chunker';
import { v4 as uuidv4 } from 'uuid';
import type { UploadResponse } from '@/types';

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

    // Step 1: Register document in docs collection
    const docsCollection = await getDocsCollection(formChromaUrl);
    await docsCollection.add({
      ids: [documentId],
      documents: [file.name],
      metadatas: [
        {
          filename: file.name,
          filesize: file.size,
          filetype: file.type || 'application/octet-stream',
          status: 'processing',
          chunk_count: 0,
          created_at: new Date().toISOString(),
          error_message: '',
        },
      ],
    });

    // Step 2: Extract text from file
    let extractedText: string;
    try {
      extractedText = await extractTextFromFile(buffer, file.type, file.name);
    } catch {
      await updateDocStatus(docsCollection, documentId, 'error', 'Failed to extract text from file');
      return NextResponse.json<UploadResponse>({ success: false, error: 'Failed to extract text from document' }, { status: 422 });
    }

    if (!extractedText || extractedText.trim().length < 10) {
      await updateDocStatus(docsCollection, documentId, 'error', 'No readable text found in document');
      return NextResponse.json<UploadResponse>({ success: false, error: 'Document appears to be empty or unreadable' }, { status: 422 });
    }

    // Step 3: Chunk the text
    const chunks = chunkText(extractedText);
    if (chunks.length === 0) {
      await updateDocStatus(docsCollection, documentId, 'error', 'No chunks generated');
      return NextResponse.json<UploadResponse>({ success: false, error: 'Could not process document content' }, { status: 422 });
    }

    // Step 4: Store chunks in ChromaDB
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

    // Step 5: Update document status to indexed
    await updateDocStatus(docsCollection, documentId, 'indexed', '', chunks.length);

    return NextResponse.json<UploadResponse>({
      success: true,
      document_id: documentId,
      filename: file.name,
      chunk_count: chunks.length,
    });
  } catch (error) {
    console.error('Upload API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json<UploadResponse>({
          success: false,
          error: 'ChromaDB is not reachable. Please configure a valid ChromaDB URL in the Settings modal (⚙️/🔑 icon).'
        }, { status: 503 });
      }
    }

    return NextResponse.json<UploadResponse>({ success: false, error: 'Internal server error during document processing' }, { status: 500 });
  }
}

async function updateDocStatus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: any,
  documentId: string,
  status: string,
  errorMessage = '',
  chunkCount = 0
) {
  try {
    await collection.update({
      ids: [documentId],
      metadatas: [
        {
          status,
          chunk_count: chunkCount,
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        },
      ],
    });
  } catch (err) {
    console.error('Failed to update doc status:', err);
  }
}
