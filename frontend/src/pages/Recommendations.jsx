import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowUpRight,
  Sliders,
  ChevronRight
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';

const DEFAULT_RECOMMENDATIONS = [
  {
    id: "REC-01",
    category: "SUPPLIER DIVERSIFICATION",
    title: "Shift 40% Procurement Volume to Nexis Microelectronics (SUP002)",
    reason: "Primary supplier Global Components Ltd. has elevated disruption probability (86%) with delay rate at 38%.",
    expected_benefit: "Mitigates single-point-of-failure risk, reduces lead time from 24d to 12d, and cuts variance by 75%.",
    priority: "Critical",
    action_type: "procurement_split",
    parameters: {
      primary: "Global Components Ltd. (40%)",
      backup: "Nexis Microelectronics (60%)",
      leadTimeReduction: "12 Days"
    }
  },
  {
    id: "REC-02",
    category: "INVENTORY ACTION",
    title: "Trigger Expedited Buffer Replenishment (+470 units) for Industrial Controller X1",
    reason: "Current inventory (420 units) covers only 6.2 days against projected 14-day demand of 890 units.",
    expected_benefit: "Prevents imminent stockout estimated at Day 8; protects critical assembly line continuity.",
    priority: "Critical",
    action_type: "emergency_reorder",
    parameters: {
      reorderUnits: 470,
      targetWarehouse: "Central Hub Chicago",
      reorderThreshold: "950 units"
    }
  },
  {
    id: "REC-03",
    category: "ROUTE ACTION",
    title: "Switch Critical Transit Leg SHP-8091 to Expedited Air Freight Corridor",
    reason: "Active Pacific maritime corridor from Shenzhen to Chicago has route risk score of 82% with port congestion.",
    expected_benefit: "Bypasses congested ocean terminals, shaving 5 days off transit lead time.",
    priority: "High",
    action_type: "reroute",
    parameters: {
      currentMode: "Maritime (Ocean)",
      proposedMode: "Air Freight Dedicated",
      delayReduction: "5 Days"
    }
  },
  {
    id: "REC-04",
    category: "GOVERNANCE & MONITORING",
    title: "Institute Daily Telematics Tracking & Enforce SLA Milestone Penalties with SUP006",
    reason: "Pacific Logistics & Assemblies performance variance (8.0d) exceeds enterprise tolerance threshold.",
    expected_benefit: "Enforces delivery adherence and unlocks real-time visibility into tier-1 manufacturing delays.",
    priority: "Medium",
    action_type: "sla_enforcement",
    parameters: {
      frequency: "Daily automated GPS sync",
      penaltyThreshold: ">3 days variance"
    }
  }
];

export default function Recommendations({ onNavigateToAnalysis }) {
  const [recommendations, setRecommendations] = useState(DEFAULT_RECOMMENDATIONS);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [appliedActions, setAppliedActions] = useState({});

  const handleApply = (id) => {
    setAppliedActions((prev) => ({
      ...prev,
      [id]: true
    }));
  };

  const filtered = recommendations.filter(
    (r) => selectedCategory === 'ALL' || r.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="human-card rounded-lg p-6 border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Resilience Directives & Mitigation Engine
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-normal">
            Derived from multi-criteria supplier allocation, buffer exhaustion modeling, and lane rerouting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white font-medium"
          >
            <option value="ALL">All Action Categories</option>
            <option value="SUPPLIER DIVERSIFICATION">Supplier Diversification</option>
            <option value="INVENTORY ACTION">Inventory Buffer Actions</option>
            <option value="ROUTE ACTION">Route & Transit Optimization</option>
            <option value="GOVERNANCE & MONITORING">Governance & SLA</option>
          </select>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((rec) => {
          const isApplied = appliedActions[rec.id];
          return (
            <div
              key={rec.id}
              className={`human-card rounded-lg p-6 border transition-all flex flex-col justify-between ${
                isApplied 
                  ? 'border-emerald-500/50 bg-emerald-950/20' 
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                    {rec.category}
                  </span>
                  <RiskBadge level={rec.priority} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {rec.title}
                  </h3>
                  <div className="mt-3 p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                    <p className="text-zinc-300">
                      <span className="font-semibold text-zinc-400">Data-Backed Rationale:</span> {rec.reason}
                    </p>
                    <p className="text-emerald-400 font-semibold pt-2 border-t border-zinc-800/80 font-mono">
                      <span className="text-zinc-400 font-sans font-normal">Expected ROI / Benefit:</span> {rec.expected_benefit}
                    </p>
                  </div>
                </div>

                {rec.parameters && (
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 font-mono">
                    {Object.entries(rec.parameters).map(([key, val]) => (
                      <div key={key} className="p-2 rounded bg-zinc-950 border border-zinc-800">
                        <span className="text-zinc-500 uppercase text-[10px]">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <div className="font-semibold text-white mt-0.5">{val}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => onNavigateToAnalysis('SUP001', 'P001')}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
                >
                  <span>Inspect Risk Node</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleApply(rec.id)}
                  className={`px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isApplied
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Directive Queued</span>
                    </>
                  ) : (
                    <>
                      <span>Apply Mitigation Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
