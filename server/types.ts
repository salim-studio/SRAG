export type IngestionStatus =
  | 'uploaded'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'indexing'
  | 'completed'
  | 'failed';

export type ChunkingStrategy = 'recursive' | 'fixed' | 'sentence' | 'semantic';

export interface ChunkMetadata {
  document_id: string;
  file_name: string;
  page: number;
  section: string;
  chunk_id: string;
  source: string;
  char_count: number;
  language?: string;
  [key: string]: unknown;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  knowledge_base_id: string;
  text: string;
  metadata: ChunkMetadata;
  embedding?: number[];
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  knowledge_base_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  page_count: number;
  chunk_count: number;
  status: IngestionStatus;
  status_message?: string;
  raw_text?: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  language: 'en' | 'ar' | 'fr' | 'multilingual';
  chunk_size: number;
  chunk_overlap: number;
  chunking_strategy: ChunkingStrategy;
  created_at: string;
  document_count?: number;
  chunk_count?: number;
}

export interface SearchResultItem {
  chunk: DocumentChunk;
  semantic_score: number;
  bm25_score: number;
  hybrid_score: number;
  rerank_score: number;
  final_score: number;
}

export interface RAGTrace {
  query: string;
  rewritten_query?: string;
  query_expansion?: string[];
  embedding_latency_ms: number;
  retrieval_latency_ms: number;
  rerank_latency_ms: number;
  llm_latency_ms: number;
  total_latency_ms: number;
  vector_candidates_count: number;
  bm25_candidates_count: number;
  top_candidates: SearchResultItem[];
  final_context_chars: number;
  grounding_score: 'High' | 'Medium' | 'Low';
  grounding_numeric: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Array<{
    id: number;
    document_id: string;
    file_name: string;
    page: number;
    section: string;
    chunk_id: string;
    snippet: string;
    relevance: number;
  }>;
  grounding_confidence?: 'High' | 'Medium' | 'Low';
  trace?: RAGTrace;
  created_at: string;
}

export interface Conversation {
  id: string;
  knowledge_base_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface FeedbackRecord {
  id: string;
  message_id: string;
  query: string;
  answer: string;
  rating: 'thumbs_up' | 'thumbs_down';
  feedback_notes?: string;
  latency_ms: number;
  created_at: string;
}

export interface EvaluationItem {
  id: string;
  question: string;
  expected_answer: string;
  expected_sources: string[];
}

export interface EvaluationResult {
  id: string;
  timestamp: string;
  knowledge_base_id: string;
  total_questions: number;
  hit_rate: number;
  mrr: number;
  precision_at_k: number;
  recall_at_k: number;
  faithfulness_score: number;
  answer_relevance: number;
  average_latency_ms: number;
  details: Array<{
    question: string;
    retrieved_sources: string[];
    expected_sources: string[];
    hit: boolean;
    reciprocal_rank: number;
    answer: string;
    faithfulness: number;
  }>;
}

export interface SystemConfig {
  embedding_provider: 'gemini' | 'local';
  embedding_model: string;
  llm_provider: 'gemini';
  llm_model: string;
  top_k: number;
  hybrid_alpha: number;
  reranking_enabled: boolean;
  reranking_model: string;
  chunk_size: number;
  chunk_overlap: number;
  min_chunk_size: number;
  max_chunk_size: number;
  chunking_strategy: ChunkingStrategy;
  max_context_chars: number;
  strict_anti_hallucination: boolean;
}
