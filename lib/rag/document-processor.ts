/**
 * Document text extraction utilities.
 * Supports PDF, TXT, and DOCX files.
 */

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (mimeType === 'text/plain' || ext === 'txt') {
    return extractTextFromTxt(buffer);
  }

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return extractTextFromPdf(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    ext === 'docx' ||
    ext === 'doc'
  ) {
    return extractTextFromDocx(buffer);
  }

  throw new Error(`Unsupported file type: ${mimeType || ext}`);
}

async function extractTextFromTxt(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamically import pdf-parse to avoid issues with server components
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export function validateFile(
  filename: string,
  mimeType: string,
  sizeBytes: number
): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'docx', 'doc'];

  if (sizeBytes > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds 50MB limit (${(sizeBytes / 1024 / 1024).toFixed(1)}MB)` };
  }

  const ext = filename.split('.').pop()?.toLowerCase();
  const isAllowedType = ALLOWED_TYPES.includes(mimeType) || (ext && ALLOWED_EXTENSIONS.includes(ext));

  if (!isAllowedType) {
    return { valid: false, error: `Unsupported file type. Allowed: PDF, TXT, DOCX` };
  }

  return { valid: true };
}
