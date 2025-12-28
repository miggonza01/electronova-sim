// ============================================
// FILE: client/src/components/tabs/ProductionTab.jsx
// PURPOSE: Producción con Guía y Validación de MP
// ============================================

import React from 'react';
import GuidanceCard from '../GuidanceCard'; // <--- Importar Guía

const ProductionTab = ({ products, quota, currentData, onUpdate, simulation }) => {
  
  // Reglas para la Guía
  const rules = [
    "La capacidad de planta (6,000 u) se comparte entre todos los competidores activos.",
    "No puedes producir si no tienes Materia Prima (MP) disponible.",
    "El costo de producción se descuenta inmediatamente de tu Capital.",
    "Si produces más de lo que permite tu MP, verás una advertencia roja."
  ];

  const getUnitsForProduct = (productId) => {
    if (!currentData) return 0;
    const item = currentData.find(d => d.productLine === productId);
    return item ? item.units : 0;
  };

  const handleChange = (productId, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    let newData = [...(currentData || [])];
    const existingIndex = newData.findIndex(item => item.productLine === productId);

    if (existingIndex >= 0) {
        newData[existingIndex] = { ...newData[existingIndex], units: numValue };
    } else {
        newData.push({ productLine: productId, units: numValue });
    }
    onUpdate(newData);
  };

  const totalProduced = (currentData || []).reduce((sum, item) => sum + item.units, 0);
  const remainingQuota = quota - totalProduced;
  const isOverQuota = remainingQuota < 0;
  const usagePercent = quota > 0 ? Math.min(100, (totalProduced / quota) * 100) : 0;

  // Estilos
  const cardStyle = {
    backgroundColor: '#1E293B', padding: '1.5rem', borderRadius: '0.5rem',
    border: '1px solid #334155', marginBottom: '1.5rem', color: '#F8FAFC'
  };

  return (
    <div>
      {/* 1. GUÍA DE PRODUCCIÓN */}
      <GuidanceCard title="Guía de Producción" rules={rules} />

      {/* 2. RESUMEN DE INVENTARIO DE MP (En Tiempo Real) */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(simulation.inventory.rawMaterials).map(([matName, units]) => {
            // Detectar si falta material (buscando en los errores de simulación)
            const deficit = simulation.errors.mpDeficit.find(d => d.material === matName);
            
            return (
                <div key={matName} className={`p-4 rounded border ${deficit ? 'bg-red-900/20 border-red-500' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="text-xs text-slate-400 uppercase">Stock {matName}</div>
                    <div className={`text-xl font-bold ${deficit ? 'text-red-400' : 'text-white'}`}>
                        {units.toLocaleString()} u
                    </div>
                    {deficit && <div className="text-xs text-red-400 font-bold">Faltan {deficit.missing.toLocaleString()} u</div>}
                </div>
            );
        })}
      </div>

      {/* 3. CAPACIDAD */}
      <div style={cardStyle}>
        <div className="flex justify-between items-end mb-2">
            <div>
                <h3 className="text-sm text-slate-400 uppercase">Capacidad de Planta</h3>
                <div className={`text-2xl font-bold ${isOverQuota ? 'text-red-500' : 'text-white'}`}>
                    {totalProduced.toLocaleString()} / {quota.toLocaleString()} u
                </div>
            </div>
            <div className={isOverQuota ? 'text-red-500' : 'text-emerald-400'}>
                {isOverQuota ? '⚠️ EXCESO' : `${remainingQuota} u Disp.`}
            </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div className={`h-full ${isOverQuota ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${usagePercent}%` }}></div>
        </div>
      </div>

      {/* 4. INPUTS DE PRODUCTOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map(product => (
            <div key={product._id} style={{ ...cardStyle, marginBottom: 0 }}>
                <div className="flex justify-between mb-4">
                    <h4 className="font-bold text-lg">{product.name}</h4>
                    <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                        Costo: ${parseFloat(product.baseProductionCost).toFixed(0)}
                    </span>
                </div>
                
                <label className="block text-sm text-slate-400 mb-1">Producir (Unidades)</label>
                <input 
                    type="number" min="0"
                    value={getUnitsForProduct(product._id) || ''}
                    onChange={(e) => handleChange(product._id, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                />

                <div className="mt-4 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">Consume:</p>
                    <div className="flex gap-2 flex-wrap">
                        {product.rawMaterialRequirements.map((req, idx) => (
                            <span key={idx} className="text-xs bg-slate-800 px-2 py-1 rounded border border-slate-600">
                                {req.quantity} {req.materialType}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ProductionTab;