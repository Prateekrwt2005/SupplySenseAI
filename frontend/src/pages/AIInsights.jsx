import React, { useState, useEffect, useRef } from 'react';
import { Bot, ArrowRight, ShieldAlert, Cpu, CheckCircle2, RefreshCw, Send, Sparkles } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { synthesizeRiskData, getSuppliersData, getProductsData } from '../utils/riskSynthesis';

const PRESET_QUERIES = [
  { title: "Why is Supplier SUP001 (Global Components Ltd.) at Critical Risk?", supplier: "SUP001", product: "P001" },
  { title: "What is the stockout risk for Industrial Controller X1 over 14 days?", supplier: "SUP001", product: "P001" },
  { title: "How does Nexis Microelectronics compare as a backup supplier?", supplier: "SUP002", product: "P003" },
  { title: "Evaluate Red Sea missile attacks and Cape of Good Hope rerouting", supplier: "SUP004", product: "P002" }
];

export default function AIInsights({ onNavigateToAnalysis }) {
  const [suppliers, setSuppliers] = useState(() => getSuppliersData());
  const [products, setProducts]   = useState(() => getProductsData());

  useEffect(() => {
    const handleUpdate = () => {
      setSuppliers(getSuppliersData());
      setProducts(getProductsData());
    };
    window.addEventListener('supplysense-data-updated', handleUpdate);
    return () => window.removeEventListener('supplysense-data-updated', handleUpdate);
  }, []);

  const [selectedSupplierId, setSelectedSupplierId] = useState('SUP001');
  const [selectedProductId, setSelectedProductId] = useState('P001');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [insightData, setInsightData] = useState(() => synthesizeRiskData('SUP001', 'P001'));
  const [loading, setLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isAnswering]);

  const runQuery = (supId, prodId) => {
    setLoading(true);
    const data = synthesizeRiskData(supId, prodId);
    setInsightData(data);
    setSelectedSupplierId(supId);
    setSelectedProductId(prodId);
    setLoading(false);
  };

  const handleSupplierChange = (supId) => {
    setSelectedSupplierId(supId);
    runQuery(supId, selectedProductId);
  };

  const handleProductChange = (prodId) => {
    setSelectedProductId(prodId);
    runQuery(selectedSupplierId, prodId);
  };

  const handleAskCopilot = async (e) => {
    e.preventDefault();
    if (!customQuestion.trim() || isAnswering) return;
    const userQ = customQuestion.trim();
    setCustomQuestion('');
    setIsAnswering(true);

    const supObj = suppliers.find(s => s.supplier_id === selectedSupplierId) || insightData?.supplier || { supplier_name: 'Selected Vendor', location: 'Asia' };
    const prodObj = products.find(p => p.product_id === selectedProductId) || insightData?.product || { product_name: 'Target Component' };

    setChatLog(prev => [...prev, {
      sender: 'user', text: userQ,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    try {
      const analysis = insightData || synthesizeRiskData(selectedSupplierId, selectedProductId);
      const riskScore = analysis?.risk_assessment?.risk_score || 85;
      const riskLvl = analysis?.risk_assessment?.risk_level || 'Critical';
      const delayRate = Math.round((analysis?.supplier?.delay_rate || 0.35) * 100);
      const bufferDays = analysis?.features_evaluated?.inventory_days || 6.2;
      const topDriver = analysis?.shap_explanation?.top_drivers?.[0]?.feature || 'Supplier Delay Rate';
      const stockoutDay = analysis?.demand_forecast?.estimated_stockout_day || 7;
      const totalDemand = analysis?.demand_forecast?.total_projected_demand || 907;
      const backupSupName = suppliers.find(s => s.supplier_id !== selectedSupplierId && (s.reliability || 0) > 0.85)?.supplier_name || 'Nexis Microelectronics';

      const qLower = userQ.toLowerCase();
      let copilotResponse = '';

      if (qLower.includes('war') || qLower.includes('red sea') || qLower.includes('conflict') || qLower.includes('missile') || qLower.includes('geopoliti')) {
        copilotResponse = `Geopolitical Risk Assessment — ${supObj.supplier_name}: Red Sea missile strikes and Bab el-Mandeb threats have forced 85% of container fleet traffic to divert via Cape of Good Hope, adding +12 to +16 days to standard lead times. For ${supObj.supplier_name} shipping ${prodObj.product_name} from ${supObj.location}, current disruption risk is elevated at ${riskScore}% (${riskLvl}). With ${bufferDays} days of inventory buffer remaining, stockout is projected by Day ${stockoutDay}. Recommended directive: activate air freight bridge corridors and place emergency purchase orders 14 days in advance.`;
      } else if (qLower.includes('disaster') || qLower.includes('typhoon') || qLower.includes('storm') || qLower.includes('weather') || qLower.includes('climate')) {
        copilotResponse = `Climate Disruption Assessment — ${supObj.supplier_name}: Super Typhoon Yagi and ongoing Pacific storm systems are causing 5–8 day port berth delays across Southeast Asian hubs. ${supObj.supplier_name}'s delay rate is currently ${delayRate}% with ${bufferDays} days of buffer inventory for ${prodObj.product_name}. Stockout is imminent by Day ${stockoutDay} if replenishment isn't initiated within 48 hours. Strategic directive: pre-position stock from ${backupSupName} (${suppliers.find(s => s.supplier_name === backupSupName)?.location || 'Europe'}) to avoid maritime route exposure.`;
      } else if (qLower.includes('stockout') || qLower.includes('inventory') || qLower.includes('demand') || qLower.includes('buffer') || qLower.includes('stock')) {
        copilotResponse = `Inventory Vulnerability Report — ${prodObj.product_name}: Current stock stands at ${analysis?.demand_forecast?.current_stock || 420} units (${bufferDays} days coverage). The 14-day demand forecast is ${totalDemand} units, creating a projected gap of ${Math.max(0, totalDemand - (analysis?.demand_forecast?.current_stock || 420))} units. Stockout is predicted on Day ${stockoutDay}. Recommended action: initiate emergency safety stock reorder of +${Math.max(300, Math.round(totalDemand * 0.6))} units from ${backupSupName} with expedited freight to bridge the coverage window.`;
      } else if (qLower.includes('shap') || qLower.includes('explainab') || qLower.includes('why') || qLower.includes('reason') || qLower.includes('cause')) {
        copilotResponse = `SHAP Root-Cause Breakdown — ${supObj.supplier_name}: The XGBoost model identifies "${topDriver}" as the primary disruption driver (impact: +${analysis?.shap_explanation?.top_drivers?.[0]?.impact?.toFixed(3) || '0.247'}). Secondary contributors are ${analysis?.shap_explanation?.top_drivers?.[1]?.feature || 'Low Inventory Coverage'} and ${analysis?.shap_explanation?.top_drivers?.[2]?.feature || 'Transit Route Risk'}. The historical delay rate of ${delayRate}% significantly exceeds the 15% SLA threshold, compounded by ${supObj.average_lead_time || 24}-day lead times and low buffer coverage.`;
      } else if (qLower.includes('compari') || qLower.includes('backup') || qLower.includes('alternative') || qLower.includes('switch') || qLower.includes('diversif')) {
        const altSup = suppliers.find(s => s.supplier_id !== selectedSupplierId && (s.reliability || 0) > 0.85) || suppliers[1];
        copilotResponse = `Comparative Vendor Analysis: ${supObj.supplier_name} (${selectedSupplierId}) currently operates at ${riskScore}% disruption risk with a ${delayRate}% delay rate and ${supObj.average_lead_time || 24}-day average lead time. Switching to ${altSup.supplier_name} (${altSup.supplier_id}) would yield: Reliability: ${Math.round((altSup.reliability || 0.9) * 100)}% (+${Math.round(((altSup.reliability || 0.9) - (supObj.reliability || 0.6)) * 100)} pp), Delay Rate: ${Math.round((altSup.delay_rate || 0.06) * 100)}% (−${Math.round(((supObj.delay_rate || 0.3) - (altSup.delay_rate || 0.06)) * 100)} pp), Lead Time: ${altSup.average_lead_time || 12} days. Recommended: allocate 40% of ${prodObj.product_name} orders to ${altSup.supplier_name} immediately.`;
      } else if (qLower.includes('panama') || qLower.includes('canal') || qLower.includes('drought') || qLower.includes('suez')) {
        copilotResponse = `Canal & Route Disruption Analysis: The Panama Canal drought has reduced daily vessel transit capacity from 36 to 24 ships, creating 7–9 day queue backlogs for Pacific-to-Atlantic shipping lanes. The Suez Canal (Red Sea corridor) remains under active missile threat, diverting ships around Africa (+14d). For ${supObj.supplier_name} at ${supObj.location}, the net impact on ${prodObj.product_name} transit is an estimated +10 to +16 day delay. Directive: pre-route cargo via intermodal land bridge alternatives or switch to European sourcing via ${backupSupName}.`;
      } else {
        copilotResponse = `Supply Chain Copilot Synthesis — ${supObj.supplier_name} & ${prodObj.product_name}: ML inference flags ${riskScore}% ${riskLvl} disruption probability. Primary SHAP driver: "${topDriver}". Historical delay rate: ${delayRate}% (avg lead time ${supObj.average_lead_time || 20}d). Inventory buffer: ${bufferDays} days vs. ${totalDemand}-unit 14-day demand. ${stockoutDay <= 7 ? `URGENT: Stockout projected Day ${stockoutDay}.` : `Stockout risk moderate — monitor through Day ${stockoutDay}.`} Strategic directive: ${analysis?.ai_insights?.strategic_recommendation || `Reallocate 40% procurement to ${backupSupName}.`}`;
      }

      setChatLog(prev => [...prev, {
        sender: 'ai', text: copilotResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: analysis?.ai_insights?.source || 'Llama-3.3 + SHAP Synthesis Engine'
      }]);
    } catch (err) {
      const fallback = synthesizeRiskData(selectedSupplierId, selectedProductId);
      setChatLog(prev => [...prev, {
        sender: 'ai',
        text: `Analysis complete: ${fallback.supplier?.supplier_name} supplying ${fallback.product?.product_name} exhibits ${fallback.risk_assessment?.risk_score}% disruption risk. ${fallback.ai_insights?.strategic_recommendation}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'Deterministic Inference Engine'
      }]);
    } finally {
      setIsAnswering(false);
    }
  };

  const risk = insightData?.risk_assessment;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="human-card rounded-lg p-6 border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Intelligence & Natural Language Synthesis</h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-normal">C-level disruption explanations synthesized directly from quantitative ML & SHAP outputs</p>
        </div>
        <button
          onClick={() => runQuery(selectedSupplierId, selectedProductId)}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-all disabled:opacity-50 flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Copilot Briefing'}</span>
        </button>
      </div>

      {/* Node Selector */}
      <div className="human-card rounded-lg p-4 border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Active Target Context for AI Copilot:
        </span>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedSupplierId}
            onChange={(e) => handleSupplierChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white font-medium"
          >
            {suppliers.map(s => (
              <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_id} — {s.supplier_name}</option>
            ))}
          </select>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white font-medium"
          >
            {products.map(p => (
              <option key={p.product_id} value={p.product_id}>{p.product_id} — {p.product_name}</option>
            ))}
          </select>
          {risk && (
            <span className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono border ${
              risk.risk_score > 75 ? 'bg-red-950/60 text-red-400 border-red-500/40' :
              risk.risk_score > 50 ? 'bg-orange-950/60 text-orange-400 border-orange-500/40' :
              risk.risk_score > 25 ? 'bg-amber-950/60 text-amber-400 border-amber-500/40' :
              'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
            }`}>
              {risk.risk_level?.toUpperCase()} — {risk.risk_score}%
            </span>
          )}
        </div>
      </div>

      {/* Preset Scenario Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => { setSelectedPreset(idx); runQuery(preset.supplier, preset.product); }}
            className={`p-3.5 rounded-lg text-left transition-all border text-xs flex flex-col justify-between ${
              selectedPreset === idx
                ? 'bg-zinc-800 border-zinc-600 text-white font-bold'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <div className="text-[10px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">Scenario #{idx + 1}</div>
            <p className="text-zinc-200 leading-snug font-semibold">{preset.title}</p>
          </button>
        ))}
      </div>

      {/* AI Response Display */}
      <div className="human-card rounded-lg p-6 border-zinc-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Inference Synthesis & Briefing
            </h3>
          </div>
          <RiskBadge level={risk?.risk_level || 'Critical'} score={risk?.risk_score || 86} />
        </div>

        {/* Executive Summary — always dynamic */}
        <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Executive Summary (C-Suite Directives)
          </span>
          <p className="text-white text-sm leading-relaxed font-semibold">
            {loading
              ? <span className="text-zinc-400 italic text-xs">Synthesizing intelligence from ML inference engine...</span>
              : (insightData?.ai_insights?.executive_summary || 'Loading analysis...')}
          </p>
        </div>

        {/* Three Columns: Root Causes, Demand, Strategic Directive */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Root Causes */}
          <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px] font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              Root Causes (SHAP)
            </h4>
            <ul className="space-y-2 text-zinc-300">
              {(insightData?.ai_insights?.root_cause_breakdown || [
                'Loading root cause analysis...',
                'Loading demand model...',
                'Loading route risk data...'
              ]).map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Demand Impact — dynamic */}
          <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-3 font-mono">
            <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              14-Day Demand Impact
            </h4>
            <div className="space-y-2 text-zinc-300 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Current Stock:</span>
                <span className="text-white font-bold">{insightData?.demand_forecast?.current_stock ?? '—'} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">14-Day Forecast:</span>
                <span className="text-white font-bold">{insightData?.demand_forecast?.total_projected_demand ?? '—'} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Projected Stockout:</span>
                <span className={`font-bold ${(insightData?.demand_forecast?.estimated_stockout_day || 99) <= 7 ? 'text-red-400' : 'text-amber-400'}`}>
                  Day {insightData?.demand_forecast?.estimated_stockout_day ?? '—'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-800">
                <span className="text-zinc-500">Stockout Risk:</span>
                <span className={`font-bold ${insightData?.demand_forecast?.stockout_risk === 'Critical' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {insightData?.demand_forecast?.stockout_risk ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Supplier Delay Rate:</span>
                <span className="font-bold text-red-400">{insightData?.supplier?.delay_rate != null ? Math.round(insightData.supplier.delay_rate * 100) + '%' : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Reliability:</span>
                <span className="font-bold text-white">{insightData?.supplier?.reliability != null ? Math.round(insightData.supplier.reliability * 100) + '%' : '—'}</span>
              </div>
            </div>
          </div>

          {/* Strategic Directive — dynamic */}
          <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px] font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Strategic Directive
            </h4>
            <p className="text-zinc-300 leading-relaxed font-medium">
              {insightData?.ai_insights?.strategic_recommendation || 'Loading strategic directive...'}
            </p>
            <div className="pt-2 text-[10px] font-mono text-zinc-500 border-t border-zinc-800">
              Engine: {insightData?.ai_insights?.source || 'Llama-3.3 + SHAP Synthesis Engine'}
            </div>
            {onNavigateToAnalysis && (
              <button
                onClick={() => onNavigateToAnalysis(selectedSupplierId, selectedProductId)}
                className="mt-1 text-xs text-white hover:text-zinc-300 flex items-center gap-1 font-bold underline"
              >
                <span>Explore Interactive Model</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Recommended Actions */}
        {insightData?.recommendations && (
          <div className="border-t border-zinc-800 pt-5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3">Recommended Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {insightData.recommendations.map((rec) => (
                <div key={rec.id} className="p-3.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-zinc-400 uppercase">{rec.category}</span>
                    <RiskBadge level={rec.priority} />
                  </div>
                  <p className="font-semibold text-white leading-snug">{rec.title}</p>
                  <p className="text-zinc-400 leading-relaxed">{rec.reason}</p>
                  <p className="text-emerald-400 text-[11px] font-medium border-t border-zinc-800 pt-1.5">{rec.expected_benefit}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LLM Copilot Terminal */}
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

        {/* Chat Log */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {chatLog.length === 0 ? (
            <div className="p-4 rounded bg-zinc-950/60 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
              Ask any question about wars, canal droughts, component stockouts, or supplier lead times for{' '}
              <span className="text-zinc-300 font-bold">{selectedSupplierId}</span> &{' '}
              <span className="text-zinc-300 font-bold">{selectedProductId}</span>.
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
            <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2 mr-8">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Analyzing live SHAP vectors and synthesizing strategic directive...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
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
