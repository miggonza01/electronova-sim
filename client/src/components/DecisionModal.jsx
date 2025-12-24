// client/src/components/DecisionModal.jsx
import { useState } from 'react';
import { X, DollarSign, Megaphone, Factory, Truck, AlertCircle, CheckCircle, Package } from 'lucide-react';
import decisionService from '../services/decisionService';

const DecisionModal = ({ isOpen, onClose, companyData, onSuccess }) => {
  
  const [price, setPrice] = useState('');
  const [marketing, setMarketing] = useState('');
  const [productionUnits, setProductionUnits] = useState('');
  const [mpToBuy, setMpToBuy] = useState('');
  
  const [shipments, setShipments] = useState({
    Norte: { units: '', method: 'Terrestre' },
    Sur: { units: '', method: 'Terrestre' },
    Centro: { units: '', method: 'Terrestre' }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const MP_COST = 15.00;
  const MANUFACTURE_COST = 35.00;
  const SHIPPING_COST_AIR = 5.00;
  const SHIPPING_COST_GROUND = 1.00;

  if (!isOpen) return null; 

  const handleShipChange = (plaza, field, value) => {
    setShipments(prev => ({
      ...prev,
      [plaza]: { ...prev[plaza], [field]: value }
    }));
  };

  // --- CÁLCULOS DETALLADOS ---
  const marketingCost = parseFloat(marketing) || 0;
  const unitsToProduce = parseInt(productionUnits) || 0;
  const unitsToBuy = parseInt(mpToBuy) || 0;

  let totalUnitsToShip = 0;
  let totalShippingCost = 0;

  Object.values(shipments).forEach(s => {
    const u = parseInt(s.units) || 0;
    const rate = s.method === 'Aereo' ? SHIPPING_COST_AIR : SHIPPING_COST_GROUND;
    totalUnitsToShip += u;
    totalShippingCost += (u * rate);
  });

  const costOfBuyingMP = unitsToBuy * MP_COST;
  const costOfProduction = unitsToProduce * MANUFACTURE_COST;
  
  const totalEstimatedCost = marketingCost + costOfBuyingMP + costOfProduction + totalShippingCost;
  
  const currentCash = companyData?.financials?.cash || 0;
  const currentMP = companyData?.rawMaterials?.units || 0;
  const currentFactoryStock = companyData?.factoryStock?.units || 0;

  const remainingCash = currentCash - totalEstimatedCost;
  const isOverBudget = remainingCash < 0; 
  
  const totalMPAvailable = currentMP + unitsToBuy;
  const isMissingMP = unitsToProduce > totalMPAvailable;
  
  const totalFactoryAvailable = currentFactoryStock + unitsToProduce;
  const isMissingFactoryStock = totalUnitsToShip > totalFactoryAvailable;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isOverBudget) return setError("Fondos insuficientes.");
    if (isMissingMP) return setError("Falta Materia Prima.");
    if (isMissingFactoryStock) return setError(`Stock Fábrica insuficiente (${totalFactoryAvailable} u).`);
    if (price <= 0) return setError("Precio inválido.");

    setLoading(true);

    const logisticsArray = Object.keys(shipments).map(key => ({
      destination: key,
      units: parseInt(shipments[key].units) || 0,
      method: shipments[key].method
    })).filter(item => item.units > 0);

    const decisionPayload = {
      price: parseFloat(price),
      marketing: parseFloat(marketing) || 0,
      production: { units: unitsToProduce },
      procurement: { units: unitsToBuy },
      logistics: logisticsArray
    };

    try {
      await decisionService.submitDecision(decisionPayload);
      setSuccessMsg("¡Estrategia Global Enviada!");
      setTimeout(() => { onSuccess(); handleCloseManual(); }, 1500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCloseManual = () => {
      setPrice(''); setMarketing(''); setProductionUnits(''); setMpToBuy('');
      setShipments({
        Norte: { units: '', method: 'Terrestre' },
        Sur: { units: '', method: 'Terrestre' },
        Centro: { units: '', method: 'Terrestre' }
      });
      setError(null); setSuccessMsg(null);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-corporate-slate w-full max-w-4xl rounded-2xl border border-corporate-blue/20 shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
        
        {/* CORRECCIÓN DE TÍTULO */}
        <div className="bg-corporate-navy px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="text-corporate-blue" size={24} />
            Centro de Operaciones
          </h2>
          <button onClick={handleCloseManual} className="text-corporate-muted hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 bg-corporate-danger/10 border border-corporate-danger text-corporate-danger px-4 py-3 rounded-lg flex items-center gap-2 text-sm"><AlertCircle size={18}/> {error}</div>}
          {successMsg && <div className="mb-4 bg-corporate-success/10 border border-corporate-success text-corporate-success px-4 py-3 rounded-lg flex items-center gap-2 text-sm"><CheckCircle size={18}/> {successMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* COL 1: PRODUCCIÓN */}
              <div className="space-y-4 bg-corporate-navy/30 p-4 rounded-lg border border-white/5">
                <h3 className="text-xs font-bold text-corporate-muted uppercase border-b border-white/10 pb-2 mb-2">1. Producción</h3>
                <div className="space-y-1">
                  <label className="text-xs text-corporate-blue font-bold flex justify-between">
                    <span>Comprar MP</span> <span className="text-white/50">Stock: {currentMP}</span>
                  </label>
                  <div className="relative">
                    <Package className="absolute left-2 top-2.5 text-corporate-blue" size={14} />
                    <input type="number" className="w-full bg-corporate-slate border border-white/10 rounded py-2 pl-8 text-sm text-white outline-none" 
                      placeholder="0" value={mpToBuy} onChange={(e) => setMpToBuy(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-corporate-success font-bold flex justify-between">
                    <span>Producir</span> <span className={isMissingMP ? "text-corporate-danger" : "text-white/50"}>Max: {totalMPAvailable}</span>
                  </label>
                  <div className="relative">
                    <Factory className="absolute left-2 top-2.5 text-corporate-success" size={14} />
                    <input type="number" className="w-full bg-corporate-slate border border-white/10 rounded py-2 pl-8 text-sm text-white outline-none" 
                      placeholder="0" value={productionUnits} onChange={(e) => setProductionUnits(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* COL 2: ENVÍOS */}
              <div className="space-y-4 bg-corporate-navy/30 p-4 rounded-lg border border-white/5">
                <h3 className="text-xs font-bold text-corporate-muted uppercase border-b border-white/10 pb-2 mb-2">
                  2. Envíos (Disp: {totalFactoryAvailable})
                </h3>
                {['Norte', 'Centro', 'Sur'].map(plaza => (
                  <div key={plaza} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] text-white/70 uppercase font-bold">{plaza}</label>
                      <input type="number" className="w-full bg-corporate-slate border border-white/10 rounded py-1 px-2 text-sm text-white outline-none" 
                        placeholder="0" 
                        value={shipments[plaza].units}
                        onChange={(e) => handleShipChange(plaza, 'units', e.target.value)}
                      />
                    </div>
                    <div className="w-20">
                      <select 
                        className="w-full bg-corporate-slate border border-white/10 rounded py-1 px-1 text-[10px] text-white outline-none h-[30px]"
                        value={shipments[plaza].method}
                        onChange={(e) => handleShipChange(plaza, 'method', e.target.value)}
                      >
                        <option value="Terrestre">Tierra ($1)</option>
                        <option value="Aereo">Aire ($5)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* COL 3: COMERCIAL */}
              <div className="space-y-4 bg-corporate-navy/30 p-4 rounded-lg border border-white/5">
                <h3 className="text-xs font-bold text-corporate-muted uppercase border-b border-white/10 pb-2 mb-2">3. Comercial</h3>
                <div className="space-y-1">
                  <label className="text-xs text-corporate-muted font-bold">Precio Global</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 text-white" size={14} />
                    <input type="number" className="w-full bg-corporate-slate border border-white/10 rounded py-2 pl-8 text-sm text-white outline-none" 
                      placeholder="150.00" value={price} onChange={(e) => setPrice(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-corporate-muted font-bold">Marketing Global</label>
                  <div className="relative">
                    <Megaphone className="absolute left-2 top-2.5 text-corporate-warning" size={14} />
                    <input type="number" className="w-full bg-corporate-slate border border-white/10 rounded py-2 pl-8 text-sm text-white outline-none" 
                      placeholder="5000" value={marketing} onChange={(e) => setMarketing(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* CORRECCIÓN: BARRA DE TOTALES DETALLADA */}
            <div className="bg-corporate-navy p-4 rounded-xl border border-white/5 mt-4 text-xs">
              <div className="grid grid-cols-4 gap-2 mb-2 text-center">
                <div className="bg-white/5 p-2 rounded">
                  <span className="text-corporate-blue block font-bold mb-1">Materia Prima</span> 
                  <span className="text-white font-mono">${costOfBuyingMP.toLocaleString()}</span>
                </div>
                <div className="bg-white/5 p-2 rounded">
                  <span className="text-corporate-success block font-bold mb-1">Producción</span> 
                  <span className="text-white font-mono">${costOfProduction.toLocaleString()}</span>
                </div>
                <div className="bg-white/5 p-2 rounded">
                  <span className="text-white block font-bold mb-1">Logística</span> 
                  <span className="text-white font-mono">${totalShippingCost.toLocaleString()}</span>
                </div>
                <div className="bg-white/5 p-2 rounded">
                  <span className="text-corporate-warning block font-bold mb-1">Marketing</span> 
                  <span className="text-white font-mono">${marketingCost.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="h-px bg-white/10 my-3"></div>
              
              <div className="flex justify-between items-center font-bold text-sm">
                <span className="text-white text-base">Total Inversión: <span className="text-corporate-blue">${totalEstimatedCost.toLocaleString()}</span></span>
                <span className={`px-3 py-1 rounded ${isOverBudget ? 'bg-corporate-danger/20 text-corporate-danger' : 'bg-corporate-success/20 text-corporate-success'}`}>
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