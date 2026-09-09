import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  FileCheck,
  Zap,
} from 'lucide-react';
import { EvaluationResult, KnowledgeBase, Language } from '../types.js';
import { getTranslation } from '../i18n/translations.js';

interface EvaluationViewProps {
  activeKb: KnowledgeBase;
  language: Language;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({
  activeKb,
  language,
}) => {
  const t = getTranslation(language);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<EvaluationResult[]>([]);

  // Load history on mount
  useEffect(() => {
    fetch('/api/evaluation/history')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHistory(data);
          setResult(data[0]);
        }
      })
      .catch(() => {});
  }, [activeKb.id]);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await fetch('/api/evaluation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledge_base_id: activeKb.id }),
      });
      const data = await res.json();
      setResult(data);
      setHistory((prev) => [data, ...prev]);
    } catch (err) {
      alert(`Evaluation failed: ${(err as Error).message}`);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {t.eval_title}
          </h2>
          <p className="text-xs text-slate-500">
            {t.eval_desc} Active Benchmark: <span className="font-semibold text-slate-700">{activeKb.name}</span>
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={evaluating}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          {evaluating ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Evaluating Benchmark Dataset...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>{t.run_eval}</span>
            </>
          )}
        </button>
      </div>

      {/* Scorecards */}
      {result ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500">{t.hit_rate}</div>
              <div className="text-2xl font-extrabold text-indigo-700 font-mono mt-1">
                {(result.hit_rate * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>Target &gt;90%</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500">{t.mrr}</div>
              <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1">
                {result.mrr.toFixed(3)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">1.0 = Perfect 1st Rank</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500">{t.precision_at_k}</div>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
                {(result.precision_at_k * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Retrieved relevance</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500">{t.recall_at_k}</div>
              <div className="text-2xl font-extrabold text-purple-700 font-mono mt-1">
                {(result.recall_at_k * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Expected coverage</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500">{t.faithfulness}</div>
              <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1">
                {(result.faithfulness_score * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                <FileCheck className="w-3 h-3" />
                <span>Anti-Hallucination</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500">Avg Latency</div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                {result.average_latency_ms} ms
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Retrieval + Rerank</div>
            </div>
          </div>

          {/* Detailed Question Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>{t.eval_results} ({result.details?.length || 0} Evaluated Items)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Executed: {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="space-y-3">
              {result.details?.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      {item.hit ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>Q{idx + 1}: &quot;{item.question}&quot;</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                        RR: {item.reciprocal_rank.toFixed(2)}
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
                        Faithfulness: {(item.faithfulness * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-500">Expected Source(s):</span>
                      <div className="text-slate-800 font-mono mt-0.5">{item.expected_sources.join(', ')}</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-500">Top Retrieved Source(s):</span>
                      <div className="text-slate-800 font-mono mt-0.5">
                        {item.retrieved_sources.slice(0, 2).join(', ') || 'None'}
                      </div>
                    </div>
                  </div>

                  {item.answer && (
                    <div className="text-slate-600 italic bg-white/80 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                      &quot;{item.answer.slice(0, 220)}...&quot;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Ready to benchmark</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click &quot;Run Benchmark Evaluation&quot; to execute automated Hit Rate, MRR, Precision, and Faithfulness tests against ground truth questions.
          </p>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Past Benchmark Runs ({history.length})
          </h4>
          <div className="space-y-1.5">
            {history.slice(1, 5).map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 text-xs hover:bg-slate-50"
              >
                <span className="font-mono text-slate-500">{new Date(h.timestamp).toLocaleString()}</span>
                <div className="flex items-center gap-3 font-mono">
                  <span>Hit Rate: {(h.hit_rate * 100).toFixed(0)}%</span>
                  <span>MRR: {h.mrr.toFixed(3)}</span>
                  <span>Faithfulness: {(h.faithfulness_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
