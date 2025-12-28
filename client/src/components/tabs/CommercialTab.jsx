// ============================================
// FILE: client/src/components/tabs/CommercialTab.jsx
// PURPOSE: Estrategia Comercial con validación financiera
// ============================================

import React from 'react';
import GuidanceCard from '../GuidanceCard';

const MARKETS = ['Novaterra', 'Solís', 'Veridia', 'Aurínea'];

const CommercialTab = ({ products, currentData, onUpdate, simulation }) => {

  const rules = [
    "PRECIO: Si es muy alto comparado con la competencia, perderás cuota de mercado.",
    "MARKETING: Aumenta la visibilidad de tu marca en esa plaza.",
    "El presupuesto de Marketing se paga INMEDIATAMENTE (descuenta Caja).",
    "Define un precio para cada producto que tengas disponible en esa plaza."
  ];

  // Helpers
  const getMarketData = (marketName) => {
    if (!currentData) return { marketingBudget: 0, prices: [] };
    return currentData.find(d => d.market === marketName) || { marketingBudget: 0, prices: [] };
  };

  const getPrice = (marketData, productId) => {
    if (!marketData.prices) return 0;
    const priceItem = marketData.prices.find(p => p.productLine === productId);
    return priceItem ? priceItem.price : 0;
  };

  // Manejadores
  const handleMarketingChange = (marketName, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    let newData = [...(currentData || [])];
    const index = newData.findIndex(d => d.market === marketName);

    if (index >= 0) {
        newData[index] = { ...newData[index], marketingBudget: numValue };
    } else {
        newData.push({ market: marketName, marketingBudget: numValue, prices: [] });
    }
    onUpdate(newData);
  };

  const handlePriceChange = (marketName, productId, value) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    let newData = [...(currentData || [])];
    let marketIndex = newData.findIndex(d => d.market === marketName);

    if (marketIndex === -1) {
        newData.push({ market: marketName, marketingBudget: 0, prices: [] });
        marketIndex = newData.length - 1;
    }

    let currentPrices = [...(newData[marketIndex].prices || [])];
    const priceIndex = currentPrices.findIndex(p => p.productLine === productId);

    if (priceIndex >= 0) {
        currentPrices[priceIndex] = { ...currentPrices[priceIndex], price: numValue };
    } else {
        currentPrices.push({ productLine: productId, price: numValue });
    }

    newData[marketIndex] = { ...newData[marketIndex], prices: currentPrices };
    onUpdate(newData);
  };

  // Estilos
  const cardStyle = {
    backgroundColor: '#1E293B', borderRadius: '0.5rem', border: '1px solid #334155',
    overflow: 'hidden', display: 'flex', flexDirection: 'column'
  };

  const headerStyle = {
    backgroundColor: '#0F172A', padding: '1rem', borderBottom: '1px solid #334155',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  };

  return (
    <div>
      <GuidanceCard title="Guía Comercial" rules={rules} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {MARKETS.map(market => {
            const marketData = getMarketData(market);
            
            return (
                <div key={market} style={cardStyle}>
                    {/* HEADER */}
                    <div style={headerStyle}>
                        <h3 style={{ color: '#F8FAFC', fontWeight: 'bold', fontSize: '1.1rem' }}>{market}</h3>
                        <div style={{ textAlign: 'right' }}>
                            <label style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', marginBottom: '0.2rem' }}>INVERSIÓN MARKETING</label>
                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: '0.25rem', border: '1px solid #475569', padding: '0 0.5rem' }}>
                                <span style={{ color: '#10B981', fontSize: '0.8rem' }}>$</span>
                                <input 
                                    type="number"
                                    value={marketData.marketingBudget || ''}
                                    onChange={(e) => handleMarketingChange(market, e.target.value)}
                                    style={{ 
                                        width: '80px', background: 'transparent', border: 'none', 
                                        color: 'white', textAlign: 'right', outline: 'none', padding: '0.25rem'
                                    }}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* BODY */}
                    <div style={{ padding: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', color: '#64748B', fontSize: '0.75rem', paddingBottom: '0.5rem' }}>PRODUCTO</th>
                                    <th style={{ textAlign: 'right', color: '#64748B', fontSize: '0.75rem', paddingBottom: '0.5rem' }}>PRECIO VENTA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product._id} style={{ borderTop: '1px solid #334155' }}>
                                        <td style={{ padding: '0.75rem 0', color: '#CBD5E1', fontSize: '0.9rem' }}>
                                            {product.name}
                                        </td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: '0.25rem', border: '1px solid #475569', padding: '0.25rem 0.5rem' }}>
                                                <span style={{ color: '#3B82F6', fontSize: '0.8rem', marginRight: '0.25rem' }}>$</span>
                                                <input 
                                                    type="number"
                                                    value={getPrice(marketData, product._id) || ''}
                                                    onChange={(e) => handlePriceChange(market, product._id, e.target.value)}
                                                    style={{ 
                                                        width: '70px', background: 'transparent', border: 'none', 
                                                        color: 'white', textAlign: 'right', outline: 'none', fontWeight: 'bold'
                                                    }}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default CommercialTab;