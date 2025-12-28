// ============================================
// FILE: client/src/pages/AdminDashboardV2.jsx
// PURPOSE: Panel de Control del Profesor (Sin errores de Linter)
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.v2.js';
import logo from '../assets/LogoElectroNova.png';

const AdminDashboardV2 = () => {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  
  // Estado inicial en true cubre la primera carga sin causar re-renders
  const [loading, setLoading] = useState(true); 
  const [refresh, setRefresh] = useState(0);

  // Cargar lista de juegos
  useEffect(() => {
    // NOTA: Eliminamos setLoading(true) de aquí para evitar el error "Cascading Renders".
    // La carga inicial la maneja el useState.
    // Las recargas las maneja el handleCreateGame.
    
    api.get('/admin/games')
      .then(res => setGames(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [refresh]);

  const handleCreateGame = async () => {
    const name = prompt("Nombre de la nueva clase:");
    if (name) {
        try {
            // Activamos loading AQUÍ, antes de disparar el efecto
            setLoading(true); 
            await api.post('/admin/games', { name });
            setRefresh(prev => prev + 1); // Esto disparará el useEffect
        } catch (e) { 
            console.error(e);
            alert("Error creando juego");
            setLoading(false); // Apagamos loading si hubo error
        }
    }
  };

  // Feedback de carga
  if (loading && games.length === 0) {
      return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Cargando panel de administración...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* HEADER */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" style={{ height: '30px' }} />
            <h1 className="font-bold text-lg">Panel Docente</h1>
        </div>
        <button onClick={() => { localStorage.removeItem('token_v2'); window.location.href='/login-v2'; }} className="text-sm text-slate-400 hover:text-white">Salir</button>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        {!selectedGame ? (
            // VISTA 1: LISTA DE SALAS
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
                    {games.length === 0 && !loading && (
                        <div className="col-span-full text-center text-slate-500 py-10 border border-dashed border-slate-700 rounded">
                            No tienes salas creadas. ¡Crea la primera!
                        </div>
                    )}
                </div>
            </div>
        ) : (
            // VISTA 2: DETALLE DE SALA
            <GameControlPanel gameId={selectedGame} onBack={() => setSelectedGame(null)} />
        )}
      </main>
    </div>
  );
};

// SUB-COMPONENTE: CONTROL DE SALA ESPECÍFICA
const GameControlPanel = ({ gameId, onBack }) => {
    const [data, setData] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Usamos useCallback para estabilizar la función
    const loadData = useCallback(() => {
        api.get(`/admin/games/${gameId}`)
           .then(res => setData(res.data))
           .catch(console.error);
    }, [gameId]);

    useEffect(() => { 
        loadData(); 
        // Polling: Actualizar cada 5 segundos para ver quién envía decisión
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

    if (!data) return <div className="text-white p-8">Cargando datos de la sala...</div>;

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
                        <span>Estado: {game.status}</span>
                    </div>
                </div>
                
                {game.status === 'ACTIVE' && (
                    <button 
                        onClick={handleProcess}
                        disabled={processing}
                        className={`px-6 py-3 rounded font-bold text-white shadow-lg ${processing ? 'bg-slate-600' : 'bg-red-600 hover:bg-red-500'}`}
                    >
                        {processing ? 'Procesando...' : '🚨 PROCESAR RONDA'}
                    </button>
                )}
            </div>

            {/* LISTA DE ESTUDIANTES */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase font-bold">
                        <tr>
                            <th className="p-4">Empresa</th>
                            <th className="p-4 text-right">Caja</th>
                            <th className="p-4 text-center">Estado Decisión</th>
                            <th className="p-4 text-center">Salud</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => (
                            <tr key={student.companyId} className="border-b border-slate-700 hover:bg-slate-700/50">
                                <td className="p-4 font-bold text-white">{student.companyName}</td>
                                <td className="p-4 text-right font-mono text-emerald-400">
                                    ${parseFloat(student.cash).toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                    {student.hasSubmitted ? (
                                        <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs">ENVIADA</span>
                                    ) : (
                                        <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded text-xs">PENDIENTE</span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    {student.isBankrupt ? '💀 QUIEBRA' : '✅ ACTIVA'}
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-500">Esperando que se registren alumnos con el código {game.code}...</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboardV2;