import React from 'react';
import { Activity, RefreshCw, Menu } from 'lucide-react';

export default function Header({ activePageTitle, onQuickAnalyze, isAnalyzing, onToggleMobileMenu }) {
  return (
    <header className="h-14 border-b border-zinc-800 bg-[#0c0c0e]/95 backdrop-blur px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Hamburger toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
          aria-label="Toggle navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider truncate">
          {activePageTitle}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Quick run analyze button */}
        <button
          onClick={onQuickAnalyze}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-all disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden xs:inline">Analyzing...</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Run Disruption Analysis</span>
              <span className="sm:hidden">Analyze</span>
            </>
          )}
        </button>

        {/* Threat status indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="uppercase text-[10px] tracking-wider">Threat Level: Elevated</span>
        </div>
      </div>
    </header>
  );
}

