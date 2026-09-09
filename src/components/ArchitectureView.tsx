import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileCode,
  Layers,
  Sparkles,
  Database,
  Search,
  Filter,
  ShieldAlert,
  Bot,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../types.js';
import { getTranslation } from '../i18n/translations.js';

interface ArchitectureViewProps {
  language: Language;
}

interface StageStatus {
  id: string;
  name: string;
  status: string;
  details: string;
  config: Record<string, any>;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ language }) => {
  const t = getTranslation(language);
  const [stages, setStages] = useState<StageStatus[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>('hybrid_retrieval');

  useEffect(() => {
    fetch('/api/architecture/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.pipeline_stages) {
          setStages(data.pipeline_stages);
        }
      })
      .catch(() => {});
  }, []);

  const flowNodes = [
    { id: 'documents', label: '1. Documents', icon: FileText, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'extraction', label: '2. Extraction', icon: FileCode, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'chunking', label: '3. Chunking', icon: Layers, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'embeddings', label: '4. Embeddings', icon: Sparkles, color: 'text-pink-600 bg-pink-50 border-pink-200' },
    { id: 'vector_store', label: '5. Vector DB', icon: Database, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'hybrid_retrieval', label: '6. Hybrid Search', icon: Search, color: 'text-indigo-700 bg-indigo-100 border-indigo-300 ring-2 ring-indigo-300' },
    { id: 'reranker', label: '7. Reranking', icon: Filter, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'context_construction', label: '8. Guarded Context', icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'llm', label: '9. Grounded LLM', icon: Bot, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  ];

  const selectedStage = stages.find((s) => s.id === selectedStageId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {t.arch_title}
        </h2>
        <p className="text-xs text-slate-500">{t.arch_desc}</p>
      </div>

      {/* Interactive Pipeline Diagram */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider">End-To-End Ingestion & Query Lifecycle</span>
          <span>{t.click_node_inspect}</span>
        </div>

        {/* Pipeline Nodes Flow */}
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center min-w-[900px] gap-2">
            {flowNodes.map((node, index) => {
              const Icon = node.icon;
              const isSelected = selectedStageId === node.id;
              return (
                <React.Fragment key={node.id}>
                  <button
                    onClick={() => setSelectedStageId(node.id)}
                    className={`flex-1 p-3.5 rounded-2xl border transition-all text-left flex flex-col items-center text-center space-y-2 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-400 border-indigo-600'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-white/20 text-white' : node.color
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold truncate max-w-full">{node.label}</div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[10px] font-mono opacity-80">Online</span>
                    </div>
                  </button>

                  {index < flowNodes.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected Node Deep-Dive Inspection Card */}
        {selectedStage && (
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedStage.name}</h3>
                  <p className="text-xs text-slate-500">{selectedStage.details}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="capitalize">{selectedStage.status}</span>
              </span>
            </div>

            {/* Config & Mathematics Drawer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-800">Operational Parameters</div>
                <div className="font-mono text-[11px] text-slate-600 space-y-1">
                  {Object.entries(selectedStage.config).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-slate-50 py-0.5">
                      <span className="text-slate-500">{key}:</span>
                      <span className="font-bold text-indigo-700">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-800">Architectural Guarantees</div>
                {selectedStage.id === 'hybrid_retrieval' ? (
                  <p className="text-slate-600 leading-relaxed">
                    Combines semantic vector similarity with BM25 Robertson-Spärck Jones IDF:
                    <br />
                    <code className="font-mono text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded block mt-1">
                      Final Score = α * Semantic + (1 - α) * BM25
                    </code>
                  </p>
                ) : selectedStage.id === 'context_construction' ? (
                  <p className="text-slate-600 leading-relaxed">
                    Anti-Prompt-Injection boundary treats retrieved document content strictly as untrusted data inputs.
                    Instruction leakage and jailbreak tokens are nullified.
                  </p>
                ) : (
                  <p className="text-slate-600 leading-relaxed">
                    Module operates synchronously with automatic fallback fallbacks to ensure high availability and resilient indexing.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
