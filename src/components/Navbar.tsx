import React from 'react';
import { Database, Globe, Bug, Sparkles, ChevronDown } from 'lucide-react';
import { KnowledgeBase, Language } from '../types.js';
import { getTranslation } from '../i18n/translations.js';

interface NavbarProps {
  knowledgeBases: KnowledgeBase[];
  activeKbId: string;
  onSelectKb: (id: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  debugMode: boolean;
  onToggleDebugMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  knowledgeBases,
  activeKbId,
  onSelectKb,
  language,
  onLanguageChange,
  debugMode,
  onToggleDebugMode,
}) => {
  const t = getTranslation(language);
  const activeKb = knowledgeBases.find((k) => k.id === activeKbId);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-100">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base md:text-lg text-slate-900 tracking-tight">
              {t.app_title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {t.operational}
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden md:block truncate max-w-sm">
            {t.app_subtitle}
          </p>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Knowledge Base selector */}
        <div className="relative flex items-center">
          <div className="hidden lg:flex items-center text-xs font-semibold text-slate-500 mr-2">
            <Database className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span>{t.active_kb}:</span>
          </div>
          <div className="relative">
            <select
              value={activeKbId}
              onChange={(e) => onSelectKb(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-lg pl-3 pr-8 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[170px] sm:max-w-[240px] truncate transition-colors"
            >
              {knowledgeBases.map((kb) => (
                <option key={kb.id} value={kb.id}>
                  📚 {kb.name} ({kb.document_count || 0} docs)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Developer Debug Toggle */}
        <button
          onClick={onToggleDebugMode}
          title={t.inspect_trace}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            debugMode
              ? 'bg-amber-50 border-amber-300 text-amber-800 ring-1 ring-amber-300'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Bug className={`w-3.5 h-3.5 ${debugMode ? 'text-amber-600' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Debug</span>
        </button>

        {/* Language selector */}
        <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-400 mx-1.5 hidden sm:block" />
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              language === 'en'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => onLanguageChange('ar')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              language === 'ar'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            العربية
          </button>
          <button
            onClick={() => onLanguageChange('fr')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              language === 'fr'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            FR
          </button>
        </div>
      </div>
    </header>
  );
};
