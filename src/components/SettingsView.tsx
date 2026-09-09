import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Check,
  Cpu,
  Sliders,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { SystemConfig, Language } from '../types.js';
import { getTranslation } from '../i18n/translations.js';

interface SettingsViewProps {
  language: Language;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ language }) => {
  const t = getTranslation(language);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {t.settings}
          </h2>
          <p className="text-xs text-slate-500">
            Fine-tune retrieval thresholds, hybrid weights, reranker models, and context constraints.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Model Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>AI Models & Embeddings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                LLM Generation Model
              </label>
              <select
                value={config.llm_model}
                onChange={(e) => setConfig({ ...config, llm_model: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800"
              >
                <option value="gemini-3.8-flash">Gemini 2.5 Flash (Fast, High Quality)</option>
                <option value="gemini-3.8-pro">Gemini 2.5 Pro (Deep Reasoning)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Embedding Provider & Model
              </label>
              <select
                value={config.embedding_provider}
                onChange={(e) =>
                  setConfig({ ...config, embedding_provider: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800"
              >
                <option value="gemini">Gemini Text Embeddings (gemini-embedding-2-preview)</option>
                <option value="local">Local Dense Vector Fallback (Offline)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Retrieval & Hybrid Search Tuning */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Retrieval & Reranking Tuning</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                <span>Top-K Retrieved Chunks</span>
                <span className="font-mono text-indigo-700 font-bold">{config.top_k}</span>
              </div>
              <input
                type="range"
                min={2}
                max={15}
                value={config.top_k}
                onChange={(e) => setConfig({ ...config, top_k: parseInt(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>2</span>
                <span>15</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                <span>Hybrid Alpha (α)</span>
                <span className="font-mono text-indigo-700 font-bold">{config.hybrid_alpha}</span>
              </div>
              <input
                type="range"
                min={0.0}
                max={1.0}
                step={0.05}
                value={config.hybrid_alpha}
                onChange={(e) =>
                  setConfig({ ...config, hybrid_alpha: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0.0 (BM25)</span>
                <span>1.0 (Vector)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                <span>Max Context Window</span>
                <span className="font-mono text-indigo-700 font-bold">{config.max_context_chars}c</span>
              </div>
              <input
                type="range"
                min={1500}
                max={10000}
                step={500}
                value={config.max_context_chars}
                onChange={(e) =>
                  setConfig({ ...config, max_context_chars: parseInt(e.target.value) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>1500</span>
                <span>10,000</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <span className="font-bold text-slate-800">Enable Cross-Attention Reranker</span>
              <p className="text-[11px] text-slate-500">
                Rescores candidates using exact phrase alignment and lexical density before passing to LLM.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.reranking_enabled}
              onChange={(e) => setConfig({ ...config, reranking_enabled: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Chunking Defaults */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Default Document Ingestion Chunking</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Chunk Size (chars)</label>
              <input
                type="number"
                value={config.chunk_size}
                onChange={(e) => setConfig({ ...config, chunk_size: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Overlap (chars)</label>
              <input
                type="number"
                value={config.chunk_overlap}
                onChange={(e) => setConfig({ ...config, chunk_overlap: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chunking Strategy</label>
              <select
                value={config.chunking_strategy}
                onChange={(e) => setConfig({ ...config, chunking_strategy: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="semantic">Semantic Structure (Headers & Tables)</option>
                <option value="recursive">Recursive Paragraph & Sentence</option>
                <option value="sentence">Sentence Sliding Window</option>
                <option value="fixed">Uniform Fixed-Size</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Anti-Hallucination */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-800">Strict Anti-Hallucination Guardrails</span>
              <p className="text-[11px] text-slate-500">
                Forces LLM to state &quot;Insufficient Information&quot; if retrieved documents do not contain direct answers.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={config.strict_anti_hallucination}
            onChange={(e) =>
              setConfig({ ...config, strict_anti_hallucination: e.target.checked })
            }
            className="w-4 h-4 accent-emerald-600 cursor-pointer"
          />
        </div>
      </form>
    </div>
  );
};
