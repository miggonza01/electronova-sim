// ============================================
// FILE: client/src/pages/GameOverPage.jsx
// PURPOSE: Pantalla de Resultados Finales (Clean Linter)
// ============================================

import React, { useEffect, useState } from 'react';
import api from '../services/api.v2';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/LogoElectroNova.png';

const GameOverPage = () => {
  const [results, setResults] = useState(null);
  const [myCompanyId, setMyCompanyId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadResults = async () => {
        try {
            // 1. Obtener mi ID
            const profile = await api.get('/auth/profile');
            setMyCompanyId(profile.data.company._id);
            
            // 2. Obtener Ranking
            const res = await api.get('/decisions/results'); 
            setResults(res.data.ranking);

        } catch (e) {
            console.error(e);
        }
    };
    loadResults();
  }, []);

  if (!results) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Calculando resultados finales...</div>;

  const myRank = results.findIndex(r => r.id === myCompanyId);
  const isWinner = myRank === 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col items-center py-10">
      <img src={logo} alt="Logo" className="h-16 mb-4" />
      <h1 className="text-4xl font-bold mb-2 text-blue-500">SIMULACIÓN FINALIZADA</h1>
      <p className="text-slate-400 mb-8">Resultados Oficiales del Mercado</p>

      {/* TARJETA DE RESULTADO PERSONAL */}
      <div className={`p-8 rounded-xl border-2 mb-8 text-center shadow-2xl transform transition-all hover:scale-105 ${isWinner ? 'bg-gradient-to-b from-yellow-900/50 to-slate-900 border-yellow-500' : 'bg-slate-800 border-slate-700'}`}>
        <h2 className="text-2xl font-bold mb-2">{isWinner ? '🏆 ¡FELICIDADES!' : '🏁 Buen Trabajo'}</h2>
        <p className="text-lg mb-4">Has terminado en la posición:</p>
        <div className="text-6xl font-black mb-2">{myRank + 1}<span className="text-2xl text-slate-500"> / {results.length}</span></div>
        <div className="text-sm text-slate-400">Winner Scorecard (WSC): <span className="text-white font-bold">{results[myRank].wsc}</span></div>
      </div>

      {/* TABLA DE POSICIONES */}
      <div className="w-full max-w-4xl bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-400 uppercase text-sm">
                <tr>
                    <th className="p-4 text-center">#</th>
                    <th className="p-4">Empresa</th>
                    <th className="p-4 text-right">Utilidad Neta</th>
                    <th className="p-4 text-right">Ventas</th>
                    <th className="p-4 text-center">WSC</th>
                </tr>
            </thead>
            <tbody>
                {results.map((r, idx) => (
                    <tr key={r.id} className={`border-b border-slate-700 ${r.id === myCompanyId ? 'bg-blue-900/20' : ''}`}>
                        <td className="p-4 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-4 font-bold">
                            {r.name} 
                            {idx === 0 && <span className="ml-2 text-yellow-500">👑</span>}
                            {r.id === myCompanyId && <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">TÚ</span>}
                        </td>
                        <td className="p-4 text-right font-mono text-emerald-400">${r.details.netIncome.toLocaleString()}</td>
                        <td className="p-4 text-right font-mono text-slate-300">${r.details.revenue.toLocaleString()}</td>
                        <td className="p-4 text-center font-bold text-xl text-white">{r.wsc}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* CORRECCIÓN: Usamos navigate para limpiar el error de linter */}
      <button 
        onClick={() => {
            localStorage.removeItem('token_v2');
            navigate('/login-v2');
        }} 
        className="mt-8 text-slate-500 hover:text-white underline cursor-pointer"
      >
        Cerrar Sesión y Salir
      </button>
    </div>
  );
};

export default GameOverPage;