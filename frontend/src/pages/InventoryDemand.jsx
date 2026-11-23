import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  ShieldAlert, 
  RefreshCw,
  Plus,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import RiskBadge from '../components/RiskBadge';
import { fetchInventory, fetchProducts, fetchForecast, createProduct } from '../services/api';

export default function InventoryDemand({ onNavigateToAnalysis }) {
  const [products, setProducts] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('P001');
  const [forecastHorizon, setForecastHorizon] = useState(14);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    category: 'Sensors',
    criticality: 'High',
    unit_cost: 120,
    lead_time_days: 14,
    daily_consumption_rate: 50,
    initial_stock: 450,
    safety_stock: 600,
    primary_supplier_id: 'SUP001',
    backup_supplier_id: 'SUP002'
  });

  const loadMeta = async () => {
    const [pData, iData] = await Promise.all([
      fetchProducts(),
      fetchInventory()
    ]);
    setProducts(pData || []);
    setInventoryList(iData || []);
  };

  useEffect(() => {
    loadMeta();
  }, []);

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.product_name.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await createProduct(newProduct);
      if (res && res.product) {
        setProducts(prev => [...prev, res.product]);
        if (res.inventory) {
          setInventoryList(prev => [...prev, res.inventory]);
        }
        setSelectedProductId(res.product.product_id);
      }
      setShowAddModal(false);
      setNewProduct({
        product_name: '',
        category: 'Sensors',
        criticality: 'High',
        unit_cost: 120,
        lead_time_days: 14,
        daily_consumption_rate: 50,
        initial_stock: 450,
        safety_stock: 600,
        primary_supplier_id: 'SUP001',
        backup_supplier_id: 'SUP002'
      });
    } catch (err) {
      console.error('Failed to create product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    async function loadForecast() {
      setLoading(true);
      const data = await fetchForecast(selectedProductId, forecastHorizon);
      setForecastData(data);
      setLoading(false);
    }
    loadForecast();
  }, [selectedProductId, forecastHorizon]);

  const currentInv = inventoryList.find((i) => i.product_id === selectedProductId) || {
    current_stock: 420,
    safety_stock: 800,
    inventory_days: 9.3,
    stockout_risk: 'Critical',
    warehouse_location: 'Central Hub Chicago'
  };

  const selectedProd = products.find((p) => p.product_id === selectedProductId) || {
    product_name: 'Industrial Controller X1',
    category: 'Control Systems',
    criticality: 'Critical'
  };

  // Prepare combined historical + forecast chart data
  const chartData = [];
  if (forecastData) {
    (forecastData.historical_data || []).forEach((h) => {
      chartData.push({
        date: h.date.slice(5),
        historicalDemand: h.demand,
        forecastDemand: null,
        projectedStock: null
      });
    });
    (forecastData.forecast || []).forEach((f) => {
      chartData.push({
        date: f.date.slice(5),
        historicalDemand: null,
        forecastDemand: f.forecast_demand,
        projectedStock: f.projected_inventory,
        upperBound: f.upper_bound,
        lowerBound: f.lower_bound
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Product Selector Bar */}
      <div className="human-card rounded-lg p-5 border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight uppercase">Demand Forecasting & Buffer Depletion</h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-normal">Time-series consumption projections vs warehouse safety buffers</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Add Product Line Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-all font-mono"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product Line
          </button>

          {/* Product Select */}
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-medium"
          >
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_id} — {p.product_name}
              </option>
            ))}
          </select>

          {/* Horizon Toggle */}
          <div className="flex bg-zinc-950 border border-zinc-800 rounded p-0.5 text-xs font-mono">
            {[7, 14, 30].map((h) => (
              <button
                key={h}
                onClick={() => setForecastHorizon(h)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  forecastHorizon === h
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {h}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="human-card rounded-lg p-4 border-zinc-800 border-l-2 border-l-zinc-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Current Stock</span>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">
            {currentInv.current_stock?.toLocaleString() || 420} <span className="text-xs font-normal text-zinc-400">units</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">{currentInv.warehouse_location}</div>
        </div>

        <div className="human-card rounded-lg p-4 border-zinc-800 border-l-2 border-l-zinc-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Safety Stock Target</span>
          <div className="text-2xl font-extrabold text-zinc-300 mt-1 font-mono">
            {currentInv.safety_stock?.toLocaleString() || 800} <span className="text-xs font-normal text-zinc-400">units</span>
          </div>
          <div className="text-[11px] text-red-400 mt-1 font-mono font-bold">
            Deficit: -{Math.max(0, (currentInv.safety_stock || 800) - (currentInv.current_stock || 420))} units
          </div>
        </div>

        <div className="human-card rounded-lg p-4 border-zinc-800 border-l-2 border-l-red-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Inventory Coverage</span>
          <div className="text-2xl font-extrabold text-red-400 mt-1 font-mono">
            {currentInv.inventory_days} <span className="text-xs font-normal text-zinc-400">days</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Threshold: 21 days</div>
        </div>

        <div className="human-card rounded-lg p-4 border-zinc-800 border-l-2 border-l-red-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Stockout Threat</span>
          <div className="mt-2">
            <RiskBadge level={currentInv.stockout_risk} />
          </div>
          <div className="text-[11px] text-red-400 mt-2 font-mono font-bold">
            {forecastData?.stockout_predicted 
              ? `Exhaustion: Day ${forecastData?.estimated_stockout_day}`
              : 'Buffer Positive'}
          </div>
        </div>
      </div>

      {/* Stockout Warning Banner */}
      {currentInv.stockout_risk === 'Critical' && (
        <div className="human-card rounded-lg p-4 border-red-500/40 bg-red-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-red-300 text-xs uppercase tracking-wider">
                CRITICAL STOCKOUT WARNING &mdash; {selectedProd.product_name}
              </div>
              <p className="text-xs text-zinc-300 mt-0.5 font-normal">
                On-hand inventory ({currentInv.current_stock} units) exhausts at Day {forecastData?.estimated_stockout_day || 7} under surging {forecastHorizon}-day demand ({forecastData?.total_projected_demand || 907} units).
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToAnalysis('SUP001', selectedProductId)}
            className="px-4 py-2 rounded bg-white text-black hover:bg-zinc-200 font-bold text-xs transition-all whitespace-nowrap"
          >
            Trigger Mitigation Engine
          </button>
        </div>
      )}

      {/* Main Forecasting Composed Chart */}
      <div className="human-card rounded-lg p-6 border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Demand & Stock Projection ({forecastHorizon}-Day Horizon)
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-normal">Historical daily demand vs linear trend projection and remaining buffer stock</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded bg-zinc-600" /> Historical
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-2.5 h-2.5 rounded bg-white" /> Forecast Demand
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-3 h-0.5 bg-red-500" /> Projected Stock
            </span>
          </div>
        </div>

        <div className="h-64">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Calculating forecast...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#71717a" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px', fontSize: '11px' }}
                />
                <Bar yAxisId="left" dataKey="historicalDemand" fill="#3f3f46" radius={[2, 2, 0, 0]} name="Historical Demand" />
                <Bar yAxisId="left" dataKey="forecastDemand" fill="#ffffff" radius={[2, 2, 0, 0]} name="Forecast Demand" />
                <Line yAxisId="right" type="monotone" dataKey="projectedStock" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name="Projected Stock" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-zinc-800 text-xs">
          <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
            <span className="text-zinc-400 font-medium">Total Projected Demand ({forecastHorizon}d):</span>
            <div className="text-base font-bold text-white mt-0.5 font-mono">
              {forecastData?.total_projected_demand || 907} units
            </div>
          </div>
          <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
            <span className="text-zinc-400 font-medium">Safety Buffer Status:</span>
            <div className="text-base font-bold text-red-400 mt-0.5 font-mono">
              Depletion Alert Triggered
            </div>
          </div>
          <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
            <span className="text-zinc-400 font-medium">Model Calibration:</span>
            <div className="text-base font-bold text-zinc-200 mt-0.5 font-mono">
              Moving Avg + Seasonality
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Line Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="human-card rounded-lg p-6 border-zinc-700 max-w-lg w-full space-y-4 bg-[#121215]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-400" />
                Add New Product Line / Component
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white p-1 text-sm font-mono"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Product / Component Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen GPU Processing Blade"
                  value={newProduct.product_name}
                  onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
                  >
                    <option value="Semiconductors">Semiconductors</option>
                    <option value="Sensors">Sensors</option>
                    <option value="Control Systems">Control Systems</option>
                    <option value="Structural">Structural</option>
                    <option value="Optics">Optics</option>
                    <option value="Power Electronics">Power Electronics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Criticality</label>
                  <select
                    value={newProduct.criticality}
                    onChange={(e) => setNewProduct({ ...newProduct, criticality: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Unit Cost ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={newProduct.unit_cost}
                    onChange={(e) => setNewProduct({ ...newProduct, unit_cost: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Daily Consumption (Units)</label>
                  <input
                    type="number"
                    min="1"
                    value={newProduct.daily_consumption_rate}
                    onChange={(e) => setNewProduct({ ...newProduct, daily_consumption_rate: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Initial Stock (Units)</label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.initial_stock}
                    onChange={(e) => setNewProduct({ ...newProduct, initial_stock: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Safety Stock Target (Units)</label>
                  <input
                    type="number"
                    min="1"
                    value={newProduct.safety_stock}
                    onChange={(e) => setNewProduct({ ...newProduct, safety_stock: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-white text-black hover:bg-zinc-200 font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Save Product Line'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
