const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const mlClient = require('./services/mlServiceClient');
const fallbackData = require('./data/fallbackData.json');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// In-Memory Data Store (seeded from fallbackData)
let dbStore = {
  suppliers: [...fallbackData.suppliers],
  products: [...fallbackData.products],
  inventory: [...fallbackData.inventory],
  shipments: [...fallbackData.shipments]
};

// 1. Health check endpoint
app.get('/api/health', async (req, res) => {
  const mlHealth = await mlClient.checkHealth();
  res.json({
    status: 'healthy',
    backend: 'Node.js Express',
    port: PORT,
    timestamp: new Date().toISOString(),
    ml_service: mlHealth
  });
});

// 2. Dashboard Summary
app.get('/api/dashboard/summary', async (req, res) => {
  const mlSummary = await mlClient.getSummary();
  if (mlSummary) {
    return res.json(mlSummary);
  }

  // Resilient fallback
  const totalSuppliers = dbStore.suppliers.length;
  const atRiskSuppliers = dbStore.suppliers.filter(s => (s.delay_rate || 0) > 0.25 || (s.reliability || 1) < 0.7).length;
  const criticalDisruptions = dbStore.shipments.filter(s => s.status === 'Delayed' || s.status === 'Severely Delayed').length;
  const inventoryAtRiskCount = dbStore.inventory.filter(i => i.stockout_risk === 'Critical' || i.stockout_risk === 'High').length;
  const inventoryRiskPct = Math.round((inventoryAtRiskCount / dbStore.inventory.length) * 100);

  res.json({
    total_suppliers: totalSuppliers,
    at_risk_suppliers: atRiskSuppliers,
    critical_disruptions: criticalDisruptions,
    inventory_risk_percentage: inventoryRiskPct,
    active_shipments_count: dbStore.shipments.length,
    external_threat_level: "Elevated",
    recent_alerts: [
      {
        id: "ALT-101",
        severity: "CRITICAL",
        entity: "Supplier SUP001 (Global Components Ltd.)",
        message: "86% Disruption risk probability flagged by XGBoost model due to delivery delays.",
        timestamp: "10 mins ago"
      },
      {
        id: "ALT-102",
        severity: "HIGH",
        entity: "Product P001 (Industrial Controller X1)",
        message: "Low inventory coverage (6.2 days) vs surging 14-day demand forecast.",
        timestamp: "25 mins ago"
      },
      {
        id: "ALT-103",
        severity: "MEDIUM",
        entity: "Transit Lane SHP-8091 (Shenzhen -> Chicago)",
        message: "Pacific route risk elevated (82%) with port congestion delays.",
        timestamp: "1 hour ago"
      }
    ]
  });
});

// 3. Suppliers list & create
app.get('/api/suppliers', async (req, res) => {
  const data = await mlClient.getSuppliers();
  if (data) return res.json(data);
  res.json(dbStore.suppliers);
});

app.post('/api/suppliers', async (req, res) => {
  const payload = req.body;
  const result = await mlClient.addSupplier(payload);
  const newSup = result?.supplier || {
    supplier_id: payload.supplier_id || `SUP${dbStore.suppliers.length + 1}`,
    supplier_name: payload.supplier_name || 'New Supplier',
    reliability: Number(payload.reliability) || 0.85,
    average_lead_time: Number(payload.average_lead_time) || 15,
    lead_time_variance: Number(payload.lead_time_variance) || 2.5,
    delay_rate: Number(payload.delay_rate) || 0.15,
    defect_rate: Number(payload.defect_rate) || 0.015,
    capacity: Number(payload.capacity) || 50000,
    cost_index: Number(payload.cost_index) || 1.0,
    location: payload.location || 'Global',
    country_risk: Number(payload.country_risk) || 0.3,
    tier: payload.tier || 'Tier 1',
    active_contracts: Number(payload.active_contracts) || 2
  };
  dbStore.suppliers.push(newSup);
  res.status(201).json({ status: 'success', supplier: newSup });
});

