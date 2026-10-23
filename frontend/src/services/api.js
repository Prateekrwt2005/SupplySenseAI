import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const fetchHealth = async () => {
  try {
    const res = await apiClient.get('/health');
    return res.data;
  } catch (err) {
    return { status: 'degraded', backend: 'Offline/Fallback', error: err.message };
  }
};

export const fetchSummary = async () => {
  try {
    const res = await apiClient.get('/dashboard/summary');
    return res.data;
  } catch (err) {
    console.warn('API fetchSummary fallback:', err);
    return {
      total_suppliers: 8,
      at_risk_suppliers: 3,
      critical_disruptions: 2,
      inventory_risk_percentage: 33,
      active_shipments_count: 8,
      external_threat_level: "Elevated",
      recent_alerts: [
        { id: "ALT-101", severity: "CRITICAL", entity: "Supplier SUP001 (Global Components Ltd.)", message: "86% Disruption risk flagged due to severe delivery delay rate.", timestamp: "10m ago" },
        { id: "ALT-102", severity: "HIGH", entity: "Product P001 (Industrial Controller X1)", message: "Low inventory coverage (6.2 days) vs surging 14-day demand forecast.", timestamp: "25m ago" },
        { id: "ALT-103", severity: "MEDIUM", entity: "Route SHP-8091 (Shenzhen -> Chicago)", message: "Pacific maritime congestion risk elevated (82%).", timestamp: "1h ago" }
      ]
    };
  }
};

export const fetchSuppliers = async () => {
  try {
    const res = await apiClient.get('/suppliers');
    return res.data;
  } catch (err) {
    console.warn('API fetchSuppliers fallback:', err);
    return [];
  }
};

export const createSupplier = async (supplierData) => {
  try {
    const res = await apiClient.post('/suppliers', supplierData);
    return res.data;
  } catch (err) {
    console.warn('API createSupplier fallback:', err);
    return { status: 'fallback', supplier: supplierData };
  }
};

export const fetchProducts = async () => {
  try {
    const res = await apiClient.get('/products');
    return res.data;
  } catch (err) {
    console.warn('API fetchProducts fallback:', err);
    return [];
  }
};

export const createProduct = async (productData) => {
  try {
    const res = await apiClient.post('/products', productData);
    return res.data;
  } catch (err) {
    console.warn('API createProduct fallback:', err);
    return { status: 'fallback', product: productData };
  }
};

export const fetchInventory = async () => {
  try {
    const res = await apiClient.get('/inventory');
    return res.data;
  } catch (err) {
    console.warn('API fetchInventory fallback:', err);
    return [];
  }
};

export const fetchShipments = async () => {
  try {
    const res = await apiClient.get('/shipments');
    return res.data;
  } catch (err) {
    console.warn('API fetchShipments fallback:', err);
    return [];
  }
};

export const fetchRiskOverview = async () => {
  try {
    const res = await apiClient.get('/risk');
    return res.data;
  } catch (err) {
    console.warn('API fetchRiskOverview fallback:', err);
    return {
      risk_distribution: { low: 4, medium: 2, high: 1, critical: 1 },
      suppliers_ranked: []
    };
  }
};

export const runAnalyzeSupplyChain = async (supplierId, productId) => {
  try {
    const res = await apiClient.post('/analyze', {
      supplier_id: supplierId,
      product_id: productId
    });
    return res.data;
  } catch (err) {
    console.warn('API runAnalyzeSupplyChain fallback:', err);
    throw err;
  }
};

export const fetchForecast = async (productId, horizon = 14) => {
  try {
    const res = await apiClient.get(`/forecast/${productId}?horizon=${horizon}`);
    return res.data;
  } catch (err) {
    console.warn('API fetchForecast fallback:', err);
    return null;
  }
};

export const fetchRecommendations = async (supplierId, productId) => {
  try {
    const res = await apiClient.post('/recommendation', { supplier_id: supplierId, product_id: productId });
    return res.data;
  } catch (err) {
    console.warn('API fetchRecommendations fallback:', err);
    return [];
  }
};

export const fetchExplanation = async (supplierId, productId) => {
  try {
    const res = await apiClient.post('/explanation', { supplier_id: supplierId, product_id: productId });
    return res.data;
  } catch (err) {
    console.warn('API fetchExplanation fallback:', err);
    return null;
  }
};

export const fetchModelReport = async () => {
  try {
    const res = await apiClient.get('/model-report');
    return res.data;
  } catch (err) {
    console.warn('API fetchModelReport fallback:', err);
    return null;
  }
};

export const fetchDataSource = async () => {
  try {
    const res = await apiClient.get('/data-source');
    return res.data;
  } catch (err) {
    console.warn('API fetchDataSource fallback:', err);
    return null;
  }
};

