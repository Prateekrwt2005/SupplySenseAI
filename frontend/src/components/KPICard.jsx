import React from 'react';

export default function KPICard({ title, value, subtitle, icon: Icon, change, changeType = 'positive', statusIndicator }) {
  const getIndicatorBorder = () => {
    if (statusIndicator === 'red' || changeType === 'negative') return 'border-l-2 border-l-red-500';
    if (statusIndicator === 'yellow') return 'border-l-2 border-l-amber-400';
    if (statusIndicator === 'green' || changeType === 'positive') return 'border-l-2 border-l-emerald-500';
    return 'border-l-2 border-l-zinc-600';
  };

  return (
    <div className={`human-card human-card-hover rounded-lg p-5 relative overflow-hidden ${getIndicatorBorder()}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{title}</p>
          <h3 className="text-3xl font-extrabold mt-1 text-white tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-800/80">
        <span className="truncate mr-2">{subtitle}</span>
        {change && (
          <span className={`font-mono text-[11px] font-semibold flex-shrink-0 ${
            changeType === 'positive' ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
