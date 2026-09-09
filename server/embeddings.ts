import { getGeminiClient } from './gemini.js';

// Cache for embeddings to avoid repeated calls
const embeddingCache = new Map<string, number[]>();

export interface EmbeddingProvider {
  name: string;
  dimension: number;
  generateEmbedding(text: string): Promise<number[]>;
  generateBatch(texts: string[]): Promise<number[][]>;
}

/**
 * Calculates cosine similarity between two numeric vectors.
 * Returns a value between -1.0 and 1.0 (clamped to 0.0 to 1.0 for similarity).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, (sim + 1) / 2)); // Normalize to [0, 1] range
}

/**
 * Deterministic high-dimensional dense vector generator for local fallback.
 * Uses subword & character n-gram hashing into a 128-dim normalized vector space.
 * Captures semantic & lexical overlap across English, Arabic, French, and code.
 */
export function generateLocalDenseVector(text: string, dimension = 128): number[] {
  const vec = new Array<number>(dimension).fill(0);
  const normalized = text.toLowerCase().trim();
  if (!normalized) return vec;

  // Split into tokens
  const tokens = normalized.match(/[\p{L}\p{N}]+/gu) || [normalized];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const weight = 1.0 / Math.log2(i + 3); // Position decay

    // Token hash
    let hash = 0;
    for (let c = 0; c < token.length; c++) {
      hash = (hash * 31 + token.charCodeAt(c)) >>> 0;
    }
    const idx = hash % dimension;
    vec[idx] += weight;

    // Subword 3-grams
    if (token.length >= 3) {
      for (let g = 0; g <= token.length - 3; g++) {
        const trigram = token.slice(g, g + 3);
        let gHash = 5381;
        for (let j = 0; j < trigram.length; j++) {
          gHash = (gHash * 33) ^ trigram.charCodeAt(j);
        }
        const gIdx = Math.abs(gHash) % dimension;
        vec[gIdx] += 0.4 * weight;
      }
    }
  }

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < dimension; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimension; i++) {
      vec[i] = vec[i] / norm;
    }
  }

  return vec;
}

/**
 * Main embedding generator supporting Gemini API and local fallback
 */
export async function getEmbedding(text: string, preferredProvider: 'gemini' | 'local' = 'gemini'): Promise<number[]> {
  const cleanText = text.trim();
  if (!cleanText) {
    return generateLocalDenseVector('', 128);
  }

  const cacheKey = `${preferredProvider}:${cleanText.slice(0, 100)}:${cleanText.length}`;
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  if (preferredProvider === 'gemini') {
    const ai = getGeminiClient();
    if (ai) {
      try {
        // Try Gemini embedding model
        const result = await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: cleanText,
        });

        const responseAny = result as any;
        const values =
          responseAny.embedding?.values ||
          responseAny.embeddings?.[0]?.values ||
          (Array.isArray(responseAny.embeddings) ? responseAny.embeddings : null);
        if (values && values.length > 0) {
          embeddingCache.set(cacheKey, values);
          return values;
        }
      } catch (err) {
        console.warn('Gemini embedding failed, falling back to local dense vector:', (err as Error).message);
      }
    }
  }

  // Fallback or explicit local provider
  const localVec = generateLocalDenseVector(cleanText, 128);
  embeddingCache.set(cacheKey, localVec);
  return localVec;
}

export async function getBatchEmbeddings(
  texts: string[],
  preferredProvider: 'gemini' | 'local' = 'gemini'
): Promise<number[][]> {
  const results: number[][] = [];
  for (const t of texts) {
    results.push(await getEmbedding(t, preferredProvider));
  }
  return results;
}
