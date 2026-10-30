import React, { useState, useEffect } from 'react';
import { Search, MapPin, ArrowUpRight, Plus, X } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { fetchSuppliers, createSupplier } from '../services/api';

export default function Suppliers({ onNavigateToAnalysis }) {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  // Add Supplier Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    supplier_name: '',
    location: '',
    tier: 'Tier 1',
    average_lead_time: 14,
    reliability: 0.85,
    delay_rate: 0.15,
    capacity: 50000,
    country_risk: 0.25
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await fetchSuppliers();
      setSuppliers(data || []);
    }
    load();
  }, []);

  const handleAddSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!newSupplier.supplier_name.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await createSupplier(newSupplier);
      if (res && res.supplier) {
        setSuppliers(prev => [...prev, res.supplier]);
      }
      setShowAddModal(false);
      setNewSupplier({
        supplier_name: '',
        location: '',
        tier: 'Tier 1',
        average_lead_time: 14,
        reliability: 0.85,
        delay_rate: 0.15,
        capacity: 50000,
        country_risk: 0.25
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
                          s.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || s.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Supplier Directory & Performance Index</h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-normal">Tracking lead times, reliability %, delay rates, and disruption risk</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Add Supplier Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-colors font-mono cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Supplier
          </button>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white font-medium"
          >
            <option value="ALL">All Tiers</option>
            <option value="Tier 1">Tier 1</option>
            <option value="Tier 2">Tier 2</option>
            <option value="Tier 3">Tier 3</option>
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


      {/* Supplier Grid / Table */}
      <div className="human-card rounded-lg border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Supplier / ID</th>
                <th className="py-3 px-4">Tier & Location</th>
                <th className="py-3 px-4">Reliability</th>
                <th className="py-3 px-4">Delay Rate</th>
                <th className="py-3 px-4">Avg Lead Time</th>
                <th className="py-3 px-4">Defect Rate</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Risk Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {filtered.map((s) => {
                const isCrit = s.supplier_id === 'SUP001' || (s.delay_rate || 0) >= 0.35;
                const isHigh = !isCrit && (s.delay_rate || 0) >= 0.25;
                const level = isCrit ? 'Critical' : (isHigh ? 'High' : ((s.delay_rate || 0) > 0.12 ? 'Medium' : 'Low'));
                const score = isCrit ? 86 : Math.round((s.delay_rate || 0.1) * 100);

                return (
                  <tr key={s.supplier_id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{s.supplier_name}</div>
                      <div className="font-mono text-zinc-400 text-[11px]">{s.supplier_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-zinc-200">{s.tier}</div>
                      <div className="text-zinc-500 text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-500" /> {s.location}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-200">
                      {Math.round((s.reliability || 0.8) * 100)}%
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-red-400">
                      {Math.round((s.delay_rate || 0.1) * 100)}%
                    </td>
                    <td className="py-3 px-4 text-zinc-300 font-mono">
                      {s.average_lead_time}d <span className="text-zinc-500 text-[11px]">(&plusmn;{s.lead_time_variance}d)</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">
                      {((s.defect_rate || 0.01) * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-300">
                      {s.capacity ? s.capacity.toLocaleString() : '5,000'}/mo
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={level} score={score} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedSupplier(s)}
                        className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-medium transition-all"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => onNavigateToAnalysis(s.supplier_id, 'P001')}
                        className="px-2.5 py-1 rounded bg-white text-black hover:bg-zinc-200 text-[11px] font-bold transition-all inline-flex items-center gap-1"
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
                <span className="text-xs font-mono text-zinc-400">{selectedSupplier.supplier_id}</span>
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
                <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">{Math.round(selectedSupplier.reliability * 100)}%</p>
              </div>
              <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400">Delay Rate</span>
                <p className="text-lg font-bold text-red-400 mt-1 font-mono">{Math.round(selectedSupplier.delay_rate * 100)}%</p>
              </div>
              <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400">Average Lead Time</span>
                <p className="text-lg font-bold text-white mt-1 font-mono">{selectedSupplier.average_lead_time} days</p>
              </div>
              <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400">Monthly Capacity</span>
                <p className="text-lg font-bold text-white mt-1 font-mono">{selectedSupplier.capacity.toLocaleString()} units</p>
              </div>
            </div>

            <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
              <p><span className="text-zinc-400 font-semibold">Location:</span> {selectedSupplier.location}</p>
              <p className="mt-1"><span className="text-zinc-400 font-semibold">Country Risk Factor:</span> {selectedSupplier.country_risk}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  const id = selectedSupplier.supplier_id;
                  setSelectedSupplier(null);
                  onNavigateToAnalysis(id, 'P001');
                }}
                className="flex-1 py-2 rounded bg-white text-black hover:bg-zinc-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Launch Disruption Deep Dive</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="human-card rounded-lg p-6 border-zinc-700 max-w-md w-full space-y-4 bg-[#121215]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Add New Supplier Node</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Supplier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Advanced Systems"
                  value={newSupplier.supplier_name}
                  onChange={(e) => setNewSupplier({...newSupplier, supplier_name: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Location (City, Country)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune, IN"
                    value={newSupplier.location}
                    onChange={(e) => setNewSupplier({...newSupplier, location: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Tier</label>
                  <select
                    value={newSupplier.tier}
                    onChange={(e) => setNewSupplier({...newSupplier, tier: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-medium"
                  >
                    <option value="Tier 1">Tier 1 (Direct)</option>
                    <option value="Tier 2">Tier 2 (Sub-tier)</option>
                    <option value="Tier 3">Tier 3 (Raw Materials)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Average Lead Time (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={newSupplier.average_lead_time}
                    onChange={(e) => setNewSupplier({...newSupplier, average_lead_time: Number(e.target.value)})}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Reliability Rate (0.0 to 1.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={newSupplier.reliability}
                    onChange={(e) => setNewSupplier({...newSupplier, reliability: Number(e.target.value)})}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Historical Delay Rate (0.0 to 1.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={newSupplier.delay_rate}
                    onChange={(e) => setNewSupplier({...newSupplier, delay_rate: Number(e.target.value)})}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Monthly Capacity (units)</label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={newSupplier.capacity}
                    onChange={(e) => setNewSupplier({...newSupplier, capacity: Number(e.target.value)})}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-zinc-700 text-zinc-300 hover:text-white font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-white text-black hover:bg-zinc-200 font-bold font-mono transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Add to Directory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
