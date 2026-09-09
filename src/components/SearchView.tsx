import React, { useState } from 'react';
import {
  Search,
  Sliders,
  Sparkles,
  FileText,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { KnowledgeBase, SearchResultItem, RAGTrace, Language } from '../types.js';
import { getTranslation } from '../i18n/translations.js';

interface SearchViewProps {
  activeKb: KnowledgeBase;
  language: Language;
  onPreviewChunkDoc?: (docId: string, chunkId: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  activeKb,
  language,
}) => {
  const t = getTranslation(language);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'hybrid' | 'semantic' | 'bm25'>('hybrid');
  const [alpha, setAlpha] = useState(0.7);
  const [topK, setTopK] = useState(6);
  const [rerank, setRerank] = useState(true);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [trace, setTrace] = useState<RAGTrace | null>(null);
  const [expandedChunkId, setExpandedChunkId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          kb_id: activeKb.id,
          mode,
          alpha,
          top_k: topK,
          rerank,
        }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setTrace(data.trace || null);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const sampleQueries = [
    'What is the critical threshold for carbon productivity?',
    'Contracts for Difference (CfD) offshore wind impact',
    'How do RAG systems defend against prompt injection?',
    'ما هي نسبة الطاقة المتجددة المستهدفة في عام 2030؟',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {t.search}
        </h2>
        <p className="text-xs text-slate-500">
          Inspect and benchmark semantic embeddings, BM25 term frequencies, and cross-attention reranking scores.
        </p>
      </div>

      {/* Main Search & Control Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search_placeholder}
              className="w-full pl-12 pr-28 py-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400 font-medium"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              {searching ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span>{t.run_search}</span>
              )}
            </button>
          </div>

          {/* Sample query pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Suggested:</span>
            </span>
            {sampleQueries.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuery(sq)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-lg text-xs font-medium border border-slate-200/60 transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>
        </form>

        {/* Controls Bar */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Mode Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.search_mode}</span>
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('hybrid')}
                className={`py-1.5 rounded-lg transition-colors ${
                  mode === 'hybrid' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hybrid
              </button>
              <button
                type="button"
                onClick={() => setMode('semantic')}
                className={`py-1.5 rounded-lg transition-colors ${
                  mode === 'semantic' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vector
              </button>
              <button
                type="button"
                onClick={() => setMode('bm25')}
                className={`py-1.5 rounded-lg transition-colors ${
                  mode === 'bm25' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                BM25
              </button>
            </div>
          </div>

          {/* Alpha Slider */}
          <div className={mode !== 'hybrid' ? 'opacity-40 pointer-events-none' : ''}>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.alpha_slider}</span>
              </span>
              <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                α = {alpha}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>0.0 (BM25)</span>
              <span>0.5 (Balanced)</span>
              <span>1.0 (Cosine)</span>
            </div>
          </div>

          {/* Top K & Rerank */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.top_k}
              </label>
              <select
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              >
                <option value={3}>Top 3</option>
                <option value={5}>Top 5</option>
                <option value={8}>Top 8</option>
                <option value={12}>Top 12</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reranker
              </label>
              <button
                type="button"
                onClick={() => setRerank(!rerank)}
                className={`w-full py-1.5 px-2 rounded-xl text-xs font-semibold border transition-colors ${
                  rerank
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                {rerank ? '✓ Active' : 'Off'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              {results.length} Candidates Retrieved
            </h3>
            {trace && (
              <span className="text-xs font-mono text-slate-500">
                Retrieval: {trace.retrieval_latency_ms}ms • Rerank: {trace.rerank_latency_ms}ms • Grounding: {trace.grounding_score}
              </span>
            )}
          </div>

          {results.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No matching chunks found for this query.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((item, idx) => {
                const isExpanded = expandedChunkId === item.chunk.id;
                return (
                  <div
                    key={item.chunk.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-indigo-200 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.chunk.metadata.file_name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          • Page {item.chunk.metadata.page} • {item.chunk.metadata.section}
                        </span>
                      </div>

                      {/* Score metrics badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          title={t.similarity_score}
                          className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] font-semibold border border-blue-200"
                        >
                          Cosine: {item.semantic_score.toFixed(3)}
                        </span>
                        <span
                          title={t.bm25_score}
                          className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[11px] font-semibold border border-purple-200"
                        >
                          BM25: {item.bm25_score.toFixed(3)}
                        </span>
                        {rerank && (
                          <span
                            title={t.rerank_score}
                            className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-[11px] font-semibold border border-amber-200"
                          >
                            Rerank: {item.rerank_score.toFixed(3)}
                          </span>
                        )}
                        <span
                          title={t.final_score}
                          className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-300"
                        >
                          Final: {(item.final_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Passage text */}
                    <div className="text-xs text-slate-800 leading-relaxed font-sans">
                      {isExpanded ? item.chunk.text : `${item.chunk.text.slice(0, 320)}...`}
                    </div>

                    {/* Expand footer */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span className="font-mono">Chunk ID: {item.chunk.metadata.chunk_id}</span>
                      <button
                        onClick={() => setExpandedChunkId(isExpanded ? null : item.chunk.id)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Collapse' : t.view_passage}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
