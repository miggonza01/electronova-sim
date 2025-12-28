// ============================================
// FILE: client/src/components/tabs/ToolsTab.jsx
// PURPOSE: Tienda de Información (URL Corregida)
// ============================================

import React, { useState } from 'react';
import api from '../../services/api.v2';

const ToolsTab = ({ company }) => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const COST = 15000; 

  const handleBuy = async () => {
    if (parseFloat(company?.cash || 0) < COST) {
        return alert("❌ Fondos insuficientes en caja para esta operación.");
    }

    if (!window.confirm(`¿Confirmas la compra del Estudio de Mercado por $${COST.toLocaleString()}? Se descontará inmediatamente.`)) return;
    
    setLoading(true);
    setError(null);

    try {
      // CORRECCIÓN: Quitamos '/api' porque ya está en la baseURL de axios
      const res = await api.post('/tools/market-research'); 
      setMarketData(res.data.data);
      alert("✅ Compra exitosa. Los datos han sido revelados.");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al comprar el estudio");
    } finally {
      setLoading(false);
    }
  };

  // Estilos
  const cardStyle = { backgroundColor: '#1E293B', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #334155', color: '#F8FAFC' };

  return (
    <div>
      {/* HEADER DE LA HERRAMIENTA */}
      <div style={{ ...cardStyle, marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3B82F6' }}>📊 Estudio de Mercado Detallado</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Revela la <strong>Sensibilidad al Precio</strong> y las <strong>Preferencias</strong> de cada plaza.
            </p>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
                Saldo disponible: <span style={{ color: '#10B981' }}>${parseFloat(company?.cash || 0).toLocaleString()}</span>
            </p>
        </div>
        
        {!marketData && (
            <button 
                onClick={handleBuy} 
                disabled={loading}
                style={{ 
                    backgroundColor: '#10B981', color: 'white', padding: '0.75rem 1.5rem', 
                    borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                    opacity: loading ? 0.7 : 1, boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                }}
            >
                {loading ? 'Procesando...' : `Comprar Reporte ($${COST.toLocaleString()})`}
            </button>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid #EF4444' }}>
            ⚠️ {error}
        </div>
      )}

      {/* RESULTADOS (SOLO SI SE COMPRÓ) */}
      {marketData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {marketData.map(market => (
                <div key={market._id} style={cardStyle}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        {market.name}
                    </h4>
                    
                    <div style={{ spaceY: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#94A3B8' }}>Potencial Base:</span>
                            <span style={{ fontWeight: 'bold' }}>{market.demandPotential.toLocaleString()} u</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#94A3B8' }}>Sensibilidad Precio:</span>
                            <span style={{ fontWeight: 'bold', color: market.priceSensitivity > 1 ? '#EF4444' : '#10B981' }}>
                                {market.priceSensitivity} (Elasticidad)
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: '#94A3B8' }}>Precio Máximo:</span>
                            <span style={{ fontWeight: 'bold', color: '#F59E0B' }}>${market.priceHardCap}</span>
                        </div>

                        {/* PREFERENCIAS (Barras) */}
                        <div style={{ marginTop: '1rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Preferencias del Consumidor</p>
                            
                            <PreferenceBar label="Precio" value={market.params.w_price} color="#10B981" />
                            <PreferenceBar label="Calidad" value={market.params.w_quality} color="#3B82F6" />
                            <PreferenceBar label="Marketing" value={market.params.w_marketing} color="#F59E0B" />
                            <PreferenceBar label="Ética" value={market.params.w_ethics} color="#8B5CF6" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

const PreferenceBar = ({ label, value, color }) => (
    <div style={{ marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.1rem' }}>
            <span>{label}</span>
            <span>{(value * 100).toFixed(0)}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: '#334155', borderRadius: '99px' }}>
            <div style={{ width: `${value * 100}%`, height: '100%', backgroundColor: color, borderRadius: '99px' }}></div>
        </div>
    </div>
);

export default ToolsTab;