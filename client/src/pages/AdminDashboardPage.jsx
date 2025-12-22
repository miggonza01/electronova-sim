// client/src/pages/AdminDashboardPage.jsx
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import adminService from '../services/adminService';
import { Play, Pause, RefreshCw, Server, Users, AlertTriangle, CheckCircle } from 'lucide-react';

const AdminDashboardPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false); // Para el botón de procesar
  const [statusMsg, setStatusMsg] = useState(null); // Mensajes de éxito/error

  // Cargar configuración al inicio
  const fetchConfig = async () => {
    try {
      const response = await adminService.getGameConfig();
      if (response.success) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error("Error cargando panel admin:", error);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // --- MANEJADOR DEL BOTÓN ROJO ---
  const handleProcessRound = async () => {
    if (!window.confirm(`¿Estás SEGURO de cerrar la Ronda ${config.currentRound}? Esto es irreversible.`)) {
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const response = await adminService.processRound();
      
      setStatusMsg({ type: 'success', text: `¡Éxito! Ronda ${response.data.newRound} iniciada.` });
      
      // Actualizamos la configuración visual
      setConfig(prev => ({ ...prev, currentRound: response.data.newRound }));

    } catch (error) {
      setStatusMsg({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!config) return <div className="text-white text-center mt-20">Cargando Sistema de Control...</div>;

  return (
    <div className="min-h-screen bg-corporate-navy font-sans">
      <Navbar round={config.currentRound} />

      <main className="max-w-5xl mx-auto px-4 py-12">
        
        {/* Título */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-2 flex justify-center items-center gap-3">
            <Server size={40} className="text-corporate-blue" />
            Torre de Control
          </h1>
          <p className="text-corporate-muted">
            Panel de Administración de ElectroNova Inc.
          </p>
        </div>

        {/* Mensajes de Estado */}
        {statusMsg && (
          <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border ${
            statusMsg.type === 'success' 
              ? 'bg-corporate-success/10 border-corporate-success text-corporate-success' 
              : 'bg-corporate-danger/10 border-corporate-danger text-corporate-danger'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle /> : <AlertTriangle />}
            <span className="font-bold">{statusMsg.text}</span>
          </div>
        )}

        {/* --- PANEL PRINCIPAL --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* TARJETA 1: ESTADO DEL SISTEMA */}
          <div className="bg-corporate-slate p-8 rounded-2xl border border-white/10 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <RefreshCw className="text-corporate-blue" />
              Estado del Ciclo
            </h2>

            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-corporate-navy rounded-lg border border-white/5">
                <span className="text-corporate-muted">Ronda Actual</span>
                <span className="text-4xl font-mono font-bold text-white">{config.currentRound}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-corporate-navy rounded-lg border border-white/5">
                <span className="text-corporate-muted">Estado del Motor</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.gameActive ? 'bg-corporate-success/20 text-corporate-success' : 'bg-corporate-danger/20 text-corporate-danger'}`}>
                  {config.gameActive ? 'ONLINE' : 'PAUSADO'}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-corporate-navy rounded-lg border border-white/5">
                <span className="text-corporate-muted">Tasa de Interés</span>
                <span className="font-mono text-white">{config.loanInterestRate * 100}%</span>
              </div>
            </div>
          </div>

          {/* TARJETA 2: ACCIONES CRÍTICAS */}
          <div className="bg-corporate-slate p-8 rounded-2xl border border-white/10 shadow-xl flex flex-col justify-center">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="text-corporate-warning" />
              Zona de Peligro
            </h2>

            <p className="text-corporate-muted text-sm mb-8">
              Al procesar la ronda, se calcularán todas las ventas, se actualizarán los inventarios y se cobrarán intereses. Esta acción notificará a todos los estudiantes conectados.
            </p>

            <button
              onClick={handleProcessRound}
              disabled={loading || !config.gameActive}
              className={`w-full py-6 rounded-xl font-bold text-xl shadow-2xl transition-all transform active:scale-95 flex justify-center items-center gap-3
                ${loading 
                  ? 'bg-corporate-muted cursor-wait' 
                  : 'bg-gradient-to-r from-corporate-blue to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-corporate-blue/30'
                }`}
            >
              {loading ? (
                <span>Procesando Mercado...</span>
              ) : (
                <>
                  <Play fill="currentColor" />
                  PROCESAR RONDA {config.currentRound}
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <span className="text-xs text-corporate-muted flex items-center justify-center gap-1">
                <Users size={12} />
                Los estudiantes verán los resultados automáticamente.
              </span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;