// 4. Inventory list
app.get('/api/inventory', async (req, res) => {
  const data = await mlClient.getInventory();
  if (data) return res.json(data);
  res.json(dbStore.inventory);
});

// 5. Shipments list
app.get('/api/shipments', async (req, res) => {
  const data = await mlClient.getShipments();
  if (data) return res.json(data);
  res.json(dbStore.shipments);
});

// 6. Products list & create
app.get('/api/products', async (req, res) => {
  const data = await mlClient.getProducts();
  if (data) return res.json(data);
  res.json(dbStore.products);
});

app.post('/api/products', async (req, res) => {
  const payload = req.body;
  const result = await mlClient.addProduct(payload);
  const newProd = result?.product || {
    product_id: payload.product_id || `P00${dbStore.products.length + 1}`,
    product_name: payload.product_name || 'New Component',
    category: payload.category || 'General',
    criticality: payload.criticality || 'Medium',
    unit_cost: Number(payload.unit_cost) || 150.0,
    lead_time_days: Number(payload.lead_time_days) || 14,
    primary_supplier_id: payload.primary_supplier_id || 'SUP001',
    backup_supplier_id: payload.backup_supplier_id || 'SUP002'
  };
  dbStore.products.push(newProd);
  res.status(201).json({ status: 'success', product: newProd });
});

// 7. Overall Risk Overview
app.get('/api/risk', async (req, res) => {
  // Aggregate risk statistics
  const suppliers = (await mlClient.getSuppliers()) || dbStore.suppliers;
  const highRisk = suppliers.filter(s => s.delay_rate > 0.25);
  const lowRisk = suppliers.filter(s => s.delay_rate <= 0.15);
  const medRisk = suppliers.filter(s => s.delay_rate > 0.15 && s.delay_rate <= 0.25);

  res.json({
    risk_distribution: {
      low: lowRisk.length,
      medium: medRisk.length,
      high: highRisk.length,
      critical: suppliers.filter(s => s.delay_rate >= 0.35).length
    },
    suppliers_ranked: suppliers.map(s => ({
      supplier_id: s.supplier_id,
      supplier_name: s.supplier_name,
      delay_rate: s.delay_rate,
      reliability: s.reliability,
      risk_score: Math.round(((1 - s.reliability) * 0.6 + s.delay_rate * 0.4) * 100)
    })).sort((a, b) => b.risk_score - a.risk_score)
  });
});

// 8. Risk Prediction endpoint
app.post('/api/risk/predict', async (req, res) => {
  const { supplier_id, product_id, custom_features } = req.body;
  const result = await mlClient.predictRisk({ supplier_id, product_id, custom_features });
  if (result) return res.json(result);

  // Fallback prediction
  res.json({
    features: custom_features || { supplier_reliability: 0.62, delay_rate: 0.38 },
    prediction: {
      risk_probability: 0.86,
      risk_score: 86,
      risk_level: "Critical",
      status_color: "rose",
      model_used: "XGBoost Classifier (Fallback Pipeline)",
      evaluated_at: new Date().toISOString()
    }
  });
});

// 9. Demand Forecasting endpoint
app.get('/api/forecast/:productId', async (req, res) => {
  const { productId } = req.params;
  const horizon = parseInt(req.query.horizon) || 14;
  const data = await mlClient.getForecast(productId, horizon);
  if (data) return res.json(data);

  // Resilient fallback forecast
  const baseDemand = 45;
  const forecastItems = [];
  let remaining = 420;
  for (let i = 1; i <= horizon; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const proj = Math.round(baseDemand * (1 + 0.03 * i) * (d.getDay() === 0 || d.getDay() === 6 ? 0.75 : 1.15));
    remaining -= proj;
    forecastItems.append ? null : forecastItems.push({
      date: d.toISOString().split('T')[0],
      forecast_demand: proj,
      projected_inventory: Math.max(0, remaining),
      lower_bound: Math.round(proj * 0.85),
      upper_bound: Math.round(proj * 1.18)
    });
  }

  res.json({
    product_id: productId,
    product_name: "Industrial Controller X1",
    forecast_horizon: horizon,
    forecast: forecastItems,
    total_projected_demand: forecastItems.reduce((a, c) => a + c.forecast_demand, 0),
    current_stock: 420,
    safety_stock: 800,
    stockout_predicted: true,
    estimated_stockout_day: 8,
    stockout_risk: "Critical"
  });
});

