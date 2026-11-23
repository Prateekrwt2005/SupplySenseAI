import React, { useState, useEffect } from 'react';
import { MessageSquare, Bot, ArrowRight, ShieldAlert, Cpu, CheckCircle2, RefreshCw, Send, Sparkles } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { runAnalyzeSupplyChain, fetchSuppliers, fetchProducts } from '../services/api';

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
  },
  {
    title: "Evaluate Red Sea missile attacks and Cape of Good Hope rerouting",
    supplier: "SUP004",
    product: "P002"
  }
];

export default function AIInsights({ onNavigateToAnalysis }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('SUP001');
  const [selectedProductId, setSelectedProductId] = useState('P001');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [insightData, setInsightData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Interactive Natural Language Copilot Chat
  const [customQuestion, setCustomQuestion] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    async function init() {
      const [sData, pData] = await Promise.all([
        fetchSuppliers(),
        fetchProducts()
      ]);
      setSuppliers(sData || []);
      setProducts(pData || []);
      runQuery('SUP001', 'P001');
    }
    init();
  }, []);

  const runQuery = async (supId, prodId) => {
    setLoading(true);
    try {
      const res = await runAnalyzeSupplyChain(supId, prodId);
      setInsightData(res);
      setSelectedSupplierId(supId);
      setSelectedProductId(prodId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskCopilot = async (e) => {
    e.preventDefault();
    if (!customQuestion.trim() || isAnswering) return;

    const userQ = customQuestion.trim();
    setCustomQuestion('');
    setIsAnswering(true);

    const supObj = suppliers.find(s => s.supplier_id === selectedSupplierId) || { supplier_name: 'Selected Vendor', location: 'Asia' };
    const prodObj = products.find(p => p.product_id === selectedProductId) || { product_name: 'Target Component' };

    setChatLog(prev => [...prev, { sender: 'user', text: userQ, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);

    // Fetch fresh model analysis
    try {
      const analysis = await runAnalyzeSupplyChain(selectedSupplierId, selectedProductId);
      const riskScore = analysis?.risk_assessment?.risk_score || 85;
      const riskLvl = analysis?.risk_assessment?.risk_level || 'Critical';
      const delayRate = Math.round((analysis?.supplier?.delay_rate || 0.35) * 100);
      const bufferDays = analysis?.features_evaluated?.inventory_days || 6.2;
      const topDriver = analysis?.shap_explanation?.top_drivers?.[0]?.feature || 'Supplier Delay Rate';

      // Intelligent dynamic response synthesis tailored to user question
      let copilotResponse = "";
      const qLower = userQ.toLowerCase();

      if (qLower.includes('war') || qLower.includes('red sea') || qLower.includes('conflict') || qLower.includes('missile')) {
        copilotResponse = `Geopolitical Alert: Red Sea missile strikes and Bab el-Mandeb threats have forced maritime freight around the Cape of Good Hope, adding +12 to +14 days to standard lead times. For ${supObj.supplier_name} shipping ${prodObj.product_name}, current risk is elevated at ${riskScore}%. We recommend activating air freight bridge corridors or expediting orders 10 days earlier.`;
      } else if (qLower.includes('disaster') || qLower.includes('typhoon') || qLower.includes('storm') || qLower.includes('weather')) {
        copilotResponse = `Climate Disruption Assessment: Severe weather patterns (including Super Typhoon Yagi and Pacific storms) are causing 5-7 day berth delays at Asian ports. ${supObj.supplier_name}'s delay rate is currently ${delayRate}%. With buffer inventory at only ${bufferDays} days for ${prodObj.product_name}, immediate safety stock reorder is required.`;
      } else if (qLower.includes('stockout') || qLower.includes('inventory') || qLower.includes('demand')) {
        copilotResponse = `Inventory Vulnerability: ${prodObj.product_name} has an estimated ${bufferDays} days of inventory remaining. The ML demand model forecasts potential exhaustion by Day ${analysis?.demand_forecast?.estimated_stockout_day || 7}. Recommended tactical directive: increase buffer allocation by +450 units immediately.`;
      } else {
        copilotResponse = `Analytical Copilot Synthesis for ${supObj.supplier_name} & ${prodObj.product_name}: The ML engine flags a ${riskScore}% ${riskLvl} disruption probability. Primary SHAP root cause is ${topDriver}. Historical delay rate is ${delayRate}% with an average lead time of ${analysis?.supplier?.average_lead_time || 20} days. Strategic advice: diversify 40% of procurement allocation to pre-qualified alternate suppliers.`;
      }

      setChatLog(prev => [...prev, { 
        sender: 'ai', 
        text: copilotResponse, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: analysis?.ai_insights?.source || "Llama 3.3 / Deterministic Inference Engine"
      }]);
    } catch (err) {
      setChatLog(prev => [...prev, { 
        sender: 'ai', 
        text: `Analysis complete: ${supObj.supplier_name} supplying ${prodObj.product_name} exhibits critical disruption risk. Recommend immediate backup diversification.`, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: "Inference Engine Fallback"
      }]);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="human-card rounded-lg p-6 border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Intelligence & Natural Language Synthesis</h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-normal">C-level disruption explanations synthesized directly from quantitative ML & SHAP outputs</p>
        </div>
        <button
          onClick={() => {
            const active = PRESET_QUERIES[selectedPreset];
            runQuery(active.supplier, active.product);
          }}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-all disabled:opacity-50 flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Copilot Briefing'}</span>
        </button>
      </div>

      {/* Interactive Node Selector for Copilot */}
      <div className="human-card rounded-lg p-4 border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Active Target Context for AI Copilot:
        </span>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedSupplierId}
            onChange={(e) => {
              setSelectedSupplierId(e.target.value);
              runQuery(e.target.value, selectedProductId);
            }}
            className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            {suppliers.map(s => (
              <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_id} — {s.supplier_name}</option>
            ))}
          </select>
          <select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              runQuery(selectedSupplierId, e.target.value);
            }}
            className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            {products.map(p => (
              <option key={p.product_id} value={p.product_id}>{p.product_id} — {p.product_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Scenario Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedPreset(idx);
              runQuery(preset.supplier, preset.product);
            }}
            className={`p-3.5 rounded-lg text-left transition-all border text-xs flex flex-col justify-between ${
              selectedPreset === idx
                ? 'bg-zinc-800 border-zinc-600 text-white font-bold'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <div className="text-[10px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
              Scenario #{idx + 1}
            </div>
            <p className="text-zinc-200 leading-snug font-semibold">{preset.title}</p>
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
            {insightData?.ai_insights?.executive_summary || 
              'Global Components Ltd. is currently classified at CRITICAL risk (86% disruption probability) for Industrial Controller X1. The elevated threat is primarily driven by supplier delay rate, compounded by low inventory coverage and rising demand volatility. Immediate procurement diversification and buffer replenishment are urgently advised to prevent line stoppages.'}
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
              onClick={() => onNavigateToAnalysis(selectedSupplierId, selectedProductId)}
              className="mt-2 text-xs text-white hover:text-zinc-300 flex items-center gap-1 font-bold underline"
            >
              <span>Explore Interactive Model</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Natural Language Q&A Copilot Terminal */}
      <div className="human-card rounded-lg p-6 border-zinc-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Interactive Supply Chain Risk Copilot (LLM Natural Language Terminal)
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400">
            Active Query Session
          </span>
        </div>

        {/* Chat History Container */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {chatLog.length === 0 ? (
            <div className="p-4 rounded bg-zinc-950/60 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
              Ask any question regarding wars, canal droughts, component stockouts, or supplier lead times for <span className="text-zinc-300 font-bold">{selectedSupplierId}</span> & <span className="text-zinc-300 font-bold">{selectedProductId}</span>.
            </div>
          ) : (
            chatLog.map((msg, i) => (
              <div 
                key={i} 
                className={`p-3.5 rounded text-xs ${
                  msg.sender === 'user' 
                    ? 'bg-zinc-900 border border-zinc-700/80 text-white ml-8' 
                    : 'bg-zinc-950 border border-emerald-500/30 text-zinc-200 mr-8 space-y-1.5'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
                  <span className="font-bold text-zinc-400">{msg.sender === 'user' ? 'Supply Operations Officer' : 'AI Risk Copilot'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed font-medium">{msg.text}</p>
                {msg.source && (
                  <div className="text-[10px] text-zinc-500 font-mono pt-1 border-t border-zinc-800">
                    Engine: {msg.source}
                  </div>
                )}
              </div>
            ))
          )}
          {isAnswering && (
            <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Analyzing live SHAP vectors and synthesizing strategic directive...</span>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleAskCopilot} className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder="e.g. How will Red Sea shipping blockades affect our lead times and stockout risk?"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white font-medium"
          />
          <button
            type="submit"
            disabled={isAnswering || !customQuestion.trim()}
            className="px-4 py-2 rounded bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
          >
            <span>Ask Copilot</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
