import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ShieldCheck,
  FileText,
  Activity,
  Plus,
} from 'lucide-react';
import {
  ChatMessage,
  Citation,
  KnowledgeBase,
  Language,
  Conversation,
} from '../types.js';
import { getTranslation } from '../i18n/translations.js';

interface ChatViewProps {
  activeKb: KnowledgeBase;
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onOpenCitation: (citation: Citation) => void;
  onInspectTrace: (trace: any) => void;
  language: Language;
}

export const ChatView: React.FC<ChatViewProps> = ({
  activeKb,
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onOpenCitation,
  onInspectTrace,
  language,
}) => {
  const t = getTranslation(language);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'thumbs_up' | 'thumbs_down'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync messages when active conversation changes
  useEffect(() => {
    const activeConv = conversations.find((c) => c.id === activeConversationId);
    if (activeConv) {
      setMessages(activeConv.messages || []);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, conversations]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingStatus]);

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend || isStreaming) return;

    setInputPrompt('');

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      conversation_id: activeConversationId,
      role: 'user',
      content: promptToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingStatus(t.generating_stream);

    // Prepare assistant placeholder message
    const assistantMsgId = `msg_a_${Date.now()}`;
    const placeholderAssistant: ChatMessage = {
      id: assistantMsgId,
      conversation_id: activeConversationId,
      role: 'assistant',
      content: '',
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, placeholderAssistant]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConversationId,
          knowledge_base_id: activeKb.id,
          message: promptToSend,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const payload = JSON.parse(line.slice(6));

                if (payload.type === 'stage') {
                  setStreamingStatus(payload.text);
                } else if (payload.type === 'meta') {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            citations: payload.citations,
                            grounding_confidence: payload.grounding_confidence,
                          }
                        : m
                    )
                  );
                } else if (payload.type === 'chunk') {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: m.content + payload.text }
                        : m
                    )
                  );
                } else if (payload.type === 'done') {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, trace: payload.trace, content: payload.content || m.content }
                        : m
                    )
                  );
                  setStreamingStatus(null);
                }
              } catch {
                // Ignore parse errors on partial streams
              }
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `Error generating grounded response: ${(err as Error).message}. (Your knowledge base remains safe).`,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      setStreamingStatus(null);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (msgId: string, rating: 'thumbs_up' | 'thumbs_down', query: string, answer: string) => {
    setFeedbackGiven((prev) => ({ ...prev, [msgId]: rating }));
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: msgId,
          query,
          answer,
          rating,
        }),
      });
    } catch {
      // ignore
    }
  };

  const samplePrompts = [
    'What critical renewable penetration threshold accelerates carbon productivity?',
    'What are the 3 layers introduced by Modular RAG architectures?',
    'ما هي الحوافز المالية والإعفاءات الضريبية الممنوحة لمشاريع الطاقة النظيفة؟',
    'How do Contracts for Difference (CfD) lower the cost of capital?',
  ];

  return (
    <div className="flex h-[calc(100vh-8rem)] max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      {/* Sessions Sidebar */}
      <div className="w-72 border-r border-slate-200 bg-slate-50/60 hidden md:flex flex-col shrink-0">
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Sessions
          </span>
          <button
            onClick={onCreateConversation}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex flex-col gap-1 cursor-pointer ${
                  isActive
                    ? 'bg-white text-indigo-700 font-semibold shadow-xs border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="truncate font-medium">{conv.title}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {conv.messages?.length || 0} msgs
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{activeKb.name}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  Grounded Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Answers are synthesized strictly from indexed document passages with verified citations.
              </p>
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs border border-indigo-100">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  Ask Anything from &quot;{activeKb.name}&quot;
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  The assistant will retrieve relevant passages using hybrid semantic + BM25 search, execute cross-attention reranking, and ground the answer with exact document citations.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="grid grid-cols-1 gap-2 w-full pt-2">
                {samplePrompts.map((sp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sp)}
                    className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-indigo-50/50 hover:border-indigo-200 text-xs text-slate-700 font-medium transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span>{sp}</span>
                    <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-2xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* User / Assistant Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white shadow-xs font-medium rounded-br-xs'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 shadow-xs rounded-tl-xs whitespace-pre-wrap font-sans'
                      }`}
                    >
                      {msg.content || (
                        <span className="inline-flex items-center gap-1.5 text-slate-400 italic">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                          Generating grounded response...
                        </span>
                      )}
                    </div>

                    {/* Grounding & Citations Bar */}
                    {!isUser && (msg.citations?.length || 0) > 0 && (
                      <div className="p-3 bg-slate-100/70 border border-slate-200/80 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t.sources_cited} ({msg.citations?.length})</span>
                          </div>

                          {msg.grounding_confidence && (
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold ${
                                msg.grounding_confidence === 'High'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : msg.grounding_confidence === 'Medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {msg.grounding_confidence === 'High'
                                ? t.grounding_high
                                : msg.grounding_confidence === 'Medium'
                                ? t.grounding_medium
                                : t.grounding_low}
                            </span>
                          )}
                        </div>

                        {/* Citation clickable cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {msg.citations?.map((cit) => (
                            <div
                              key={cit.id}
                              onClick={() => onOpenCitation(cit)}
                              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all cursor-pointer flex flex-col justify-between space-y-1 shadow-xs group"
                            >
                              <div className="flex items-center justify-between font-semibold text-indigo-700 text-[11px]">
                                <div className="flex items-center gap-1 truncate max-w-[170px]">
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  <span className="truncate">[{cit.id}] {cit.file_name}</span>
                                </div>
                                <span className="font-mono text-slate-500 text-[10px] shrink-0">
                                  p. {cit.page}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                                &quot;{cit.snippet}&quot;
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                                <span className="font-mono">Match: {(cit.relevance * 100).toFixed(0)}%</span>
                                <span className="text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5">
                                  <span>Inspect</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assistant message action buttons */}
                    {!isUser && msg.content && (
                      <div className="flex items-center gap-2 pt-1 text-slate-400 text-xs">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-slate-700 flex items-center gap-1 p-1 rounded transition-colors"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-[11px]">{copiedId === msg.id ? 'Copied' : t.copy_answer}</span>
                        </button>

                        <button
                          onClick={() => handleSendMessage(messages[messages.length - 2]?.content)}
                          className="hover:text-slate-700 flex items-center gap-1 p-1 rounded transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="text-[11px]">{t.regenerate}</span>
                        </button>

                        {msg.trace && (
                          <button
                            onClick={() => onInspectTrace(msg.trace)}
                            className="hover:text-indigo-600 flex items-center gap-1 p-1 rounded transition-colors text-indigo-600 font-medium"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span className="text-[11px]">{t.inspect_trace}</span>
                          </button>
                        )}

                        <div className="ml-auto flex items-center gap-1">
                          <button
                            onClick={() => handleFeedback(msg.id, 'thumbs_up', messages[messages.length - 2]?.content || '', msg.content)}
                            className={`p-1 rounded hover:text-emerald-600 transition-colors ${
                              feedbackGiven[msg.id] === 'thumbs_up' ? 'text-emerald-600 font-bold' : ''
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'thumbs_down', messages[messages.length - 2]?.content || '', msg.content)}
                            className={`p-1 rounded hover:text-rose-600 transition-colors ${
                              feedbackGiven[msg.id] === 'thumbs_down' ? 'text-rose-600 font-bold' : ''
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-xs mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Real-time status indicator */}
          {streamingStatus && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium bg-indigo-50/80 px-3 py-2 rounded-xl border border-indigo-100 animate-pulse max-w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{streamingStatus}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-white rounded-2xl border border-slate-300 px-4 py-2 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={t.ask_placeholder}
              disabled={isStreaming}
              className="flex-1 text-xs md:text-sm text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 py-1 font-medium"
            />
            <button
              type="submit"
              disabled={isStreaming || !inputPrompt.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pt-2">
            <span>Powered by Gemini 2.5 + Cross-Encoder Reranking</span>
            <span>Grounding: Anti-Injection Guarded</span>
          </div>
        </div>
      </div>
    </div>
  );
};
