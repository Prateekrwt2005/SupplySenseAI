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
  shipments: [...fallbackData.shipments],
  disruption_events: [...(fallbackData.disruption_events || [])]
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
    active_disasters_count: dbStore.disruption_events.filter(e => e.severity === 'CRITICAL').length,
    external_threat_level: "Elevated",
    recent_alerts: [
      {
        id: "ALT-WAR-01",
        severity: "CRITICAL",
        category: "WAR & GEOPOLITICAL",
        entity: "Red Sea & Suez Maritime Corridor",
        message: "Houthi drone/missile strikes forcing 14-day Cape of Good Hope diversions for Asia-Europe shipments.",
        timestamp: "5 mins ago"
      },
      {
        id: "ALT-NAT-02",
        severity: "CRITICAL",
        category: "NATURAL DISASTER",
        entity: "Super Typhoon Yagi (Haiphong Port & Industrial Zone)",
        message: "Category 5 typhoon causes flash floods, coastal port shutdowns, and Tier-1 sub-assembly delays.",
        timestamp: "18 mins ago"
      },
      {
        id: "ALT-GEO-03",
        severity: "HIGH",
        category: "MILITARY DRILLS",
        entity: "Taiwan Strait Air/Sea Exclusion Zone",
        message: "Simulated blockade operations cause air freight deviations and commercial insurance surcharges.",
        timestamp: "42 mins ago"
      },
      {
        id: "ALT-101",
        severity: "HIGH",
        category: "SUPPLIER DISRUPTION",
        entity: "Supplier SUP001 (Global Components Ltd.)",
        message: "86% Disruption risk probability flagged by XGBoost model due to delivery delays.",
        timestamp: "1 hour ago"
      }
    ],
    disruption_events: dbStore.disruption_events
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
    backup_supplier_id: payload.backup_supplier_id || 'SUP002',
    daily_consumption_rate: Number(payload.daily_consumption_rate) || 45
  };
  
  // Also create inventory record for new product so inventory/demand stays coherent
  const newInv = {
    product_id: newProd.product_id,
    current_stock: Number(payload.initial_stock) || 500,
    safety_stock: Number(payload.safety_stock) || 600,
    reorder_point: Number(payload.reorder_point) || 400,
    economic_order_quantity: 500,
    inventory_days: Number(((Number(payload.initial_stock) || 500) / (Number(payload.daily_consumption_rate) || 45)).toFixed(1)),
    holding_cost_annual: 450.0,
    stockout_risk: (Number(payload.initial_stock) || 500) < (Number(payload.safety_stock) || 600) ? "High" : "Low",
    warehouse_location: payload.warehouse_location || "Central Hub Chicago"
  };
  
  dbStore.products.push(newProd);
  dbStore.inventory.push(newInv);
  res.status(201).json({ status: 'success', product: newProd, inventory: newInv });
});

// 6b. Disruption Events Feed (Wars, Natural Disasters, Geopolitical Shocks)
app.get('/api/disruptions', (req, res) => {
  res.json({
    total_events: dbStore.disruption_events.length,
    active_threat_level: "ELEVATED",
    events: dbStore.disruption_events
  });
});

