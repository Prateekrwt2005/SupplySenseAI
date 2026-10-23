import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Building2, 
  Boxes, 
  Truck, 
  Lightbulb, 
  Sparkles, 
  Layers,
  ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'risk-analysis', label: 'Risk Analysis', icon: Activity, badge: 'ML+SHAP' },
  { id: 'suppliers', label: 'Suppliers', icon: Building2 },
  { id: 'inventory-demand', label: 'Inventory & Demand', icon: Boxes },
  { id: 'shipments-routes', label: 'Shipments & Routes', icon: Truck },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  { id: 'ai-insights', label: 'AI Insights', icon: Sparkles, badge: 'LLM' },
  { id: 'architecture', label: 'Architecture', icon: Layers }
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="w-64 bg-[#0c0c0e] border-r border-zinc-800/90 flex flex-col justify-between h-screen sticky top-0 z-20">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              SUPPLYSENSE<span className="text-zinc-400 font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-800">AI</span>
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Supply-Chain Risk Engine</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>

        {/* Navigation List */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-zinc-200 text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-3.5 h-3.5 text-black" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-zinc-800 bg-[#09090b]">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-zinc-200">System Ready</span>
          </div>
          <span className="font-mono text-[10px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
            v1.0
          </span>
        </div>
        <p className="text-[11px] font-mono text-zinc-500 mt-1">XGBoost &bull; SHAP &bull; Llama-3.3</p>
      </div>
    </aside>
  );
}
