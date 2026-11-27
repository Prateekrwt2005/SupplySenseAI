import React, { useState, useEffect } from 'react';
import { 
  Plane, 
  Ship, 
  ArrowRight, 
  AlertTriangle, 
  ShieldAlert, 
  Flame, 
  Plus, 
  X, 
  Map as MapIcon, 
  LayoutList, 
  Columns 
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import GlobalRouteMap from '../components/GlobalRouteMap';
import fallbackData from '../data/fallbackData.json';
import { fetchShipments, fetchDisruptions, createDisruptionEvent } from '../services/api';
import { getShipmentsData } from '../utils/riskSynthesis';

export default function ShipmentsRoutes({ onNavigateToAnalysis }) {
  const [shipments, setShipments] = useState(() => getShipmentsData());
  const [disruptions, setDisruptions] = useState(() => fallbackData.disruption_events || []);
  const [filterMode, setFilterMode] = useState('ALL');
  const [viewMode, setViewMode] = useState('UNIFIED'); // 'UNIFIED', 'MAP', 'TABLE'
  const [activeMapShipmentId, setActiveMapShipmentId] = useState(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'Geopolitical Conflict / War',
    severity: 'CRITICAL',
    region: 'Taiwan Strait & South China Sea',
    impact: '+7 to +10 Days Delay',
    affected_corridors: 'Asia-to-US Pacific Lane',
    affected_suppliers: 'SUP001, SUP002',
    description: ''
  });

  const loadData = async () => {
    try {
      const [sData, dData] = await Promise.all([
        fetchShipments(),
        fetchDisruptions()
      ]);
      if (sData && sData.length > 0) setShipments(sData);
      if (dData?.events && dData.events.length > 0) setDisruptions(dData.events);
    } catch (err) {
      console.warn('Using bundled shipments & disruption fallback data:', err);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      setShipments(getShipmentsData());
    };
    window.addEventListener('supplysense-data-updated', handleUpdate);
    return () => window.removeEventListener('supplysense-data-updated', handleUpdate);
  }, []);

  const handleAddEventSubmit = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...newEvent,
        affected_corridors: newEvent.affected_corridors.split(',').map(c => c.trim()),
        affected_suppliers: newEvent.affected_suppliers.split(',').map(s => s.trim())
      };
      const res = await createDisruptionEvent(payload);
      if (res && res.event) {
        setDisruptions(prev => [res.event, ...prev]);
      }
      setShowAddEventModal(false);
      setNewEvent({
        title: '',
        type: 'Geopolitical Conflict / War',
        severity: 'CRITICAL',
        region: 'Taiwan Strait & South China Sea',
        impact: '+7 to +10 Days Delay',
        affected_corridors: 'Asia-to-US Pacific Lane',
        affected_suppliers: 'SUP001, SUP002',
        description: ''
      });
    } catch (err) {
      console.error('Failed to create disruption event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = shipments.filter(
    (s) => filterMode === 'ALL' || s.transport_mode === filterMode
  );

  const handleFocusRouteOnMap = (shipmentId) => {
    setActiveMapShipmentId(shipmentId);
    if (viewMode === 'TABLE') {
      setViewMode('UNIFIED');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Active Shipments, Transit Corridors & Global Disruptions</h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-normal">Live telematics tracking maritime chokepoints, conflict zones, and disaster impacts</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded bg-zinc-950 p-1 border border-zinc-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('UNIFIED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-semibold ${
                viewMode === 'UNIFIED'
                  ? 'bg-zinc-800 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Unified View</span>
            </button>
            <button
              onClick={() => setViewMode('MAP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-semibold ${
                viewMode === 'MAP'
                  ? 'bg-zinc-800 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dark World Map</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-semibold ${
                viewMode === 'TABLE'
                  ? 'bg-zinc-800 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Feed & Tables</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddEventModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Report Route Disruption
          </button>

          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white font-medium"
          >
            <option value="ALL">All Transport Modes</option>
            <option value="Maritime">Maritime (Ocean)</option>
            <option value="Air Freight">Air Freight</option>
          </select>
        </div>
      </div>

      {/* ── Interactive Dark Theme World Route Map ── */}
      {(viewMode === 'UNIFIED' || viewMode === 'MAP') && (
        <GlobalRouteMap 
          shipments={shipments}
          onNavigateToAnalysis={onNavigateToAnalysis}
          activeShipmentId={activeMapShipmentId}
        />
      )}

      {/* ── Threat Feed & Tables ── */}
      {(viewMode === 'UNIFIED' || viewMode === 'TABLE') && (
        <>
          {/* Global Supply Line Threat Feed: Wars, Natural Disasters & Embargoes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  Live Geopolitical & Disaster Disruption Feed ({disruptions.length} Active Events)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-red-400 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded font-bold">
                THREAT POSTURE: ELEVATED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {disruptions.map((evt) => {
                const isCrit = evt.severity === 'CRITICAL';
                return (
                  <div 
                    key={evt.id}
                    className={`human-card rounded-lg p-4 border transition-all flex flex-col justify-between ${
                      isCrit ? 'border-red-500/50 bg-red-950/20' : 'border-amber-500/40 bg-amber-950/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {evt.type}
                        </span>
                        <RiskBadge level={evt.severity} />
                      </div>
                      <h4 className="font-bold text-white text-xs leading-snug">
                        {evt.title}
                      </h4>
                      <div className="text-[11px] font-semibold text-red-400 mt-1.5 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span>Impact: {evt.impact}</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] mt-2 leading-relaxed font-normal">
                        {evt.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                      <span>Region: {evt.region}</span>
                      <span className="text-zinc-300 font-semibold">{evt.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Corridor Highlights Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="human-card rounded-lg p-5 border-red-500/40 bg-red-950/30 flex items-start gap-4">
              <div className="p-2.5 rounded bg-red-950 border border-red-500/40 text-red-400">
                <Ship className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider font-mono">High Risk Lane</span>
                  <RiskBadge level="Critical" score={82} />
                </div>
                <h4 className="font-bold text-white text-xs">Trans-Pacific Maritime Corridor (Shenzhen &rarr; Chicago)</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                  Route SHP-8091 affected by West Coast port congestion & severe storm systems. Average delay: +5.0 days.
                </p>
              </div>
            </div>

            <div className="human-card rounded-lg p-5 border-emerald-500/40 bg-emerald-950/30 flex items-start gap-4">
              <div className="p-2.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                <Plane className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">Optimal Corridor</span>
                  <RiskBadge level="Low" score={22} />
                </div>
                <h4 className="font-bold text-white text-xs">East-Asia Air Corridor (Taipei &rarr; Newark)</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                  Route SHP-8092 operating within schedule parameters. Zero variance detected in last 14 departures.
                </p>
              </div>
            </div>
          </div>

          {/* Shipments Table */}
          <div className="human-card rounded-lg border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Shipment ID</th>
                    <th className="py-3 px-4">Supplier / Part</th>
                    <th className="py-3 px-4">Transit Lane (Origin &rarr; Dest)</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Expected Delivery</th>
                    <th className="py-3 px-4">Delay Days</th>
                    <th className="py-3 px-4">Route Risk</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {filtered.map((s) => {
                    const isDelayed = s.status === 'Delayed' || s.status === 'Severely Delayed';
                    const routeRiskScore = Math.round((s.route_risk || 0.3) * 100);
                    const riskLvl = routeRiskScore > 70 ? 'Critical' : (routeRiskScore > 40 ? 'Medium' : 'Low');

                    return (
                      <tr key={s.shipment_id} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {s.shipment_id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{s.supplier_id}</div>
                          <div className="text-zinc-400 text-[11px]">{s.product_id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-zinc-200">
                            <span>{s.origin}</span>
                            <ArrowRight className="w-3 h-3 text-zinc-500" />
                            <span>{s.destination}</span>
                          </div>
                          {s.disruption_cause && (
                            <div className="text-[10px] text-amber-400 font-mono mt-0.5 max-w-xs truncate" title={s.disruption_cause}>
                              &bull; {s.disruption_cause}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]">
                            {s.transport_mode === 'Maritime' ? <Ship className="w-3 h-3 text-zinc-400" /> : <Plane className="w-3 h-3 text-zinc-400" />}
                            {s.transport_mode}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-300">
                          {s.expected_delivery}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {s.delay_days > 0 ? (
                            <span className="text-red-400">+{s.delay_days} days</span>
                          ) : (
                            <span className="text-emerald-400">On Schedule</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <RiskBadge level={riskLvl} score={routeRiskScore} />
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            isDelayed 
                              ? 'bg-red-950/60 text-red-400 border-red-500/40' 
                              : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleFocusRouteOnMap(s.shipment_id)}
                            className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold transition-all border border-zinc-800"
                          >
                            Track on Map
                          </button>
                          <button
                            onClick={() => onNavigateToAnalysis(s.supplier_id, s.product_id)}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-semibold transition-all border border-zinc-700"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Report Disruption Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="human-card rounded-lg p-6 border-zinc-700 max-w-lg w-full space-y-4 bg-[#121215]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                Report Supply Line Disruption / Disaster
              </h3>
              <button 
                onClick={() => setShowAddEventModal(false)}
                className="text-zinc-400 hover:text-white p-1 text-sm font-mono"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEventSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Disruption Title / Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Strait of Hormuz Tanker Seizures & Maritime Blockade"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Disruption Category</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
                  >
                    <option value="Geopolitical Conflict / War">Geopolitical Conflict / War</option>
                    <option value="Natural Disaster / Storm">Natural Disaster / Storm</option>
                    <option value="Military Exercises & Embargo">Military Exercises & Embargo</option>
                    <option value="Severe Climate Disaster">Severe Climate Disaster</option>
                    <option value="Port Congestion / Labor Strike">Port Congestion / Labor Strike</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Threat Severity</label>
                  <select
                    value={newEvent.severity}
                    onChange={(e) => setNewEvent({ ...newEvent, severity: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Affected Geographic Region</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Persian Gulf & Red Sea"
                    value={newEvent.region}
                    onChange={(e) => setNewEvent({ ...newEvent, region: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Transit Impact Delay</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +10 to +14 Days Delay"
                    value={newEvent.impact}
                    onChange={(e) => setNewEvent({ ...newEvent, impact: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Impact Description & Supply Line Ramifications</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Detail the root cause (e.g., naval shelling, typhoon flooding, canal lock shutdown) and how it impedes container vessel movement."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Broadcast Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