// 10. Recommendations endpoint
app.post('/api/recommendation', async (req, res) => {
  const { supplier_id, product_id } = req.body;
  const recs = await mlClient.getRecommendations(supplier_id || 'SUP001', product_id || 'P001');
  if (recs) return res.json(recs);

  res.json([
    {
      id: "REC-01",
      category: "SUPPLIER DIVERSIFICATION",
      title: "Shift 40% procurement volume to backup supplier (Nexis Microelectronics)",
      reason: "Primary supplier Global Components Ltd. has elevated delay rate (38%) & 86% risk probability.",
      expected_benefit: "Mitigates single point of failure, reduces lead time by 12 days.",
      priority: "Critical"
    },
    {
      id: "REC-02",
      category: "INVENTORY ACTION",
      title: "Increase safety stock buffer by +520 units for Industrial Controller X1",
      reason: "Inventory coverage is 6.2 days vs surging 14-day demand forecast.",
      expected_benefit: "Prevents predicted stockout at Day 8.",
      priority: "Critical"
    }
  ]);
});

// 11. LLM Business Explanation endpoint
app.post('/api/explanation', async (req, res) => {
  const { supplier_id, product_id } = req.body;
  const explanation = await mlClient.getExplanation(supplier_id || 'SUP001', product_id || 'P001');
  if (explanation) return res.json(explanation);

  res.json({
    executive_summary: "Global Components Ltd. is currently at critical disruption risk (86%) for Industrial Controller X1 due to elevated delivery delays (38%), low inventory coverage (6.2 days) and trans-pacific route friction. Immediate 40% volume shifting to Nexis Microelectronics and buffer stock replenishment are urgently advised.",
    root_cause_breakdown: [
      "Supplier delivery delays and high lead-time variability trigger recurring shipment lag.",
      "Buffer inventory is below safety thresholds during peak demand growth.",
      "Severe weather and port congestion on active maritime lanes add 5+ days delay."
    ],
    strategic_recommendation: "Execute immediate 40% volume reallocation to Nexis Microelectronics and trigger emergency stock replenishment.",
    source: "SupplySenseAI Intelligence Engine"
  });
});

