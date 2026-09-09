import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { DashboardView } from './components/DashboardView.js';
import { KnowledgeBaseView } from './components/KnowledgeBaseView.js';
import { DocumentsView } from './components/DocumentsView.js';
import { SearchView } from './components/SearchView.js';
import { ChatView } from './components/ChatView.js';
import { DebugTraceView } from './components/DebugTraceView.js';
import { EvaluationView } from './components/EvaluationView.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import { ArchitectureView } from './components/ArchitectureView.js';
import { SettingsView } from './components/SettingsView.js';
import { DocumentModal } from './components/DocumentModal.js';
import {
  ActiveTab,
  Language,
  KnowledgeBase,
  DocumentRecord,
  DocumentChunk,
  Conversation,
  RAGTrace,
  Citation,
} from './types.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [language, setLanguage] = useState<Language>('en');
  const [debugMode, setDebugMode] = useState<boolean>(false);

  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [activeKbId, setActiveKbId] = useState<string>('kb_clean_energy');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');

  // Developer Trace State
  const [currentTrace, setCurrentTrace] = useState<RAGTrace | null>(null);

  // Document Modal Preview State
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [previewChunks, setPreviewChunks] = useState<DocumentChunk[]>([]);
  const [highlightChunkId, setHighlightChunkId] = useState<string | undefined>();
  const [highlightSnippet, setHighlightSnippet] = useState<string | undefined>();

  // Fetch Knowledge Bases
  const fetchKnowledgeBases = async () => {
    try {
      const res = await fetch('/api/knowledge-bases');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setKnowledgeBases(data);
        if (!activeKbId || !data.some((k) => k.id === activeKbId)) {
          setActiveKbId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch knowledge bases:', err);
    }
  };

  // Fetch Documents for active KB
  const fetchDocuments = async (kbId: string) => {
    try {
      const res = await fetch(`/api/documents?kb_id=${kbId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  // Fetch Conversations for active KB
  const fetchConversations = async (kbId: string) => {
    try {
      const res = await fetch(`/api/conversations?kb_id=${kbId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setConversations(data);
        if (data.length > 0) {
          setActiveConversationId(data[0].id);
        } else {
          setActiveConversationId('');
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  useEffect(() => {
    if (activeKbId) {
      fetchDocuments(activeKbId);
      fetchConversations(activeKbId);
    }
  }, [activeKbId]);

  // Set RTL direction if Arabic
  const isRtl = language === 'ar';

  const activeKb = knowledgeBases.find((k) => k.id === activeKbId) || {
    id: activeKbId,
    name: 'Default Knowledge Base',
    description: '',
    language: 'en',
    chunk_size: 750,
    chunk_overlap: 80,
    chunking_strategy: 'semantic',
    created_at: new Date().toISOString(),
  };

  const totalChunks = documents.reduce((acc, curr) => acc + (curr.chunk_count || 0), 0);

  // Handle Document Upload
  const handleUploadDocument = async (docData: {
    file_name: string;
    file_type: string;
    file_size: number;
    content: string;
  }) => {
    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kb_id: activeKbId,
        ...docData,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }
    await fetchDocuments(activeKbId);
    await fetchKnowledgeBases();
  };

  // Handle Document Delete
  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document and its vector chunks?')) return;
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    await fetchDocuments(activeKbId);
    await fetchKnowledgeBases();
  };

  // Handle Re-index
  const handleReindexDocument = async (id: string) => {
    await fetch(`/api/documents/${id}/reindex`, { method: 'POST' });
    await fetchDocuments(activeKbId);
    await fetchKnowledgeBases();
  };

  // Handle Preview Document
  const handlePreviewDocument = async (doc: DocumentRecord, chunkId?: string, snippet?: string) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      const data = await res.json();
      setPreviewDoc(data.document || doc);
      setPreviewChunks(data.chunks || []);
      setHighlightChunkId(chunkId);
      setHighlightSnippet(snippet);
    } catch {
      setPreviewDoc(doc);
      setPreviewChunks([]);
    }
  };

  // Handle Citation Click in Chat
  const handleOpenCitation = async (citation: Citation) => {
    const doc = documents.find((d) => d.id === citation.document_id) || {
      id: citation.document_id,
      knowledge_base_id: activeKbId,
      file_name: citation.file_name,
      file_type: citation.file_name.split('.').pop() || 'txt',
      file_size: 10240,
      page_count: citation.page || 1,
      chunk_count: 1,
      status: 'completed' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    handlePreviewDocument(doc, citation.chunk_id, citation.snippet);
  };

  // Handle KB Creation
  const handleCreateKb = async (data: Partial<KnowledgeBase>) => {
    const res = await fetch('/api/knowledge-bases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const newKb = await res.json();
    setKnowledgeBases((prev) => [...prev, newKb]);
    setActiveKbId(newKb.id);
  };

  // Handle KB Delete
  const handleDeleteKb = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entire knowledge base and all its documents?')) return;
    await fetch(`/api/knowledge-bases/${id}`, { method: 'DELETE' });
    const remaining = knowledgeBases.filter((k) => k.id !== id);
    setKnowledgeBases(remaining);
    if (remaining.length > 0) {
      setActiveKbId(remaining[0].id);
    }
  };

  // Handle New Conversation
  const handleCreateConversation = async () => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        knowledge_base_id: activeKbId,
        title: `Research Session #${conversations.length + 1}`,
      }),
    });
    const newConv = await res.json();
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900 ${
        isRtl ? 'font-arabic' : ''
      }`}
    >
      {/* Top Navigation */}
      <Navbar
        knowledgeBases={knowledgeBases}
        activeKbId={activeKbId}
        onSelectKb={setActiveKbId}
        language={language}
        onLanguageChange={setLanguage}
        debugMode={debugMode}
        onToggleDebugMode={() => {
          setDebugMode(!debugMode);
          if (!debugMode) setActiveTab('debug_trace');
        }}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          language={language}
          documentCount={documents.length}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              activeKb={activeKb}
              documents={documents}
              totalChunks={totalChunks}
              onNavigate={setActiveTab}
              onOpenUpload={() => setActiveTab('documents')}
              onPreviewDoc={handlePreviewDocument}
              language={language}
            />
          )}

          {activeTab === 'knowledge_bases' && (
            <KnowledgeBaseView
              knowledgeBases={knowledgeBases}
              activeKbId={activeKbId}
              onSelectKb={setActiveKbId}
              onCreateKb={handleCreateKb}
              onDeleteKb={handleDeleteKb}
              language={language}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              activeKb={activeKb}
              documents={documents}
              onUpload={handleUploadDocument}
              onDelete={handleDeleteDocument}
              onReindex={handleReindexDocument}
              onPreview={handlePreviewDocument}
              language={language}
            />
          )}

          {activeTab === 'search' && (
            <SearchView
              activeKb={activeKb}
              language={language}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView
              activeKb={activeKb}
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
              onCreateConversation={handleCreateConversation}
              onOpenCitation={handleOpenCitation}
              onInspectTrace={(trace) => {
                setCurrentTrace(trace);
                setActiveTab('debug_trace');
              }}
              language={language}
            />
          )}

          {activeTab === 'debug_trace' && (
            <DebugTraceView
              trace={currentTrace}
              language={language}
            />
          )}

          {activeTab === 'evaluation' && (
            <EvaluationView
              activeKb={activeKb}
              language={language}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView language={language} />
          )}

          {activeTab === 'architecture' && (
            <ArchitectureView language={language} />
          )}

          {activeTab === 'settings' && (
            <SettingsView language={language} />
          )}
        </main>
      </div>

      {/* Full Document & Chunk Preview Modal */}
      {previewDoc && (
        <DocumentModal
          document={previewDoc}
          chunks={previewChunks}
          highlightChunkId={highlightChunkId}
          highlightSnippet={highlightSnippet}
          onClose={() => {
            setPreviewDoc(null);
            setHighlightChunkId(undefined);
            setHighlightSnippet(undefined);
          }}
        />
      )}
    </div>
  );
}
