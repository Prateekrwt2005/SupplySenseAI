const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Resilient API client functions
async function getSummary() {
  try {
    const res = await mlClient.get('/summary');
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] /summary fallback triggered: ${err.message}`);
    return null;
  }
}

async function getSuppliers() {
  try {
    const res = await mlClient.get('/suppliers');
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] /suppliers fallback triggered: ${err.message}`);
    return null;
  }
}

async function addSupplier(payload) {
  try {
    const res = await mlClient.post('/suppliers', payload);
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] POST /suppliers fallback: ${err.message}`);
    return null;
  }
}

async function getProducts() {
  try {
    const res = await mlClient.get('/products');
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] /products fallback: ${err.message}`);
    return null;
  }
}

async function addProduct(payload) {
  try {
    const res = await mlClient.post('/products', payload);
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] POST /products fallback: ${err.message}`);
    return null;
  }
}

async function getInventory() {
  try {
    const res = await mlClient.get('/inventory');
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] /inventory fallback: ${err.message}`);
    return null;
  }
}

async function getShipments() {
  try {
    const res = await mlClient.get('/shipments');
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] /shipments fallback: ${err.message}`);
    return null;
  }
}

async function predictRisk(payload) {
  try {
    const res = await mlClient.post('/predict-risk', payload);
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] /predict-risk fallback: ${err.message}`);
    return null;
  }
}

async function explainRisk(payload) {
  try {
    const res = await mlClient.post('/explain-risk', payload);
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] /explain-risk fallback: ${err.message}`);
    return null;
  }
}

async function getForecast(productId, horizonDays = 14) {
  try {
    const res = await mlClient.post('/forecast', { product_id: productId, horizon_days: horizonDays });
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] /forecast fallback: ${err.message}`);
    return null;
  }
}

async function getRecommendations(supplierId, productId) {
  try {
    const res = await mlClient.post('/recommend', { supplier_id: supplierId, product_id: productId });
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] /recommend fallback: ${err.message}`);
    return null;
  }
}

async function getExplanation(supplierId, productId) {
  try {
    const res = await mlClient.post('/explanation', { supplier_id: supplierId, product_id: productId });
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] /explanation fallback: ${err.message}`);
    return null;
  }
}

async function runFullAnalysis(supplierId, productId) {
  try {
    const res = await mlClient.post('/analyze', { supplier_id: supplierId, product_id: productId });
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] /analyze fallback triggered: ${err.message}`);
    return null;
  }
}

async function checkHealth() {
  try {
    const res = await mlClient.get('/health');
    return { online: true, details: res.data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

async function getModelReport() {
  try {
    const res = await mlClient.get('/model-report');
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] /model-report fallback: ${err.message}`);
    return null;
  }
}

async function getDataSource() {
  try {
    const res = await mlClient.get('/data-source');
    return res.data;
  } catch (err) {
    console.warn(`[ML Service] /data-source fallback: ${err.message}`);
    return null;
  }
}

module.exports = {
  getSummary,
  getSuppliers,
  addSupplier,
  getProducts,
  addProduct,
  getInventory,
  getShipments,
  predictRisk,
  explainRisk,
  getForecast,
  getRecommendations,
  getExplanation,
  runFullAnalysis,
  checkHealth,
  getModelReport,
  getDataSource
};
