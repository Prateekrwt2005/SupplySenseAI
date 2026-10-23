import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';

export default function Header({ activePageTitle, onQuickAnalyze, isAnalyzing }) {
  return (
    <header className="h-14 border-b border-zinc-800 bg-[#0c0c0e]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">{activePageTitle}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick run analyze button */}
        <button
          onClick={onQuickAnalyze}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-all disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5" />
              <span>Run Disruption Analysis</span>
            </>
          )}
        </button>

        {/* Threat status indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="uppercase text-[10px] tracking-wider">Threat Level: Elevated</span>
        </div>
      </div>
    </header>
  );
}
