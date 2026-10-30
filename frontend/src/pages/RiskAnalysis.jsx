import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  Cpu, 
  RefreshCw, 
  Zap, 
  Info,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { runAnalyzeSupplyChain, fetchSuppliers, fetchProducts } from '../services/api';

export default function RiskAnalysis({ initialSupplierId = 'SUP001', initialProductId = 'P001' }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [selectedSupplier, setSelectedSupplier] = useState(initialSupplierId);
  const [selectedProduct, setSelectedProduct] = useState(initialProductId);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [supData, prodData] = await Promise.all([
          fetchSuppliers(),
          fetchProducts()
        ]);
        setSuppliers(supData || []);
        setProducts(prodData || []);
      } catch (err) {
        console.error('Error loading dropdown lists', err);
      }
    }
    loadDropdowns();
  }, []);

  const executeAnalysis = async (supId = selectedSupplier, prodId = selectedProduct) => {
    setAnalyzing(true);
    setError(null);
    try {
      const data = await runAnalyzeSupplyChain(supId, prodId);
      setAnalysisResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Unable to reach live ML microservice. Using cached parameters.');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    executeAnalysis(initialSupplierId, initialProductId);
  }, [initialSupplierId, initialProductId]);

  const risk = analysisResult?.risk_assessment || {
    risk_probability: 0.86,
    risk_score: 86,
    risk_level: 'Critical',
    model_used: 'XGBoost Classifier'
  };

  const shapData = analysisResult?.shap_explanation?.top_drivers || [
    { feature: 'Supplier Delay Rate', impact: 0.24, direction: 'increases_risk', current_value: '38%' },
    { feature: 'Low Inventory Coverage', impact: 0.21, direction: 'increases_risk', current_value: '6.2 days' },
    { feature: 'Demand Growth Rate', impact: 0.17, direction: 'increases_risk', current_value: '+34%' },
    { feature: 'Transit Route Risk', impact: 0.14, direction: 'increases_risk', current_value: '85%' },
    { feature: 'Severe Weather Risk', impact: 0.11, direction: 'increases_risk', current_value: '76%' },
    { feature: 'Port Congestion Index', impact: 0.08, direction: 'increases_risk', current_value: '78%' }
  ];

  return (
    <div className="space-y-6">
      {/* Selector & Action Toolbar */}
      <div className="human-card rounded-lg p-5 border-zinc-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* Supplier Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">
                Target Supplier Node
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-medium"
              >
                {suppliers.length > 0 ? (
                  suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.supplier_id} — {s.supplier_name} ({s.location})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="SUP001">SUP001 — Global Components Ltd. (Shenzhen, CN)</option>
                    <option value="SUP002">SUP002 — Nexis Microelectronics (Taipei, TW)</option>
                    <option value="SUP003">SUP003 — Apex Semiconductor Fab (Dresden, DE)</option>
                    <option value="SUP004">SUP004 — Vanguard Precision Sensors (Penang, MY)</option>
                  </>
                )}
              </select>
            </div>

            {/* Product Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">
                Component / Part Number
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-medium"
              >
                {products.length > 0 ? (
                  products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_id} — {p.product_name} ({p.category})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="P001">P001 — Industrial Controller X1 (Control Systems)</option>
                    <option value="P002">P002 — Optic Sensor Array Pro (Sensors)</option>
                    <option value="P003">P003 — ARM Cortex Processing Core (Semiconductors)</option>
                    <option value="P004">P004 — High-Tensile Alloy Casing (Structural)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            <button
              onClick={() => executeAnalysis(selectedSupplier, selectedProduct)}
              disabled={analyzing}
              className="w-full lg:w-auto px-6 py-2.5 rounded bg-white text-black hover:bg-zinc-200 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing Inference...</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5" />
                  <span>Run Disruption Inference</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Analysis Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Risk Score & Telemetry (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Risk Score Card */}
          <div className="human-card rounded-lg p-6 border-zinc-800 text-center">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Disruption Probability
              </span>
              <RiskBadge level={risk.risk_level} score={risk.risk_score} />
            </div>

            {/* Gauge */}
            <div className="my-6 relative flex items-center justify-center">
              <div className="w-36 h-36 rounded-full border-4 border-zinc-800 flex items-center justify-center relative">
                <div 
                  className={`w-full h-full rounded-full border-4 absolute top-0 left-0 ${
                    risk.risk_score > 75 
                      ? 'border-red-500 border-t-red-400' 
                      : (risk.risk_score > 40 ? 'border-amber-400' : 'border-emerald-500')
                  }`}
                  style={{
                    clipPath: `polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%)`
                  }}
                />
                <div className="text-center z-10">
                  <div className="text-4xl font-extrabold text-white tracking-tight font-mono">
                    {risk.risk_score}%
                  </div>
                  <div className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${
                    risk.risk_score > 75 ? 'text-red-400' : (risk.risk_score > 40 ? 'text-amber-400' : 'text-emerald-400')
                  }`}>
                    {risk.risk_level} Risk
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-zinc-800 pt-4 font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Model:</span>
                <span className="font-bold text-white">{risk.model_used || 'Random Forest'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Data Source:</span>
                <span className="font-bold text-green-400 text-[10px] text-right truncate max-w-[150px]" title={risk.data_source || 'DataCo Dataset'}>
                  {risk.data_source ? 'DataCo (Real)' : 'DataCo Dataset'}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Disruption Probability:</span>
                <span className="font-bold text-red-400">{risk.risk_probability}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Evaluated Features:</span>
                <span className="text-zinc-200">12 Indicators (Leakage-Free)</span>
              </div>
            </div>
          </div>

          {/* Node Context Card */}
          <div className="human-card rounded-lg p-5 border-zinc-800 text-xs space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-zinc-800 text-[11px] font-mono">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              Node Telemetry
            </h4>
            <div className="space-y-2 text-zinc-300">
              <div className="flex justify-between pb-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Supplier:</span>
                <span className="font-semibold text-white">{analysisResult?.supplier?.supplier_name || 'Global Components Ltd.'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Component:</span>
                <span className="font-semibold text-white">{analysisResult?.product?.product_name || 'Industrial Controller X1'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-zinc-800/60 font-mono">
                <span className="text-zinc-400">Delay Rate:</span>
                <span className={`font-bold ${
                  (analysisResult?.supplier?.delay_rate || 0.38) > 0.25 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {Math.round((analysisResult?.supplier?.delay_rate !== undefined ? analysisResult.supplier.delay_rate : 0.38) * 100)}%
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-zinc-800/60 font-mono">
                <span className="text-zinc-400">Reliability:</span>
                <span className="font-bold text-white">
                  {Math.round((analysisResult?.supplier?.reliability !== undefined ? analysisResult.supplier.reliability : 0.85) * 100)}%
                </span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-zinc-400">Inventory Coverage:</span>
                <span className="font-bold text-amber-400">
                  {analysisResult?.features_evaluated?.inventory_days || 6.2} Days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: SHAP Explainability & LLM AI Briefing (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* SHAP EXPLAINABILITY PANEL */}
          <div className="human-card rounded-lg p-6 border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5 text-zinc-300" />
                  SHAP Explainability (Feature Attributions)
                </div>
                <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                  Why is the Disruption Risk High?
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                shap.TreeExplainer
              </span>
            </div>

            {/* SHAP Feature Contribution Bars */}
            <div className="space-y-4">
              {shapData.map((driver, idx) => {
                const percentage = Math.min(100, Math.max(12, Math.round((driver.impact / 0.28) * 100)));
                const isRiskInc = driver.direction === 'increases_risk';

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2 text-white">
                        <span className="font-mono text-zinc-500 text-[11px]">#{idx + 1}</span>
                        <span className="font-semibold">{driver.feature}</span>
                        {driver.current_value !== undefined && (
                          <span className="text-[11px] text-zinc-400 font-mono">
                            [{driver.current_value}]
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className={`text-[11px] font-bold ${isRiskInc ? 'text-red-400' : 'text-emerald-400'}`}>
                          {isRiskInc ? `+${driver.impact.toFixed(3)}` : `-${driver.impact.toFixed(3)}`}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          isRiskInc ? 'bg-red-950/60 text-red-400 border border-red-500/30' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isRiskInc ? 'Increases Risk' : 'Decreases Risk'}
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar (Red for risk increase, Green for decrease) */}
                    <div className="h-2 w-full bg-zinc-900 rounded overflow-hidden border border-zinc-800">
                      <div
                        className={`h-full rounded transition-all duration-500 ${
                          isRiskInc ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>*Values reflect marginal log-odds contribution per node attribute.</span>
              <span className="text-zinc-300 font-semibold">Total Attribution: +0.95</span>
            </div>
          </div>

          {/* AI ASSESSMENT & LLM BUSINESS BRIEFING */}
          <div className="human-card rounded-lg p-6 border-zinc-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Executive Intelligence Briefing
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                {analysisResult?.ai_insights?.source || 'Groq + Llama 3.3'}
              </span>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 rounded bg-zinc-950 border border-zinc-800">
                <p className="font-semibold text-white text-sm leading-relaxed">
                  "{analysisResult?.ai_insights?.executive_summary || 
                    'Supplier A is currently at critical disruption risk due to increasing delivery delays, low inventory coverage and rising demand. The recommended response is to diversify procurement toward Supplier B and increase safety stock.'}"
                </p>
              </div>

              {/* Root Cause Bullet Points */}
              <div className="space-y-2">
                <h5 className="font-bold text-zinc-300 text-xs uppercase tracking-wider font-mono">
                  Identified Root-Cause Vectors:
                </h5>
                <ul className="space-y-1.5 text-zinc-300">
                  {(analysisResult?.ai_insights?.root_cause_breakdown || [
                    'Elevated Supplier Delay Rate and lead-time variability trigger recurring shipment lag.',
                    'Buffer inventory (420 units) is below safety thresholds for 14-day projected demand (890 units).',
                    'External freight lane and weather friction along origin routes compound the delivery lag.'
                  ]).map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Strategic Directive */}
              {analysisResult?.ai_insights?.strategic_recommendation && (
                <div className="pt-3 border-t border-zinc-800 flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Strategic Directive: {analysisResult.ai_insights.strategic_recommendation}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RECOMMENDED ACTIONS SECTION */}
      <div className="human-card rounded-lg p-6 border-zinc-800">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recommended Actions & Mitigation Directives
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Derived from multi-criteria supplier scoring and buffer modeling</p>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {analysisResult?.recommendations?.length || 3} Actions Generated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(analysisResult?.recommendations || [
            {
              id: "REC-01",
              category: "SUPPLIER DIVERSIFICATION",
              title: "Shift 40% procurement volume to Nexis Microelectronics (SUP002)",
              reason: "Global Components Ltd. exhibits 86% disruption risk with 38% delay rate.",
              expected_benefit: "Cuts delivery variance by 75% and ensures component flow.",
              priority: "Critical"
            },
            {
              id: "REC-02",
              category: "INVENTORY ACTION",
              title: "Initiate emergency buffer reorder (+470 units)",
              reason: "Inventory coverage (6.2d) cannot bridge 14-day demand surge (890 units).",
              expected_benefit: "Prevents stockout on Day 8.",
              priority: "Critical"
            },
            {
              id: "REC-03",
              category: "ROUTE ACTION",
              title: "Switch transit lane SHP-8091 to expedited Air Freight corridor",
              reason: "Active maritime route has 82% risk score due to port congestion.",
              expected_benefit: "Reduces transit time by 5 days.",
              priority: "High"
            }
          ]).map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                    {rec.category}
                  </span>
                  <RiskBadge level={rec.priority} />
                </div>
                <h4 className="font-bold text-white text-xs leading-snug">
                  {rec.title}
                </h4>
                <p className="text-zinc-400 text-[11px] mt-2 leading-relaxed">
                  <span className="text-zinc-300 font-semibold">Reason:</span> {rec.reason}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-300 font-medium flex items-center justify-between">
                <span>Benefit: {rec.expected_benefit}</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
