import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  AlertTriangle, 
  Boxes, 
  TrendingUp, 
  ArrowUpRight, 
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import KPICard from '../components/KPICard';
import RiskBadge from '../components/RiskBadge';
import { fetchSummary, fetchSuppliers } from '../services/api';

const RISK_DISTRIBUTION_DATA = [
  { name: 'Low Risk (0-30%)', value: 48, color: '#22c55e' },
  { name: 'Medium Risk (31-60%)', value: 32, color: '#eab308' },
  { name: 'High Risk (61-80%)', value: 14, color: '#f97316' },
  { name: 'Critical (>80%)', value: 6, color: '#ef4444' }
];

const TREND_DATA = [
  { month: 'Apr', baseline: 18, disrupted: 4 },
  { month: 'May', baseline: 22, disrupted: 6 },
  { month: 'Jun', baseline: 25, disrupted: 9 },
  { month: 'Jul', baseline: 20, disrupted: 7 },
  { month: 'Aug', baseline: 30, disrupted: 12 },
  { month: 'Sep', baseline: 36, disrupted: 17 }
];

export default function Dashboard({ onNavigateToAnalysis }) {
  const [summary, setSummary] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sumRes, supRes] = await Promise.all([
          fetchSummary(),
          fetchSuppliers()
        ]);
        setSummary(sumRes);
        setSuppliers(supRes || []);
      } catch (e) {
        console.error("Error loading dashboard data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="human-card rounded-lg p-4 sm:p-6 border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-400 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Active Monitoring Node
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Supply Chain Resilience Dashboard
          </h1>
          <p className="text-zinc-400 text-xs mt-1 max-w-2xl font-normal leading-relaxed">
            Multi-tier risk classification, SHAP tree attribution, and time-series inventory depletion forecasting.
          </p>
        </div>
        <button
          onClick={() => onNavigateToAnalysis('SUP001', 'P001')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded bg-white text-black hover:bg-zinc-200 font-bold text-xs transition-all flex-shrink-0"
        >
          <span>Launch Disruption Risk Engine</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>


      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Suppliers"
          value={summary ? "128" : "..."}
          subtitle="8 Direct Tier-1 Monitored"
          icon={Building2}
          statusIndicator="green"
          change="+4 QTD"
          changeType="positive"
        />
        <KPICard
          title="At-Risk Suppliers"
          value={summary ? "17" : "..."}
          subtitle="Delay Rate > 25%"
          icon={AlertTriangle}
          statusIndicator="yellow"
          change="3 Actionable"
          changeType="negative"
        />
        <KPICard
          title="Critical Disruptions"
          value={summary ? "5" : "..."}
          subtitle="Active Delayed Corridors"
          icon={AlertCircle}
          statusIndicator="red"
          change="High Port Lag"
          changeType="negative"
        />
        <KPICard
          title="Inventory Risk"
          value={summary ? `${summary.inventory_risk_percentage}%` : "23%"}
          subtitle="Stockout Threat <14 Days"
          icon={Boxes}
          statusIndicator="red"
          change="Buffer Low"
          changeType="negative"
        />
      </div>

      {/* Analytics Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="human-card rounded-lg p-5 border-zinc-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Network Risk Distribution
            </h3>
            <span className="text-[11px] text-zinc-400 font-mono">128 Nodes</span>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={RISK_DISTRIBUTION_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {RISK_DISTRIBUTION_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#121215" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px', fontSize: '11px' }}
                  itemStyle={{ color: '#ffffff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-zinc-800 text-xs">
            {RISK_DISTRIBUTION_DATA.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-zinc-400 text-[11px] truncate">{d.name}</span>
                <span className="font-mono text-white text-[11px] ml-auto font-bold">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6-Month Risk Trend Area Chart */}
        <div className="human-card rounded-lg p-5 border-zinc-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                6-Month Incident Frequency & Disruption Exposure
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-normal">Historical operational volume vs flagged disruptions</p>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-red-400 font-mono font-bold bg-red-950/60 border border-red-500/40 px-2 py-0.5 rounded">
              <TrendingUp className="w-3 h-3 text-red-400" /> +14% Volatility
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA}>
                <defs>
                  <linearGradient id="disruptedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#52525b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#52525b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="baseline" stroke="#a1a1aa" strokeWidth={1.5} fillOpacity={1} fill="url(#baselineGrad)" name="Baseline Shipments" />
                <Area type="monotone" dataKey="disrupted" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#disruptedGrad)" name="Flagged Disruptions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Supplier Ranking & Recent Disruption Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Ranking Table */}
        <div className="human-card rounded-lg p-5 border-zinc-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Supplier Exposure Matrix
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-normal">Ranked by delay probability, defect rate, and lead time variance</p>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">XGBoost Inference</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-bold text-[10px]">
                  <th className="pb-3">Supplier</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Reliability</th>
                  <th className="pb-3">Delay Rate</th>
                  <th className="pb-3">Lead Time</th>
                  <th className="pb-3">Risk Level</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {suppliers.slice(0, 8).map((s) => {
                  const calculatedScore = Math.round(((1 - (s.reliability || 0.85)) * 0.55 + (s.delay_rate || 0.1) * 0.45) * 100);
                  const score = Math.min(99, Math.max(10, calculatedScore));
                  const level = score > 75 ? 'Critical' : (score > 40 ? 'High' : (score > 20 ? 'Medium' : 'Low'));

                  return (
                    <tr key={s.supplier_id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-400 text-[11px]">{s.supplier_id}</span>
                          <span>{s.supplier_name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-zinc-400">{s.location}</td>
                      <td className="py-3 font-mono text-zinc-200">
                        {Math.round((s.reliability || 0.8) * 100)}%
                      </td>
                      <td className="py-3 font-mono font-bold text-red-400">
                        {Math.round((s.delay_rate || 0.1) * 100)}%
                      </td>
                      <td className="py-3 text-zinc-300 font-mono">{s.average_lead_time}d</td>
                      <td className="py-3">
                        <RiskBadge level={level} score={score} />
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onNavigateToAnalysis(s.supplier_id, 'P001')}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-semibold border border-zinc-700 transition-all inline-flex items-center gap-1"
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

        {/* Real-time Incident Alerts Panel */}
        <div className="human-card rounded-lg p-5 border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                Active Alerts Log
              </h3>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>

            <div className="space-y-3">
              {(summary?.recent_alerts || [
                { id: "ALT-101", severity: "CRITICAL", entity: "SUP001 (Global Components Ltd.)", message: "86% Disruption risk probability flagged due to delivery delays.", timestamp: "10m ago" },
                { id: "ALT-102", severity: "HIGH", entity: "P001 (Industrial Controller X1)", message: "Low inventory coverage (6.2 days) vs surging 14-day demand forecast.", timestamp: "25m ago" },
                { id: "ALT-103", severity: "MEDIUM", entity: "Route SHP-8091 (Shenzhen -> Chicago)", message: "Pacific maritime congestion risk elevated (82%).", timestamp: "1h ago" }
              ]).map((alert) => (
                <div 
                  key={alert.id}
                  className="p-3 rounded bg-zinc-950 border border-zinc-800/90 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <RiskBadge level={alert.severity} />
                    <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {alert.timestamp}
                    </span>
                  </div>
                  <div className="font-bold text-white text-xs mt-1.5">{alert.entity}</div>
                  <p className="text-zinc-400 mt-0.5 leading-relaxed text-[11px] font-normal">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800">
            <button
              onClick={() => onNavigateToAnalysis('SUP001', 'P001')}
              className="w-full py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
            >
              <span>Inspect Highest-Risk Node</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
