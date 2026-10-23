import React, { useState, useEffect } from 'react';
import { Plane, Ship, ArrowRight } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { fetchShipments } from '../services/api';

export default function ShipmentsRoutes({ onNavigateToAnalysis }) {
  const [shipments, setShipments] = useState([]);
  const [filterMode, setFilterMode] = useState('ALL');

  useEffect(() => {
    async function load() {
      const data = await fetchShipments();
      setShipments(data || []);
    }
    load();
  }, []);

  const filtered = shipments.filter(
    (s) => filterMode === 'ALL' || s.transport_mode === filterMode
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Active Shipments & Transit Corridors</h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-normal">Tracking maritime lanes, air freight corridors, and port delay probabilities</p>
        </div>

        <div className="flex items-center gap-3">
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
                <th className="py-3 px-4 text-right">Action</th>
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
                    <td className="py-3 px-4 text-right">
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
    </div>
  );
}
