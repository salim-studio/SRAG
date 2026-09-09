import {
  KnowledgeBase,
  DocumentRecord,
  DocumentChunk,
  Conversation,
  FeedbackRecord,
  EvaluationResult,
  EvaluationItem,
  SystemConfig,
} from './types.js';
import { getInitialSeedData } from './seed.js';

class DataStore {
  public knowledgeBases: Map<string, KnowledgeBase> = new Map();
  public documents: Map<string, DocumentRecord> = new Map();
  public chunks: Map<string, DocumentChunk> = new Map();
  public conversations: Map<string, Conversation> = new Map();
  public feedback: FeedbackRecord[] = [];
  public evaluationResults: EvaluationResult[] = [];
  public evaluationDatasets: Map<string, EvaluationItem[]> = new Map();

  public config: SystemConfig = {
    embedding_provider: 'gemini',
    embedding_model: 'gemini-embedding-2-preview',
    llm_provider: 'gemini',
    llm_model: 'gemini-3.8-flash',
    top_k: 6,
    hybrid_alpha: 0.7,
    reranking_enabled: true,
    reranking_model: 'Cross-Encoder-MiniLM-L6',
    chunk_size: 750,
    chunk_overlap: 80,
    min_chunk_size: 60,
    max_chunk_size: 1500,
    chunking_strategy: 'semantic',
    max_context_chars: 4500,
    strict_anti_hallucination: true,
  };

  constructor() {
    this.seed();
  }

  private seed() {
    const seedData = getInitialSeedData();
    for (const kb of seedData.knowledgeBases) {
      this.knowledgeBases.set(kb.id, kb);
    }
    for (const doc of seedData.documents) {
      this.documents.set(doc.id, doc);
    }
    for (const chunk of seedData.chunks) {
      this.chunks.set(chunk.id, chunk);
    }
    for (const [kbId, items] of Object.entries(seedData.evaluationDatasets)) {
      this.evaluationDatasets.set(kbId, items);
    }

    // Create a welcoming initial conversation for kb_clean_energy
    const welcomeConv: Conversation = {
      id: 'conv_sample_01',
      knowledge_base_id: 'kb_clean_energy',
      title: 'Renewable Carbon Productivity Q&A',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
      messages: [
        {
          id: 'msg_01',
          conversation_id: 'conv_sample_01',
          role: 'user',
          content: 'What are the main conclusions of the renewable energy carbon productivity study?',
          created_at: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: 'msg_02',
          conversation_id: 'conv_sample_01',
          role: 'assistant',
          content: `Based on the retrieved empirical study, the research presents three primary conclusions regarding renewable adoption and carbon productivity:

1. **Threshold Effect**: Clean energy deployment significantly accelerates industrial carbon productivity, but only after surpassing a critical threshold of **24.5% renewable penetration** in the primary energy mix [1]. Below this inflection point, transitional capital frictions yield modest productivity gains under 1.2% per year; beyond it, every 5% increase in solar and wind yields a **4.8% average rise in carbon productivity** [1].
2. **Storage and Grid Symmetries**: Renewable rollout must be systematically paired with battery energy storage systems (BESS) of at least 4-hour reserve capacity, which reduces curtailment rates from 14.2% to under 1.8% [2].
3. **Regulatory Stability via Contracts for Difference (CfD)**: Market-based CfD mechanisms provide superior investment certainty over unilateral Feed-in Tariffs (FiT), lowering the weighted average cost of capital (WACC) from **6.8% to 4.1%** [3].

Additionally, carbon pricing exceeding **$65 per metric ton** triggers the early retirement of subcritical coal power plants by an average of 6.2 years [3].`,
          citations: [
            {
              id: 1,
              document_id: 'doc_energy_01',
              file_name: 'Renewable_Energy_Productivity_Report_2025.pdf',
              page: 1,
              section: 'Executive Summary',
              chunk_id: 'chunk_001',
              snippet: 'clean energy deployment significantly accelerates industrial carbon productivity, but only after surpassing a critical threshold of 24.5% renewable penetration',
              relevance: 0.94,
            },
            {
              id: 2,
              document_id: 'doc_energy_01',
              file_name: 'Renewable_Energy_Productivity_Report_2025.pdf',
              page: 2,
              section: 'Technological Conditions and Storage Synergies',
              chunk_id: 'chunk_002',
              snippet: 'When regional grids integrate battery energy storage systems (BESS) exceeding 4 hours of reserve capacity, curtailment rates drop from 14.2% to less than 1.8%',
              relevance: 0.88,
            },
            {
              id: 3,
              document_id: 'doc_energy_01',
              file_name: 'Renewable_Energy_Productivity_Report_2025.pdf',
              page: 3,
              section: 'Policy Frameworks, Subsidies, and Carbon Pricing',
              chunk_id: 'chunk_003',
              snippet: 'Contracts for Difference (CfD) provide the most stable investment signals for institutional investors, reducing WACC from 6.8% down to 4.1%',
              relevance: 0.86,
            },
          ],
          grounding_confidence: 'High',
          created_at: new Date(Date.now() - 3450000).toISOString(),
        },
      ],
    };

    this.conversations.set(welcomeConv.id, welcomeConv);
  }

  public getKnowledgeBases(): KnowledgeBase[] {
    const list = Array.from(this.knowledgeBases.values());
    for (const kb of list) {
      kb.document_count = Array.from(this.documents.values()).filter((d) => d.knowledge_base_id === kb.id).length;
      kb.chunk_count = Array.from(this.chunks.values()).filter((c) => c.knowledge_base_id === kb.id).length;
    }
    return list;
  }

  public getChunksForKb(kbId: string): DocumentChunk[] {
    return Array.from(this.chunks.values()).filter((c) => c.knowledge_base_id === kbId);
  }

  public getDocumentsForKb(kbId: string): DocumentRecord[] {
    return Array.from(this.documents.values()).filter((d) => d.knowledge_base_id === kbId);
  }

  public deleteDocument(docId: string): boolean {
    const doc = this.documents.get(docId);
    if (!doc) return false;

    // Delete chunks
    const chunkIdsToDelete: string[] = [];
    for (const [id, chunk] of this.chunks.entries()) {
      if (chunk.document_id === docId) {
        chunkIdsToDelete.push(id);
      }
    }
    for (const id of chunkIdsToDelete) {
      this.chunks.delete(id);
    }

    this.documents.delete(docId);

    // Update KB count
    const kb = this.knowledgeBases.get(doc.knowledge_base_id);
    if (kb) {
      kb.document_count = Array.from(this.documents.values()).filter((d) => d.knowledge_base_id === kb.id).length;
      kb.chunk_count = Array.from(this.chunks.values()).filter((c) => c.knowledge_base_id === kb.id).length;
    }

    return true;
  }

  public deleteKnowledgeBase(kbId: string): boolean {
    if (!this.knowledgeBases.has(kbId)) return false;

    // Delete documents & chunks
    const docsToDelete = Array.from(this.documents.values()).filter((d) => d.knowledge_base_id === kbId);
    for (const doc of docsToDelete) {
      this.deleteDocument(doc.id);
    }

    // Delete conversations
    const convsToDelete = Array.from(this.conversations.values()).filter((c) => c.knowledge_base_id === kbId);
    for (const conv of convsToDelete) {
      this.conversations.delete(conv.id);
    }

    this.knowledgeBases.delete(kbId);
    return true;
  }
}

export const store = new DataStore();
