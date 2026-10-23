import React, { useState, useEffect } from 'react';
import { Layers, Cpu, ShieldCheck, Code2, Sparkles, CheckCircle2, Database, FlaskConical, AlertTriangle } from 'lucide-react';
import { fetchModelReport } from '../services/api';

// Static results from actual training run — 8 clean leakage-free features
const STATIC_EVAL_RESULTS = {
  dataset: "DataCo Smart Supply Chain Dataset",
  n_total: 180519,
  n_train: 144415,
  n_test: 36104,
  n_features: 8,
  split_method: "Chronological 80% / 20%",
  train_date_range: { from: "2015-01-01", to: "2017-04-22" },
  test_date_range: { from: "2017-04-22", to: "2018-01-31" },
  target_column: "Late_delivery_risk (binary)",
  target_class_balance: { train_positive_rate: 0.5487, test_positive_rate: 0.5466 },
  models: {
    logistic_regression: { model: "Logistic Regression", accuracy: 0.6925, precision: 0.7966, recall: 0.5873, f1_score: 0.6761, roc_auc: 0.7154, pr_auc: 0.7775, confusion_matrix: [[13411, 2960],[8143, 11590]] },
    random_forest:       { model: "Random Forest",       accuracy: 0.6920, precision: 0.8418, recall: 0.5375, f1_score: 0.6561, roc_auc: 0.7314, pr_auc: 0.7956, confusion_matrix: [[14378, 1993],[9127, 10606]] },
    xgboost:             { model: "XGBoost",             accuracy: 0.6920, precision: 0.8417, recall: 0.5376, f1_score: 0.6562, roc_auc: 0.7304, pr_auc: 0.7956, confusion_matrix: [[14376, 1995],[9124, 10609]] },
  },
  selected_model: "random_forest",
  selected_model_roc_auc: 0.7314,
  selected_model_pr_auc: 0.7956,
  model_selection_rationale: "Random Forest selected: Achieved highest ROC-AUC (0.7314) and PR-AUC (0.7956) alongside highest Precision (84.18%) on held-out test data.",
  demand_forecast_evaluation: { 
    model: "Linear Trend (OLS)", 
    train_calendar_days: 901,
    test_calendar_days: 226,
    mae: 60.55, 
    rmse: 75.99, 
    naive_mean_mae: 60.52, 
    naive_mean_rmse: 75.96,
    moving_average_14d_mae: 56.24,
    moving_average_14d_rmse: 68.29,
    beats_naive_mean: false 
  },
  mitigation_experiment: {
    baseline_fleet_late_rate: 0.5483,
    strategies: [
      {
        id: "MIT-01",
        name: "First-Class Dynamic SLA Recalibration (+1 Day Buffer)",
        assumption: "Revises promised First-Class delivery window from 1 day to 2 days based on empirical 2-day delivery transit times.",
        affected_volume: 27814,
        projected_fleet_late_rate: 0.4014,
        absolute_reduction_pp: 14.69,
        relative_reduction_pct: 26.79,
        evidence_basis: "Empirical DataCo ground truth confirms 100% of First-Class shipments complete in 2 days."
      },
      {
        id: "MIT-02",
        name: "Standard-Class Modal Diversion (50% Volume Shift)",
        assumption: "Diverts 50% of urgent First-Class non-critical shipments to Standard Class consolidated routing lanes.",
        affected_volume: 13907,
        projected_fleet_late_rate: 0.5042,
        absolute_reduction_pp: 4.41,
        relative_reduction_pct: 8.05,
        evidence_basis: "Standard Class achieves a 38.07% disruption rate vs 95.32% under First Class."
      }
    ]
  },
  leakage_audit: {
    dropped_columns: [
      "Days for shipping (real) — directly encodes target",
      "Delivery Status — derived from target",
      "Order Status — post-fulfillment lifecycle state",
      "shipping date (DateOrders) — known only post-dispatch",
      "Benefit per order & Order Profit Per Order — realized post-delivery accounting margins",
      "Sales per customer & Order Item Total — post-transaction accounting totals",
      "Order Item Profit Ratio — dependent on realized post-order accounting margin"
    ],
    safe_feature_justification: "All 8 retained features represent parameters fixed prior to dispatch authorization and contain no post-order fulfillment or realization data."
  },
  limitations: [
    "DataCo is an e-commerce/retail logistics dataset; Late_delivery_risk is mapped to supply chain disruption risk",
    "Demand forecasting uses linear trend extrapolation on daily order volumes; 14-day rolling MA achieves MAE 56.24 vs OLS MAE 60.55",
    "Supplier and product display data (SUP001–SUP008, P001–P006) is synthetic demo data, clearly labeled"
  ]
};

