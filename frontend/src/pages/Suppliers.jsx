import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  ArrowUpRight, 
  Plus, 
  X, 
  ShieldAlert, 
  Truck, 
  Activity, 
  CheckCircle2, 
  Ship, 
  Plane, 
  Navigation, 
  Boxes 
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { fetchSuppliers, createSupplier } from '../services/api';
import { getProductsData, getSuppliersData } from '../utils/riskSynthesis';

export default function Suppliers({ onNavigateToAnalysis }) {
  const [suppliers, setSuppliers] = useState(() => getSuppliersData());
  const [products] = useState(() => getProductsData());
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  // Add Supplier Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    supplier_name: '',
    location: 'Pune, IN',
    destination: 'Chicago, US',
    tier: 'Tier 1',
    component_id: 'P001',
    transport_mode: 'Maritime',
    transit_corridor: 'Indian Ocean & Suez / Cape Maritime Corridor',
    average_lead_time: 18,
    lead_time_variance: 4.2,
    reliability: 0.76,
    delay_rate: 0.32,
    route_risk: 0.68,
    inventory_days: 7.5,
    current_stock: 450,
    capacity: 45000,
    country_risk: 0.35,
    hazard_factor: 'Red Sea Missile Threats & Port Berth Delays'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentlyAddedSup, setRecentlyAddedSup] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await fetchSuppliers();
      setSuppliers(data || getSuppliersData());
    }
    load();

    const handleUpdate = () => {
      setSuppliers(getSuppliersData());
    };
    window.addEventListener('supplysense-data-updated', handleUpdate);
    return () => window.removeEventListener('supplysense-data-updated', handleUpdate);
  }, []);

  const handleAddSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!newSupplier.supplier_name.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await createSupplier(newSupplier);
      const created = res?.supplier || newSupplier;
      setSuppliers(getSuppliersData());
      setRecentlyAddedSup(created);
      setShowAddModal(false);
      // Reset form
      setNewSupplier({
        supplier_name: '',
        location: 'Pune, IN',
        destination: 'Chicago, US',
        tier: 'Tier 1',
        component_id: 'P001',
        transport_mode: 'Maritime',
        transit_corridor: 'Indian Ocean & Suez / Cape Maritime Corridor',
        average_lead_time: 18,
        lead_time_variance: 4.2,
        reliability: 0.76,
        delay_rate: 0.32,
        route_risk: 0.68,
        inventory_days: 7.5,
        current_stock: 450,
        capacity: 45000,
        country_risk: 0.35,
        hazard_factor: 'Red Sea Missile Threats & Port Berth Delays'
      });
    } catch (err) {
      console.error('Failed to add supplier:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = suppliers.filter((s) => {
    const matchesSearch = s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.supplier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.location && s.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTier = tierFilter === 'ALL' || s.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Supplier Directory & Route Telemetry Index</h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-normal">Tracking lead times, destination corridors, reliability %, delay rates, and ML disruption diagnosis</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Add Supplier Button */}
          <button
            onClick={() => {
              setRecentlyAddedSup(null);
              setShowAddModal(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-colors font-mono cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Supplier & Route
          </button>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white font-medium"
          >
            <option value="ALL">All Tiers</option>
            <option value="Tier 1">Tier 1 (Direct)</option>
            <option value="Tier 2">Tier 2 (Sub-tier)</option>
            <option value="Tier 3">Tier 3 (Raw Materials)</option>
          </select>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name, ID, country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white font-medium"
            />
          </div>
        </div>
      </div>

      {/* Success Notification Banner when a supplier is added */}
      {recentlyAddedSup && (
        <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">
                Supplier Successfully Added: <span className="font-mono text-emerald-300">{recentlyAddedSup.supplier_name}</span> ({recentlyAddedSup.supplier_id})
              </div>
              <p className="text-[11px] text-zinc-300 mt-0.5">
                Configured route: {recentlyAddedSup.location} &rarr; {recentlyAddedSup.destination || 'Chicago, US'} ({recentlyAddedSup.transport_mode || 'Maritime'}) | Route Risk: {Math.round((recentlyAddedSup.route_risk || 0.45) * 100)}%
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToAnalysis(recentlyAddedSup.supplier_id, recentlyAddedSup.component_id || 'P001')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-mono transition-all flex-shrink-0"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Launch Risk Diagnosis & SHAP</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Supplier Grid / Table */}
      <div className="human-card rounded-lg border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Supplier / ID</th>
                <th className="py-3 px-4">Origin &rarr; Destination</th>
                <th className="py-3 px-4">Reliability</th>
                <th className="py-3 px-4">Delay Rate</th>
                <th className="py-3 px-4">Avg Lead Time</th>
                <th className="py-3 px-4">Route Risk</th>
                <th className="py-3 px-4">Risk Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {filtered.map((s) => {
                const calculatedScore = Math.round(
                  ((1 - (s.reliability != null ? s.reliability : 0.85)) * 0.55 + 
                   (s.delay_rate != null ? s.delay_rate : 0.1) * 0.45 +
                   (s.route_risk != null ? s.route_risk * 0.15 : 0.05)) * 100
                );
                const score = Math.min(99, Math.max(10, calculatedScore));
                const level = score > 75 ? 'Critical' : (score > 40 ? 'High' : (score > 20 ? 'Medium' : 'Low'));

                return (
                  <tr key={s.supplier_id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {s.supplier_name}
                        {s.is_custom && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-zinc-400 text-[11px]">{s.supplier_id} &bull; {s.tier}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-zinc-200 flex items-center gap-1 text-[11px] font-medium">
                        <MapPin className="w-3 h-3 text-zinc-400" />
                        <span>{s.location}</span>
                        <span className="text-zinc-500">&rarr;</span>
                        <span className="text-zinc-300">{s.destination || 'Chicago, US'}</span>
                      </div>
                      <div className="text-zinc-500 text-[10px] font-mono flex items-center gap-1 mt-0.5">
                        {s.transport_mode === 'Air Freight' ? <Plane className="w-3 h-3 text-cyan-400" /> : <Ship className="w-3 h-3 text-blue-400" />}
                        <span>{s.transport_mode || 'Maritime'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-200">
                      {Math.round((s.reliability != null ? s.reliability : 0.8) * 100)}%
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-red-400">
                      {Math.round((s.delay_rate != null ? s.delay_rate : 0.1) * 100)}%
                    </td>
                    <td className="py-3 px-4 text-zinc-300 font-mono">
                      {s.average_lead_time}d <span className="text-zinc-500 text-[11px]">(&plusmn;{s.lead_time_variance || 3}d)</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={(s.route_risk || 0.3) > 0.6 ? 'text-red-400 font-bold' : 'text-zinc-300'}>
                        {Math.round((s.route_risk != null ? s.route_risk : 0.45) * 100)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={level} score={score} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedSupplier(s)}
                        className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-medium transition-all"
                      >
                        Telemetry
                      </button>
                      <button
                        onClick={() => onNavigateToAnalysis(s.supplier_id, s.component_id || 'P001')}
                        className="px-2.5 py-1 rounded bg-white text-black hover:bg-zinc-200 text-[11px] font-bold transition-all inline-flex items-center gap-1 font-mono"
                      >
                        Analyze
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Modal Details Drawer */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="human-card rounded-lg p-6 border-zinc-700 max-w-lg w-full space-y-4 bg-[#121215]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-xs font-mono text-zinc-400">{selectedSupplier.supplier_id} &bull; {selectedSupplier.tier}</span>
                <h3 className="text-base font-bold text-white">{selectedSupplier.supplier_name}</h3>
              </div>
              <button 
                onClick={() => setSelectedSupplier(null)}
                className="text-zinc-400 hover:text-white px-2 py-1 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400">Reliability Score</span>
                <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">{Math.round((selectedSupplier.reliability || 0.8) * 100)}%</p>
              </div>
              <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400">Delay Rate</span>
                <p className="text-lg font-bold text-red-400 mt-1 font-mono">{Math.round((selectedSupplier.delay_rate || 0.15) * 100)}%</p>
              </div>
              <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400">Average Lead Time</span>
                <p className="text-lg font-bold text-white mt-1 font-mono">{selectedSupplier.average_lead_time} days</p>
              </div>
              <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400">Route Vulnerability</span>
                <p className="text-lg font-bold text-amber-400 mt-1 font-mono">{Math.round((selectedSupplier.route_risk || 0.45) * 100)}%</p>
              </div>
            </div>

            <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1 font-mono">
              <p><span className="text-zinc-500 font-semibold">Origin Location:</span> {selectedSupplier.location}</p>
              <p><span className="text-zinc-500 font-semibold">Destination Hub:</span> {selectedSupplier.destination || 'Chicago, US'}</p>
              <p><span className="text-zinc-500 font-semibold">Transport Mode:</span> {selectedSupplier.transport_mode || 'Maritime'}</p>
              <p><span className="text-zinc-500 font-semibold">Transit Corridor:</span> {selectedSupplier.transit_corridor || 'Global Transit Lane'}</p>
              {selectedSupplier.hazard_factor && (
                <p className="text-red-400 pt-1 border-t border-zinc-800">
                  <span className="text-red-500 font-semibold">Hazard Vector:</span> {selectedSupplier.hazard_factor}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  const id = selectedSupplier.supplier_id;
                  const prodId = selectedSupplier.component_id || 'P001';
                  setSelectedSupplier(null);
                  onNavigateToAnalysis(id, prodId);
                }}
                className="flex-1 py-2.5 rounded bg-white text-black hover:bg-zinc-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 font-mono"
              >
                <span>Launch Disruption Deep Dive & SHAP</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Comprehensive Add Supplier & Route Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="human-card rounded-lg p-6 border-zinc-700 max-w-2xl w-full space-y-4 bg-[#11141c] my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Register New Supplier, Destination Corridor & Telemetry
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-4 text-xs">
              
              {/* Section 1: Supplier Identification */}
              <div className="space-y-3 p-3.5 rounded bg-zinc-950/70 border border-zinc-800/80">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-zinc-400" />
                  1. Supplier Identity & Component Sourced
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Supplier Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tata Advanced Systems / Foxconn Precision"
                      value={newSupplier.supplier_name}
                      onChange={(e) => setNewSupplier({...newSupplier, supplier_name: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Tier Classification</label>
                    <select
                      value={newSupplier.tier}
                      onChange={(e) => setNewSupplier({...newSupplier, tier: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                    >
                      <option value="Tier 1">Tier 1 (Direct Integrator)</option>
                      <option value="Tier 2">Tier 2 (Sub-tier Assemblies)</option>
                      <option value="Tier 3">Tier 3 (Raw Materials)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Component / Part Number Supplied</label>
                  <select
                    value={newSupplier.component_id}
                    onChange={(e) => setNewSupplier({...newSupplier, component_id: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                  >
                    {products.map(p => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.product_id} — {p.product_name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 2: Route, Source, Destination & Mode */}
              <div className="space-y-3 p-3.5 rounded bg-zinc-950/70 border border-zinc-800/80">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  2. Route Logistics (Source &rarr; Destination Telematics)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Source / Origin (City, Country)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune, IN or Tokyo, JP"
                      value={newSupplier.location}
                      onChange={(e) => setNewSupplier({...newSupplier, location: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Destination Warehouse / DC</label>
                    <select
                      value={newSupplier.destination}
                      onChange={(e) => setNewSupplier({...newSupplier, destination: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                    >
                      <option value="Chicago, US">Central Hub Chicago (ORD)</option>
                      <option value="Newark, US">East Coast Port/Air DC (EWR)</option>
                      <option value="Reno, US">West Coast Automated DC (RNO)</option>
                      <option value="Dallas, US">South Inland Intermodal (DFW)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Transport Mode</label>
                    <select
                      value={newSupplier.transport_mode}
                      onChange={(e) => setNewSupplier({...newSupplier, transport_mode: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                    >
                      <option value="Maritime">Maritime (Ocean Freight)</option>
                      <option value="Air Freight">Air Freight (Expedited)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Route Vulnerability Risk (0.0–1.0)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      max="0.99"
                      value={newSupplier.route_risk}
                      onChange={(e) => setNewSupplier({...newSupplier, route_risk: Number(e.target.value)})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Transit Corridor Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Indo-Pacific Maritime Corridor"
                      value={newSupplier.transit_corridor}
                      onChange={(e) => setNewSupplier({...newSupplier, transit_corridor: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Operational Telemetry & Disaster Exposure */}
              <div className="space-y-3 p-3.5 rounded bg-zinc-950/70 border border-zinc-800/80">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-red-400" />
                  3. Operational Performance & Disruption Indicators (Fed into ML)
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Historical Delay Rate</label>
                    <input
                      type="number"
                      step="0.02"
                      min="0.01"
                      max="0.99"
                      value={newSupplier.delay_rate}
                      onChange={(e) => setNewSupplier({...newSupplier, delay_rate: Number(e.target.value)})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-mono font-bold text-red-400"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono">{Math.round(newSupplier.delay_rate * 100)}% delays</span>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">SLA Reliability</label>
                    <input
                      type="number"
                      step="0.02"
                      min="0.10"
                      max="0.99"
                      value={newSupplier.reliability}
                      onChange={(e) => setNewSupplier({...newSupplier, reliability: Number(e.target.value)})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-mono font-bold text-emerald-400"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono">{Math.round(newSupplier.reliability * 100)}% reliability</span>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Avg Lead Time (days)</label>
                    <input
                      type="number"
                      min="2"
                      max="90"
                      value={newSupplier.average_lead_time}
                      onChange={(e) => setNewSupplier({...newSupplier, average_lead_time: Number(e.target.value)})}
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
                      value={newSupplier.inventory_days}
                      onChange={(e) => setNewSupplier({...newSupplier, inventory_days: Number(e.target.value)})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Active External Hazard / Disruption Driver</label>
                  <input
                    type="text"
                    placeholder="e.g. Red Sea Missile Attacks, Typhoon Port Delays, Panama Canal Drought Cap, or Normal Operations"
                    value={newSupplier.hazard_factor}
                    onChange={(e) => setNewSupplier({...newSupplier, hazard_factor: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                  />
                </div>
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
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded bg-white text-black hover:bg-zinc-200 font-bold font-mono transition-colors shadow-sm"
                >
                  {isSubmitting ? 'Registering...' : 'Save & Compute Disruption Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
