import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Cpu, 
  RefreshCw, 
  Info, 
  SlidersHorizontal, 
  ChevronRight, 
  Plus, 
  X, 
  Truck, 
  Navigation, 
  Boxes, 
  Ship, 
  Plane, 
  MapPin, 
  AlertTriangle 
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { 
  synthesizeRiskData, 
  getSuppliersData, 
  getProductsData, 
  addSupplier 
} from '../utils/riskSynthesis';

export default function RiskAnalysis({ initialSupplierId = 'SUP001', initialProductId = 'P001' }) {
  const [allSuppliers, setAllSuppliers] = useState(() => getSuppliersData());
  const [allProducts, setAllProducts]   = useState(() => getProductsData());

  const [selectedSupplier, setSelectedSupplier] = useState(initialSupplierId);
  const [selectedProduct,  setSelectedProduct]  = useState(initialProductId);
  const [result, setResult] = useState(() => synthesizeRiskData(initialSupplierId, initialProductId));
  const [analyzing, setAnalyzing] = useState(false);

  // Modal for adding a custom supplier directly from Risk Analysis
  const [showAddModal, setShowAddModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    supplier_name: '',
    location: 'Pune, IN',
    destination: 'Chicago, US',
    tier: 'Tier 1',
    component_id: 'P001',
    transport_mode: 'Maritime',
    transit_corridor: 'Indian Ocean & Suez / Cape Corridor',
    average_lead_time: 18,
    lead_time_variance: 4.2,
    reliability: 0.74,
    delay_rate: 0.35,
    route_risk: 0.70,
    inventory_days: 7.0,
    current_stock: 450,
    country_risk: 0.35,
    hazard_factor: 'Red Sea Missile Threats & Port Berth Delays'
  });

  // Re-sync suppliers when prop changes or custom event fires
  useEffect(() => {
    const handleSync = () => {
      const sups = getSuppliersData();
      const prods = getProductsData();
      setAllSuppliers(sups);
      setAllProducts(prods);
    };

    window.addEventListener('supplysense-data-updated', handleSync);
    return () => window.removeEventListener('supplysense-data-updated', handleSync);
  }, []);

  // Recompute when initial props change (e.g. from Suppliers or Dashboard "Analyze" button)
  useEffect(() => {
    const sups = getSuppliersData();
    setAllSuppliers(sups);
    const validSup = sups.find(s => s.supplier_id === initialSupplierId) ? initialSupplierId : (sups[0]?.supplier_id || 'SUP001');
    setSelectedSupplier(validSup);
    setSelectedProduct(initialProductId);
    setResult(synthesizeRiskData(validSup, initialProductId));
  }, [initialSupplierId, initialProductId]);

  const runInference = (supId, prodId) => {
    setAnalyzing(true);
    const data = synthesizeRiskData(supId, prodId);
    setResult(data);
    setAnalyzing(false);
  };

  const handleSupplierChange = (supId) => {
    setSelectedSupplier(supId);
    const supObj = allSuppliers.find(s => s.supplier_id === supId);
    const prodToUse = supObj?.component_id || selectedProduct;
    setSelectedProduct(prodToUse);
    runInference(supId, prodToUse);
  };

  const handleProductChange = (prodId) => {
    setSelectedProduct(prodId);
    runInference(selectedSupplier, prodId);
  };

  const handleAddCustomSupplier = (e) => {
    e.preventDefault();
    if (!customForm.supplier_name.trim()) return;

    const created = addSupplier(customForm);
    const updatedSups = getSuppliersData();
    setAllSuppliers(updatedSups);
    setSelectedSupplier(created.supplier_id);
    setSelectedProduct(created.component_id || 'P001');
    setShowAddModal(false);

    // Immediately run disruption inference for the new supplier
    runInference(created.supplier_id, created.component_id || 'P001');
  };

  const risk  = result.risk_assessment;
  const shap  = result.shap_explanation?.top_drivers || [];
  const sup   = result.supplier;
  const prod  = result.product;
  const inv   = result.demand_forecast;
  const feat  = result.features_evaluated;

  const gaugeColor = risk.risk_score > 75 ? 'text-red-400 border-red-500'
    : risk.risk_score > 50 ? 'text-orange-400 border-orange-500'
    : risk.risk_score > 25 ? 'text-amber-400 border-amber-400'
    : 'text-emerald-400 border-emerald-500';

  const scoreColor = risk.risk_score > 75 ? 'text-red-400'
    : risk.risk_score > 50 ? 'text-orange-400'
    : risk.risk_score > 25 ? 'text-amber-400'
    : 'text-emerald-400';

  return (
    <div className="space-y-6">

      {/* ── Selector Toolbar ── */}
      <div className="human-card rounded-lg p-5 border-zinc-800 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* Supplier Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  Target Supplier Node
                </label>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
                >
                  <Plus className="w-3 h-3" />
                  <span>Feed Custom Supplier</span>
                </button>
              </div>
              <select
                value={selectedSupplier}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-medium"
              >
                {allSuppliers.map(s => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier_id} — {s.supplier_name} ({s.location} &rarr; {s.destination || 'Chicago'}) {s.is_custom ? '★ Custom' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">
                Component / Part Number
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-medium"
              >
                {allProducts.map(p => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_id} — {p.product_name} ({p.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => runInference(selectedSupplier, selectedProduct)}
              disabled={analyzing}
              className="flex-1 lg:flex-none px-6 py-2.5 rounded bg-white text-black hover:bg-zinc-200 font-bold text-xs transition-all flex items-center justify-center gap-2 font-mono"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{analyzing ? 'Evaluating...' : 'Run Disruption Inference'}</span>
            </button>
          </div>
        </div>

        {/* Quick-select pills */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-500 font-semibold mr-1">Quick Node:</span>
          {allSuppliers.map(s => {
            const isSelected = selectedSupplier === s.supplier_id;
            const preview = synthesizeRiskData(s.supplier_id, s.component_id || selectedProduct);
            const sc = preview.risk_assessment.risk_score;
            const dotCls = sc > 75 ? 'bg-red-400' : sc > 50 ? 'bg-orange-400' : sc > 25 ? 'bg-amber-400' : 'bg-emerald-400';
            return (
              <button
                key={s.supplier_id}
                onClick={() => handleSupplierChange(s.supplier_id)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-600'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
                <span>{s.supplier_id} ({s.supplier_name.split(' ')[0]})</span>
                {s.is_custom && <span className="text-[9px] text-indigo-400 font-bold">★</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left: Score + Telemetry ── */}
        <div className="lg:col-span-4 space-y-6">

          {/* Risk Gauge Card */}
          <div className="human-card rounded-lg p-6 border-zinc-800 text-center">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Disruption Probability</span>
              <RiskBadge level={risk.risk_level} score={risk.risk_score} />
            </div>

            {/* Circle gauge */}
            <div className="my-6 flex items-center justify-center">
              <div className={`w-36 h-36 rounded-full border-4 border-zinc-800 flex items-center justify-center relative`}>
                <div className={`w-full h-full rounded-full border-4 absolute top-0 left-0 transition-all duration-700 ${gaugeColor}`}
                  style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%)' }}
                />
                <div className="text-center z-10">
                  <div className={`text-4xl font-extrabold tracking-tight font-mono transition-all duration-500 ${scoreColor}`}>
                    {risk.risk_score}%
                  </div>
                  <div className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${scoreColor}`}>
                    {risk.risk_level} Risk
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-zinc-800 pt-4 font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Model:</span>
                <span className="font-bold text-white">{risk.model_used}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Data Source:</span>
                <span className="font-bold text-emerald-400 text-[10px] text-right truncate max-w-[200px]">{risk.data_source}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Probability:</span>
                <span className={`font-bold ${scoreColor}`}>{risk.risk_probability} ({risk.risk_score}%)</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Features Evaluated:</span>
                <span className="text-zinc-200">14 Verified Indicators</span>
              </div>
            </div>
          </div>

          {/* Node Telemetry */}
          <div className="human-card rounded-lg p-5 border-zinc-800 text-xs space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px] font-mono">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                Node & Corridor Telemetry
              </span>
              {sup.is_custom && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                  Custom Node
                </span>
              )}
            </h4>
            <div className="space-y-2.5 text-zinc-300">
              {[
                { label: 'Supplier', val: sup.supplier_name, cls: 'text-white font-semibold' },
                { label: 'Component', val: prod.product_name, cls: 'text-white font-semibold' },
                { label: 'Source Origin', val: sup.location, cls: 'text-zinc-200 font-mono' },
                { label: 'Destination Hub', val: sup.destination || 'Chicago, US', cls: 'text-zinc-200 font-mono' },
                { label: 'Transit Corridor', val: `${sup.transit_corridor || 'Global Lane'} (${sup.transport_mode || 'Maritime'})`, cls: 'text-zinc-300 font-mono text-[11px]' },
                { label: 'Route Risk', val: `${Math.round((feat.route_risk || 0.45) * 100)}%`, cls: (feat.route_risk || 0) > 0.5 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold' },
                { label: 'Delay Rate', val: `${Math.round((sup.delay_rate || 0) * 100)}%`, cls: (sup.delay_rate || 0) > 0.2 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold' },
                { label: 'Reliability', val: `${Math.round((sup.reliability || 0) * 100)}%`, cls: 'text-white font-bold' },
                { label: 'Lead Time', val: `${sup.average_lead_time || 14} days (±${sup.lead_time_variance || 2}d)`, cls: 'text-zinc-200 font-mono' },
                { label: 'Inventory Coverage', val: `${feat.inventory_days} days`, cls: (feat.inventory_days || 99) < 14 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold' },
                { label: 'Current Stock', val: `${inv.current_stock} units`, cls: 'text-zinc-200 font-mono' },
              ].map(({ label, val, cls }) => (
                <div key={label} className="flex justify-between pb-1.5 border-b border-zinc-800/60 last:border-0 last:pb-0">
                  <span className="text-zinc-400">{label}:</span>
                  <span className={cls}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: SHAP + Briefing ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* SHAP Explainability */}
          <div className="human-card rounded-lg p-6 border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5 text-zinc-300" />
                  SHAP Explainability (Feature Attributions)
                </div>
                <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                  {risk.risk_score > 75 ? `Why is ${sup.supplier_name} at Critical Risk?`
                    : risk.risk_score > 50 ? `Disruption Drivers for ${sup.supplier_name}`
                    : risk.risk_score > 25 ? `Moderate Risk Factors — ${sup.supplier_name}`
                    : `Low Risk Profile — ${sup.supplier_name}`}
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                shap.TreeExplainer
              </span>
            </div>

            <div className="space-y-4">
              {shap.map((driver, idx) => {
                const pct = Math.min(100, Math.max(10, Math.round((Math.abs(driver.impact) / 0.28) * 100)));
                const isRisk = driver.direction === 'increases_risk';
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2 text-white">
                        <span className="font-mono text-zinc-500 text-[11px]">#{idx + 1}</span>
                        <span className="font-semibold">{driver.feature}</span>
                        <span className="text-[11px] text-zinc-400 font-mono">[{driver.current_value}]</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className={`text-[11px] font-bold ${isRisk ? 'text-red-400' : 'text-emerald-400'}`}>
                          {isRisk ? '+' : '−'}{Math.abs(driver.impact).toFixed(3)}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isRisk
                            ? 'bg-red-950/60 text-red-400 border border-red-500/30'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isRisk ? 'Increases Risk' : 'Decreases Risk'}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded overflow-hidden border border-zinc-800">
                      <div
                        className={`h-full rounded transition-all duration-700 ${isRisk ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>*Values reflect marginal log-odds contribution per node attribute.</span>
              <span className="text-zinc-300 font-semibold">
                Total: {risk.risk_score > 75 ? '+0.95' : risk.risk_score > 50 ? '+0.52' : risk.risk_score > 25 ? '+0.28' : '−0.14'}
              </span>
            </div>
          </div>

          {/* Executive Intelligence Briefing */}
          <div className="human-card rounded-lg p-6 border-zinc-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${risk.risk_score > 75 ? 'bg-red-500' : risk.risk_score > 50 ? 'bg-orange-500' : risk.risk_score > 25 ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Executive Intelligence Briefing
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                {result.ai_insights?.source || 'Llama-3.3 + SHAP Synthesis Engine'}
              </span>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 rounded bg-zinc-950 border border-zinc-800">
                <p className="font-semibold text-white text-sm leading-relaxed">
                  {result.ai_insights?.executive_summary}
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-zinc-300 text-xs uppercase tracking-wider font-mono">
                  Identified Root-Cause Vectors:
                </h5>
                <ul className="space-y-1.5 text-zinc-300">
                  {result.ai_insights?.root_cause_breakdown?.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        risk.risk_score > 50 ? 'bg-red-400' : 'bg-zinc-400'
                      }`} />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {result.ai_insights?.strategic_recommendation && (
                <div className="pt-3 border-t border-zinc-800 flex items-start gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Strategic Directive: {result.ai_insights.strategic_recommendation}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommended Actions ── */}
      <div className="human-card rounded-lg p-6 border-zinc-800">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recommended Actions & Mitigation Directives
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Derived from SHAP root-cause analysis for {sup.supplier_name} × {prod.product_name}
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-mono">3 Actions Generated</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {result.recommendations?.map(rec => (
            <div key={rec.id} className="p-4 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                    {rec.category}
                  </span>
                  <RiskBadge level={rec.priority} />
                </div>
                <h4 className="font-bold text-white text-xs leading-snug">{rec.title}</h4>
                <p className="text-zinc-400 text-[11px] mt-2 leading-relaxed">
                  <span className="text-zinc-300 font-semibold">Reason: </span>{rec.reason}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-emerald-400 font-medium">
                Benefit: {rec.expected_benefit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Add / Simulate Custom Supplier Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="human-card rounded-lg p-6 border-zinc-700 max-w-xl w-full space-y-4 bg-[#11141c] my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Feed Custom Supplier & Transit Route Parameters
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomSupplier} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Supplier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Advanced Systems / Bosch Precision"
                  value={customForm.supplier_name}
                  onChange={(e) => setCustomForm({...customForm, supplier_name: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Source / Origin Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune, IN"
                    value={customForm.location}
                    onChange={(e) => setCustomForm({...customForm, location: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Destination Warehouse</label>
                  <select
                    value={customForm.destination}
                    onChange={(e) => setCustomForm({...customForm, destination: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                  >
                    <option value="Chicago, US">Central Hub Chicago (ORD)</option>
                    <option value="Newark, US">East Coast Port/Air DC (EWR)</option>
                    <option value="Reno, US">West Coast Automated DC (RNO)</option>
                    <option value="Dallas, US">South Inland Intermodal (DFW)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Component Supplied</label>
                  <select
                    value={customForm.component_id}
                    onChange={(e) => setCustomForm({...customForm, component_id: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                  >
                    {allProducts.map(p => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.product_id} — {p.product_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Transport Mode</label>
                  <select
                    value={customForm.transport_mode}
                    onChange={(e) => setCustomForm({...customForm, transport_mode: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                  >
                    <option value="Maritime">Maritime (Ocean)</option>
                    <option value="Air Freight">Air Freight</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Historical Delay Rate</label>
                  <input
                    type="number"
                    step="0.02"
                    min="0.01"
                    max="0.99"
                    value={customForm.delay_rate}
                    onChange={(e) => setCustomForm({...customForm, delay_rate: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-mono font-bold text-red-400"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono">{Math.round(customForm.delay_rate * 100)}% delays</span>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">SLA Reliability</label>
                  <input
                    type="number"
                    step="0.02"
                    min="0.10"
                    max="0.99"
                    value={customForm.reliability}
                    onChange={(e) => setCustomForm({...customForm, reliability: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-mono font-bold text-emerald-400"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono">{Math.round(customForm.reliability * 100)}%</span>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Route Vulnerability</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="0.99"
                    value={customForm.route_risk}
                    onChange={(e) => setCustomForm({...customForm, route_risk: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono">{Math.round(customForm.route_risk * 100)}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Average Lead Time (days)</label>
                  <input
                    type="number"
                    min="2"
                    max="90"
                    value={customForm.average_lead_time}
                    onChange={(e) => setCustomForm({...customForm, average_lead_time: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Inventory Days Buffer</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="60"
                    value={customForm.inventory_days}
                    onChange={(e) => setCustomForm({...customForm, inventory_days: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Active External Hazard / Disruption Driver</label>
                <input
                  type="text"
                  placeholder="e.g. Red Sea Missile Attacks, Typhoon Port Congestion, or Normal Operations"
                  value={customForm.hazard_factor}
                  onChange={(e) => setCustomForm({...customForm, hazard_factor: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded border border-zinc-700 text-zinc-300 hover:text-white font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-white text-black hover:bg-zinc-200 font-bold font-mono transition-colors shadow-sm"
                >
                  Register & Run Inference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
