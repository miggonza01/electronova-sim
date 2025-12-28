// ============================================
// FILE: client/src/components/tabs/LogisticsTab.jsx
// PURPOSE: Logística con validación de Stock en Fábrica
// ============================================

import React from 'react';
import GuidanceCard from '../GuidanceCard';

const MARKETS = ['Novaterra', 'Solís', 'Veridia', 'Aurínea'];

const LogisticsTab = ({ products, currentData, onUpdate, simulation }) => {

  const rules = [
    "TERRESTRE: Costo $5/u. Llega en 2 Rondas.",
    "AÉREO: Costo $15/u. Llega en 1 Ronda (Inmediato).",
    "Solo puedes enviar el stock disponible en Fábrica (Inventario Inicial + Producción Actual).",
    "El costo de envío se paga inmediatamente."
  ];

  // Helper: Buscar envío existente
  const getShipment = (productId, marketName) => {
    if (!currentData) return { units: 0, method: 'terrestre' };
    const found = currentData.find(d => d.productLine === productId && d.destination === marketName);
    return found ? { units: found.units, method: found.method } : { units: 0, method: 'terrestre' };
  };

  // Manejador de cambios
  const handleChange = (productId, marketName, field, value) => {
    let newData = [...(currentData || [])];
    const index = newData.findIndex(d => d.productLine === productId && d.destination === marketName);
    const defaultEntry = { productLine: productId, destination: marketName, units: 0, method: 'terrestre' };

    if (index >= 0) {
        newData[index] = { ...newData[index], [field]: value };
    } else {
        const newEntry = { ...defaultEntry, [field]: value };
        newData.push(newEntry);
    }
    onUpdate(newData);
  };

  // Estilos
  const cardStyle = {
    backgroundColor: '#1E293B', padding: '1.5rem', borderRadius: '0.5rem',
    border: '1px solid #334155', color: '#F8FAFC', marginBottom: '1.5rem'
  };

  const tableHeaderStyle = {
    fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase',
    paddingBottom: '0.5rem', borderBottom: '1px solid #334155'
  };

  return (
    <div>
      <GuidanceCard title="Guía de Logística" rules={rules} />

      {products.map(product => {
        // 1. Calcular Stock Disponible (Simulado)
        // El hook useGameSimulation ya nos da el stock proyectado (Factory Stock)
        // Pero ojo: simulation.inventory.factoryStock es el REMANENTE.
        // Para saber el total disponible antes de envíos, tendríamos que sumar lo enviado.
        // Simplificación: Usamos el déficit reportado por simulation.errors.stockDeficit
        
        const stockRemanente = simulation.inventory.factoryStock[product._id] || 0;
        
        // Verificar si hay error de stock para este producto
        const deficitError = simulation.errors.stockDeficit.find(e => e.product === product._id);
        const isCritical = !!deficitError;

        return (
            <div key={product._id} style={{ ...cardStyle, border: isCritical ? '1px solid #EF4444' : '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{product.name}</h4>
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#334155', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', color: '#CBD5E1' }}>
                            ID: {product._id.substring(0,4)}...
                        </span>
                    </div>
                    
                    {/* Indicador de Stock */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>STOCK FÁBRICA DISPONIBLE</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: isCritical ? '#EF4444' : '#10B981' }}>
                            {stockRemanente.toLocaleString()} u
                        </div>
                        {isCritical && (
                            <div style={{ fontSize: '0.75rem', color: '#EF4444' }}>
                                Faltan {deficitError.missing.toLocaleString()} u
                            </div>
                        )}
                    </div>
                </div>

                {/* TABLA INTERNA */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 0.5fr', gap: '1rem', alignItems: 'center' }}>
                    <div style={tableHeaderStyle}>Destino</div>
                    <div style={tableHeaderStyle}>Cantidad</div>
                    <div style={tableHeaderStyle}>Método</div>
                    <div style={tableHeaderStyle}>Costo</div>

                    {MARKETS.map(market => {
                        const { units, method } = getShipment(product._id, market);
                        const cost = units * (method === 'aereo' ? 15 : 5);

                        return (
                            <React.Fragment key={market}>
                                <div style={{ fontWeight: '500', color: '#E2E8F0' }}>{market}</div>
                                
                                <input 
                                    type="number" min="0"
                                    value={units || ''}
                                    onChange={(e) => handleChange(product._id, market, 'units', Math.max(0, parseInt(e.target.value) || 0))}
                                    style={{
                                        width: '100%', padding: '0.5rem', backgroundColor: '#0F172A',
                                        border: '1px solid #475569', borderRadius: '0.25rem', color: 'white', textAlign: 'center'
                                    }}
                                    placeholder="0"
                                />

                                <select
                                    value={method}
                                    onChange={(e) => handleChange(product._id, market, 'method', e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.5rem',
                                        backgroundColor: method === 'aereo' ? '#1E3A8A' : '#0F172A',
                                        border: method === 'aereo' ? '1px solid #3B82F6' : '1px solid #475569',
                                        borderRadius: '0.25rem', color: 'white', cursor: 'pointer'
                                    }}
                                >
                                    <option value="terrestre">Terrestre ($5)</option>
                                    <option value="aereo">Aéreo ($15)</option>
                                </select>

                                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#64748B' }}>
                                    ${cost.toLocaleString()}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        );
      })}
    </div>
  );
};

export default LogisticsTab;