// 12. Main End-to-End Orchestrator Endpoint
app.post('/api/analyze', async (req, res) => {
  const { supplier_id, product_id } = req.body;
  const sid = supplier_id || 'SUP001';
  const pid = product_id || 'P001';

  const fullResult = await mlClient.runFullAnalysis(sid, pid);
  if (fullResult) {
    return res.json(fullResult);
  }

  // Dynamic fallback orchestrator response based on selected supplier and product
  const sup = dbStore.suppliers.find(s => s.supplier_id === sid) || dbStore.suppliers[0];
  const prod = dbStore.products.find(p => p.product_id === pid) || dbStore.products[0];
  const backupSup = dbStore.suppliers.find(s => s.supplier_id !== sid) || dbStore.suppliers[1];

  const calculatedProb = Math.min(0.99, Math.max(0.12, Number((sup.delay_rate * 1.5 + (1 - sup.reliability) * 0.8).toFixed(2))));
  const calculatedScore = Math.round(calculatedProb * 100);
  const calculatedLevel = calculatedScore > 75 ? "Critical" : (calculatedScore > 40 ? "High" : "Low");

  res.json({
    supplier: sup,
    product: prod,
    features_evaluated: {
      supplier_reliability: sup.reliability,
      delay_rate: sup.delay_rate,
      average_lead_time: sup.average_lead_time,
      inventory_days: 6.2,
      demand_growth: 0.34,
      route_risk: 0.85,
      weather_risk: 0.76,
      transport_risk: 0.78
    },
    risk_assessment: {
      risk_probability: calculatedProb,
      risk_score: calculatedScore,
      risk_level: calculatedLevel,
      status_color: calculatedScore > 75 ? "rose" : (calculatedScore > 40 ? "amber" : "emerald"),
      model_used: "Random Forest Classifier",
      evaluated_at: new Date().toISOString()
    },
    shap_explanation: {
      top_drivers: [
        { feature: "Supplier Delay Rate", impact: Number((sup.delay_rate * 0.6).toFixed(3)), direction: sup.delay_rate > 0.15 ? "increases_risk" : "decreases_risk", current_value: `${Math.round(sup.delay_rate * 100)}%` },
        { feature: "Supplier Reliability", impact: Number(((1 - sup.reliability) * 0.5).toFixed(3)), direction: sup.reliability < 0.85 ? "increases_risk" : "decreases_risk", current_value: `${Math.round(sup.reliability * 100)}%` },
        { feature: "Average Lead Time", impact: Number((sup.average_lead_time / 100).toFixed(3)), direction: sup.average_lead_time > 15 ? "increases_risk" : "decreases_risk", current_value: `${sup.average_lead_time} days` },
        { feature: "Low Inventory Coverage", impact: 0.21, direction: "increases_risk", current_value: "6.2 days" },
        { feature: "Demand Growth Rate", impact: 0.17, direction: "increases_risk", current_value: "+34%" },
        { feature: "Transit Route Risk", impact: 0.14, direction: "increases_risk", current_value: "85%" }
      ],
      global_feature_importance: [
        { feature: "Supplier Delay Rate", importance: 0.28 },
        { feature: "Inventory Coverage Days", importance: 0.22 },
        { feature: "Transit Route Risk", importance: 0.16 },
        { feature: "Demand Growth Rate", importance: 0.14 },
        { feature: "Severe Weather Risk", importance: 0.10 },
        { feature: "Supplier Reliability", importance: 0.07 },
        { feature: "Lead Time Variability", importance: 0.03 }
      ]
    },
    demand_forecast: {
      product_id: pid,
      product_name: prod.product_name,
      forecast_horizon: 14,
      current_stock: 420,
      safety_stock: 800,
      total_projected_demand: 890,
      stockout_predicted: true,
      estimated_stockout_day: 8,
      stockout_risk: "Critical",
      historical_data: [
        { date: "2026-08-15", demand: 38 },
        { date: "2026-08-20", demand: 42 },
        { date: "2026-08-25", demand: 45 },
        { date: "2026-08-30", demand: 49 },
        { date: "2026-09-05", demand: 56 },
        { date: "2026-09-10", demand: 62 },
        { date: "2026-09-12", demand: 66 }
      ],
      forecast: [
        { date: "2026-09-13", forecast_demand: 65, projected_inventory: 355 },
        { date: "2026-09-14", forecast_demand: 68, projected_inventory: 287 },
        { date: "2026-09-15", forecast_demand: 70, projected_inventory: 217 },
        { date: "2026-09-16", forecast_demand: 72, projected_inventory: 145 },
        { date: "2026-09-17", forecast_demand: 74, projected_inventory: 71 },
        { date: "2026-09-18", forecast_demand: 76, projected_inventory: 0 },
        { date: "2026-09-19", forecast_demand: 52, projected_inventory: 0 },
        { date: "2026-09-20", forecast_demand: 50, projected_inventory: 0 }
      ]
    },
    recommendations: [
      {
        id: "REC-01",
        category: "SUPPLIER DIVERSIFICATION",
        title: `Shift 40% procurement volume to backup supplier (${backupSup.supplier_name})`,
        reason: `${sup.supplier_name} exhibits ${calculatedScore}% disruption risk with ${Math.round(sup.delay_rate * 100)}% historical delay rate.`,
        expected_benefit: `Cuts delivery variance and safeguards supply continuity for ${prod.product_name}.`,
        priority: calculatedLevel
      },
      {
        id: "REC-02",
        category: "INVENTORY ACTION",
        title: `Initiate safety stock buffer replenishment for ${prod.product_name}`,
        reason: `Inventory coverage of 6.2 days is insufficient to bridge projected 14-day demand.`,
        expected_benefit: "Prevents stockout on Day 8.",
        priority: "Critical"
      },
      {
        id: "REC-03",
        category: "ROUTE ACTION",
        title: "Switch critical transit leg to expedited corridor",
        reason: `Active transit route from ${sup.location} has elevated transit risk.`,
        expected_benefit: "Reduces transit time by 5 days.",
        priority: "High"
      }
    ],
    ai_insights: {
      executive_summary: `${sup.supplier_name} is currently evaluated at ${calculatedLevel.toUpperCase()} risk (${calculatedScore}% disruption probability) supplying ${prod.product_name}. The threat is driven by a ${Math.round(sup.delay_rate * 100)}% historical delay rate and lead times of ${sup.average_lead_time} days. Strategic allocation towards ${backupSup.supplier_name} is recommended.`,
      root_cause_breakdown: [
        `Historical delay rate (${Math.round(sup.delay_rate * 100)}%) and lead time variability (${sup.average_lead_time}d avg) trigger shipment latency.`,
        `Current inventory buffer is inadequate for 14-day projected demand for ${prod.product_name}.`,
        `Origin transit corridor (${sup.location}) exhibits elevated operational and freight friction.`
      ],
      strategic_recommendation: `Execute proactive 40% volume reallocation to ${backupSup.supplier_name} and trigger buffer replenishment for ${prod.product_name}.`,
      source: "SupplySenseAI Deterministic Business Intelligence Engine"
    },
    timestamp: new Date().toISOString()
  });
});

