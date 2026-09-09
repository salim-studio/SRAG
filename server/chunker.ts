import { ChunkingStrategy, DocumentChunk } from './types.js';

export interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
  minChunkSize: number;
  maxChunkSize?: number;
  strategy: ChunkingStrategy;
}

export function detectLanguage(text: string): string {
  // Check for Arabic characters (\u0600-\u06FF)
  const arabicRegex = /[\u0600-\u06FF]/;
  // Check for French accents
  const frenchRegex = /[éèêëàâîïôùûç]/i;

  if (arabicRegex.test(text)) return 'ar';
  if (frenchRegex.test(text)) return 'fr';
  return 'en';
}

/**
 * Intelligent chunking engine supporting multiple strategies
 * and preserving structural document metadata (pages, sections).
 */
export function chunkDocument(
  text: string,
  documentId: string,
  fileName: string,
  options: ChunkingOptions
): DocumentChunk[] {
  const { chunkSize = 800, chunkOverlap = 100, minChunkSize = 80, strategy = 'recursive' } = options;

  // Split text by page markers if present (e.g. "--- PAGE 2 ---" or form feed "\f")
  const pageDelimiters = /(?:^|\n)--- (?:Page|صفحة) (\d+) ---/i;
  const rawPages: Array<{ pageNumber: number; content: string }> = [];

  if (text.includes('--- Page') || text.includes('--- صفحة')) {
    const parts = text.split(/(?:^|\n)--- (?:Page|صفحة) (\d+) ---\n?/i);
    let currentPage = 1;
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        currentPage = parseInt(parts[i], 10) || 1;
      } else {
        const pageContent = parts[i].trim();
        if (pageContent) {
          rawPages.push({ pageNumber: currentPage, content: pageContent });
        }
      }
    }
  } else if (text.includes('\f')) {
    const pages = text.split('\f');
    pages.forEach((p, idx) => {
      const trimmed = p.trim();
      if (trimmed) rawPages.push({ pageNumber: idx + 1, content: trimmed });
    });
  } else {
    // Single page or approximate ~2000 chars per page
    rawPages.push({ pageNumber: 1, content: text.trim() });
  }

  const chunks: DocumentChunk[] = [];
  let globalChunkIndex = 1;

  for (const pageObj of rawPages) {
    const pageText = pageObj.content;
    const pageNum = pageObj.pageNumber;

    let textPieces: string[] = [];

    switch (strategy) {
      case 'fixed': {
        textPieces = fixedSizeSplit(pageText, chunkSize, chunkOverlap);
        break;
      }
      case 'sentence': {
        textPieces = sentenceSplit(pageText, chunkSize, chunkOverlap);
        break;
      }
      case 'semantic': {
        textPieces = semanticStructureSplit(pageText, chunkSize, chunkOverlap);
        break;
      }
      case 'recursive':
      default: {
        textPieces = recursiveSplit(pageText, chunkSize, chunkOverlap);
        break;
      }
    }

    for (const piece of textPieces) {
      const cleanPiece = piece.trim();
      if (cleanPiece.length < minChunkSize) continue;

      const sectionTitle = extractSectionHeading(cleanPiece) || `Section on Page ${pageNum}`;
      const chunkId = `chunk_${String(globalChunkIndex).padStart(3, '0')}`;

      chunks.push({
        id: `${documentId}_${chunkId}`,
        document_id: documentId,
        knowledge_base_id: '',
        text: cleanPiece,
        metadata: {
          document_id: documentId,
          file_name: fileName,
          page: pageNum,
          section: sectionTitle,
          chunk_id: chunkId,
          source: fileName,
          char_count: cleanPiece.length,
          language: detectLanguage(cleanPiece),
        },
        created_at: new Date().toISOString(),
      });

      globalChunkIndex++;
    }
  }

  // Fallback if no chunks were generated (e.g. very short document)
  if (chunks.length === 0 && text.trim().length > 0) {
    const chunkId = `chunk_001`;
    chunks.push({
      id: `${documentId}_${chunkId}`,
      document_id: documentId,
      knowledge_base_id: '',
      text: text.trim(),
      metadata: {
        document_id: documentId,
        file_name: fileName,
        page: 1,
        section: 'General Content',
        chunk_id: chunkId,
        source: fileName,
        char_count: text.trim().length,
        language: detectLanguage(text),
      },
      created_at: new Date().toISOString(),
    });
  }

  return chunks;
}

