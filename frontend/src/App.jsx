import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import RiskAnalysis from './pages/RiskAnalysis';
import Suppliers from './pages/Suppliers';
import InventoryDemand from './pages/InventoryDemand';
import ShipmentsRoutes from './pages/ShipmentsRoutes';
import Recommendations from './pages/Recommendations';
import AIInsights from './pages/AIInsights';
import Architecture from './pages/Architecture';

const PAGE_TITLES = {
  dashboard: 'Executive Disruption Dashboard',
  'risk-analysis': 'ML Disruption & SHAP Risk Analysis',
  suppliers: 'Supplier Performance & Risk Directory',
  'inventory-demand': 'Inventory Buffer & Demand Forecast',
  'shipments-routes': 'Active Shipments & Route Vulnerability',
  recommendations: 'Resilience Recommendations & Mitigation',
  'ai-insights': 'AI Executive Copilot & Insights',
  architecture: 'System Architecture & ML Pipeline'
};

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedSupplierId, setSelectedSupplierId] = useState('SUP001');
  const [selectedProductId, setSelectedProductId] = useState('P001');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigateToAnalysis = (supId = 'SUP001', prodId = 'P001') => {
    setSelectedSupplierId(supId);
    setSelectedProductId(prodId);
    setActivePage('risk-analysis');
    setMobileMenuOpen(false);
  };

  const handleQuickAnalyze = () => {
    setIsAnalyzing(true);
    handleNavigateToAnalysis('SUP001', 'P001');
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 800);
  };

  const handleSelectPage = (pageId) => {
    setActivePage(pageId);
    setMobileMenuOpen(false);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigateToAnalysis={handleNavigateToAnalysis} 
          />
        );
      case 'risk-analysis':
        return (
          <RiskAnalysis 
            initialSupplierId={selectedSupplierId} 
            initialProductId={selectedProductId} 
          />
        );
      case 'suppliers':
        return (
          <Suppliers 
            onNavigateToAnalysis={handleNavigateToAnalysis} 
          />
        );
      case 'inventory-demand':
        return (
          <InventoryDemand 
            onNavigateToAnalysis={handleNavigateToAnalysis} 
          />
        );
      case 'shipments-routes':
        return (
          <ShipmentsRoutes 
            onNavigateToAnalysis={handleNavigateToAnalysis} 
          />
        );
      case 'recommendations':
        return (
          <Recommendations 
            onNavigateToAnalysis={handleNavigateToAnalysis} 
          />
        );
      case 'ai-insights':
        return (
          <AIInsights 
            onNavigateToAnalysis={handleNavigateToAnalysis} 
          />
        );
      case 'architecture':
        return <Architecture />;
      default:
        return <Dashboard onNavigateToAnalysis={handleNavigateToAnalysis} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#060b17] text-slate-100 font-sans relative">
      {/* Sidebar with Mobile Drawer support */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={handleSelectPage} 
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          activePageTitle={PAGE_TITLES[activePage] || 'SupplySenseAI'} 
          onQuickAnalyze={handleQuickAnalyze}
          isAnalyzing={isAnalyzing}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="p-3 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

