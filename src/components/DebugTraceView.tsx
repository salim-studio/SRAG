import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { RAGTrace, Language } from '../types.js';
import { getTranslation } from '../i18n/translations.js';

interface DebugTraceViewProps {
  trace: RAGTrace | null;
  language: Language;
}

export const DebugTraceView: React.FC<DebugTraceViewProps> = ({
  trace,
  language,
}) => {
  const t = getTranslation(language);
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    if (trace) {
      navigator.clipboard.writeText(JSON.stringify(trace, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!trace) {
    return (
      <div className="max-w-4xl mx-auto p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <Activity className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-base">{t.debug_trace}</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          No query trace recorded yet. Run a query in the RAG Assistant or the Dedicated Search view to inspect step-by-step pipeline execution telemetry.
        </p>
      </div>
    );
  }

  const total = trace.total_latency_ms || 1;
  const embedPct = Math.min(100, Math.round(((trace.embedding_latency_ms || 0) / total) * 100));
  const retrievePct = Math.min(100, Math.round(((trace.retrieval_latency_ms || 0) / total) * 100));
  const rerankPct = Math.min(100, Math.round(((trace.rerank_latency_ms || 0) / total) * 100));
  const llmPct = Math.min(100, Math.round(((trace.llm_latency_ms || 0) / total) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.debug_trace}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Trace #{trace.total_latency_ms}ms
            </span>
          </div>
          <p className="text-xs text-slate-500">
            End-to-end telemetry across query transformation, vector scoring, BM25 retrieval, and reranking.
          </p>
        </div>

        <button
          onClick={handleCopyJson}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied JSON' : 'Export Trace JSON'}</span>
        </button>
      </div>

      {/* Query Understanding Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Stage 1: Query Transformation & Coreference Resolution</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Original User Query</span>
            <div className="font-semibold text-slate-900 font-sans">&quot;{trace.query}&quot;</div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1">
            <span className="text-[11px] font-bold text-indigo-700 uppercase">Rewritten Standalone Query</span>
            <div className="font-semibold text-indigo-900 font-sans">
              &quot;{trace.rewritten_query || trace.query}&quot;
            </div>
          </div>
        </div>

        {trace.query_expansion && trace.query_expansion.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
            <span className="font-semibold">Query Expansions:</span>
            {trace.query_expansion.map((exp, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                {exp}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Latency Breakdown Waterfall */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Stage 2: Execution Latency Waterfall (Total: {trace.total_latency_ms} ms)</span>
          </h3>
          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            Grounding Score: {trace.grounding_score} ({(trace.grounding_numeric * 100).toFixed(0)}%)
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          <div
            style={{ width: `${Math.max(5, embedPct)}%` }}
            className="h-full bg-blue-500 rounded-l-full"
            title={`Embedding: ${trace.embedding_latency_ms}ms`}
          />
          <div
            style={{ width: `${Math.max(5, retrievePct)}%` }}
            className="h-full bg-indigo-500"
            title={`Retrieval: ${trace.retrieval_latency_ms}ms`}
          />
          <div
            style={{ width: `${Math.max(5, rerankPct)}%` }}
            className="h-full bg-amber-500"
            title={`Rerank: ${trace.rerank_latency_ms}ms`}
          />
          <div
            style={{ width: `${Math.max(10, llmPct)}%` }}
            className="h-full bg-emerald-500 rounded-r-full"
            title={`LLM Synthesis: ${trace.llm_latency_ms}ms`}
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <div className="text-[11px] font-semibold text-blue-700">Vector Embedding</div>
            <div className="text-base font-extrabold text-blue-900 font-mono mt-0.5">
              {trace.embedding_latency_ms} ms
            </div>
            <div className="text-[10px] text-blue-600">{embedPct}% of total</div>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <div className="text-[11px] font-semibold text-indigo-700">Hybrid Search (Vector+BM25)</div>
            <div className="text-base font-extrabold text-indigo-900 font-mono mt-0.5">
              {trace.retrieval_latency_ms} ms
            </div>
            <div className="text-[10px] text-indigo-600">{retrievePct}% of total</div>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <div className="text-[11px] font-semibold text-amber-700">Cross Reranker</div>
            <div className="text-base font-extrabold text-amber-900 font-mono mt-0.5">
              {trace.rerank_latency_ms} ms
            </div>
            <div className="text-[10px] text-amber-600">{rerankPct}% of total</div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-700">LLM Synthesis & Guard</div>
            <div className="text-base font-extrabold text-emerald-900 font-mono mt-0.5">
              {trace.llm_latency_ms} ms
            </div>
            <div className="text-[10px] text-emerald-600">{llmPct}% of total</div>
          </div>
        </div>
      </div>

      {/* Candidate Passages Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Stage 3: Retrieved & Reranked Candidate Pool ({trace.top_candidates?.length || 0})</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Context: {trace.final_context_chars} chars (~{Math.round(trace.final_context_chars / 4)} tokens)
          </span>
        </div>

        <div className="space-y-3">
          {trace.top_candidates?.map((candidate, idx) => (
            <div
              key={candidate.chunk.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200/80">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold">
                    Rank #{idx + 1}
                  </span>
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>{candidate.chunk.metadata.file_name}</span>
                  <span className="text-slate-400 font-normal">
                    • Page {candidate.chunk.metadata.page} • {candidate.chunk.metadata.section}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Cosine: {candidate.semantic_score.toFixed(3)}
                  </span>
                  <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    BM25: {candidate.bm25_score.toFixed(3)}
                  </span>
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Rerank: {candidate.rerank_score.toFixed(3)}
                  </span>
                  <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                    Final: {(candidate.final_score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="text-slate-700 line-clamp-2 leading-relaxed font-sans">
                {candidate.chunk.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Anti-Injection Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Anti-Prompt-Injection Boundary Active</div>
            <p className="text-[11px] text-slate-500">
              Retrieved chunks are structurally encapsulated in untrusted data blocks. Direct system prompt leakage is blocked.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Secured</span>
        </span>
      </div>
    </div>
  );
};