function extractSectionHeading(text: string): string | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 3)) {
    // Markdown heading # Title or Section 1.2 or 1. Introduction or Arabic headings
    if (line.startsWith('#')) {
      return line.replace(/^#+\s*/, '').slice(0, 60);
    }
    if (/^(?:Section|Chapter|المبحث|الفصل|المقدمة|الخلاصة|المطلب)\s+[\w\d.:-]+/i.test(line)) {
      return line.slice(0, 60);
    }
    if (line.length < 50 && (line.endsWith(':') || /^[A-Z0-9\s-]{4,}$/.test(line))) {
      return line.replace(/:$/, '').slice(0, 60);
    }
  }
  return null;
}

function fixedSizeSplit(text: string, chunkSize: number, chunkOverlap: number): string[] {
  const result: string[] = [];
  let start = 0;
  const step = Math.max(1, chunkSize - chunkOverlap);

  while (start < text.length) {
    const chunk = text.slice(start, start + chunkSize);
    result.push(chunk);
    start += step;
  }
  return result;
}

function sentenceSplit(text: string, chunkSize: number, chunkOverlap: number): string[] {
  // Regex to split by sentences (. ! ? or Arabic full stop)
  const sentences = text.match(/[^.!?؟\n]+[.!?؟\n]+|[^.!?؟\n]+$/g) || [text];
  const result: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize && current.length > 0) {
      result.push(current.trim());
      // overlap: retain last sentence if possible
      const lastSentence = current.slice(-chunkOverlap);
      current = lastSentence + ' ' + sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }
  return result;
}

function recursiveSplit(text: string, chunkSize: number, chunkOverlap: number): string[] {
  const separators = ['\n\n', '\n', '. ', ' '];

  function splitRecursive(subText: string, sepIndex: number): string[] {
    if (subText.length <= chunkSize || sepIndex >= separators.length) {
      return [subText];
    }

    const sep = separators[sepIndex];
    const parts = subText.split(sep);
    const combined: string[] = [];
    let buffer = '';

    for (const part of parts) {
      const candidate = buffer ? buffer + sep + part : part;
      if (candidate.length <= chunkSize) {
        buffer = candidate;
      } else {
        if (buffer) combined.push(buffer);
        if (part.length > chunkSize) {
          // split recursively on finer separator
          const smaller = splitRecursive(part, sepIndex + 1);
          combined.push(...smaller);
          buffer = '';
        } else {
          buffer = part;
        }
      }
    }

    if (buffer) combined.push(buffer);
    return combined;
  }

  const rawChunks = splitRecursive(text, 0);

  // Apply overlap if desired
  if (chunkOverlap > 0 && rawChunks.length > 1) {
    const withOverlap: string[] = [];
    for (let i = 0; i < rawChunks.length; i++) {
      let chunk = rawChunks[i];
      if (i > 0) {
        const prev = rawChunks[i - 1];
        const overlapText = prev.slice(-chunkOverlap);
        chunk = overlapText + ' ' + chunk;
      }
      withOverlap.push(chunk);
    }
    return withOverlap;
  }

  return rawChunks;
}

function semanticStructureSplit(text: string, chunkSize: number, chunkOverlap: number): string[] {
  // Preserve markdown / structural headings
  const sections = text.split(/(?=\n#{1,4}\s+|(?:\n(?:Section|الفصل|المبحث)\s+\d+))/i);
  const result: string[] = [];

  for (const sec of sections) {
    if (sec.length <= chunkSize) {
      result.push(sec);
    } else {
      const subChunks = recursiveSplit(sec, chunkSize, chunkOverlap);
      result.push(...subChunks);
    }
  }
  return result;
}