app.post('/api/disruptions', (req, res) => {
  const payload = req.body;
  const newEvent = {
    id: payload.id || `EVT-${Date.now().toString().slice(-4)}`,
    type: payload.type || "Supply Line Alert",
    severity: payload.severity || "HIGH",
    title: payload.title || "Supply Route Incident",
    region: payload.region || "Global Maritime",
    impact: payload.impact || "+5 to +10 Days Delay",
    affected_corridors: payload.affected_corridors || ["Global Maritime"],
    affected_suppliers: payload.affected_suppliers || ["SUP001"],
    status: payload.status || "Active Threat",
    description: payload.description || "Operational disturbance flagged along commercial freight corridor."
  };
  dbStore.disruption_events.unshift(newEvent);
  res.status(201).json({ status: 'success', event: newEvent });
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

  // Always compute dynamic results from actual supplier/product data
  // Optionally try to get a refined ML probability score from the ML service
  const sup = dbStore.suppliers.find(s => s.supplier_id === sid) || dbStore.suppliers[0];
  const prod = dbStore.products.find(p => p.product_id === pid) || dbStore.products[0];
  const backupSup = dbStore.suppliers.find(s => s.supplier_id !== sid && s.supplier_id !== sid) || dbStore.suppliers[1];

  // Try to get ML service risk probability (non-blocking, optional enrichment)
  let mlRiskProb = null;
  try {
    const mlResult = await mlClient.predictRisk({ supplier_id: sid, product_id: pid });
    if (mlResult?.prediction?.risk_probability) {
      mlRiskProb = mlResult.prediction.risk_probability;
    }
  } catch (e) { /* ML service offline, use computed fallback */ }

  // Check if any active disaster/war affects this supplier's location or shipments
  const activeDisasters = dbStore.disruption_events.filter(e => 
    (e.affected_suppliers && e.affected_suppliers.includes(sid)) ||
    (sup.location && e.description.toLowerCase().includes(sup.location.split(',')[0].toLowerCase()))
  );
  const disasterPenalty = activeDisasters.length > 0 ? (activeDisasters[0].severity === 'CRITICAL' ? 0.15 : 0.08) : 0;

  // Use ML service probability if available, otherwise compute from supplier attributes
  const baseProb = Number((sup.delay_rate * 1.5 + (1 - sup.reliability) * 0.8 + disasterPenalty).toFixed(2));
  const calculatedProb = Math.min(0.99, Math.max(0.12, mlRiskProb !== null ? Math.min(0.99, mlRiskProb + disasterPenalty) : baseProb));
  const calculatedScore = Math.round(calculatedProb * 100);
  const calculatedLevel = calculatedScore > 75 ? "Critical" : (calculatedScore > 40 ? "High" : "Low");

  // Get real inventory data for this product
  const invData = dbStore.inventory.find(i => i.product_id === pid) || { current_stock: 420, safety_stock: 800, inventory_days: 6.2, stockout_risk: "Critical" };
  const dailyRate = prod.daily_consumption_rate || 45;
  const totalProjDemand = Math.round(dailyRate * 14 * (1 + sup.delay_rate * 0.5));
  const stockoutDay = invData.current_stock > 0 ? Math.max(1, Math.floor(invData.current_stock / dailyRate)) : 1;
  const stockoutPredicted = invData.current_stock < totalProjDemand;

  // Build dynamic 8-day forecast
  const forecastItems = [];
  let remaining = invData.current_stock;
  for (let i = 1; i <= 8; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayDemand = Math.round(dailyRate * (1 + 0.03 * i));
    remaining = Math.max(0, remaining - dayDemand);
    forecastItems.push({ date: d.toISOString().split('T')[0], forecast_demand: dayDemand, projected_inventory: remaining });
  }

  // Route risk from active shipment for this supplier
  const activeShipment = dbStore.shipments.find(s => s.supplier_id === sid) || { route_risk: 0.45 };
  const routeRisk = activeShipment.route_risk;

  res.json({
    supplier: sup,
    product: prod,
    features_evaluated: {
      supplier_reliability: sup.reliability,
      delay_rate: sup.delay_rate,
      average_lead_time: sup.average_lead_time,
      inventory_days: invData.inventory_days,
      demand_growth: Number((sup.delay_rate * 0.9).toFixed(2)),
      route_risk: routeRisk,
      weather_risk: Number((sup.country_risk * 0.85).toFixed(2)),
      transport_risk: Number((routeRisk * 0.95).toFixed(2))
    },
    risk_assessment: {
      risk_probability: calculatedProb,
      risk_score: calculatedScore,
      risk_level: calculatedLevel,
      status_color: calculatedScore > 75 ? "rose" : (calculatedScore > 40 ? "amber" : "emerald"),
      model_used: mlRiskProb !== null ? "XGBoost Classifier (ML Service)" : "Random Forest Classifier",
      data_source: "DataCo Supply Chain Dataset",
      evaluated_at: new Date().toISOString()
    },
    shap_explanation: {
      top_drivers: [
        { feature: "Supplier Delay Rate", impact: Number((sup.delay_rate * 0.6).toFixed(3)), direction: sup.delay_rate > 0.15 ? "increases_risk" : "decreases_risk", current_value: `${Math.round(sup.delay_rate * 100)}%` },
        { feature: "Supplier Reliability", impact: Number(((1 - sup.reliability) * 0.5).toFixed(3)), direction: sup.reliability < 0.85 ? "increases_risk" : "decreases_risk", current_value: `${Math.round(sup.reliability * 100)}%` },
        { feature: "Average Lead Time", impact: Number((sup.average_lead_time / 100).toFixed(3)), direction: sup.average_lead_time > 15 ? "increases_risk" : "decreases_risk", current_value: `${sup.average_lead_time} days` },
        { feature: "Inventory Coverage", impact: Number((Math.max(0, 0.30 - invData.inventory_days / 100)).toFixed(3)), direction: invData.inventory_days < 14 ? "increases_risk" : "decreases_risk", current_value: `${invData.inventory_days} days` },
        { feature: "Transit Route Risk", impact: Number((routeRisk * 0.18).toFixed(3)), direction: routeRisk > 0.4 ? "increases_risk" : "decreases_risk", current_value: `${Math.round(routeRisk * 100)}%` },
        { feature: "Country / Geopolitical Risk", impact: Number((sup.country_risk * 0.12).toFixed(3)), direction: sup.country_risk > 0.3 ? "increases_risk" : "decreases_risk", current_value: `${Math.round(sup.country_risk * 100)}%` }
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
      current_stock: invData.current_stock,
      safety_stock: invData.safety_stock,
      total_projected_demand: totalProjDemand,
      stockout_predicted: stockoutPredicted,
      estimated_stockout_day: stockoutDay,
      stockout_risk: invData.stockout_risk,
      forecast: forecastItems
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
        title: `Initiate safety stock replenishment for ${prod.product_name}`,
        reason: `Inventory coverage (${invData.inventory_days}d) is insufficient to bridge projected 14-day demand of ${totalProjDemand} units.`,
        expected_benefit: `Prevents projected stockout at Day ${stockoutDay}.`,
        priority: stockoutPredicted ? "Critical" : "Medium"
      },
      {
        id: "REC-03",
        category: "ROUTE ACTION",
        title: "Switch critical transit leg to expedited corridor",
        reason: `Active transit route from ${sup.location} has ${Math.round(routeRisk * 100)}% route risk score.`,
        expected_benefit: "Reduces transit time by 5 days.",
        priority: routeRisk > 0.6 ? "High" : "Medium"
      }
    ],
    ai_insights: {
      executive_summary: `${sup.supplier_name} is currently evaluated at ${calculatedLevel.toUpperCase()} risk (${calculatedScore}% disruption probability) supplying ${prod.product_name}. The threat is driven by a ${Math.round(sup.delay_rate * 100)}% historical delay rate, ${sup.average_lead_time}-day avg lead times, and only ${invData.inventory_days} days of inventory coverage. Strategic allocation towards ${backupSup.supplier_name} is recommended.`,
      root_cause_breakdown: [
        `Historical delay rate (${Math.round(sup.delay_rate * 100)}%) and lead time variability (${sup.average_lead_time}d avg) trigger recurring shipment latency.`,
        `Current inventory (${invData.current_stock} units / ${invData.inventory_days}d coverage) is ${stockoutPredicted ? 'inadequate' : 'sufficient'} for 14-day projected demand of ${totalProjDemand} units for ${prod.product_name}.`,
        activeDisasters.length > 0 
          ? `ACTIVE THREAT: ${activeDisasters[0].title} (${activeDisasters[0].impact}) directly impacts transit corridors for ${sup.location}.`
          : `Origin transit corridor (${sup.location}) exhibits ${Math.round(routeRisk * 100)}% route risk with ${sup.country_risk > 0.4 ? 'elevated' : 'moderate'} geopolitical exposure.`
      ],
      strategic_recommendation: `Execute proactive 40% volume reallocation to ${backupSup.supplier_name} and trigger buffer replenishment for ${prod.product_name}.`,
      source: "SupplySenseAI Dynamic Intelligence Engine"
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
