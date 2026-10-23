import React, { useState } from 'react';
import { MessageSquare, Bot, ArrowRight, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { runAnalyzeSupplyChain } from '../services/api';

const PRESET_QUERIES = [
  {
    title: "Why is Supplier SUP001 (Global Components Ltd.) at Critical Risk?",
    supplier: "SUP001",
    product: "P001"
  },
  {
    title: "What is the stockout risk for Industrial Controller X1 over 14 days?",
    supplier: "SUP001",
    product: "P001"
  },
  {
    title: "How does Nexis Microelectronics compare as a backup supplier?",
    supplier: "SUP002",
    product: "P003"
  }
];

export default function AIInsights({ onNavigateToAnalysis }) {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [insightData, setInsightData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runQuery = async (supId = 'SUP001', prodId = 'P001') => {
    setLoading(true);
    try {
      const res = await runAnalyzeSupplyChain(supId, prodId);
      setInsightData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runQuery('SUP001', 'P001');
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="human-card rounded-lg p-6 border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Intelligence & Natural Language Synthesis</h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-normal">C-level disruption explanations synthesized directly from quantitative ML & SHAP outputs</p>
        </div>
      </div>

      {/* Preset Scenario Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedPreset(idx);
              runQuery(preset.supplier, preset.product);
            }}
            className={`p-4 rounded-lg text-left transition-all border text-xs flex flex-col justify-between ${
              selectedPreset === idx
                ? 'bg-zinc-800 border-zinc-600 text-white font-bold'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <div className="text-[10px] font-mono text-zinc-400 mb-2 uppercase tracking-wider">
              Scenario #{idx + 1}
            </div>
            <p className="text-zinc-200 leading-relaxed font-semibold">{preset.title}</p>
          </button>
        ))}
      </div>

      {/* AI Response Display */}
      <div className="human-card rounded-lg p-6 border-zinc-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Inference Synthesis & Briefing
            </h3>
          </div>
          <RiskBadge level={insightData?.risk_assessment?.risk_level || 'Critical'} score={insightData?.risk_assessment?.risk_score || 86} />
        </div>

        {/* Executive Summary */}
        <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Executive Summary (C-Suite Directives)
          </span>
          <p className="text-white text-sm leading-relaxed font-semibold">
            "{insightData?.ai_insights?.executive_summary || 
              'Global Components Ltd. is currently classified at CRITICAL risk (86% disruption probability) for Industrial Controller X1. The elevated threat is primarily driven by supplier delay rate, compounded by low inventory coverage and rising demand volatility. Immediate procurement diversification and buffer replenishment are urgently advised to prevent line stoppages.'}"
          </p>
        </div>

        {/* Three Columns: Drivers, Forecast, Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Risk Drivers */}
          <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px] font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              Root Causes (SHAP)
            </h4>
            <ul className="space-y-2 text-zinc-300">
              {(insightData?.ai_insights?.root_cause_breakdown || [
                'Elevated Supplier Delay Rate (38%) exceeds 15% SLA threshold.',
                'Inventory coverage (6.2d) cannot bridge 14-day demand surge.',
                'Port congestion on Pacific routes adds 5+ days delay.'
              ]).map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Forecast Summary */}
          <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-3 font-mono">
            <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              14-Day Demand Impact
            </h4>
            <div className="space-y-2 text-zinc-300 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Current Stock:</span>
                <span className="text-white font-bold">{insightData?.demand_forecast?.current_stock || 420} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">14-Day Forecast:</span>
                <span className="text-white font-bold">{insightData?.demand_forecast?.total_projected_demand || 907} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Projected Stockout:</span>
                <span className="text-red-400 font-bold">Day {insightData?.demand_forecast?.estimated_stockout_day || 7}</span>
              </div>
            </div>
          </div>

          {/* Strategic Directive */}
          <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px] font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Strategic Directive
            </h4>
            <p className="text-zinc-300 leading-relaxed font-medium">
              {insightData?.ai_insights?.strategic_recommendation || 
                'Execute immediate 40% procurement diversion to Nexis Microelectronics and trigger emergency stock replenishment.'}
            </p>
            <button
              onClick={() => onNavigateToAnalysis('SUP001', 'P001')}
              className="mt-2 text-xs text-white hover:text-zinc-300 flex items-center gap-1 font-bold underline"
            >
              <span>Explore Interactive Model</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
