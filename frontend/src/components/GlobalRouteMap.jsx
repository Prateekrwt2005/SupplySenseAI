import React, { useState, useMemo } from 'react';
import { 
  Ship, 
  Plane, 
  AlertTriangle, 
  ShieldAlert, 
  Crosshair, 
  Eye, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Radio, 
  Layers, 
  ArrowRight, 
  Info,
  Compass,
  CheckCircle2,
  Anchor
} from 'lucide-react';
import RiskBadge from './RiskBadge';

// Equirectangular projection helper
// Lon [-180, 180] -> X [0, 1000]
// Lat [-90, 90]   -> Y [500, 0]
const project = (lat, lon) => {
  const x = ((lon + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
};

// Real geographic coordinates for all logistics hub nodes
const NODES = {
  'Shenzhen, CN':   { lat: 22.54, lon: 114.05, name: 'Shenzhen Hub (Yantian Port)', country: 'China', code: 'SZX' },
  'Taipei, TW':     { lat: 25.03, lon: 121.56, name: 'Taipei Cargo Hub (Taoyuan)', country: 'Taiwan', code: 'TPE' },
  'Dresden, DE':    { lat: 51.05, lon: 13.73,  name: 'Dresden Silicon Saxony', country: 'Germany', code: 'DRS' },
  'Penang, MY':     { lat: 5.41,  lon: 100.33, name: 'Penang Bayan Lepas Hub', country: 'Malaysia', code: 'PEN' },
  'Gothenburg, SE': { lat: 57.70, lon: 11.97,  name: 'Port of Gothenburg Hub', country: 'Sweden', code: 'GOT' },
  'Busan, KR':      { lat: 35.17, lon: 129.07, name: 'Busan Port Logistics Terminal', country: 'South Korea', code: 'PUS' },
  'São Paulo, BR':  { lat: -23.55, lon: -46.63, name: 'São Paulo Santos Terminal', country: 'Brazil', code: 'SAO' },
  'Dublin, IE':     { lat: 53.34, lon: -6.26,  name: 'Dublin Airport Freight Node', country: 'Ireland', code: 'DUB' },
  'Pune, IN':       { lat: 18.52, lon: 73.85,  name: 'Pune Industrial Logistics Node', country: 'India', code: 'PNQ' },
  'Mumbai, IN':     { lat: 18.92, lon: 72.83,  name: 'Mumbai JNPT Port Hub', country: 'India', code: 'BOM' },
  'Delhi, IN':      { lat: 28.61, lon: 77.20,  name: 'Delhi Logistics Hub', country: 'India', code: 'DEL' },
  'Bangalore, IN':  { lat: 12.97, lon: 77.59,  name: 'Bangalore Hardware Node', country: 'India', code: 'BLR' },
  'Tokyo, JP':      { lat: 35.67, lon: 139.65, name: 'Tokyo Port Logistics Hub', country: 'Japan', code: 'TYO' },
  'Seoul, KR':      { lat: 37.56, lon: 126.97, name: 'Seoul Incheon Logistics Hub', country: 'South Korea', code: 'ICN' },
  'Munich, DE':     { lat: 48.13, lon: 11.58,  name: 'Munich Bavarian High-Tech Hub', country: 'Germany', code: 'MUC' },
  'Frankfurt, DE':  { lat: 50.11, lon: 8.68,   name: 'Frankfurt Air Cargo Terminal', country: 'Germany', code: 'FRA' },
  'Singapore, SG':  { lat: 1.35,  lon: 103.81, name: 'Port of Singapore Terminal', country: 'Singapore', code: 'SIN' },
  'Shanghai, CN':   { lat: 31.23, lon: 121.47, name: 'Shanghai Yangshan Port', country: 'China', code: 'SHA' },

  // Destination Warehouses
  'Chicago, US':    { lat: 41.87, lon: -87.62, name: 'Chicago Central Logistics DC', country: 'United States', code: 'ORD' },
  'Newark, US':     { lat: 40.71, lon: -74.00, name: 'Newark East Coast Port/Air DC', country: 'United States', code: 'EWR' },
  'Reno, US':       { lat: 39.52, lon: -119.81, name: 'Reno West Coast Automated DC', country: 'United States', code: 'RNO' },
  'Dallas, US':     { lat: 32.77, lon: -96.79, name: 'Dallas South Inland Intermodal', country: 'United States', code: 'DFW' }
};

export const resolveNode = (locName, isDest = false) => {
  if (!locName) return isDest ? NODES['Chicago, US'] : NODES['Shenzhen, CN'];
  if (NODES[locName]) return NODES[locName];
  
  const lower = locName.toLowerCase();
  for (const [key, node] of Object.entries(NODES)) {
    if (lower.includes(key.toLowerCase().split(',')[0].trim())) {
      return node;
    }
  }

  if (lower.includes('india') || lower.includes('in') || lower.includes('pune') || lower.includes('mumbai') || lower.includes('delhi')) {
    return NODES['Pune, IN'];
  }
  if (lower.includes('japan') || lower.includes('jp') || lower.includes('tokyo')) return NODES['Tokyo, JP'];
  if (lower.includes('korea') || lower.includes('kr') || lower.includes('seoul')) return NODES['Seoul, KR'];
  if (lower.includes('germany') || lower.includes('de') || lower.includes('munich') || lower.includes('frankfurt')) return NODES['Dresden, DE'];
  if (lower.includes('singapore') || lower.includes('sg')) return NODES['Singapore, SG'];
  if (lower.includes('taiwan') || lower.includes('tw')) return NODES['Taipei, TW'];
  if (lower.includes('china') || lower.includes('cn')) return NODES['Shenzhen, CN'];
  if (lower.includes('sweden') || lower.includes('se')) return NODES['Gothenburg, SE'];
  if (lower.includes('brazil') || lower.includes('br')) return NODES['São Paulo, BR'];
  if (lower.includes('ireland') || lower.includes('ie')) return NODES['Dublin, IE'];

  return isDest ? NODES['Chicago, US'] : { lat: 21.0, lon: 79.0, name: locName, country: 'Global Hub', code: 'HUB' };
};

// Active Chokepoints and Geopolitical Conflict/Disaster Zones
const CHOKEPOINTS = [
  {
    id: 'CP-01',
    name: 'Bab el-Mandeb & Red Sea Corridor',
    lat: 12.8,
    lon: 43.3,
    type: 'WAR / MISSILE HAZARD',
    severity: 'CRITICAL',
    delay: '+12 to +16 Days',
    desc: 'Houthi anti-ship missile strikes forcing 85% of Asia-Europe traffic to reroute around Cape of Good Hope.'
  },
  {
    id: 'CP-02',
    name: 'Taiwan Strait & East China Sea',
    lat: 24.5,
    lon: 120.0,
    type: 'MILITARY EXERCISE / TYPHOON',
    severity: 'CRITICAL',
    delay: '+5 to +7 Days',
    desc: 'Naval blockade drills and active Pacific storm front causing port berth delays in Ningbo and Shenzhen.'
  },
  {
    id: 'CP-03',
    name: 'Panama Canal Locks',
    lat: 9.1,
    lon: -79.7,
    type: 'CLIMATE DROUGHT CAP',
    severity: 'HIGH',
    delay: '+6 to +9 Days',
    desc: 'Low Gatun Lake water levels capping daily vessel transits by 33%, bottlenecking Asia-to-US Gulf shipments.'
  },
  {
    id: 'CP-04',
    name: 'Strait of Malacca Chokepoint',
    lat: 2.2,
    lon: 102.1,
    type: 'MARITIME CONGESTION',
    severity: 'HIGH',
    delay: '+3 to +5 Days',
    desc: 'Heavy feeder vessel queue spillover from Singapore and Port Klang anchorages.'
  },
  {
    id: 'CP-05',
    name: 'Rhine River Low-Water Basin',
    lat: 50.1,
    lon: 8.2,
    type: 'INLAND LOW WATER',
    severity: 'MEDIUM',
    delay: '+2 to +3 Days',
    desc: 'Barge cargo capacity curtailed to 40% loading capacity; shifting heavy freight onto strained European rail.'
  }
];

// SVG Continents Simplified World Geo Paths in [0 0 1000 500] equirectangular projection
const WORLD_CONTINENTS = [
  // North America
  "M 115 72 L 150 65 L 210 55 L 285 58 L 310 82 L 295 125 L 280 145 L 295 165 L 280 185 L 255 195 L 250 215 L 235 220 L 225 210 L 210 185 L 175 175 L 145 155 L 135 125 L 110 95 Z",
  // Greenland
  "M 330 35 L 390 32 L 405 55 L 385 75 L 340 70 Z",
  // South America
  "M 265 228 L 295 225 L 340 240 L 375 270 L 350 340 L 310 395 L 285 365 L 275 300 L 255 255 Z",
  // Europe
  "M 470 120 L 515 90 L 550 85 L 565 110 L 530 135 L 515 155 L 485 150 L 465 135 Z",
  // Scandinavia
  "M 505 50 L 535 45 L 545 75 L 520 85 L 505 65 Z",
  // British Isles
  "M 460 95 L 475 90 L 480 110 L 465 118 Z",
  // Africa
  "M 475 165 L 565 165 L 615 210 L 610 260 L 575 335 L 535 345 L 490 280 L 465 205 Z",
  // Madagascar
  "M 605 310 L 620 315 L 610 345 L 598 335 Z",
  // Asia Main Landmass
  "M 565 85 L 660 60 L 780 50 L 890 60 L 910 95 L 860 130 L 840 185 L 780 230 L 730 220 L 690 190 L 635 180 L 585 130 Z",
  // India Subcontinent
  "M 675 185 L 725 185 L 710 240 L 680 230 Z",
  // Japan
  "M 885 135 L 905 130 L 900 160 L 880 165 Z",
  // Southeast Asia & Indonesia
  "M 760 235 L 800 235 L 830 270 L 780 275 Z M 815 285 L 860 280 L 850 305 L 805 300 Z",
  // Australia
  "M 820 325 L 895 320 L 920 355 L 890 405 L 825 395 L 805 350 Z",
  // New Zealand
  "M 935 390 L 950 390 L 940 420 L 930 415 Z"
];

export default function GlobalRouteMap({ 
  shipments = [], 
  onNavigateToAnalysis,
  activeShipmentId = null 
}) {
  const [selectedRouteId, setSelectedRouteId] = useState(activeShipmentId);
  const [filterMode, setFilterMode] = useState('ALL'); // ALL, CRITICAL, MARITIME, AIR
  const [showChokepoints, setShowChokepoints] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [animateParticles, setAnimateParticles] = useState(true);
  const [selectedChokepoint, setSelectedChokepoint] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = global, 1.4 = focused

  // Filter shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      if (filterMode === 'CRITICAL') return (s.route_risk || 0) >= 0.7 || s.delay_days >= 4;
      if (filterMode === 'MARITIME') return s.transport_mode === 'Maritime';
      if (filterMode === 'AIR') return s.transport_mode === 'Air Freight';
      return true;
    });
  }, [shipments, filterMode]);

  // Selected route data
  const selectedShipment = useMemo(() => {
    return shipments.find(s => s.shipment_id === selectedRouteId) || null;
  }, [shipments, selectedRouteId]);

  // Helper to compute bezier curve path between two coordinates
  const calculateRoutePath = (origNode, destNode, isMaritime = true) => {
    const o = project(origNode.lat, origNode.lon);
    const d = project(destNode.lat, destNode.lon);

    // If crossing the Pacific (e.g. Asia X ~ 800+ to US West/Midwest X ~ 200+)
    // Drawing an arc across the Pacific edge or direct great-circle curve
    if (o.x > 700 && d.x < 350) {
      // For visual clarity on standard equirectangular projection, 
      // we draw a graceful high-latitude trans-pacific arch
      const midX = (o.x + (d.x + 1000)) / 2;
      const normalizedMidX = midX > 1000 ? midX - 1000 : midX;
      // High-latitude great circle curve arc
      const arcHeight = isMaritime ? 65 : 85;
      const ctrlY = Math.min(o.y, d.y) - arcHeight;

      // Split into two seamless paths across boundary or curved arch:
      // Path A: from origin to right border (1000)
      // Path B: from left border (0) to destination
      const exitY = (o.y + d.y) / 2 - 40;
      const pathA = `M ${o.x} ${o.y} Q ${o.x + 80} ${ctrlY} 1000 ${exitY}`;
      const pathB = `M 0 ${exitY} Q ${d.x - 80} ${ctrlY} ${d.x} ${d.y}`;
      return { pathA, pathB, isSplit: true, origP: o, destP: d };
    }

    // Direct arc (Trans-Atlantic, Intra-Asia, etc.)
    const midX = (o.x + d.x) / 2;
    const curveOffset = isMaritime ? 45 : 60;
    const midY = Math.min(o.y, d.y) - curveOffset;
    const path = `M ${o.x} ${o.y} Q ${midX} ${midY} ${d.x} ${d.y}`;
    return { path, isSplit: false, origP: o, destP: d };
  };

  return (
    <div className="human-card rounded-lg border-zinc-800 bg-[#070b13] overflow-hidden relative shadow-2xl">
      {/* ── Top Command Bar ── */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              Global Maritime & Air Transit Telematics (Dark World Map)
            </h3>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Real-time multi-echelon corridor telemetry tracking geopolitical chokepoints and route risk vectors
          </p>
        </div>

        {/* Filter & Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Quick Corridor Filter Pills */}
          <div className="inline-flex rounded bg-zinc-900 p-0.5 border border-zinc-800 text-[11px] font-mono">
            {[
              { id: 'ALL', label: 'All Corridors' },
              { id: 'CRITICAL', label: 'Critical Risk' },
              { id: 'MARITIME', label: 'Maritime (Ocean)' },
              { id: 'AIR', label: 'Air Freight' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id)}
                className={`px-2.5 py-1 rounded transition-all font-semibold ${
                  filterMode === tab.id
                    ? 'bg-zinc-800 text-white shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Layer toggles */}
          <button
            onClick={() => setShowChokepoints(!showChokepoints)}
            className={`px-2.5 py-1 rounded border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
              showChokepoints
                ? 'bg-red-950/40 border-red-500/50 text-red-300 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
            title="Toggle Conflict & Hazard Chokepoints"
          >
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span>Chokepoints</span>
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2.5 py-1 rounded border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
              showLabels
                ? 'bg-zinc-800 border-zinc-600 text-white font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
            title="Toggle Node & Port Labels"
          >
            <Layers className="w-3 h-3" />
            <span>Labels</span>
          </button>

          <button
            onClick={() => setAnimateParticles(!animateParticles)}
            className={`px-2.5 py-1 rounded border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
              animateParticles
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
            title="Toggle Live Cargo Pulse Animation"
          >
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>Pulse</span>
          </button>

          <button
            onClick={() => setZoomLevel(zoomLevel === 1 ? 1.35 : 1)}
            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-xs"
            title={zoomLevel === 1 ? 'Focus Map' : 'Reset View'}
          >
            {zoomLevel === 1 ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Interactive SVG Map Container ── */}
      <div className="relative w-full overflow-hidden bg-[#070b13] select-none">
        <svg
          viewBox={zoomLevel === 1 ? "0 0 1000 500" : "150 50 700 350"}
          className="w-full h-auto max-h-[580px] transition-all duration-500 ease-out"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, #0c121e 0%, #060910 100%)' }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="darkGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#131a29" strokeWidth="0.75" strokeDasharray="2,2" />
            </pattern>

            {/* Glowing filters for route risk lines */}
            <filter id="glowCritical" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glowLow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Pulsing Animations */}
            <style>{`
              @keyframes dashFlow {
                to { stroke-dashoffset: -40; }
              }
              @keyframes pulseRing {
                0% { r: 5px; opacity: 1; }
                100% { r: 18px; opacity: 0; }
              }
              @keyframes cargoFloat {
                0% { offset-distance: 0%; }
                100% { offset-distance: 100%; }
              }
              .route-dash-crit {
                stroke-dasharray: 6, 6;
                animation: dashFlow 1.8s linear infinite;
              }
              .route-dash-norm {
                stroke-dasharray: 4, 4;
                animation: dashFlow 2.8s linear infinite;
              }
            `}</style>
          </defs>

          {/* Background Grid & Equator / Tropic Reference Lines */}
          <rect width="1000" height="500" fill="url(#darkGrid)" />
          {/* Equator */}
          <line x1="0" y1="250" x2="1000" y2="250" stroke="#162033" strokeWidth="1" strokeDasharray="4,4" />
          {/* Prime Meridian */}
          <line x1="500" y1="0" x2="500" y2="500" stroke="#162033" strokeWidth="1" strokeDasharray="4,4" />

          {/* ── Continents Geometry (Sleek Dark Slate / Charcoal) ── */}
          <g id="worldContinents" className="transition-colors duration-300">
            {WORLD_CONTINENTS.map((pathD, idx) => (
              <path
                key={idx}
                d={pathD}
                fill="#161c28"
                stroke="#252f44"
                strokeWidth="1.2"
                strokeLinejoin="round"
                className="hover:fill-[#1b2333] transition-colors duration-200"
              />
            ))}
          </g>

          {/* ── Active Chokepoints / Geopolitical Hazard Zones ── */}
          {showChokepoints && (
            <g id="chokepointsLayer">
              {CHOKEPOINTS.map(cp => {
                const pt = project(cp.lat, cp.lon);
                const isCrit = cp.severity === 'CRITICAL';
                return (
                  <g 
                    key={cp.id} 
                    className="cursor-pointer group"
                    onClick={() => setSelectedChokepoint(cp)}
                  >
                    {/* Pulsing Warning Ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="7"
                      fill={isCrit ? '#ef4444' : '#f59e0b'}
                      fillOpacity="0.25"
                      stroke={isCrit ? '#ef4444' : '#f59e0b'}
                      strokeWidth="1"
                    >
                      <animate
                        attributeName="r"
                        values="7;18;7"
                        dur={isCrit ? "2s" : "3s"}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-opacity"
                        values="0.9;0.1;0.9"
                        dur={isCrit ? "2s" : "3s"}
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Center Icon Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill={isCrit ? '#dc2626' : '#d97706'}
                      stroke="#ffffff"
                      strokeWidth="1"
                    />

                    {/* Chokepoint Label */}
                    {showLabels && (
                      <g transform={`translate(${pt.x + 8}, ${pt.y + 3})`}>
                        <rect
                          x="0"
                          y="-9"
                          width={cp.name.length * 5.2 + 8}
                          height="14"
                          rx="2"
                          fill="#090d16"
                          fillOpacity="0.85"
                          stroke={isCrit ? '#7f1d1d' : '#78350f'}
                          strokeWidth="0.75"
                        />
                        <text
                          x="4"
                          y="1.5"
                          fill={isCrit ? '#fca5a5' : '#fde68a'}
                          fontSize="7.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {cp.name}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* ── Transit Route Arcs ── */}
          <g id="routesLayer">
            {filteredShipments.map(s => {
              const orig = resolveNode(s.origin, false);
              const dest = resolveNode(s.destination, true);
              if (!orig || !dest) return null;

              const isSelected = selectedRouteId === s.shipment_id;
              const isMaritime = s.transport_mode === 'Maritime';
              const routeCalc = calculateRoutePath(orig, dest, isMaritime);
              const routeRisk = s.route_risk || 0.3;
              const isCrit = routeRisk >= 0.7 || s.delay_days >= 4;
              const isModerate = routeRisk >= 0.35 && !isCrit;

              const strokeColor = isCrit ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';
              const glowFilter = isCrit ? 'url(#glowCritical)' : 'url(#glowLow)';
              const strokeWidth = isSelected ? 3.5 : (isCrit ? 2.5 : 1.8);
              const opacity = selectedRouteId && !isSelected ? 0.35 : 0.95;

              return (
                <g 
                  key={s.shipment_id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedRouteId(isSelected ? null : s.shipment_id)}
                >
                  {/* Thick Invisible Hover Hit-Zone */}
                  {routeCalc.isSplit ? (
                    <>
                      <path d={routeCalc.pathA} fill="none" stroke="transparent" strokeWidth="18" />
                      <path d={routeCalc.pathB} fill="none" stroke="transparent" strokeWidth="18" />
                      {/* Visible Arcs */}
                      <path
                        d={routeCalc.pathA}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeOpacity={opacity}
                        filter={glowFilter}
                        className={animateParticles ? (isCrit ? 'route-dash-crit' : 'route-dash-norm') : ''}
                      />
                      <path
                        d={routeCalc.pathB}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeOpacity={opacity}
                        filter={glowFilter}
                        className={animateParticles ? (isCrit ? 'route-dash-crit' : 'route-dash-norm') : ''}
                      />
                    </>
                  ) : (
                    <>
                      <path d={routeCalc.path} fill="none" stroke="transparent" strokeWidth="18" />
                      <path
                        d={routeCalc.path}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeOpacity={opacity}
                        filter={glowFilter}
                        className={animateParticles ? (isCrit ? 'route-dash-crit' : 'route-dash-norm') : ''}
                      />
                    </>
                  )}
                </g>
              );
            })}
          </g>

          {/* ── Logistics Hub Nodes (Origin Ports & Destination DCs) ── */}
          <g id="nodesLayer">
            {Object.entries(NODES).map(([key, node]) => {
              const pt = project(node.lat, node.lon);
              const isDest = key.includes('Chicago') || key.includes('Newark') || key.includes('Reno') || key.includes('Dallas');

              return (
                <g key={key} className="cursor-pointer group">
                  {/* Outer Pulsing Hub Halo */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isDest ? 7 : 5.5}
                    fill={isDest ? '#0284c7' : '#10b981'}
                    fillOpacity="0.2"
                    stroke={isDest ? '#38bdf8' : '#34d399'}
                    strokeWidth="0.8"
                  />

                  {/* Node Core */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isDest ? 4 : 3.2}
                    fill={isDest ? '#38bdf8' : '#10b981'}
                    stroke="#ffffff"
                    strokeWidth="1"
                  />

                  {/* Hub Label */}
                  {showLabels && (
                    <g transform={`translate(${pt.x}, ${pt.y - (isDest ? 8 : 7)})`}>
                      <text
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="7"
                        fontFamily="monospace"
                        fontWeight="bold"
                        className="drop-shadow-md select-none"
                      >
                        {node.code}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* ── Map Legend & Telemetry Overlay (Bottom Left) ── */}
        <div className="absolute bottom-3 left-3 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 p-3 rounded text-[11px] font-mono space-y-1.5 shadow-lg max-w-xs pointer-events-auto">
          <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center justify-between pb-1 border-b border-zinc-800">
            <span>Corridor Risk Vector</span>
            <span className="text-zinc-500">{filteredShipments.length} Active Lanes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span className="text-zinc-200 font-semibold">Critical Risk / Severely Delayed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-zinc-300 font-semibold">Moderate Exposure / Congested</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-zinc-400">Low Risk / On-Schedule Air & Ocean</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80 text-[10px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Pulsing Hotspots = Conflict / Chokepoint Alerts</span>
          </div>
        </div>

        {/* ── Active Route Telemetry Card (Bottom Right / Side Popover) ── */}
        {selectedShipment && (
          <div className="absolute top-3 right-3 sm:w-80 bg-zinc-950/95 backdrop-blur-md border border-zinc-700/80 p-4 rounded-lg shadow-2xl space-y-3 z-10 animate-in fade-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white">{selectedShipment.shipment_id}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono">
                  {selectedShipment.transport_mode}
                </span>
              </div>
              <button
                onClick={() => setSelectedRouteId(null)}
                className="text-zinc-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            {/* Corridor Origin -> Dest */}
            <div>
              <div className="text-[10px] uppercase font-mono text-zinc-400 font-bold">Transit Corridor</div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span>{selectedShipment.origin}</span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
                <span>{selectedShipment.destination}</span>
              </div>
            </div>

            {/* Risk & Delay Status */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Route Risk:</span>
                <span className={`font-bold ${(selectedShipment.route_risk || 0) >= 0.7 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {Math.round((selectedShipment.route_risk || 0.3) * 100)}% ({selectedShipment.status})
                </span>
              </div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Schedule Variance:</span>
                <span className={`font-bold ${selectedShipment.delay_days > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedShipment.delay_days > 0 ? `+${selectedShipment.delay_days} Days Delay` : 'On Schedule'}
                </span>
              </div>
            </div>

            {/* Cause / Intelligence */}
            {selectedShipment.disruption_cause && (
              <div className="text-[11px] p-2.5 rounded bg-red-950/30 border border-red-500/40 text-red-200 leading-snug">
                <div className="font-bold text-[10px] uppercase font-mono text-red-400 flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  Disruption Driver
                </div>
                {selectedShipment.disruption_cause}
              </div>
            )}

            {/* Action Button */}
            {onNavigateToAnalysis && (
              <button
                onClick={() => onNavigateToAnalysis(selectedShipment.supplier_id, selectedShipment.product_id)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all"
              >
                <span>Inspect Node Disruption Model</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* ── Chokepoint Details Modal / Banner ── */}
        {selectedChokepoint && (
          <div className="absolute top-3 left-3 sm:w-84 bg-zinc-950/95 backdrop-blur-md border border-red-500/60 p-4 rounded-lg shadow-2xl space-y-2.5 z-10 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
              <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/40">
                {selectedChokepoint.type}
              </span>
              <button
                onClick={() => setSelectedChokepoint(null)}
                className="text-zinc-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
            <h4 className="font-bold text-white text-xs leading-snug">
              {selectedChokepoint.name}
            </h4>
            <p className="text-[11px] text-zinc-300 leading-relaxed font-normal">
              {selectedChokepoint.desc}
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-red-400 border-t border-zinc-800 font-bold">
              <span>Transit Penalty:</span>
              <span>{selectedChokepoint.delay}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
