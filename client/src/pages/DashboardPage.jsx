// client/src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import DecisionModal from '../components/DecisionModal';
import api from '../services/api';
import { io } from 'socket.io-client';
import { DollarSign, Package, TrendingUp, Activity, PlusCircle, Truck, MapPin } from 'lucide-react'; // MapPin nuevo
import AnalyticsChart from '../components/AnalyticsChart';

const DashboardPage = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/company/my-company');
      if (response.data.success) {
        setCompany(response.data.data);
      } else {
        setError("Error al obtener datos.");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
    const SOCKET_URL = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : 'http://localhost:5000';
    const socket = io(SOCKET_URL);
    socket.emit('join_game_room', { email: 'student' });
    socket.on('round_changed', () => { fetchCompanyData(); });
    return () => socket.disconnect();
  }, []);

  if (loading && !company) return <div className="min-h-screen bg-corporate-navy flex items-center justify-center text-white">Cargando...</div>;
  if (error) return <div className="text-white text-center mt-20">{error} <button onClick={()=>window.location.reload()}>Reintentar</button></div>;
  if (!company) return null;

  const cash = company.financials?.cash || 0;
  const inventoryPlaza = company.inventory?.reduce((acc, batch) => acc + batch.units, 0) || 0;
  const inventoryTransit = company.inTransit?.reduce((acc, ship) => acc + ship.units, 0) || 0;
  const inventoryFactory = company.factoryStock?.units || 0;
  const wsc = company.kpi?.wsc || 0;
  const ethics = company.kpi?.ethics || 100;

  return (
    <div className="min-h-screen bg-corporate-navy pb-20 font-sans">
      <Navbar round={company.currentRound} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Panel de Control</h1>
            <p className="text-corporate-muted mt-1">
              {company.name} | <span className="text-corporate-blue">Ronda {company.currentRound}</span>
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-corporate-blue hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all">
            <PlusCircle size={20} /> Nueva Estrategia
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Capital Disponible" value={`$${cash.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={DollarSign} color="green" subtext="Liquidez" />
          
          <div className="bg-corporate-slate p-6 rounded-xl border border-white/5 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-corporate-muted text-xs font-bold uppercase">Cadena Suministro</h3>
              <Package className="text-corporate-blue" size={20} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Plaza:</span>
                <span className="text-white font-bold">{inventoryPlaza} u.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Tránsito:</span>
                <span className="text-corporate-warning font-bold">{inventoryTransit} u.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Fábrica:</span>
                <span className="text-corporate-success font-bold">{inventoryFactory} u.</span>
              </div>
            </div>
          </div>

          <StatCard title="Winner Scorecard" value={wsc.toFixed(1)} icon={TrendingUp} color="yellow" subtext="Puntaje Global" />
          <StatCard title="Índice de Ética" value={`${ethics}%`} icon={Activity} color={ethics > 80 ? "green" : "red"} subtext="Reputación" />
        </div>

        <div className="mb-8">
           <AnalyticsChart history={company.history} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* TABLA 1: EN TRÁNSITO */}
          <div className="bg-corporate-slate rounded-xl border border-white/5 overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-corporate-navy/50">
              <h3 className="text-white font-bold text-sm uppercase flex items-center gap-2">
                <Truck size={16} className="text-corporate-warning"/> Envíos en Tránsito
              </h3>
              <span className="text-xs text-corporate-muted">{company.inTransit?.length || 0} lotes</span>
            </div>
            <div className="overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-left text-sm text-corporate-muted">
                <thead className="bg-corporate-navy text-xs uppercase font-bold text-white/70">
                  <tr>
                    <th className="px-4 py-2">Destino</th> {/* Columna Destino */}
                    <th className="px-4 py-2">Cant.</th>
                    <th className="px-4 py-2">Método</th>
                    <th className="px-4 py-2">Llegada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {company.inTransit && company.inTransit.length > 0 ? (
                    company.inTransit.map((ship, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-bold text-white">{ship.destination}</td>
                        <td className="px-4 py-3 text-white font-mono">{ship.units}</td>
                        <td className="px-4 py-3">{ship.method}</td>
                        <td className="px-4 py-3 text-corporate-warning font-bold">
                          {ship.roundsRemaining <= 1 ? "PRÓXIMA RONDA" : `En ${ship.roundsRemaining} rondas`}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="px-4 py-6 text-center text-xs italic">No hay envíos en curso.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 2: INVENTARIO EN PLAZA */}
          <div className="bg-corporate-slate rounded-xl border border-white/5 overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-corporate-navy/50">
              <h3 className="text-white font-bold text-sm uppercase flex items-center gap-2">
                <MapPin size={16} className="text-corporate-blue"/> Stock en Plaza
              </h3>
              <span className="text-xs text-corporate-muted">{company.inventory?.length || 0} lotes</span>
            </div>
            <div className="overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-left text-sm text-corporate-muted">
                <thead className="bg-corporate-navy text-xs uppercase font-bold text-white/70">
                  <tr>
                    <th className="px-4 py-2">Plaza</th> {/* Columna Plaza NUEVA */}
                    <th className="px-4 py-2">Cant.</th>
                    <th className="px-4 py-2">Costo</th>
                    <th className="px-4 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {company.inventory && company.inventory.length > 0 ? (
                    company.inventory.map((batch, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-bold text-corporate-blue">{batch.market}</td>
                        <td className="px-4 py-3 text-white font-mono">{batch.units}</td>
                        <td className="px-4 py-3">${batch.unitCost}</td>
                        <td className="px-4 py-3">
                          {batch.age > 3 ? <span className="text-corporate-danger">OBSOLETO</span> : <span className="text-corporate-success">ACTIVO</span>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-6 text-center text-xs italic">
                        {inventoryTransit > 0 
                          ? "Esperando llegada de mercancía."
                          : "Almacén vacío."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {isModalOpen && (
          <DecisionModal 
            key={Date.now()}
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            companyData={company}
            onSuccess={() => fetchCompanyData()}
          />
        )}

      </main>
    </div>
  );
};

export default DashboardPage;