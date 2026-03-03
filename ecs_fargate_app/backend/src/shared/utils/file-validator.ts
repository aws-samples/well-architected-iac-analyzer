/**
 * Validates uploaded file contents against claimed types using file signatures.
 */

interface FileSignature {
  magicBytes: Buffer[];
  offset: number;
}

const FILE_SIGNATURES: Record<string, FileSignature> = {
  'application/pdf': {
    magicBytes: [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
    offset: 0,
  },
  'image/png': {
    magicBytes: [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    offset: 0,
  },
  'image/jpeg': {
    magicBytes: [Buffer.from([0xff, 0xd8, 0xff])],
    offset: 0,
  },
  'application/zip': {
    magicBytes: [
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      Buffer.from([0x50, 0x4b, 0x05, 0x06]),
    ],
    offset: 0,
  },
};

const EXTENSION_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  zip: 'application/zip',
};

const TEXT_EXTENSIONS = new Set([
  'yaml', 'yml', 'json', 'tf', 'ts', 'py', 'go', 'java', 'cs', 'txt',
]);

export interface FileValidationResult {
  valid: boolean;
  detectedMime: string | null;
  message?: string;
}

/**
 * Checks whether the binary content of a file matches what its extension claims.
 * For binary formats (PDF, PNG, JPEG, ZIP) the leading bytes are compared against
 * known signatures.  For text-based formats the content is verified to be valid
 * UTF-8 without embedded null bytes.
 */
export function validateFileContent(
  buffer: Buffer,
  fileName: string,
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, detectedMime: null, message: 'Empty file content' };
  }

  const ext = (fileName.split('.').pop() || '').toLowerCase();

  // Binary formats — verify magic bytes
  const expectedMime = EXTENSION_TO_MIME[ext];
  if (expectedMime) {
    const sig = FILE_SIGNATURES[expectedMime];
    if (sig && !matchesAny(buffer, sig)) {
      return {
        valid: false,
        detectedMime: detectType(buffer),
        message: `File content does not match the expected format for .${ext}`,
      };
    }
    return { valid: true, detectedMime: expectedMime };
  }

  // Text-based formats — verify valid text
  if (TEXT_EXTENSIONS.has(ext)) {
    if (!isPlausibleText(buffer)) {
      return {
        valid: false,
        detectedMime: null,
        message: `File .${ext} appears to contain binary data`,
      };
    }
    return { valid: true, detectedMime: 'text/plain' };
  }

  return {
    valid: false,
    detectedMime: null,
    message: `Unrecognised file extension: .${ext}`,
  };
}

function matchesAny(buffer: Buffer, sig: FileSignature): boolean {
  return sig.magicBytes.some((magic) => {
    if (buffer.length < sig.offset + magic.length) return false;
    return buffer
      .subarray(sig.offset, sig.offset + magic.length)
      .equals(magic);
  });
}

function isPlausibleText(buffer: Buffer): boolean {
  const len = Math.min(buffer.length, 8192);
  for (let i = 0; i < len; i++) {
    if (buffer[i] === 0x00) return false;
  }
  try {
    const sample = buffer.subarray(0, len).toString('utf-8');
    return !sample.includes('\ufffd');
  } catch {
    return false;
  }
}

function detectType(buffer: Buffer): string | null {
  for (const [mime, sig] of Object.entries(FILE_SIGNATURES)) {
    if (matchesAny(buffer, sig)) return mime;
  }
  return isPlausibleText(buffer) ? 'text/plain' : null;
}