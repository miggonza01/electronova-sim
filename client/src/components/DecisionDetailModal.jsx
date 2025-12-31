// ============================================
// FILE: client/src/components/DecisionDetailModal.jsx
// PURPOSE: Modal de Historial Detallado (Con Proveedores y Transporte)
// ============================================

import React from 'react';

const DecisionDetailModal = ({ decision, onClose, products }) => {
  if (!decision) return null;

  const getProductName = (id) => {
    const p = products.find(prod => prod._id === id);
    return p ? p.name : 'Producto Desconocido';
  };

  // Estilos
  const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };

  const modalContentStyle = {
    backgroundColor: '#1E293B', width: '90%', maxWidth: '800px', maxHeight: '90vh',
    borderRadius: '0.75rem', border: '1px solid #334155', display: 'flex', flexDirection: 'column',
    color: '#F8FAFC', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  };

  const sectionTitleStyle = {
    color: '#3B82F6', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase',
    borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginTop: '1.5rem', marginBottom: '1rem'
  };

  const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' };
  const thStyle = { textAlign: 'left', color: '#64748B', padding: '0.5rem', borderBottom: '1px solid #334155' };
  const tdStyle = { padding: '0.5rem', borderBottom: '1px solid #334155' };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Detalle de Decisión</h2>
                <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Ronda #{decision.round} • Enviada el {new Date(decision.submittedAt).toLocaleString()}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        {/* BODY */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
            
            {/* 1. COMPRAS (Con detalle de Proveedor) */}
            <h3 style={{...sectionTitleStyle, marginTop: 0}}>🛒 Compras MP</h3>
            {decision.procurement.length > 0 ? (
                <table style={tableStyle}>
                    <thead><tr><th style={thStyle}>Material</th><th style={thStyle}>Proveedor</th><th style={thStyle}>Cantidad</th></tr></thead>
                    <tbody>
                        {decision.procurement.map((item, idx) => (
                            <tr key={idx}>
                                <td style={tdStyle}>{item.materialType}</td>
                                <td style={tdStyle}>
                                    <span style={{ 
                                        color: item.supplierType === 'local' ? '#10B981' : '#F59E0B',
                                        fontWeight: 'bold', fontSize: '0.75rem'
                                    }}>
                                        {item.supplierType === 'local' ? 'LOCAL (1 Ronda)' : 'IMPORTADO (2 Rondas)'}
                                    </span>
                                </td>
                                <td style={tdStyle}>{item.units.toLocaleString()} u</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p style={{color: '#64748B'}}>Sin compras.</p>}

            {/* 2. PRODUCCIÓN */}
            <h3 style={sectionTitleStyle}>🏭 Producción</h3>
            {decision.production.length > 0 ? (
                <table style={tableStyle}>
                    <thead><tr><th style={thStyle}>Producto</th><th style={thStyle}>Cantidad</th></tr></thead>
                    <tbody>
                        {decision.production.map((item, idx) => (
                            <tr key={idx}>
                                <td style={tdStyle}>{getProductName(item.productLine)}</td>
                                <td style={tdStyle}>{item.units.toLocaleString()} u</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p style={{color: '#64748B'}}>Sin producción planificada.</p>}

            {/* 3. LOGÍSTICA (Con detalle de Transporte) */}
            <h3 style={sectionTitleStyle}>🚚 Logística</h3>
            {decision.logistics.length > 0 ? (
                <table style={tableStyle}>
                    <thead><tr><th style={thStyle}>Producto</th><th style={thStyle}>Destino</th><th style={thStyle}>Método</th><th style={thStyle}>Cantidad</th></tr></thead>
                    <tbody>
                        {decision.logistics.map((item, idx) => (
                            <tr key={idx}>
                                <td style={tdStyle}>{getProductName(item.productLine)}</td>
                                <td style={tdStyle}>{item.destination}</td>
                                <td style={tdStyle}>
                                    {item.method === 'aereo' ? (
                                        <span style={{ color: '#3B82F6' }}>✈️ Aéreo (Rápido)</span>
                                    ) : (
                                        <span style={{ color: '#F59E0B' }}>🚛 Terrestre (Normal)</span>
                                    )}
                                </td>
                                <td style={tdStyle}>{item.units.toLocaleString()} u</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p style={{color: '#64748B'}}>Sin envíos.</p>}

            {/* 4. COMERCIAL */}
            <h3 style={sectionTitleStyle}>📈 Comercial</h3>
            {decision.commercial.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {decision.commercial.map((mkt, idx) => (
                        <div key={idx} style={{ backgroundColor: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{mkt.market}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.5rem' }}>Marketing: <span style={{ color: '#10B981' }}>${mkt.marketingBudget.toLocaleString()}</span></div>
                            {mkt.prices.map((p, pIdx) => (
                                <div key={pIdx} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '0.25rem' }}>
                                    <span>{getProductName(p.productLine)}</span>
                                    <span style={{ fontWeight: 'bold' }}>${p.price}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ) : <p style={{color: '#64748B'}}>Sin estrategia comercial.</p>}

        </div>

        {/* FOOTER */}
        <div style={{ padding: '1rem', borderTop: '1px solid #334155', textAlign: 'right' }}>
            <button 
                onClick={onClose}
                style={{ backgroundColor: '#3B82F6', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
                Cerrar
            </button>
        </div>

      </div>
    </div>
  );
};

export default DecisionDetailModal;