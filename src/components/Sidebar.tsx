import React from 'react';
import {
  LayoutDashboard,
  Database,
  FileText,
  Search,
  MessageSquareText,
  Activity,
  CheckCircle2,
  BarChart3,
  Network,
  Settings,
} from 'lucide-react';
import { ActiveTab, Language } from '../types.js';
import { getTranslation } from '../i18n/translations.js';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  language: Language;
  documentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  language,
  documentCount,
}) => {
  const t = getTranslation(language);

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: t.dashboard, icon: LayoutDashboard },
    { id: 'chat' as ActiveTab, label: t.chat, icon: MessageSquareText, highlight: true },
    { id: 'documents' as ActiveTab, label: t.documents, icon: FileText, badge: documentCount },
    { id: 'search' as ActiveTab, label: t.search, icon: Search },
    { id: 'knowledge_bases' as ActiveTab, label: t.knowledge_bases, icon: Database },
    { id: 'debug_trace' as ActiveTab, label: t.debug_trace, icon: Activity },
    { id: 'evaluation' as ActiveTab, label: t.evaluation, icon: CheckCircle2 },
    { id: 'analytics' as ActiveTab, label: t.analytics, icon: BarChart3 },
    { id: 'architecture' as ActiveTab, label: t.architecture, icon: Network },
    { id: 'settings' as ActiveTab, label: t.settings, icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400 font-semibold px-2">
          <span>RAG Pipeline OS</span>
          <span className="text-emerald-400 font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            v2.5 Hybrid
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : item.highlight
                  ? 'text-indigo-300 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Vector Metric</span>
          <span className="text-slate-300 font-mono">Cosine (128-d)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Lexical Index</span>
          <span className="text-slate-300 font-mono">BM25 (k1=1.5)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Reranker</span>
          <span className="text-emerald-400 font-mono">Cross-Scorer</span>
        </div>
      </div>
    </aside>
  );
};
