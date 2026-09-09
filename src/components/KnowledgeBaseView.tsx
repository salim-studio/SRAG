import React, { useState } from 'react';
import {
  Database,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';
import { KnowledgeBase, Language } from '../types.js';
import { getTranslation } from '../i18n/translations.js';

interface KnowledgeBaseViewProps {
  knowledgeBases: KnowledgeBase[];
  activeKbId: string;
  onSelectKb: (id: string) => void;
  onCreateKb: (data: Partial<KnowledgeBase>) => Promise<void>;
  onDeleteKb: (id: string) => Promise<void>;
  language: Language;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  knowledgeBases,
  activeKbId,
  onSelectKb,
  onCreateKb,
  onDeleteKb,
  language,
}) => {
  const t = getTranslation(language);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [kbLanguage, setKbLanguage] = useState<'en' | 'ar' | 'fr' | 'multilingual'>('en');
  const [chunkSize, setChunkSize] = useState(750);
  const [chunkOverlap, setChunkOverlap] = useState(80);
  const [strategy, setStrategy] = useState<'semantic' | 'recursive' | 'sentence' | 'fixed'>('semantic');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      await onCreateKb({
        name: name.trim(),
        description: description.trim(),
        language: kbLanguage,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
        chunking_strategy: strategy,
      });
      setShowCreateModal(false);
      setName('');
      setDescription('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {t.knowledge_bases} ({knowledgeBases.length})
          </h2>
          <p className="text-xs text-slate-500">
            Create domain-isolated vector indices with tailored chunking parameters and language settings.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.create_kb}</span>
        </button>
      </div>

      {/* Grid of Knowledge Bases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {knowledgeBases.map((kb) => {
          const isActive = kb.id === activeKbId;
          return (
            <div
              key={kb.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between space-y-4 transition-all shadow-xs ${
                isActive
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  {isActive ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Index
                    </span>
                  ) : (
                    <button
                      onClick={() => onSelectKb(kb.id)}
                      className="text-xs font-semibold text-slate-600 hover:text-indigo-600 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Set Active
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{kb.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {kb.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{kb.document_count || 0} Documents</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>{kb.chunk_count || 0} Chunks</span>
                  </div>
                </div>

                {/* Hyperparameters pill */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Chunk Size:</span>
                    <span className="font-mono font-semibold">{kb.chunk_size} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overlap:</span>
                    <span className="font-mono font-semibold">{kb.chunk_overlap} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Strategy:</span>
                    <span className="font-semibold capitalize text-indigo-700">{kb.chunking_strategy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Language:</span>
                    <span className="font-mono uppercase">{kb.language}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span>Created {new Date(kb.created_at).toLocaleDateString()}</span>
                {knowledgeBases.length > 1 && (
                  <button
                    onClick={() => onDeleteKb(kb.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create KB Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">{t.create_kb}</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.kb_name}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Legal & Compliance Docs"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.kb_desc}</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of documents and domain coverage..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.kb_lang}</label>
                  <select
                    value={kbLanguage}
                    onChange={(e) => setKbLanguage(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية (Arabic RTL)</option>
                    <option value="fr">Français (French)</option>
                    <option value="multilingual">Multilingual</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.chunk_strategy}</label>
                  <select
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="semantic">Semantic Structure</option>
                    <option value="recursive">Recursive Character</option>
                    <option value="sentence">Sentence Window</option>
                    <option value="fixed">Fixed Size</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.chunk_size}</label>
                  <input
                    type="number"
                    min={200}
                    max={2000}
                    step={50}
                    value={chunkSize}
                    onChange={(e) => setChunkSize(parseInt(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.chunk_overlap}</label>
                  <input
                    type="number"
                    min={0}
                    max={400}
                    step={10}
                    value={chunkOverlap}
                    onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{creating ? 'Creating...' : 'Create Index'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
