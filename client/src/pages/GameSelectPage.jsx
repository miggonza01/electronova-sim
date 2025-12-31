// ============================================
// FILE: client/src/pages/GameSelectPage.jsx
// PURPOSE: Lobby para seleccionar o unirse a partidas (Con Input de Código)
// ============================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.v2.js';
import logo from '../assets/LogoElectroNova.png';

const GameSelectPage = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para unirse a nueva sala
  const [newGameCode, setNewGameCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Cargar salas al iniciar
  const fetchRooms = async () => {
    try {
      const res = await api.get('/auth/rooms');
      setRooms(res.data.rooms);
    } catch (error) {
      console.error("Error cargando salas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Función: Cambiar a una sala existente
  const handleSelectRoom = async (gameId) => {
    try {
        setLoading(true);
        await api.post('/auth/switch-room', { gameId });
        navigate('/dashboard');
    } catch (error) {
        console.error("Switch room error:", error);
        alert("Error al cambiar de sala");
        setLoading(false);
    }
  };

  // Función: Unirse a nueva sala con código
  const handleJoinGame = async (e) => {
      e.preventDefault();
      if (!newGameCode.trim()) return;

      setJoining(true);
      try {
          await api.post('/auth/join-game', { gameCode: newGameCode });
          alert("✅ Te has unido a la nueva sala.");
          setNewGameCode(''); // Limpiar input
          fetchRooms(); // Recargar lista para ver la nueva tarjeta
      } catch (error) {
          alert("❌ Error: " + (error.response?.data?.message || "Código inválido"));
      } finally {
          setJoining(false);
      }
  };

  const handleLogout = () => {
    localStorage.removeItem('token_v2');
    window.location.href = '/login-v2';
  };

  if (loading && rooms.length === 0) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Cargando tus simulaciones...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" style={{ height: '30px' }} />
            <h1 className="font-bold text-lg">Mis Simulaciones</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-white">Cerrar Sesión</button>
      </header>

      <main className="p-8 max-w-5xl mx-auto w-full flex-grow">
        
        {/* SECCIÓN SUPERIOR: TÍTULO Y FORMULARIO DE UNIÓN */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-slate-700 pb-6">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Selecciona una Sala</h2>
                <p className="text-slate-400">Tienes {rooms.length} partidas activas.</p>
            </div>
            
            {/* FORMULARIO PARA UNIRSE A NUEVA SALA */}
            <form onSubmit={handleJoinGame} className="flex gap-2 w-full md:w-auto">
                <input 
                    type="text" 
                    placeholder="Código de Sala (Ej: ROOM-123)" 
                    value={newGameCode}
                    onChange={(e) => setNewGameCode(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white outline-none focus:border-blue-500 uppercase"
                />
                <button 
                    type="submit"
                    disabled={joining || !newGameCode}
                    className={`px-6 py-2 rounded font-bold text-white transition-all ${joining ? 'bg-slate-600' : 'bg-blue-600 hover:bg-blue-500 shadow-lg'}`}
                >
                    {joining ? 'Uniéndose...' : '+ Unirse'}
                </button>
            </form>
        </div>

        {/* GRID DE SALAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
                <div 
                    key={room.game._id}
                    onClick={() => handleSelectRoom(room.game._id)}
                    className={`
                        relative p-6 rounded-xl border cursor-pointer transition-all hover:scale-[1.02]
                        ${room.isCurrent 
                            ? 'bg-slate-800 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                            : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                        }
                    `}
                >
                    {room.isCurrent && (
                        <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            Activa
                        </div>
                    )}

                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-white mb-1">{room.game.name}</h3>
                        <div className="text-xs font-mono text-slate-500 bg-slate-900 inline-block px-2 py-1 rounded">
                            {room.game.code}
                        </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-300 border-t border-slate-700 pt-4">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Tu Empresa:</span>
                            <span className="font-bold">{room.companyName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Ronda Actual:</span>
                            <span className="text-white bg-slate-700 px-2 rounded">{room.game.currentRound}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Caja:</span>
                            <span className="text-emerald-400 font-mono">${parseFloat(room.cash).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Estado:</span>
                            <span className={`font-bold ${room.game.status === 'ACTIVE' ? 'text-green-400' : 'text-slate-400'}`}>
                                {room.game.status}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {rooms.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl">
                <p className="text-slate-500 text-lg mb-4">No estás inscrito en ninguna simulación.</p>
                <p className="text-sm text-slate-400">Ingresa el código que te dio el profesor arriba para comenzar.</p>
            </div>
        )}

      </main>
    </div>
  );
};

export default GameSelectPage;