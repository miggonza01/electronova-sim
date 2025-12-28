import React from 'react';

const DecisionSummary = ({ simulation, onSave, saving }) => {
  if (!simulation) return null;

  const { projectedCash, initialCash, breakdown, isValid, errors } = simulation;
  const percentUsed = Math.min(100, ((initialCash - projectedCash) / initialCash) * 100);

  // Formatear moneda
  const f = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4 shadow-2xl z-50">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* BARRA DE PRESUPUESTO */}
        <div className="flex-1 w-full">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Presupuesto Utilizado</span>
                <span className={projectedCash < 0 ? 'text-red-500 font-bold' : 'text-emerald-400'}>
                    {f(projectedCash)} Restante
                </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                    className={`h-full transition-all ${projectedCash < 0 ? 'bg-red-500' : 'bg-blue-500'}`} 
                    style={{ width: `${projectedCash < 0 ? 100 : percentUsed}%` }}
                ></div>
            </div>
            <div className="flex gap-3 mt-1 text-xs text-slate-500">
                <span>🏭 Prod: {f(breakdown.production)}</span>
                <span>🛒 Comp: {f(breakdown.procurement)}</span>
                <span>🚚 Log: {f(breakdown.logistics)}</span>
                <span>📈 Mkt: {f(breakdown.marketing)}</span>
            </div>
        </div>

        {/* ERRORES Y BOTÓN */}
        <div className="flex items-center gap-4">
            {!isValid && (
                <div className="text-red-400 text-xs font-bold text-right">
                    {errors.negativeCash && <div>⚠️ Capital Insuficiente</div>}
                    {errors.mpDeficit.length > 0 && <div>⚠️ Falta Materia Prima</div>}
                    {errors.stockDeficit.length > 0 && <div>⚠️ Falta Stock PT</div>}
                </div>
            )}
            
            <button
                onClick={onSave}
                disabled={!isValid || saving}
                className={`px-6 py-3 rounded font-bold text-white transition-all ${
                    !isValid || saving 
                    ? 'bg-slate-700 cursor-not-allowed text-slate-500' 
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg hover:shadow-emerald-500/20'
                }`}
            >
                {saving ? 'Guardando...' : 'CONFIRMAR DECISIONES'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default DecisionSummary;