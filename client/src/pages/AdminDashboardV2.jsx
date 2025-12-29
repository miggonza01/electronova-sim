// ============================================
// FILE: client/src/pages/AdminDashboardV2.jsx
// PURPOSE: Panel Docente (Fix Delete & Timer)
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.v2.js';
import logo from '../assets/LogoElectroNova.png';
import DecisionDetailModal from '../components/DecisionDetailModal';
import CountdownTimer from '../components/CountdownTimer';

const AdminDashboardV2 = () => {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);

  useEffect(() => {
    api.get('/admin/games')
      .then(res => setGames(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [refresh]);

  const submitCreateGame = async (payload) => {
    try {
        setLoading(true);
        await api.post('/admin/games', payload);
        setRefresh(prev => prev + 1);
        setShowCreateModal(false);
    } catch (e) { alert("Error: " + e.message); } finally { setLoading(false); }
  };

  const submitUpdateGame = async (id, payload) => {
    try {
        setLoading(true);
        await api.put(`/admin/games/${id}`, payload);
        setRefresh(prev => prev + 1);
        setEditingGame(null);
        alert("✅ Sala actualizada.");
    } catch (e) { alert("Error: " + e.message); } finally { setLoading(false); }
  };

  // ELIMINAR (CORREGIDO)
  const handleDeleteGame = async (e, id) => {
      // Detener propagación y prevenir comportamiento default
      e.preventDefault();
      e.stopPropagation();
      
      if(!window.confirm("⛔ ¿ESTÁS SEGURO? Se borrará la sala y TODOS los datos.")) return;
      
      try {
          await api.delete(`/admin/games/${id}`);
          // Actualización optimista: Quitamos la sala de la lista visualmente
          setGames(prev => prev.filter(g => g._id !== id));
          // No llamamos a setRefresh aquí para evitar conflictos de renderizado
      } catch (err) { 
          console.error("Error deleting:", err);
          alert("Error al eliminar: " + (err.response?.data?.message || err.message)); 
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
                    <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-bold text-sm">+ Nueva Sala</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {games.map(game => (
                        <div key={game._id} className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-blue-500 cursor-pointer transition-all relative group" onClick={() => setSelectedGame(game._id)}>
                            
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setEditingGame(game); }} className="bg-slate-700 hover:bg-blue-600 text-white p-1 rounded text-xs">✏️</button>
                                {/* Botón Eliminar Corregido */}
                                <button onClick={(e) => handleDeleteGame(e, game._id)} className="bg-slate-700 hover:bg-red-600 text-white p-1 rounded text-xs">🗑️</button>
                            </div>

                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{game.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded ${game.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-400'}`}>{game.status}</span>
                            </div>
                            <div className="text-2xl font-mono text-blue-400 mb-4 tracking-wider">{game.code}</div>
                            
                            {game.status === 'ACTIVE' && (
                                <div className="mb-2">
                                    <CountdownTimer targetDate={game.roundEndsAt} />
                                </div>
                            )}

                            <div className="text-sm text-slate-400">Ronda: {game.currentRound} / {game.config.maxRounds}</div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <GameControlPanel gameId={selectedGame} onBack={() => setSelectedGame(null)} />
        )}
      </main>

      {showCreateModal && <GameConfigModal title="Crear Sala" onClose={() => setShowCreateModal(false)} onSubmit={submitCreateGame} />}
      {editingGame && <GameConfigModal title="Editar Sala" initialData={editingGame} onClose={() => setEditingGame(null)} onSubmit={(data) => submitUpdateGame(editingGame._id, data)} />}
    </div>
  );
};

const GameConfigModal = ({ title, initialData, onClose, onSubmit }) => {
    const [form, setForm] = useState({
        name: initialData?.name || '',
        initialCash: initialData?.config?.initialCash || 500000,
        maxRounds: initialData?.config?.maxRounds || 8,
        marketResearchRound: initialData?.config?.marketResearchRound || 1,
        marketResearchCost: initialData?.config?.marketResearchCost || 15000,
        days: initialData?.config?.duration?.days || 0,
        hours: initialData?.config?.duration?.hours || 0,
        minutes: initialData?.config?.duration?.minutes || 10
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            name: form.name,
            config: {
                initialCash: parseInt(form.initialCash),
                maxRounds: parseInt(form.maxRounds),
                marketResearchRound: parseInt(form.marketResearchRound),
                marketResearchCost: parseInt(form.marketResearchCost),
                duration: { days: parseInt(form.days), hours: parseInt(form.hours), minutes: parseInt(form.minutes) }
            }
        };
        onSubmit(payload);
    };

    const inputStyle = "w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm mb-3 focus:border-blue-500 outline-none";
    const labelStyle = "block text-xs text-slate-400 mb-1";

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 w-96 max-h-[90vh] overflow-y-auto shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
                <form onSubmit={handleSubmit}>
                    <label className={labelStyle}>Nombre de la Sala</label>
                    <input className={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className={labelStyle}>Capital Inicial</label><input type="number" className={inputStyle} value={form.initialCash} onChange={e => setForm({...form, initialCash: e.target.value})} /></div>
                        <div><label className={labelStyle}>Total Rondas</label><input type="number" className={inputStyle} value={form.maxRounds} onChange={e => setForm({...form, maxRounds: e.target.value})} /></div>
                    </div>
                    <div className="border-t border-slate-700 my-2 pt-2">
                        <label className={labelStyle}>Duración Ronda</label>
                        <div className="flex gap-2">
                            <div className="flex-1"><input type="number" className={inputStyle} value={form.days} onChange={e => setForm({...form, days: e.target.value})} /><span className="text-[10px] text-slate-500">Días</span></div>
                            <div className="flex-1"><input type="number" className={inputStyle} value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} /><span className="text-[10px] text-slate-500">Hrs</span></div>
                            <div className="flex-1"><input type="number" className={inputStyle} value={form.minutes} onChange={e => setForm({...form, minutes: e.target.value})} /><span className="text-[10px] text-slate-500">Min</span></div>
                        </div>
                    </div>
                    <div className="border-t border-slate-700 my-2 pt-2">
                        <label className="text-xs font-bold text-blue-400 mb-2 block">Estudio de Mercado</label>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className={labelStyle}>Ronda Disp.</label><input type="number" className={inputStyle} value={form.marketResearchRound} onChange={e => setForm({...form, marketResearchRound: e.target.value})} /></div>
                            <div><label className={labelStyle}>Costo</label><input type="number" className={inputStyle} value={form.marketResearchCost} onChange={e => setForm({...form, marketResearchCost: e.target.value})} /></div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const GameControlPanel = ({ gameId, onBack }) => {
    const [data, setData] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [inspectingCompany, setInspectingCompany] = useState(null);
    const [studentHistory, setStudentHistory] = useState([]);
    const [viewDecision, setViewDecision] = useState(null);
    const [products, setProducts] = useState([]);

    const loadData = useCallback(() => {
        api.get(`/admin/games/${gameId}`).then(res => setData(res.data)).catch(console.error);
    }, [gameId]);

    useEffect(() => { api.get('/products').then(res => setProducts(res.data.data)).catch(console.error); }, []);

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
        } catch (e) { console.error(e); alert("Error cargando historial"); }
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
                        {game.status === 'ACTIVE' && <CountdownTimer targetDate={game.roundEndsAt} />}
                    </div>
                </div>
                {game.status === 'ACTIVE' && (
                    <button onClick={handleProcess} disabled={processing} className={`px-6 py-3 rounded font-bold text-white shadow-lg ${processing ? 'bg-slate-600' : 'bg-red-600 hover:bg-red-500'}`}>
                        {processing ? 'Procesando...' : '🚨 PROCESAR RONDA'}
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase font-bold">
                            <tr><th className="p-4">Empresa</th><th className="p-4 text-right">Caja</th><th className="p-4 text-center">Estado</th><th className="p-4 text-right">Acción</th></tr>
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
                                        <button onClick={() => handleInspect(student.companyId)} className="text-blue-400 hover:text-blue-300 font-bold text-xs border border-blue-500 px-2 py-1 rounded">🔍 Historial</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 h-fit">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">{inspectingCompany ? `Historial: ${inspectingCompany}` : 'Selecciona un alumno'}</h3>
                    {!inspectingCompany ? <p className="text-slate-500 text-sm">Haz clic en "🔍 Historial" en la tabla.</p> : (
                        <div className="space-y-2">
                            {studentHistory.length === 0 ? <p className="text-slate-500 text-sm">Sin decisiones aún.</p> : studentHistory.map(dec => (
                                <div key={dec._id} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-700 hover:border-blue-500 cursor-pointer" onClick={() => setViewDecision(dec)}>
                                    <div><div className="font-bold text-white">Ronda {dec.round}</div><div className="text-xs text-slate-500">{new Date(dec.submittedAt).toLocaleTimeString()}</div></div>
                                    <span className="text-blue-400 text-xs">Ver &rarr;</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {viewDecision && <DecisionDetailModal decision={viewDecision} products={products} onClose={() => setViewDecision(null)} />}
        </div>
    );
};

export default AdminDashboardV2;