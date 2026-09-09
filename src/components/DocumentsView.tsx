import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  RefreshCw,
  Eye,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { DocumentRecord, KnowledgeBase, Language } from '../types.js';
import { getTranslation } from '../i18n/translations.js';

interface DocumentsViewProps {
  activeKb: KnowledgeBase;
  documents: DocumentRecord[];
  onUpload: (data: { file_name: string; file_type: string; file_size: number; content: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReindex: (id: string) => Promise<void>;
  onPreview: (doc: DocumentRecord) => void;
  language: Language;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  activeKb,
  documents,
  onUpload,
  onDelete,
  onReindex,
  onPreview,
  language,
}) => {
  const t = getTranslation(language);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [reindexingId, setReindexingId] = useState<string | null>(null);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !fileContent.trim()) return;

    setUploading(true);
    try {
      const ext = fileName.split('.').pop()?.toLowerCase() || 'txt';
      await onUpload({
        file_name: fileName.trim(),
        file_type: ext,
        file_size: fileContent.length,
        content: fileContent,
      });
      setShowUploadModal(false);
      setFileName('');
      setFileContent('');
    } finally {
      setUploading(false);
    }
  };

  const handleNativeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text || '');
    };
    reader.readAsText(file);
  };

  const handleLoadSample = (type: 'tech' | 'energy' | 'arabic') => {
    if (type === 'tech') {
      setFileName('Vector_Index_Benchmarking_Guide.md');
      setFileContent(`# Vector Indexing & Approximate Nearest Neighbors (ANN) Guide
Author: Senior AI Infrastructure Architect

## 1. Hierarchical Navigable Small World (HNSW)
HNSW builds a multi-layer graph where bottom layers contain all vectors and top layers contain sparse vectors for rapid skip-list search. It provides sub-10ms search latencies on 1M vectors with 98% recall at the cost of high RAM consumption (approximately 1.5x - 2x raw vector size).

## 2. Inverted File Flat (IVFFlat)
IVFFlat clusters vector spaces using k-means into n-lists. During search, it only probes the closest centroids, yielding 4x less memory consumption than HNSW but requiring periodic re-clustering as new vectors are ingested.`);
    } else if (type === 'energy') {
      setFileName('BESS_Battery_Economics_Analysis.txt');
      setFileContent(`--- Page 1 ---
# Battery Energy Storage Systems (BESS) Technical Specifications
Published by: Energy Analytics Lab

## Executive Overview
Grid-scale BESS solutions employing LFP (Lithium Iron Phosphate) chemistry provide 4-hour discharge durations with 89% round-trip efficiency. Total installed project costs dropped to $185/kWh in 2024.

--- Page 2 ---
## Grid Stabilization and Ancillary Services
Fast-response battery inverters deliver synthetic inertia and primary frequency response within 120 milliseconds of an under-frequency event, mitigating brownout risks across decentralized grids.`);
    } else {
      setFileName('معايير_جودة_البيانات_في_الذكاء_الاصطناعي.txt');
      setFileContent(`--- صفحة 1 ---
# معايير جودة البيانات في أنظمة الذكاء الاصطناعي والتوليد المعزز بالاسترجاع
إعداد: مركز الأبحاث الرقمية

## 1. تنقية وتجهيز البيانات
تتطلب أنظمة RAG تنقية دقيقة للمستندات من الرموز الزائدة وفصل الجداول بدقة لضمان دقة التضمينات الدلالية وعدم تشتت المتجهات في الفضاء الرياضي.

--- صفحة 2 ---
## 2. استراتيجية التقطيع العربي
نظراً لطبيعة اللغة العربية الصرفية والتركيبية، يوصى باستخدام التقطيع الدلالي الذكي الذي يعتمد على علامات الترقيم وبدايات الفقرات بدلاً من التقطيع الثابت لضمان الحفاظ على المعنى والسياق.`);
    }
  };

  const handleTriggerReindex = async (id: string) => {
    setReindexingId(id);
    try {
      await onReindex(id);
    } finally {
      setReindexingId(null);
    }
  };

  const getStatusBadge = (status: DocumentRecord['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.status_completed}</span>
          </span>
        );
      case 'extracting':
      case 'chunking':
      case 'embedding':
      case 'indexing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span className="capitalize">{status}...</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>{t.status_failed}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <Clock className="w-3.5 h-3.5" />
            <span>{t.status_uploaded}</span>
          </span>
        );
    }
  };

  const getFileIcon = (fileType: string) => {
    const ext = fileType.toLowerCase();
    if (ext.includes('csv') || ext.includes('xlsx')) return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    if (ext.includes('json') || ext.includes('html') || ext.includes('md')) return <FileCode className="w-4 h-4 text-amber-600" />;
    return <FileText className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {t.documents} ({documents.length})
          </h2>
          <p className="text-xs text-slate-500">
            Documents currently indexed in <span className="font-semibold text-slate-700">{activeKb.name}</span>
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.upload_doc}</span>
        </button>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {documents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">No documents in this knowledge base</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Upload PDF, DOCX, CSV, TXT, or markdown files to start semantic retrieval and Q&A.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              Upload Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs font-semibold">
                  <th className="px-6 py-3.5">Document</th>
                  <th className="px-4 py-3.5">Format</th>
                  <th className="px-4 py-3.5">{t.pages}</th>
                  <th className="px-4 py-3.5">{t.chunks}</th>
                  <th className="px-4 py-3.5">{t.ingestion_status}</th>
                  <th className="px-6 py-3.5 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          {getFileIcon(doc.file_type)}
                        </div>
                        <div className="truncate max-w-sm">
                          <div
                            onClick={() => onPreview(doc)}
                            className="font-semibold text-slate-900 truncate hover:text-indigo-600 cursor-pointer"
                          >
                            {doc.file_name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {(doc.file_size / 1024).toFixed(1)} KB • Added {new Date(doc.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="uppercase font-mono font-bold text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono font-semibold text-slate-700">
                      {doc.page_count}
                    </td>
                    <td className="px-4 py-4 font-mono font-semibold text-indigo-700">
                      {doc.chunk_count}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPreview(doc)}
                          title={t.preview}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTriggerReindex(doc.id)}
                          disabled={reindexingId === doc.id}
                          title={t.reindex}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${reindexingId === doc.id ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => onDelete(doc.id)}
                          title={t.delete}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">{t.upload_doc}</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="p-6 space-y-4">
              {/* Preset sample documents loader */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs space-y-2">
                <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Load Sample Benchmark Documents (1-Click):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadSample('tech')}
                    className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-indigo-700 font-medium hover:bg-indigo-100 transition-colors"
                  >
                    + ANN Vector Benchmarks (MD)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('energy')}
                    className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-indigo-700 font-medium hover:bg-indigo-100 transition-colors"
                  >
                    + Battery Grid Storage (TXT)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('arabic')}
                    className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-indigo-700 font-medium hover:bg-indigo-100 transition-colors"
                  >
                    + معايير جودة الذكاء الاصطناعي (العربية)
                  </button>
                </div>
              </div>

              {/* Native file upload button */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload From Disk (PDF, DOCX, TXT, MD, CSV, JSON, HTML)
                </label>
                <input
                  type="file"
                  onChange={handleNativeFileSelect}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Filename
                </label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. Research_Paper_2025.pdf"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Content / Text Extract
                </label>
                <textarea
                  required
                  rows={8}
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  placeholder="Paste or type document text here. Use '--- Page 1 ---' or '# Header' markers to test structured page/section chunking..."
                  className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !fileName.trim() || !fileContent.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing Pipeline...</span>
                    </>
                  ) : (
                    <span>Process & Index Document</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
