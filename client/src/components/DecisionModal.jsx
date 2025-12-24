// client/src/components/DecisionModal.jsx
import { useState } from 'react';
import { X, DollarSign, Megaphone, Factory, Truck, AlertCircle, CheckCircle, Package } from 'lucide-react';
import decisionService from '../services/decisionService';

const DecisionModal = ({ isOpen, onClose, companyData, onSuccess }) => {
  
  const [price, setPrice] = useState('');
  const [marketing, setMarketing] = useState('');
  const [productionUnits, setProductionUnits] = useState('');
  const [mpToBuy, setMpToBuy] = useState('');
  
  // [NUEVO] Estados Logísticos
  const [shippingUnits, setShippingUnits] = useState('');
  const [shippingMethod, setShippingMethod] = useState('Terrestre'); // Default barato

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // COSTOS
  const MP_COST = 15.00;
  const MANUFACTURE_COST = 35.00;
  const SHIPPING_COST_AIR = 5.00;
  const SHIPPING_COST_GROUND = 1.00;

  if (!isOpen) return null; 

  // --- CÁLCULOS ---
  const marketingCost = parseFloat(marketing) || 0;
  const unitsToProduce = parseInt(productionUnits) || 0;
  const unitsToBuy = parseInt(mpToBuy) || 0;
  const unitsToShip = parseInt(shippingUnits) || 0;

  const costOfBuyingMP = unitsToBuy * MP_COST;
  const costOfProduction = unitsToProduce * MANUFACTURE_COST;
  
  const shippingRate = shippingMethod === 'Aereo' ? SHIPPING_COST_AIR : SHIPPING_COST_GROUND;
  const costOfShipping = unitsToShip * shippingRate;

  const totalEstimatedCost = marketingCost + costOfBuyingMP + costOfProduction + costOfShipping;
  
  const currentCash = companyData?.financials?.cash || 0;
  const currentMP = companyData?.rawMaterials?.units || 0;
  // [NUEVO] Leemos el stock de fábrica
  const currentFactoryStock = companyData?.factoryStock?.units || 0;

  const remainingCash = currentCash - totalEstimatedCost;
  const isOverBudget = remainingCash < 0; 
  
  // Validaciones
  const totalMPAvailable = currentMP + unitsToBuy; // Asumiendo MP llega instantáneo para producir
  const isMissingMP = unitsToProduce > totalMPAvailable;
  
  // Validación de Envío: Solo puedo enviar lo que tengo en fábrica
  // Asumimos cross-docking: lo que produzco hoy, lo puedo enviar hoy.
  const totalFactoryAvailable = currentFactoryStock + unitsToProduce;
  const isMissingFactoryStock = unitsToShip > totalFactoryAvailable;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isOverBudget) return setError("Fondos insuficientes.");
    if (isMissingMP) return setError(`Falta Materia Prima. Necesitas ${unitsToProduce}.`);
    if (isMissingFactoryStock) return setError(`No puedes enviar ${unitsToShip}. Solo tendrás ${totalFactoryAvailable} en fábrica.`);
    if (price <= 0) return setError("Precio inválido.");

    setLoading(true);

    const decisionPayload = {
      price: parseFloat(price),
      marketing: parseFloat(marketing) || 0,
      production: { units: unitsToProduce },
      procurement: { units: unitsToBuy },
      // [NUEVO] Payload Logístico
      logistics: [
        {
          destination: 'Plaza Central',
          units: unitsToShip,
          method: shippingMethod
        }
      ]
    };

    try {
      await decisionService.submitDecision(decisionPayload);
      setSuccessMsg("¡Orden Logística y Comercial Enviada!");
      setTimeout(() => { onSuccess(); handleCloseManual(); }, 1500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCloseManual = () => {
      setPrice(''); setMarketing(''); setProductionUnits(''); setMpToBuy('');
      setShippingUnits(''); setShippingMethod('Terrestre');
      setError(null); setSuccessMsg(null);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-corporate-slate w-full max-w-3xl rounded-2xl border border-corporate-blue/20 shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
        
        <div className="bg-corporate-navy px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="text-corporate-blue" size={24} />
            Centro de Operaciones Globales
          </h2>
          <button onClick={handleCloseManual} className="text-corporate-muted hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 bg-corporate-danger/10 border border-corporate-danger text-corporate-danger px-4 py-3 rounded-lg flex items-center gap-2 text-sm"><AlertCircle size={18}/> {error}</div>}
          {successMsg && <div className="mb-4 bg-corporate-success/10 border border-corporate-success text-corporate-success px-4 py-3 rounded-lg flex items-center gap-2 text-sm"><CheckCircle size={18}/> {successMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* COL 1: SUMINISTRO */}
              <div className="space-y-4 bg-corporate-navy/30 p-3 rounded-lg border border-white/5">
                <h3 className="text-xs font-bold text-corporate-muted uppercase border-b border-white/10 pb-2 mb-2">1. Suministro</h3>
                
                <div className="space-y-1">
                  <label className="text-xs text-corporate-blue font-bold flex justify-between">
                    <span>Comprar MP</span> <span className="text-white/50">Stock: {currentMP}</span>
                  </label>
                  <div className="relative">
                    <Package className="absolute left-2 top-2.5 text-corporate-blue" size={14} />
                    <input type="number" className="w-full bg-corporate-slate border border-white/10 rounded py-2 pl-8 text-sm text-white focus:ring-1 focus:ring-corporate-blue outline-none" 
                      placeholder="0" value={mpToBuy} onChange={(e) => setMpToBuy(e.target.value)} />
                  </div>
                  <p className="text-[10px] text-right text-corporate-muted">${MP_COST}/u</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-corporate-success font-bold flex justify-between">
                    <span>Producir</span> <span className={isMissingMP ? "text-corporate-danger" : "text-white/50"}>Max: {totalMPAvailable}</span>
                  </label>
                  <div className="relative">
                    <Factory className="absolute left-2 top-2.5 text-corporate-success" size={14} />
                    <input type="number" className="w-full bg-corporate-slate border border-white/10 rounded py-2 pl-8 text-sm text-white focus:ring-1 focus:ring-corporate-success outline-none" 
                      placeholder="0" value={productionUnits} onChange={(e) => setProductionUnits(e.target.value)} />
                  </div>
                  <p className="text-[10px] text-right text-corporate-muted">${MANUFACTURE_COST}/u</p>
                </div>
              </div>

              {/* COL 2: LOGÍSTICA (NUEVO) */}
              <div className="space-y-4 bg-corporate-navy/30 p-3 rounded-lg border border-white/5">
                <h3 className="text-xs font-bold text-corporate-muted uppercase border-b border-white/10 pb-2 mb-2">2. Logística</h3>
                
                <div className="space-y-1">
                  <label className="text-xs text-white font-bold flex justify-between">
                    <span>Enviar a Plaza</span> <span className={isMissingFactoryStock ? "text-corporate-danger" : "text-white/50"}>Fab: {totalFactoryAvailable}</span>
                  </label>
                  <div className="relative">
                    <Truck className="absolute left-2 top-2.5 text-white" size={14} />
                    <input type="number" className="w-full bg-corporate-slate border border-white/10 rounded py-2 pl-8 text-sm text-white focus:ring-1 focus:ring-white outline-none" 
                      placeholder="0" value={shippingUnits} onChange={(e) => setShippingUnits(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/70 font-bold">Método de Envío</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShippingMethod('Terrestre')}
                      className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${shippingMethod === 'Terrestre' ? 'bg-corporate-blue text-white border-corporate-blue' : 'bg-transparent text-corporate-muted border-white/10'}`}>
                      Terrestre ($1)
                      <br/><span className="text-[9px] opacity-70">2 Rondas</span>
                    </button>
                    <button type="button" onClick={() => setShippingMethod('Aereo')}
                      className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${shippingMethod === 'Aereo' ? 'bg-corporate-warning text-corporate-navy border-corporate-warning' : 'bg-transparent text-corporate-muted border-white/10'}`}>
                      Aéreo ($5)
                      <br/><span className="text-[9px] opacity-70">1 Ronda</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* COL 3: MERCADO */}
              <div className="space-y-4 bg-corporate-navy/30 p-3 rounded-lg border border-white/5">
                <h3 className="text-xs font-bold text-corporate-muted uppercase border-b border-white/10 pb-2 mb-2">3. Mercado</h3>
                
                <div className="space-y-1">
                  <label className="text-xs text-corporate-muted font-bold">Precio Venta</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 text-white" size={14} />
                    <input type="number" className="w-full bg-corporate-slate border border-white/10 rounded py-2 pl-8 text-sm text-white focus:ring-1 outline-none" 
                      placeholder="150.00" value={price} onChange={(e) => setPrice(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-corporate-muted font-bold">Marketing</label>
                  <div className="relative">
                    <Megaphone className="absolute left-2 top-2.5 text-corporate-warning" size={14} />
                    <input type="number" className="w-full bg-corporate-slate border border-white/10 rounded py-2 pl-8 text-sm text-white focus:ring-1 outline-none" 
                      placeholder="5000" value={marketing} onChange={(e) => setMarketing(e.target.value)} />
                  </div>
                </div>
              </div>

            </div>

            {/* BARRA DE TOTALES */}
            <div className="bg-corporate-navy p-4 rounded-xl border border-white/5 mt-4 text-xs">
              <div className="grid grid-cols-4 gap-2 mb-2 text-center">
                <div><span className="text-corporate-muted block">MP</span> <span className="text-white">${costOfBuyingMP.toLocaleString()}</span></div>
                <div><span className="text-corporate-muted block">Prod</span> <span className="text-white">${costOfProduction.toLocaleString()}</span></div>
                <div><span className="text-corporate-muted block">Envío</span> <span className="text-white">${costOfShipping.toLocaleString()}</span></div>
                <div><span className="text-corporate-muted block">Mkt</span> <span className="text-white">${marketingCost.toLocaleString()}</span></div>
              </div>
              <div className="h-px bg-white/10 my-2"></div>
              <div className="flex justify-between items-center font-bold text-sm">
                <span className="text-white">Total Inversión: <span className="text-corporate-blue">${totalEstimatedCost.toLocaleString()}</span></span>
                <span className={`${isOverBudget ? 'text-corporate-danger' : 'text-corporate-success'}`}>
                  {isOverBudget ? `DÉFICIT: $${Math.abs(remainingCash).toLocaleString()}` : `CAJA FINAL: $${remainingCash.toLocaleString()}`}
                </span>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button type="button" onClick={handleCloseManual} className="flex-1 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition font-bold">Cancelar</button>
              <button type="submit" disabled={loading || isOverBudget || isMissingMP || isMissingFactoryStock || successMsg} 
                className={`flex-1 py-3 rounded-lg text-white font-bold shadow-lg transition-all ${loading || isOverBudget || isMissingMP || isMissingFactoryStock ? 'bg-corporate-muted cursor-not-allowed' : 'bg-corporate-blue hover:bg-blue-600'}`}>
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