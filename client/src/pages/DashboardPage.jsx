// client/src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client'; // Importar cliente de Socket.IO para WebSockets
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import DecisionModal from '../components/DecisionModal'; // <--- IMPORTAR MODAL
import api from '../services/api';
import { DollarSign, Package, TrendingUp, Activity, AlertTriangle, PlusCircle } from 'lucide-react';
import AnalyticsChart from '../components/AnalyticsChart';

const DashboardPage = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para controlar si el modal está abierto o cerrado
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Función para obtener datos del servidor
  const fetchCompanyData = async () => {
    try {
      setLoading(true); // Mostrar carga al refrescar
      const response = await api.get('/company/my-company');
      
      if (response.data.success) {
        setCompany(response.data.data);
      } else {
        setError("El servidor no devolvió datos válidos.");
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // --- EFECTO PRINCIPAL: CARGAR DATOS INICIALES ---
  // Se ejecuta una sola vez al montar el componente
  useEffect(() => {
    fetchCompanyData();
  }, []);

  // --- EFECTO PARA CONEXIÓN DE SOCKET.IO ---
  // Se ejecuta una vez al montar el componente para establecer conexión WebSocket
  useEffect(() => {
    // CONFIGURACIÓN DE LA URL DEL SERVIDOR DE SOCKET.IO
    // 1. Primero intenta usar la variable de entorno VITE_API_URL (configuración de Vite)
    // 2. Si existe, remueve '/api' porque Socket.IO necesita la URL base (ej: http://localhost:5000)
    // 3. Si no existe variable de entorno, usa 'http://localhost:5000' (valor por defecto desarrollo)
    const SOCKET_URL = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') // Quitamos /api para tener la base
      : 'http://localhost:5000';
    
    console.log(`>>> Conectando a Socket.IO en: ${SOCKET_URL}`);
    
    // Crear instancia del socket y conectar al servidor
    // La función io() devuelve un objeto socket que permite comunicación bidireccional
    const socket = io(SOCKET_URL);
    
    // --- CONFIGURACIÓN DE LISTENERS (ESCUCHADORES DE EVENTOS) ---
    
    // Listener para evento 'connect': Se dispara cuando la conexión se establece exitosamente
    socket.on('connect', () => {
      console.log('✅ Conectado al servidor WebSocket (Socket.IO)');
    });
    
    // Listener para evento 'roundChange': Se dispara cuando el servidor procesa una nueva ronda
    // Este evento es emitido por el servidor en adminController.triggerRoundProcessing()
    socket.on('roundChange', (newRound) => {
      console.log(`🔄 Nueva ronda procesada: ${newRound}`);
      
      // Refrescar automáticamente los datos de la empresa
      // Esto mantiene la UI sincronizada en tiempo real sin necesidad de recargar la página
      fetchCompanyData();
    });
    
    // Listener para evento 'connect_error': Se dispara cuando hay error de conexión
    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error.message);
      // NOTA: No mostrar error al usuario porque la app funciona con HTTP también
    });
    
    // --- LIMPIEZA AL DESMONTAR EL COMPONENTE ---
    // IMPORTANTE: Cerrar la conexión socket cuando el componente se desmonta
    // Previene múltiples conexiones y fugas de memoria
    return () => {
      console.log('🔌 Desconectando Socket.IO');
      socket.disconnect(); // Cerrar conexión WebSocket
    };
    
    // El array de dependencias vacío [] asegura que este efecto se ejecute solo una vez
    // al montar el componente, no en cada renderizado
  }, []);

  // --- RENDERIZADO CONDICIONAL ---
  if (loading && !company) { // Solo pantalla completa de carga si no hay datos previos
    return (
      <div className="min-h-screen bg-corporate-navy flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-corporate-blue/20 rounded-full mb-4"></div>
          <p className="text-corporate-muted text-sm font-mono">SINCRONIZANDO DATOS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-corporate-navy flex items-center justify-center p-4">
        <div className="bg-corporate-slate p-8 rounded-xl border border-corporate-danger text-center">
          <AlertTriangle className="text-corporate-danger mx-auto mb-4" size={48} />
          <h2 className="text-white font-bold text-xl mb-2">Error de Sistema</h2>
          <p className="text-corporate-muted mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-corporate-blue text-white px-4 py-2 rounded">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!company) return null;

  // --- PREPARACIÓN DE DATOS ---
  const cash = company.financials?.cash || 0;
  const inventoryTotal = company.inventory?.reduce((acc, batch) => acc + batch.units, 0) || 0;
  const wsc = company.kpi?.wsc || 0;
  const ethics = company.kpi?.ethics || 100;

  return (
    <div className="min-h-screen bg-corporate-navy pb-20 font-sans">
      <Navbar round={company.currentRound} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Encabezado con Botón de Acción */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Panel de Control</h1>
            <p className="text-corporate-muted mt-1">
              Resumen ejecutivo: <span className="text-corporate-blue font-semibold">{company.name}</span>
            </p>
          </div>

          {/* BOTÓN PRINCIPAL: Abrir Modal de Decisión */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-corporate-blue hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-corporate-blue/20 transition-all transform hover:scale-105"
          >
            <PlusCircle size={20} />
            Nueva Estrategia
          </button>
        </div>

        {/* Grid de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Capital Disponible" value={`$${cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={DollarSign} color="green" subtext="Liquidez inmediata" />
          <StatCard title="Inventario Total" value={`${inventoryTotal} u.`} icon={Package} color="blue" subtext="Unidades en almacén" />
          <StatCard title="Winner Scorecard" value={wsc.toFixed(1)} icon={TrendingUp} color="yellow" subtext="Índice de Victoria" />
          <StatCard title="Índice de Ética" value={`${ethics}%`} icon={Activity} color={ethics > 80 ? "green" : "red"} subtext="Reputación corporativa" />
        </div>

        {/* --- GRÁFICO DE ANÁLISIS --- */}
        <div className="mb-8">
           <AnalyticsChart history={company.history} />
        </div>

        {/* Tabla de Inventario */}
        <div className="bg-corporate-slate rounded-xl border border-white/5 overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Detalle de Inventario (FIFO)</h3>
            <span className="text-xs text-corporate-muted bg-white/5 px-2 py-1 rounded">Almacén Central</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-corporate-muted">
              <thead className="bg-corporate-navy text-xs uppercase font-bold text-white/70">
                <tr>
                  <th className="px-6 py-3">ID Lote</th>
                  <th className="px-6 py-3">Unidades</th>
                  <th className="px-6 py-3">Costo Unit.</th>
                  <th className="px-6 py-3">Antigüedad</th>
                  <th className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {company.inventory && company.inventory.length > 0 ? (
                  // CASO 1: HAY INVENTARIO
                  company.inventory.map((batch, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-corporate-blue">{batch.batchId}</td>
                      <td className="px-6 py-4 text-white font-bold">{batch.units}</td>
                      <td className="px-6 py-4 font-mono">${batch.unitCost}</td>
                      <td className="px-6 py-4">{batch.age} rondas</td>
                      <td className="px-6 py-4">
                        {batch.age > 3 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-corporate-danger/10 text-corporate-danger">OBSOLETO</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-corporate-success/10 text-corporate-success">ACTIVO</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  // CASO 2: NO HAY INVENTARIO (Analizamos por qué)
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      {company.history && company.history.length > 0 && company.history[company.history.length - 1].unitsSold > 0 ? (
                        // Subcaso A: Hubo ventas en la última ronda -> SOLD OUT
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-corporate-success font-bold text-lg">¡STOCK AGOTADO (SOLD OUT)!</span>
                          <p className="text-corporate-muted text-sm">
                            Excelente gestión comercial. Vendiste todo tu inventario en la Ronda anterior.
                            <br/>¡Es urgente producir más para no perder clientes!
                          </p>
                        </div>
                      ) : (
                        // Subcaso B: No hubo ventas -> FÁBRICA PARADA
                        <div className="text-corporate-muted italic">
                          Almacén vacío. No has iniciado producción o compras.
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODAL DE DECISIÓN (Se renderiza aquí pero flota sobre todo) --- */}
        {/* TRUCO: key={isModalOpen ? 'open' : 'closed'} fuerza a React a reiniciar el componente al abrirse */}
        {isModalOpen && (
          <DecisionModal 
            key={Date.now()} // <--- ESTO FUERZA EL RESET COMPLETO CADA VEZ
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            companyData={company}
            onSuccess={() => {
              fetchCompanyData();
            }}
          />
        )}

      </main>
    </div>
  );
};

export default DashboardPage;