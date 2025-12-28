// ============================================
// FILE: client/src/pages/AdminDashboardV2.jsx
// PURPOSE: Panel Docente con Inspección (Corregido y Optimizado)
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.v2.js';
import logo from '../assets/LogoElectroNova.png';
import DecisionDetailModal from '../components/DecisionDetailModal';

const AdminDashboardV2 = () => {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  
  // CORRECCIÓN 1: Inicializamos loading en true para evitar setearlo en el efecto
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    // CORRECCIÓN 2: Quitamos setLoading(true) de aquí para evitar el loop
    api.get('/admin/games')
      .then(res => setGames(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [refresh]);

  const handleCreateGame = async () => {
    const name = prompt("Nombre de la nueva clase:");
    if (name) {
        try {
            // Activamos loading aquí manualmente antes de la operación
            setLoading(true);
            await api.post('/admin/games', { name });
            setRefresh(prev => prev + 1);
        } catch (e) { 
            console.error(e);
            alert("Error creando juego");
            setLoading(false);
        }
    }
  };

  if (loading && games.length === 0) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" style={{ height: '30px' }} />
            <h1 className="font-bold text-lg">Panel Docente</h1>
        </div>
        <button onClick={() => { localStorage.removeItem('token_v2'); window.location.href='/login-v2'; }} className="text-sm text-slate-400 hover:text-white">Salir</button>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        {!selectedGame ? (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Mis Salas</h2>
                    <button onClick={handleCreateGame} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-bold text-sm">+ Nueva Sala</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {games.map(game => (
                        <div key={game._id} className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-blue-500 cursor-pointer transition-all" onClick={() => setSelectedGame(game._id)}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{game.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded ${game.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-400'}`}>{game.status}</span>
                            </div>
                            <div className="text-2xl font-mono text-blue-400 mb-4 tracking-wider">{game.code}</div>
                            <div className="text-sm text-slate-400">Ronda Actual: {game.currentRound}</div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <GameControlPanel gameId={selectedGame} onBack={() => setSelectedGame(null)} />
        )}
      </main>
    </div>
  );
};

// SUB-COMPONENTE: CONTROL DE SALA
const GameControlPanel = ({ gameId, onBack }) => {
    const [data, setData] = useState(null);
    const [processing, setProcessing] = useState(false);
    
    // Estado para inspección
    const [inspectingCompany, setInspectingCompany] = useState(null);
    const [studentHistory, setStudentHistory] = useState([]);
    const [viewDecision, setViewDecision] = useState(null);
    const [products, setProducts] = useState([]);

    // CORRECCIÓN 3: Uso correcto de useCallback para dependencias
    const loadData = useCallback(() => {
        api.get(`/admin/games/${gameId}`).then(res => setData(res.data)).catch(console.error);
    }, [gameId]);

    useEffect(() => {
        api.get('/products').then(res => setProducts(res.data.data)).catch(console.error);
    }, []);

    useEffect(() => { 
        loadData(); 
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [loadData]);

    const handleProcess = async () => {
        if (!window.confirm("¿Seguro que deseas cerrar la ronda? Esto es irreversible.")) return;
        setProcessing(true);
        try {
            await api.post(`/admin/games/${gameId}/process`);
            alert("Ronda procesada correctamente.");
            loadData();
        } catch (e) {
            alert("Error: " + (e.response?.data?.message || e.message));
        } finally {
            setProcessing(false);
        }
    };

    const handleInspect = async (companyId) => {
        try {
            const res = await api.get(`/admin/companies/${companyId}/history`);
            setStudentHistory(res.data.data);
            setInspectingCompany(res.data.companyName);
        } catch (e) {
            console.error(e);
            alert("Error cargando historial");
        }
    };

    if (!data) return <div className="text-white p-8">Cargando sala...</div>;
    const { game, students } = data;

    return (
        <div>
            <button onClick={onBack} className="mb-4 text-slate-400 hover:text-white text-sm">← Volver a Salas</button>
            
            <div className="flex justify-between items-end mb-6 border-b border-slate-700 pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">{game.name}</h2>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="bg-slate-800 px-2 py-1 rounded border border-slate-600 font-mono text-blue-300">CÓDIGO: {game.code}</span>
                        <span>Ronda: <strong className="text-white text-lg">{game.currentRound}</strong> / {game.config.maxRounds}</span>
                    </div>
                </div>
                {game.status === 'ACTIVE' && (
                    <button onClick={handleProcess} disabled={processing} className={`px-6 py-3 rounded font-bold text-white shadow-lg ${processing ? 'bg-slate-600' : 'bg-red-600 hover:bg-red-500'}`}>
                        {processing ? 'Procesando...' : '🚨 PROCESAR RONDA'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LISTA DE ESTUDIANTES */}
                <div className="lg:col-span-2 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase font-bold">
                            <tr>
                                <th className="p-4">Empresa</th>
                                <th className="p-4 text-right">Caja</th>
                                <th className="p-4 text-center">Estado</th>
                                <th className="p-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.companyId} className="border-b border-slate-700 hover:bg-slate-700/50">
                                    <td className="p-4 font-bold text-white">{student.companyName}</td>
                                    <td className="p-4 text-right font-mono text-emerald-400">${parseFloat(student.cash).toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        {student.hasSubmitted ? <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs">LISTO</span> : <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded text-xs">PENDIENTE</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleInspect(student.companyId)} className="text-blue-400 hover:text-blue-300 font-bold text-xs border border-blue-500 px-2 py-1 rounded">
                                            🔍 Historial
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PANEL LATERAL DE INSPECCIÓN */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 h-fit">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">
                        {inspectingCompany ? `Historial: ${inspectingCompany}` : 'Selecciona un alumno'}
                    </h3>
                    
                    {!inspectingCompany ? (
                        <p className="text-slate-500 text-sm">Haz clic en "🔍 Historial" en la tabla para ver las decisiones pasadas de un equipo.</p>
                    ) : (
                        <div className="space-y-2">
                            {studentHistory.length === 0 ? (
                                <p className="text-slate-500 text-sm">Este equipo no ha tomado decisiones aún.</p>
                            ) : (
                                studentHistory.map(dec => (
                                    <div key={dec._id} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-700 hover:border-blue-500 cursor-pointer" onClick={() => setViewDecision(dec)}>
                                        <div>
                                            <div className="font-bold text-white">Ronda {dec.round}</div>
                                            <div className="text-xs text-slate-500">{new Date(dec.submittedAt).toLocaleTimeString()}</div>
                                        </div>
                                        <span className="text-blue-400 text-xs">Ver &rarr;</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL REUTILIZADO */}
            {viewDecision && (
                <DecisionDetailModal 
                    decision={viewDecision} 
                    products={products} 
                    onClose={() => setViewDecision(null)} 
                />
            )}
        </div>
    );
};

export default AdminDashboardV2;