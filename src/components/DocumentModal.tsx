import React, { useState } from 'react';
import { X, FileText, Bookmark, Layers, Copy, Check, Hash } from 'lucide-react';
import { DocumentRecord, DocumentChunk } from '../types.js';

interface DocumentModalProps {
  document: DocumentRecord;
  chunks: DocumentChunk[];
  highlightChunkId?: string;
  highlightSnippet?: string;
  onClose: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  document,
  chunks,
  highlightChunkId,
  highlightSnippet,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'chunks' | 'full_text'>('chunks');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopyText = () => {
    if (document.raw_text) {
      navigator.clipboard.writeText(document.raw_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredChunks = searchQuery
    ? chunks.filter(
        (c) =>
          c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.metadata.section.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chunks;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate max-w-md">
                  {document.file_name}
                </h3>
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold">
                  {document.file_type}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {document.page_count} Pages • {chunks.length} Indexed Chunks • {(document.file_size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy All'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Subnav */}
        <div className="px-6 py-2 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('chunks')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'chunks'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Chunks View ({chunks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('full_text')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'full_text'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Text Structure</span>
            </button>
          </div>

          {activeTab === 'chunks' && (
            <input
              type="text"
              placeholder="Filter chunks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
            />
          )}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4">
          {activeTab === 'chunks' ? (
            <div className="space-y-4">
              {filteredChunks.map((chunk, idx) => {
                const isTarget =
                  chunk.metadata.chunk_id === highlightChunkId ||
                  (highlightSnippet && chunk.text.includes(highlightSnippet.slice(0, 40)));

                return (
                  <div
                    key={chunk.id}
                    id={`chunk_${chunk.metadata.chunk_id}`}
                    className={`p-4 rounded-xl border transition-all ${
                      isTarget
                        ? 'bg-amber-50/80 border-amber-400 shadow-md ring-2 ring-amber-300'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                          #{idx + 1} {chunk.metadata.chunk_id}
                        </span>
                        <span>• Page {chunk.metadata.page}</span>
                        <span>• {chunk.metadata.section}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isTarget && (
                          <span className="flex items-center gap-1 text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full text-[11px]">
                            <Bookmark className="w-3 h-3 fill-amber-500 text-amber-600" />
                            Cited In Response
                          </span>
                        )}
                        <span className="font-mono text-slate-400">{chunk.metadata.char_count} chars</span>
                      </div>
                    </div>

                    <div className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-wrap font-sans">
                      {chunk.text}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-sans shadow-xs">
              {document.raw_text || 'No raw text content available.'}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px]">ID: {document.id}</span>
          </div>
          <div>Updated: {new Date(document.updated_at).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};