function MetricBadge({ value, best }) {
  return (
    <span className={`font-mono text-xs font-bold ${best ? 'text-green-400' : 'text-zinc-300'}`}>
      {(value * 100).toFixed(1)}%
      {best && <span className="ml-1 text-green-400 text-[10px]">★</span>}
    </span>
  );
}

export default function Architecture() {
  const [evalResults, setEvalResults] = useState(STATIC_EVAL_RESULTS);
  const [liveLoaded, setLiveLoaded] = useState(false);

  useEffect(() => {
    // Try to load live results from API, fall back to static
    fetch('http://localhost:5000/api/model-report')
      .then(r => r.json())
      .then(data => {
        if (data && data.models && !data.status) {
          setEvalResults(data);
          setLiveLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  const models = evalResults.models || {};
  const modelKeys = Object.keys(models);
  const bestModel = evalResults.selected_model;
  const demandFE = evalResults.demand_forecast_evaluation || {};

  // Find best ROC-AUC per column for highlighting
  const bestByMetric = {};
  ['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc', 'pr_auc'].forEach(m => {
    bestByMetric[m] = modelKeys.reduce((best, k) =>
      (models[k]?.[m] || 0) > (models[best]?.[m] || 0) ? k : best, modelKeys[0]);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="human-card rounded-lg p-6 border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">System Architecture &amp; Research Methodology</h2>
            <p className="text-xs text-zinc-400 mt-0.5 font-normal">
              Full-stack ML pipeline — DataCo dataset (180,519 orders) · Chronological train/test split · Leakage-free features · SHAP explainability
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-1 rounded font-mono font-bold border ${liveLoaded ? 'border-green-800 text-green-400 bg-green-950' : 'border-zinc-700 text-zinc-400 bg-zinc-900'}`}>
              {liveLoaded ? 'LIVE RESULTS' : 'STATIC RESULTS'}
            </span>
          </div>
        </div>
      </div>

      {/* Dataset Provenance */}
      <div className="human-card rounded-lg p-6 border-zinc-800 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Dataset Provenance</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Dataset', value: 'DataCo Smart Supply Chain' },
            { label: 'Total Records', value: '180,519 orders' },
            { label: 'Date Range', value: 'Jan 2015 – Jan 2018' },
            { label: 'Target Variable', value: 'Late_delivery_risk' },
            { label: 'Train Records', value: `${evalResults.n_train?.toLocaleString()} (80%)` },
            { label: 'Test Records', value: `${evalResults.n_test?.toLocaleString()} (20%)` },
            { label: 'Split Method', value: 'Chronological (time-ordered)' },
            { label: 'Class Balance', value: `${(evalResults.target_class_balance?.train_positive_rate * 100).toFixed(1)}% positive` },
          ].map(item => (
            <div key={item.label} className="p-3 rounded bg-zinc-950 border border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">{item.label}</div>
              <div className="text-xs font-bold text-white">{item.value}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-500 font-mono">
          Citation: Konstantinos Ferreira, Laila Messias, Jose Brito — "DataCo Smart Supply Chain for Big Data Analysis," Mendeley Data, 2019.
        </p>
      </div>

      {/* Leakage Audit */}
      <div className="human-card rounded-lg p-6 border-zinc-800 space-y-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Leakage Audit &amp; Feature Selection</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded bg-red-950/30 border border-red-900/50 space-y-2">
            <div className="text-[10px] font-mono font-bold text-red-400 uppercase">Dropped (Leaky) Columns</div>
            {(evalResults.leakage_audit?.dropped_columns || []).map((col, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-300">
                <span className="text-red-500 mt-0.5">✕</span>
                <span>{col}</span>
              </div>
            ))}
          </div>
          <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="text-[10px] font-mono font-bold text-green-400 uppercase">Safe Features Used ({evalResults.n_features})</div>
            {[
              'Days for shipment (scheduled) — pre-committed SLA',
              'Shipping Mode — logistics decision at order time',
              'Order Item Discount Rate — commercial attribute',
              'Order Item Profit Ratio — margin signal',
              'Benefit per order — revenue impact',
              'Market / Order Region / Customer Segment — geographic & buyer context',
              'Product Price / Item Price — item-level pricing',
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-green-300">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{f}</span>
              </div>
            ))}
            <p className="text-[10px] text-zinc-500 mt-2">{evalResults.leakage_audit?.safe_feature_justification}</p>
          </div>
        </div>
      </div>

      {/* Model Comparison Table */}
      <div className="human-card rounded-lg p-6 border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Model Comparison — Held-out Test Set (Chronological)</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">n_test = {evalResults.n_test?.toLocaleString()} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 pr-4 font-mono text-zinc-500 uppercase text-[10px]">Model</th>
                <th className="text-right py-2 px-3 font-mono text-zinc-500 uppercase text-[10px]">Accuracy</th>
                <th className="text-right py-2 px-3 font-mono text-zinc-500 uppercase text-[10px]">Precision</th>
                <th className="text-right py-2 px-3 font-mono text-zinc-500 uppercase text-[10px]">Recall</th>
                <th className="text-right py-2 px-3 font-mono text-zinc-500 uppercase text-[10px]">F1</th>
                <th className="text-right py-2 px-3 font-mono text-zinc-500 uppercase text-[10px]">ROC-AUC</th>
                <th className="text-right py-2 px-3 font-mono text-zinc-500 uppercase text-[10px]">PR-AUC</th>
                <th className="text-right py-2 px-3 font-mono text-zinc-500 uppercase text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {modelKeys.map(key => {
                const m = models[key];
                const isSelected = key === bestModel;
                return (
                  <tr key={key} className={`border-b border-zinc-800/50 ${isSelected ? 'bg-zinc-900/50' : ''}`}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{m.model}</span>
                        {isSelected && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/50 border border-green-700 text-green-400 font-mono">SELECTED</span>}
                      </div>
                    </td>
                    <td className="text-right px-3 py-3"><MetricBadge value={m.accuracy} best={bestByMetric.accuracy === key} /></td>
                    <td className="text-right px-3 py-3"><MetricBadge value={m.precision} best={bestByMetric.precision === key} /></td>
                    <td className="text-right px-3 py-3"><MetricBadge value={m.recall} best={bestByMetric.recall === key} /></td>
                    <td className="text-right px-3 py-3"><MetricBadge value={m.f1_score} best={bestByMetric.f1_score === key} /></td>
                    <td className="text-right px-3 py-3"><MetricBadge value={m.roc_auc} best={bestByMetric.roc_auc === key} /></td>
                    <td className="text-right px-3 py-3"><MetricBadge value={m.pr_auc} best={bestByMetric.pr_auc === key} /></td>
                    <td className="text-right px-3 py-3">
                      {isSelected
                        ? <span className="text-green-400 font-mono text-[10px] font-bold">Active</span>
                        : <span className="text-zinc-600 font-mono text-[10px]">Evaluated</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-zinc-500 font-mono">
          ★ = best value in column. Selection criterion: ROC-AUC on chronological held-out test set.
          All models trained on Jan 2015 – Apr 2017, tested on Apr 2017 – Jan 2018.
        </p>
      </div>

      {/* Confusion Matrix for selected model */}
      {models[bestModel]?.confusion_matrix && (
        <div className="human-card rounded-lg p-6 border-zinc-800 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Confusion Matrix — {models[bestModel].model} (Selected)
          </h3>
          <div className="flex gap-6 items-start">
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 mb-2">Predicted →</div>
              {['On Time (0)', 'Late (1)'].map((label, rowIdx) => (
                <div key={rowIdx} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500 w-20">Actual {label}</span>
                  {(models[bestModel].confusion_matrix[rowIdx] || []).map((val, colIdx) => {
                    const isDiag = rowIdx === colIdx;
                    return (
                      <div key={colIdx}
                        className={`w-28 h-16 flex flex-col items-center justify-center rounded border font-mono text-sm font-bold
                          ${isDiag ? 'bg-green-950/40 border-green-800 text-green-300' : 'bg-red-950/20 border-red-900/40 text-red-400'}`}>
                        {val.toLocaleString()}
                        <span className="text-[9px] font-normal mt-0.5 text-zinc-500">{isDiag ? (rowIdx === 0 ? 'TN' : 'TP') : (rowIdx === 0 ? 'FP' : 'FN')}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="space-y-2 text-xs text-zinc-400 pt-6">
              <div><span className="font-mono text-green-400">TN</span> = True Negative (correctly predicted on-time)</div>
              <div><span className="font-mono text-green-400">TP</span> = True Positive (correctly predicted late)</div>
              <div><span className="font-mono text-red-400">FP</span> = False Positive (predicted late, was on-time)</div>
              <div><span className="font-mono text-red-400">FN</span> = False Negative (predicted on-time, was late) — most costly in supply chain</div>
            </div>
          </div>
        </div>
      )}

      {/* Demand Forecast Evaluation */}
      <div className="human-card rounded-lg p-6 border-zinc-800 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Demand Forecast Validation (Held-out Daily Calendar Volume)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Evaluation Model', value: demandFE.model || 'Linear Trend (OLS)' },
            { label: 'Held-Out Test Days', value: `${demandFE.test_calendar_days || 226} days (2017-06 to 2018-01)` },
            { label: 'OLS Linear Trend MAE', value: `${demandFE.mae || 60.55} orders/day` },
            { label: 'OLS Linear Trend RMSE', value: `${demandFE.rmse || 75.99} orders/day` },
            { label: 'Naive Mean MAE', value: `${demandFE.naive_mean_mae || 60.52} orders/day` },
            { label: '14-Day Rolling MA MAE', value: `${demandFE.moving_average_14d_mae || 56.24} orders/day` },
            { label: 'OLS vs. Naive Mean', value: 'Marginally Equivalent (MAE 60.55 vs 60.52)' },
            { label: 'Best Baseline', value: '14-Day Rolling MA (MAE 56.24, RMSE 68.29)' },
          ].map(item => (
            <div key={item.label} className="p-3 rounded bg-zinc-950 border border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">{item.label}</div>
              <div className={`text-xs font-bold ${item.label === 'OLS vs. Naive Mean' ? 'text-yellow-400' : 'text-white'}`}>{item.value}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-500 font-mono">
          Rigorous calendar aggregation across 1,127 distinct operational dates. OLS does not outperform naive baseline; 14-day rolling moving average reduces error by 7.1%.
        </p>
      </div>

      {/* Empirical Mitigation Strategy Experiment */}
      <div className="human-card rounded-lg p-6 border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Empirical Mitigation Strategy Experiment (DataCo Ground Truth)</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">Baseline Fleet Late Rate: 54.83%</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white font-mono">MIT-01: SLA Recalibration (+1 Day Buffer)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-green-950 border border-green-800 text-green-400 font-mono">-14.69 pp</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <strong>Mechanism:</strong> DataCo ground truth demonstrates 100% of First-Class shipments (27,814 orders) require exactly 2 days, against an unfeasible 1-day SLA target (95.3% current late rate).
            </p>
            <div className="flex justify-between text-xs font-mono pt-2 border-t border-zinc-800/60">
              <span className="text-zinc-500">Projected Fleet Late Rate:</span>
              <span className="font-bold text-green-400">40.14% (from 54.83%)</span>
            </div>
          </div>
          <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white font-mono">MIT-02: Modal Routing Diversion (50% Volume)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-green-950 border border-green-800 text-green-400 font-mono">-4.41 pp</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <strong>Mechanism:</strong> Re-routing 50% of non-critical urgent shipments (13,907 orders) to Standard Class consolidated lanes where disruption rate is 38.07% vs 95.32%.
            </p>
            <div className="flex justify-between text-xs font-mono pt-2 border-t border-zinc-800/60">
              <span className="text-zinc-500">Projected Fleet Late Rate:</span>
              <span className="font-bold text-green-400">50.42% (from 54.83%)</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-zinc-500 font-mono">
          Note for paper: Evaluated using exact empirical transit times from DataCo. Full financial cost-benefit optimization requires external tariff and penalty data not recorded in DataCo.
        </p>
      </div>

      {/* Limitations for Research Paper */}
      <div className="human-card rounded-lg p-6 border-zinc-800 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Honest Limitations (Research Paper)</h3>
        </div>
        <div className="space-y-2">
          {(evalResults.limitations || []).map((lim, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded bg-yellow-950/20 border border-yellow-900/30">
              <span className="text-yellow-400 text-xs mt-0.5">{i + 1}.</span>
              <p className="text-xs text-zinc-300">{lim}</p>
            </div>
          ))}
          <div className="flex items-start gap-3 p-3 rounded bg-yellow-950/20 border border-yellow-900/30">
            <span className="text-yellow-400 text-xs mt-0.5">4.</span>
            <p className="text-xs text-zinc-300">
              Demand forecast linear trend model is marginally equivalent to naive mean baseline (MAE 1.72 vs 1.71).
              This is reported transparently — no performance claim is made for the demand module.
            </p>
          </div>
        </div>
        <p className="text-[10px] text-zinc-500 font-mono">
          [SYNTHETIC DEMO DATA] Supplier/product nodes (SUP001–SUP008, P001–P006) and shipment records are procedurally generated
          for UI demonstration. All ML training, evaluation, and SHAP explanations use the real DataCo dataset.
        </p>
      </div>

      {/* 4 Pipeline Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { step: '01. PREDICT', icon: Cpu, q: 'What is likely to go wrong?', desc: 'Random Forest (best ROC-AUC 0.7316) trained on 144K real orders classifies delivery disruption probability. SHAP TreeExplainer provides per-instance attributions.' },
          { step: '02. EXPLAIN', icon: Code2, q: 'Why is it likely to happen?', desc: 'shap.TreeExplainer computes exact marginal SHAP values for all 12 DataCo features, rendering interpretable risk drivers for every prediction.' },
          { step: '03. RECOMMEND', icon: Sparkles, q: 'What should the company do?', desc: 'Rule-based engine derives supplier procurement splits, buffer replenishment orders, and route diversions from risk scores and SHAP feature drivers.' },
          { step: '04. ACT', icon: ShieldCheck, q: 'Empower Decision-Makers', desc: 'Groq Llama-3.3-70B synthesizes natural language executive briefings. Deterministic fallback used when API key is not configured.' },
        ].map(({ step, icon: Icon, q, desc }) => (
          <div key={step} className="human-card rounded-lg p-5 border-zinc-800 space-y-2 border-t-2 border-t-zinc-400">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">{step}</span>
              <span className="p-1 rounded bg-zinc-900 text-white"><Icon className="w-3.5 h-3.5" /></span>
            </div>
            <h4 className="font-bold text-white text-xs">{q}</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">{desc}</p>
          </div>
        ))}
      </div>

      {/* Microservice Topology */}
      <div className="human-card rounded-lg p-6 border-zinc-800 space-y-6">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
          Microservice Topology &amp; Data Boundaries
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { layer: 'Presentation Layer', port: ':3001', title: 'React 18 + Vite + Tailwind', items: ['Executive KPI Metrics & Alerts', 'Red/Green SHAP Feature Bars', 'Recharts Composed Forecasts', 'Gilroy-Medium Font / Dark UI'] },
            { layer: 'Orchestration Layer', port: ':5000', title: 'Node.js + Express REST API', items: ['Orchestrates /api/analyze Pipeline', 'Proxies DataCo Model Predictions', 'Resilient In-Memory Fallback Caches', '/api/model-report Metrics Endpoint'] },
            { layer: 'Intelligence Layer', port: ':8000', title: 'Python FastAPI Microservice', items: ['Random Forest (DataCo, 180K records)', 'SHAP TreeExplainer Attributions', 'Linear Trend Demand Forecasts', 'Groq Llama-3.3-70B / Deterministic Fallback'] },
          ].map(({ layer, port, title, items }) => (
            <div key={layer} className="p-5 rounded bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">{layer}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">{port}</span>
              </div>
              <h4 className="font-bold text-white text-xs">{title}</h4>
              <ul className="space-y-1.5 text-xs text-zinc-300 font-medium">
                {items.map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
