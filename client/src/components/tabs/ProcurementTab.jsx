// ============================================
// FILE: client/src/components/tabs/ProcurementTab.jsx
// PURPOSE: Compras con visualización exacta de consumo
// ============================================

import React from 'react';
import GuidanceCard from '../GuidanceCard';

const MATERIALS = ['Alfa', 'Beta', 'Omega'];

const ProcurementTab = ({ currentData, onUpdate, simulation }) => {

  const rules = [
    "Proveedor LOCAL: Llega en 1 ronda (Rápido). Costo +20%. Ética +5 pts.",
    "Proveedor IMPORTADO: Llega en 2 rondas (Lento). Costo Base. Sin ética.",
    "El stock proyectado considera: Lo que tienes - Lo que usas en Producción + Lo que compras."
  ];

  const getDataForMaterial = (matName) => {
    if (!currentData) return { units: 0, supplierType: 'local' };
    const item = currentData.find(d => d.materialType === matName);
    return item ? { units: item.units, supplierType: item.supplierType } : { units: 0, supplierType: 'local' };
  };

  const handleChange = (matName, field, value) => {
    let newData = [...(currentData || [])];
    const index = newData.findIndex(item => item.materialType === matName);
    const defaultEntry = { materialType: matName, units: 0, supplierType: 'local' };

    if (index >= 0) {
        newData[index] = { ...newData[index], [field]: value };
    } else {
        const newEntry = { ...defaultEntry, [field]: value };
        newData.push(newEntry);
    }
    onUpdate(newData);
  };

  const cardStyle = {
    backgroundColor: '#1E293B', padding: '1.5rem', borderRadius: '0.5rem',
    border: '1px solid #334155', color: '#F8FAFC'
  };

  return (
    <div>
      <GuidanceCard title="Guía de Abastecimiento" rules={rules} />

      {/* 2. RESUMEN DE STOCK DETALLADO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {MATERIALS.map((matName) => {
            // DATOS DIRECTOS DEL SIMULADOR
            const initial = simulation.initialState?.rawMaterials[matName] || 0;
            
            // Consumo calculado explícitamente en el hook según la decisión de producción
            const consumption = simulation.materialConsumption[matName] || 0;
            
            // Compras actuales en el formulario
            const purchased = getDataForMaterial(matName).units;
            
            // Stock final proyectado
            // Nota: Si el consumo excede lo disponible, el final podría ser negativo matemáticamente
            // pero el hook lo clampa a 0 en inventory.rawMaterials.
            // Para mostrar la matemática pura:
            const projected = initial - consumption + purchased;
            
            // Verificar déficit
            const deficit = simulation.errors.mpDeficit.find(d => d.material === matName);

            return (
                <div key={matName} className={`p-4 rounded border ${deficit ? 'bg-red-900/20 border-red-500' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="text-sm font-bold text-blue-400 mb-2 border-b border-slate-700 pb-1">{matName}</div>
                    
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Inicial:</span> <span>{initial.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-red-400 mb-1">
                        <span>Consumo Prod:</span> <span>-{consumption.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-400 mb-2">
                        <span>Compras:</span> <span>+{purchased.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm font-bold text-white border-t border-slate-600 pt-1">
                        <span>Disponible:</span> 
                        <span className={projected < 0 ? 'text-red-500' : 'text-white'}>
                            {projected < 0 ? 0 : projected.toLocaleString()} u
                        </span>
                    </div>
                    {projected < 0 && (
                        <div className="text-xs text-red-500 text-right mt-1 font-bold">
                            Faltan {Math.abs(projected).toLocaleString()} u
                        </div>
                    )}
                </div>
            );
        })}
      </div>

      {/* 3. TARJETAS DE COMPRA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MATERIALS.map(mat => {
            const { units, supplierType } = getDataForMaterial(mat);
            const baseCostMap = { 'Alfa': 15, 'Beta': 25, 'Omega': 5 };
            const baseCost = baseCostMap[mat];
            const multiplier = supplierType === 'local' ? 1.2 : 1.0;
            const estimatedUnitCost = baseCost * multiplier;
            const totalLineCost = units * estimatedUnitCost;

            return (
                <div key={mat} style={cardStyle}>
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-xl font-bold">{mat}</h4>
                        <div className="text-right">
                            <div className="text-xs text-slate-400">Costo Unit.</div>
                            <div className="text-emerald-400 font-mono">${estimatedUnitCost.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="flex bg-slate-900 p-1 rounded mb-4">
                        <button
                            onClick={() => handleChange(mat, 'supplierType', 'local')}
                            className={`flex-1 py-1 text-xs rounded transition-colors ${supplierType === 'local' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Local (1R)
                        </button>
                        <button
                            onClick={() => handleChange(mat, 'supplierType', 'imported')}
                            className={`flex-1 py-1 text-xs rounded transition-colors ${supplierType === 'imported' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Imp. (2R)
                        </button>
                    </div>

                    <label className="block text-xs text-slate-400 mb-1">Cantidad a Comprar</label>
                    <input 
                        type="number" min="0"
                        value={units || ''}
                        onChange={(e) => handleChange(mat, 'units', Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-bold focus:border-blue-500 outline-none mb-2"
                    />
                    
                    <div className="text-right text-xs text-slate-500 border-t border-slate-700 pt-2">
                        Total: <span className="text-slate-300">${totalLineCost.toLocaleString()}</span>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default ProcurementTab;