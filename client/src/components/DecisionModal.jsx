// client/src/components/DecisionModal.jsx
import { useState } from 'react'; // useEffect ya no es necesario para resetear, pero lo dejamos por si acaso
import { X, DollarSign, Megaphone, Factory, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import decisionService from '../services/decisionService';

const DecisionModal = ({ isOpen, onClose, companyData, onSuccess }) => {
  
  // --- ESTADOS DEL FORMULARIO ---
  // Inicializamos con valores vacíos
  const [price, setPrice] = useState('');
  const [marketing, setMarketing] = useState('');
  const [productionUnits, setProductionUnits] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const PRODUCTION_COST_PER_UNIT = 50.00; 

  // --- CORRECCIÓN: ELIMINAMOS EL USEEFFECT CONFLICTIVO ---
  // Ya no reseteamos automáticamente al abrir.
  // Si quisieras que el formulario aparezca limpio cada vez, 
  // la mejor práctica es que el componente padre lo desmonte y monte de nuevo (usando key).
  // O podemos limpiar manualmente al cerrar.

  if (!isOpen) return null; 

  const marketingCost = parseFloat(marketing) || 0;
  const prodUnits = parseInt(productionUnits) || 0;
  const productionCost = prodUnits * PRODUCTION_COST_PER_UNIT;
  const totalEstimatedCost = marketingCost + productionCost;
  
  const currentCash = companyData?.financials?.cash || 0;
  const remainingCash = currentCash - totalEstimatedCost;
  const isOverBudget = remainingCash < 0; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isOverBudget) {
      setError("Fondos insuficientes para ejecutar esta estrategia.");
      return;
    }
    if (price <= 0) {
      setError("El precio debe ser mayor a 0.");
      return;
    }

    setLoading(true);

    const decisionPayload = {
      price: parseFloat(price),
      marketing: parseFloat(marketing) || 0,
      production: {
        units: parseInt(productionUnits) || 0
      },
      logistics: [] 
    };

    try {
      await decisionService.submitDecision(decisionPayload);
      
      setSuccessMsg("¡Estrategia registrada correctamente!");
      
      setTimeout(() => {
        onSuccess(); 
        // --- LIMPIEZA MANUAL AL TERMINAR ---
        setPrice('');
        setMarketing('');
        setProductionUnits('');
        setSuccessMsg(null);
        // ----------------------------------
        onClose();   
      }, 1500);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Función para cerrar manualmente y limpiar errores
  const handleCloseManual = () => {
      setError(null);
      setSuccessMsg(null);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-corporate-slate w-full max-w-2xl rounded-2xl border border-corporate-blue/20 shadow-2xl overflow-hidden animate-fade-in">
        
        <div className="bg-corporate-navy px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Factory className="text-corporate-blue" size={24} />
            Centro de Decisiones
          </h2>
          <button onClick={handleCloseManual} className="text-corporate-muted hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-corporate-danger/10 border border-corporate-danger text-corporate-danger px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={18} /> {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 bg-corporate-success/10 border border-corporate-success text-corporate-success px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <CheckCircle size={18} /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* PRECIO */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-corporate-muted uppercase">Precio de Venta ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 text-corporate-blue" size={18} />
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    className="w-full bg-corporate-navy border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-corporate-blue focus:ring-1 focus:ring-corporate-blue outline-none transition"
                    placeholder="Ej. 150.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* MARKETING */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-corporate-muted uppercase">Presupuesto Marketing ($)</label>
                <div className="relative">
                  <Megaphone className="absolute left-3 top-3 text-corporate-warning" size={18} />
                  <input 
                    type="number" 
                    step="100"
                    min="0"
                    className="w-full bg-corporate-navy border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-corporate-blue focus:ring-1 focus:ring-corporate-blue outline-none transition"
                    placeholder="Ej. 5000"
                    value={marketing}
                    onChange={(e) => setMarketing(e.target.value)}
                  />
                </div>
              </div>

              {/* PRODUCCIÓN */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-corporate-muted uppercase">Producir Unidades</label>
                <div className="relative">
                  <Factory className="absolute left-3 top-3 text-corporate-success" size={18} />
                  <input 
                    type="number" 
                    step="10"
                    min="0"
                    className="w-full bg-corporate-navy border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-corporate-blue focus:ring-1 focus:ring-corporate-blue outline-none transition"
                    placeholder="Ej. 500"
                    value={productionUnits}
                    onChange={(e) => setProductionUnits(e.target.value)}
                  />
                </div>
                <p className="text-xs text-corporate-muted">Costo: ${PRODUCTION_COST_PER_UNIT}/u</p>
              </div>

              {/* LOGÍSTICA */}
              <div className="space-y-2 opacity-50 cursor-not-allowed">
                <label className="text-xs font-bold text-corporate-muted uppercase">Logística</label>
                <div className="relative">
                  <Truck className="absolute left-3 top-3 text-white" size={18} />
                  <input 
                    disabled
                    className="w-full bg-corporate-navy border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-corporate-muted"
                    value="Automático (Aéreo)"
                  />
                </div>
              </div>
            </div>

            {/* BARRA DE PRESUPUESTO */}
            <div className="bg-corporate-navy p-4 rounded-xl border border-white/5 mt-6">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-corporate-muted">Costo Producción:</span>
                <span className="text-white font-mono">${productionCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-corporate-muted">Costo Marketing:</span>
                <span className="text-white font-mono">${marketingCost.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/10 my-2"></div>
              <div className="flex justify-between items-center font-bold">
                <span className="text-white">Total Inversión:</span>
                <span className="text-corporate-blue font-mono">${totalEstimatedCost.toLocaleString()}</span>
              </div>
              
              <div className={`mt-3 text-xs font-bold text-center py-1 rounded ${isOverBudget ? 'bg-corporate-danger text-white' : 'bg-corporate-success/20 text-corporate-success'}`}>
                {isOverBudget 
                  ? `DÉFICIT: $${Math.abs(remainingCash).toLocaleString()} (No puedes procesar)`
                  : `CAJA RESTANTE PROYECTADA: $${remainingCash.toLocaleString()}`
                }
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={handleCloseManual}
                className="flex-1 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || isOverBudget || successMsg}
                className={`flex-1 py-3 rounded-lg text-white font-bold shadow-lg transition-all
                  ${(loading || isOverBudget) 
                    ? 'bg-corporate-muted cursor-not-allowed' 
                    : 'bg-corporate-blue hover:bg-blue-600 shadow-corporate-blue/20'
                  }`}
              >
                {loading ? 'Procesando...' : 'Confirmar Estrategia'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DecisionModal;