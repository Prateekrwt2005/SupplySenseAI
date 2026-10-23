import React from 'react';

export default function RiskBadge({ level, score }) {
  const getBadgeStyle = () => {
    switch ((level || '').toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-red-950/60 text-red-400 border-red-500/40';
      case 'medium':
      case 'elevated':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
      case 'low':
      case 'normal':
      case 'safe':
      default:
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40';
    }
  };

  const getDotColor = () => {
    switch ((level || '').toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-red-500';
      case 'medium':
      case 'elevated':
        return 'bg-amber-400';
      case 'low':
      default:
        return 'bg-emerald-400';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${getBadgeStyle()}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      <span className="uppercase tracking-wider">{level || 'Normal'}</span>
      {score !== undefined && <span className="font-mono text-zinc-300 opacity-90">({score}%)</span>}
    </span>
  );
}