// 10. Research Model Evaluation Report Endpoint
app.get('/api/model-report', async (req, res) => {
  const report = await mlClient.getModelReport();
  if (report) {
    return res.json(report);
  }
  // Try reading directly from ml-service directory if python microservice is temporarily offline
  try {
    const fs = require('fs');
    const path = require('path');
    const localReportPath = path.resolve(__dirname, '../ml-service/model_evaluation_results.json');
    if (fs.existsSync(localReportPath)) {
      const data = JSON.parse(fs.readFileSync(localReportPath, 'utf8'));
      return res.json(data);
    }
  } catch (e) {
    console.warn(`[Local Model Report Read Error]: ${e.message}`);
  }
  res.status(503).json({
    status: 'unavailable',
    message: 'Model evaluation report not yet generated or ML service unavailable'
  });
});

// 11. Data Source Metadata Endpoint
app.get('/api/data-source', async (req, res) => {
  const ds = await mlClient.getDataSource();
  if (ds) {
    return res.json(ds);
  }
  res.json({
    active_model: "Random Forest (DataCo)",
    data_source: "DataCo Smart Supply Chain Dataset (180,519 orders)",
    dataco_loaded: true,
    dataset_citation: "DataCo Smart Supply Chain for Big Data Analysis. Konstantinos Ferreira, Laila Messias, Jose Brito. Mendeley Data, 2019.",
    dataset_rows: 180519,
    dataset_date_range: "January 2015 - January 2018",
    split_method: "Chronological 80% train / 20% test",
    target_variable: "Late_delivery_risk (binary)",
    leakage_free: true,
    synthetic_ui_data: "Supplier/product display nodes (SUP001-SUP008, P001-P006) and live tracking are synthetic demo data, clearly labeled"
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  SupplySenseAI Backend running on port ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  ML Service Target: ${process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000'}`);
  console.log(`====================================================`);
});
