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

export const fetchDisruptions = async () => {
  try {
    const res = await apiClient.get('/disruptions');
    return res.data;
  } catch (err) {
    console.warn('API fetchDisruptions fallback:', err);
    return {
      total_events: 5,
      active_threat_level: "ELEVATED",
      events: [
        {
          id: "EVT-WAR-01",
          type: "Geopolitical Conflict / War",
          severity: "CRITICAL",
          title: "Red Sea Missile Assaults Force Cape of Good Hope Diversions",
          region: "Red Sea & Suez Canal Corridor",
          impact: "+12 to +16 Transit Days",
          affected_corridors: ["Asia-to-Europe Maritime", "Asia-to-US East Coast"],
          affected_suppliers: ["SUP001", "SUP004", "SUP008"],
          status: "Active Threat",
          description: "Armed attacks on commercial container vessels through Bab el-Mandeb have forced 85% of container fleet traffic to divert around Africa, adding 3,500 nautical miles, 14 days delay, and $2,800/FEU bunker fuel surcharges."
        },
        {
          id: "EVT-NAT-02",
          type: "Natural Disaster / Storm",
          severity: "CRITICAL",
          title: "Category 5 Super Typhoon Yagi Floods Northern Vietnam Tech Hubs",
          region: "Southeast Asia (Haiphong, Vietnam & Hainan)",
          impact: "Severe Factory Outage & +7 Days Port Backlog",
          affected_corridors: ["Haiphong-Chicago Lane", "South China Sea Corridors"],
          affected_suppliers: ["SUP008", "SUP004"],
          status: "Active Threat",
          description: "Submerged industrial export processing zones, destroyed coastal cranes, and grid collapse have paralyzed sensor and optic component manufacturing in Haiphong, with force majeure declared across Tier-1 sub-assemblers."
        },
        {
          id: "EVT-GEO-03",
          type: "Military Exercises & Embargo",
          severity: "HIGH",
          title: "Taiwan Strait Military Drills & Airspace Exclusion Zones",
          region: "Taiwan Strait & East China Sea",
          impact: "+48h Freight Re-routing & Insurance Premium Surges",
          affected_corridors: ["Taipei Air Freight", "Shenzhen-Chicago Maritime"],
          affected_suppliers: ["SUP001", "SUP002"],
          status: "Monitored",
          description: "Simulated live-fire blockades and navigational warnings have restricted sea lanes along shipping lane A533, triggering war-risk insurance surcharges and rerouting cargo flights over Japanese airspace."
        },
        {
          id: "EVT-CLIM-04",
          type: "Severe Climate Disaster",
          severity: "HIGH",
          title: "Historic Drought Stalls Panama Canal Daily Vessel Transits",
          region: "Central America (Panama Canal)",
          impact: "-33% Daily Vessel Capacity & +9 Days Queue",
          affected_corridors: ["Pacific-to-Atlantic Maritime", "US East Coast Inbound"],
          affected_suppliers: ["SUP001", "SUP004", "SUP006"],
          status: "Active Threat",
          description: "Gatun Lake reservoir levels remain critically depressed, capping daily transit booking slots from 36 down to 24 ships and forcing container ships to unload weight onto parallel rail bridges."
        },
        {
          id: "EVT-LAB-05",
          type: "Infrastructure & Labor Strike",
          severity: "MEDIUM",
          title: "North European Rail Freight Bottlenecks & Low Rhine Navigation",
          region: "Central Europe (Germany & Netherlands)",
          impact: "+3 to +5 Days Intermodal Lag",
          affected_corridors: ["Dresden-Rotterdam Rail Corridor"],
          affected_suppliers: ["SUP003"],
          status: "Active Threat",
          description: "Low summer water levels on the Rhine Kaub gauge force barges to load at only 40% cargo capacity, pushing excess bulk freight onto congested German rail lines and delaying semiconductor raw material inputs."
        }
      ]
    };
  }
};

export const createDisruptionEvent = async (eventData) => {
  try {
    const res = await apiClient.post('/disruptions', eventData);
    return res.data;
  } catch (err) {
    console.warn('API createDisruptionEvent fallback:', err);
    return { status: 'fallback', event: eventData };
  }
};


