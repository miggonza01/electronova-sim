// ============================================
// FILE: client/src/pages/DecisionPageV2.jsx
// PURPOSE: Terminal de Decisiones (Restaurado)
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.v2.js';
import logo from '../assets/LogoElectroNova.png';

// Componentes
import ProductionTab from '../components/tabs/ProductionTab';
import ProcurementTab from '../components/tabs/ProcurementTab';
import LogisticsTab from '../components/tabs/LogisticsTab';
import CommercialTab from '../components/tabs/CommercialTab';
import ToolsTab from '../components/tabs/ToolsTab';
import DecisionSummary from '../components/DecisionSummary';
import { useGameSimulation } from '../hooks/useGameSimulation';

const DecisionPageV2 = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('procurement');
  
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [company, setCompany] = useState(null);
  
  const [decision, setDecision] = useState({
    production: [],
    procurement: [],
    logistics: [],
    commercial: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, matRes, profileRes] = await Promise.all([
            api.get('/products'),
            Promise.resolve({ data: { data: [ 
                { name: 'Alfa', baseCost: 15 }, 
                { name: 'Beta', baseCost: 25 }, 
                { name: 'Omega', baseCost: 5 } 
            ]}}), 
            api.get('/auth/profile')
        ]);

        setProducts(prodRes.data.data);
        setMaterials(matRes.data.data);
        setCompany(profileRes.data.company);

        try {
            const currentDecRes = await api.get('/decisions/current');
            if (currentDecRes.data.data) {
                setDecision(currentDecRes.data.data);
            }
        } catch (error) {
            console.log("Iniciando decisión en blanco.", error);
        }

      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const simulation = useGameSimulation(company, decision, products, materials);

  const updateDecisionSection = (section, newData) => {
    setDecision(prev => ({ ...prev, [section]: newData }));
  };

  const handleSave = async () => {
    if (!simulation.isValid) return alert("❌ Corrige los errores antes de enviar.");
    setSaving(true);
    try {
      await api.post('/decisions', decision);
      alert('✅ Decisión guardada correctamente.');
      navigate('/dashboard');
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-white bg-slate-900 min-h-screen">Cargando simulador...</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'procurement':
        return <ProcurementTab currentData={decision.procurement} onUpdate={(data) => updateDecisionSection('procurement', data)} simulation={simulation} />;
      case 'production':
        return <ProductionTab products={products} quota={company.productionQuota} currentData={decision.production} onUpdate={(data) => updateDecisionSection('production', data)} simulation={simulation} />;
      case 'logistics':
        return <LogisticsTab products={products} currentData={decision.logistics} onUpdate={(data) => updateDecisionSection('logistics', data)} simulation={simulation} />;
      case 'commercial':
        return <CommercialTab products={products} currentData={decision.commercial} onUpdate={(data) => updateDecisionSection('commercial', data)} simulation={simulation} />;
      case 'tools':
        return <ToolsTab company={company} />;
      default: return null;
    }
  };

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
        activeTab === id ? 'border-blue-500 text-blue-400 bg-slate-800' : 'border-transparent text-slate-400 hover:text-white'
      }`}
    >
      <span className="mr-2">{icon}</span> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-32 flex flex-col">
      <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 px-6 py-4 flex justify-between items-center shadow-lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={logo} alt="Logo" style={{ height: '32px' }} />
            <div>
                <h1 className="text-lg font-bold text-white leading-tight">Simulador de Estrategias</h1>
                <p className="text-xs text-slate-400">Ronda {company.currentRound} | {company.name}</p>
            </div>
        </div>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Salir</button>
      </header>

      <div className="px-6 mt-6 border-b border-slate-700 flex overflow-x-auto">
        <TabButton id="procurement" label="1. Compras" icon="🛒" />
        <TabButton id="production" label="2. Producción" icon="🏭" />
        <TabButton id="logistics" label="3. Logística" icon="✈️" />
        <TabButton id="commercial" label="4. Ventas" icon="💲" />
        <TabButton id="tools" label="5. Herramientas" icon="🛠️" />
      </div>

      <main className="p-6 max-w-5xl mx-auto w-full flex-grow">
        {renderTabContent()}
      </main>

      <footer style={{ textAlign: 'center', padding: '1rem', color: '#475569', fontSize: '0.75rem', marginBottom: '4rem' }}>
        © Maribel Pinheiro & Miguel González | Dic-2025
      </footer>

      <DecisionSummary simulation={simulation} onSave={handleSave} saving={saving} />
    </div>
  );
};

export default DecisionPageV2;