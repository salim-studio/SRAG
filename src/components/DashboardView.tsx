import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Sparkles,
  Search,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Cpu,
  Plus,
} from 'lucide-react';
import {
  KnowledgeBase,
  DocumentRecord,
  Language,
  ActiveTab,
  SearchResultItem,
} from '../types.js';
import { getTranslation } from '../i18n/translations.js';

interface DashboardViewProps {
  activeKb: KnowledgeBase;
  documents: DocumentRecord[];
  totalChunks: number;
  onNavigate: (tab: ActiveTab) => void;
  onOpenUpload: () => void;
  onPreviewDoc: (doc: DocumentRecord) => void;
  language: Language;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeKb,
  documents,
  totalChunks,
  onNavigate,
  onOpenUpload,
  onPreviewDoc,
  language,
}) => {
  const t = getTranslation(language);
  const [quickQuery, setQuickQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [quickResults, setQuickResults] = useState<SearchResultItem[] | null>(null);

  const completedDocs = documents.filter((d) => d.status === 'completed').length;
  const failedDocs = documents.filter((d) => d.status === 'failed').length;

  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: quickQuery.trim(),
          kb_id: activeKb.id,
          mode: 'hybrid',
          alpha: 0.7,
          top_k: 3,
        }),
      });
      const data = await res.json();
      setQuickResults(data.results || []);
    } catch {
      setQuickResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modular Hybrid RAG Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {activeKb.name}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {activeKb.description || t.app_subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('chat')}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.chat}</span>
            </button>
            <button
              onClick={onOpenUpload}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.upload_doc}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>{t.total_docs}</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {documents.length}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold">{completedDocs} indexed</span>
            {failedDocs > 0 && <span className="text-rose-600 font-semibold">• {failedDocs} failed</span>}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>{t.total_chunks}</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {totalChunks}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Strategy: <span className="font-semibold text-slate-700 capitalize">{activeKb.chunking_strategy}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>{t.avg_latency}</span>
            <Cpu className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            ~38 ms
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Hybrid Dense + BM25</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>{t.system_health}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            100%
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Vector DB & Reranker Online
          </div>
        </div>
      </div>

      {/* Main split: Instant Knowledge Query & Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Instant Query Sandbox */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t.quick_test}</h3>
              <p className="text-xs text-slate-500">{t.quick_test_desc}</p>
            </div>
            <button
              onClick={() => onNavigate('search')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Dedicated Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleQuickSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="e.g. What is the critical threshold of renewable penetration?"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !quickQuery.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-2"
            >
              {searching ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span>{t.run_search}</span>
              )}
            </button>
          </form>

          {/* Quick results preview */}
          {quickResults && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Top Retrieved Passages ({quickResults.length})
              </div>
              {quickResults.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  No matching passages found.
                </div>
              ) : (
                quickResults.map((res, i) => (
                  <div
                    key={res.chunk.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-indigo-700 truncate max-w-xs">
                        #{i + 1} {res.chunk.metadata.file_name} (p. {res.chunk.metadata.page})
                      </span>
                      <span className="font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                        Score: {(res.final_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                      {res.chunk.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Recent Documents & Knowledge Base Details */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">{t.documents}</h3>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {documents.slice(0, 5).map((doc) => (
              <div
                key={doc.id}
                onClick={() => onPreviewDoc(doc)}
                className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-indigo-700">
                      {doc.file_name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {doc.page_count}p • {doc.chunk_count} chunks
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  Ready
                </span>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800">Active Pipeline Configuration:</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                Chunk Size: <span className="font-mono font-semibold">{activeKb.chunk_size}c</span>
              </div>
              <div>
                Overlap: <span className="font-mono font-semibold">{activeKb.chunk_overlap}c</span>
              </div>
              <div>
                Strategy: <span className="font-semibold capitalize">{activeKb.chunking_strategy}</span>
              </div>
              <div>
                Language: <span className="font-mono uppercase">{activeKb.language}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
