// client/src/components/DecisionModal.jsx
import { useState } from 'react';
import { X, DollarSign, Megaphone, Factory, Truck, AlertCircle, CheckCircle, Package } from 'lucide-react';
import decisionService from '../services/decisionService';

const DecisionModal = ({ isOpen, onClose, companyData, onSuccess }) => {
  
  // --- ESTADOS ---
  const [price, setPrice] = useState('');
  const [marketing, setMarketing] = useState('');
  const [productionUnits, setProductionUnits] = useState('');
  const [mpToBuy, setMpToBuy] = useState(''); // Nuevo: Compras MP
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // --- COSTOS (Esto debería venir del Backend en una config real) ---
  const MP_COST = 15.00; // Costo Compra MP
  const MANUFACTURE_COST = 35.00; // Costo Transformación
  // Costo Total Producción = 50.00 (igual que antes, pero desglosado)

  if (!isOpen) return null; 

  // --- CÁLCULOS ---
  const marketingCost = parseFloat(marketing) || 0;
  
  const unitsToProduce = parseInt(productionUnits) || 0;
  const unitsToBuy = parseInt(mpToBuy) || 0;

  const costOfBuyingMP = unitsToBuy * MP_COST;
  const costOfProduction = unitsToProduce * MANUFACTURE_COST;

  const totalEstimatedCost = marketingCost + costOfBuyingMP + costOfProduction;
  
  const currentCash = companyData?.financials?.cash || 0;
  const currentMP = companyData?.rawMaterials?.units || 0;

  const remainingCash = currentCash - totalEstimatedCost;
  const isOverBudget = remainingCash < 0; 
  
  // Validación: ¿Tengo suficiente MP para producir?
  // MP Disponible Total = Lo que tengo + Lo que compro ahora (asumiendo llegada inmediata para Fase 1)
  const totalMPAvailable = currentMP + unitsToBuy;
  const isMissingMP = unitsToProduce > totalMPAvailable;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isOverBudget) {
      setError("Fondos insuficientes.");
      return;
    }
    if (isMissingMP) {
      setError(`No tienes suficiente Materia Prima. Necesitas ${unitsToProduce}, tienes ${totalMPAvailable}.`);
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
      production: { units: unitsToProduce },
      procurement: { units: unitsToBuy }, // Nuevo campo
      logistics: [] 
    };

    try {
      await decisionService.submitDecision(decisionPayload);
      setSuccessMsg("¡Estrategia registrada correctamente!");
      setTimeout(() => {
        onSuccess(); 
        handleCloseManual();   
      }, 1500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCloseManual = () => {
      setPrice('');
      setMarketing('');
      setProductionUnits('');
      setMpToBuy('');
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
            Gestión de Cadena de Suministro
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
              
              {/* 1. COMPRAS DE MATERIA PRIMA */}
              <div className="space-y-2 bg-corporate-navy/50 p-3 rounded-lg border border-white/5">
                <label className="text-xs font-bold text-corporate-blue uppercase flex justify-between">
                  <span>Comprar MP</span>
                  <span className="text-white">Stock: {currentMP} u.</span>
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-3 text-corporate-blue" size={18} />
                  <input 
                    type="number" step="10" min="0"
                    className="w-full bg-corporate-slate border border-corporate-blue/30 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-1 focus:ring-corporate-blue outline-none"
                    placeholder="Cant. a comprar"
                    value={mpToBuy}
                    onChange={(e) => setMpToBuy(e.target.value)}
                  />
                </div>
                <p className="text-xs text-corporate-muted">Costo: ${MP_COST}/u</p>
              </div>

              {/* 2. PRODUCCIÓN */}
              <div className="space-y-2 bg-corporate-navy/50 p-3 rounded-lg border border-white/5">
                <label className="text-xs font-bold text-corporate-success uppercase flex justify-between">
                  <span>Producir</span>
                  <span className={isMissingMP ? "text-corporate-danger" : "text-corporate-muted"}>
                    Disp: {totalMPAvailable} u.
                  </span>
                </label>
                <div className="relative">
                  <Factory className="absolute left-3 top-3 text-corporate-success" size={18} />
                  <input 
                    type="number" step="10" min="0"
                    className={`w-full bg-corporate-slate border rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-1 outline-none
                      ${isMissingMP ? 'border-corporate-danger focus:ring-corporate-danger' : 'border-corporate-success/30 focus:ring-corporate-success'}`}
                    placeholder="Cant. a producir"
                    value={productionUnits}
                    onChange={(e) => setProductionUnits(e.target.value)}
                  />
                </div>
                <p className="text-xs text-corporate-muted">Costo Manuf.: ${MANUFACTURE_COST}/u</p>
              </div>

              {/* 3. PRECIO */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-corporate-muted uppercase">Precio Venta ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 text-white" size={18} />
                  <input 
                    type="number" step="0.01" min="0.01"
                    className="w-full bg-corporate-navy border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-corporate-blue outline-none"
                    placeholder="Ej. 150.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 4. MARKETING */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-corporate-muted uppercase">Marketing ($)</label>
                <div className="relative">
                  <Megaphone className="absolute left-3 top-3 text-corporate-warning" size={18} />
                  <input 
                    type="number" step="100" min="0"
                    className="w-full bg-corporate-navy border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-corporate-blue outline-none"
                    placeholder="Ej. 5000"
                    value={marketing}
                    onChange={(e) => setMarketing(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* BARRA DE PRESUPUESTO */}
            <div className="bg-corporate-navy p-4 rounded-xl border border-white/5 mt-6 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-corporate-muted">Compra MP:</span>
                <span className="text-white">${costOfBuyingMP.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-corporate-muted">Manufactura:</span>
                <span className="text-white">${costOfProduction.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-corporate-muted">Marketing:</span>
                <span className="text-white">${marketingCost.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/10 my-2"></div>
              <div className="flex justify-between font-bold text-lg">
                <span className="text-white">Total:</span>
                <span className="text-corporate-blue">${totalEstimatedCost.toLocaleString()}</span>
              </div>
              
              <div className={`mt-2 text-xs font-bold text-center py-1 rounded ${isOverBudget ? 'bg-corporate-danger text-white' : 'bg-corporate-success/20 text-corporate-success'}`}>
                {isOverBudget 
                  ? `DÉFICIT: $${Math.abs(remainingCash).toLocaleString()}`
                  : `CAJA FINAL: $${remainingCash.toLocaleString()}`
                }
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button type="button" onClick={handleCloseManual} className="flex-1 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition font-bold">
                Cancelar
              </button>
              <button type="submit" disabled={loading || isOverBudget || isMissingMP || successMsg} 
                className={`flex-1 py-3 rounded-lg text-white font-bold shadow-lg transition-all
                  ${(loading || isOverBudget || isMissingMP) ? 'bg-corporate-muted cursor-not-allowed' : 'bg-corporate-blue hover:bg-blue-600'}`}>
                {loading ? 'Procesando...' : 'Confirmar Orden'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DecisionModal;