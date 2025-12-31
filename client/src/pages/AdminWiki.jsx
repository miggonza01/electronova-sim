// ============================================
// FILE: client/src/pages/AdminWiki.jsx
// PURPOSE: Manual Pedagógico y Técnico (Sintaxis JSX Corregida)
// ============================================

import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminWiki = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-8 flex flex-col">
      <div className="max-w-5xl mx-auto flex-grow">
        <button 
            onClick={() => navigate('/admin')}
            className="mb-6 text-emerald-400 hover:text-white flex items-center gap-2 transition-colors"
        >
            ← Volver al Panel de Control
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">🎓 Guía Pedagógica del Simulador</h1>
        <p className="text-slate-400 mb-8">Documentación técnica de mecánicas y variables de mercado.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* OBJETIVOS */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold text-emerald-300 mb-2">Propósito Didáctico</h3>
                <ul className="list-disc pl-5 text-slate-300 space-y-2 text-sm">
                    <li><strong>Gestión de Restricciones:</strong> El alumno enfrenta escasez de capital y capacidad compartida.</li>
                    <li><strong>Planificación Temporal:</strong> Diferencia entre Lead Time corto (caro) y largo (barato).</li>
                    <li><strong>Análisis de Datos:</strong> Uso del Estudio de Mercado para tomar decisiones basadas en evidencia, no intuición.</li>
                </ul>
            </div>

            {/* VARIABLES DE MERCADO */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold text-emerald-300 mb-2">Variables del Estudio de Mercado</h3>
                <div className="space-y-3 text-sm text-slate-300">
                    <div>
                        <strong className="text-white">Sensibilidad al Precio (Elasticidad):</strong>
                        <p className="text-xs text-slate-400">Controla cuánto cae la demanda si el precio sube.</p>
                        <ul className="list-disc pl-4 text-xs mt-1">
                            {/* CORRECCIÓN AQUÍ: Usamos &gt; y &lt; */}
                            <li><code>&gt; 1.0</code>: Mercado elástico (Sensible). Gana quien tenga menor precio.</li>
                            <li><code>&lt; 1.0</code>: Mercado inelástico (Premium). El cliente tolera precios altos.</li>
                        </ul>
                    </div>
                    <div>
                        <strong className="text-white">Precio Máximo (Hard Cap):</strong>
                        <p className="text-xs text-slate-400">Umbral de rechazo. Si Precio &gt; HardCap, la demanda se penaliza con factor de potencia 4 (caída vertical).</p>
                    </div>
                    <div>
                        <strong className="text-white">Pesos de Preferencia (w1..w4):</strong>
                        <p className="text-xs text-slate-400">Coeficientes del algoritmo de competencia. Determinan el "Ganador" del mercado.</p>
                    </div>
                </div>
            </div>

            {/* MECÁNICAS TÉCNICAS */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 col-span-1 md:col-span-2">
                <h3 className="text-lg font-bold text-emerald-300 mb-2">Reglas y Mecánicas del Motor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
                    <div>
                        <h4 className="font-bold text-white mb-1">Algoritmo ECPCIM</h4>
                        <p className="mb-2 text-xs">Calcula la cuota de mercado relativa:</p>
                        <div className="bg-slate-900 p-2 rounded text-xs font-mono text-blue-200 mb-2">
                            Score = w1*PrecioInv + w2*Calidad + w3*MarketingLog + w4*Ética
                        </div>
                        <p className="text-xs text-slate-400">El precio se normaliza inversamente. El marketing tiene rendimientos decrecientes (logarítmico).</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-1">Finanzas y Restricciones</h4>
                        <ul className="list-disc pl-5 text-slate-400 text-xs space-y-1">
                            <li><strong>Capacidad:</strong> <code>Total / N_Jugadores</code>. Se recalcula cada ronda.</li>
                            {/* CORRECCIÓN AQUÍ: Usamos &gt; */}
                            <li><strong>Obsolescencia:</strong> Lotes con <code>age &gt; 3</code> pagan 10% de multa.</li>
                            <li><strong>Eventos:</strong> 15% probabilidad al cerrar ronda. Afectan costos o demanda global.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '2rem', color: '#475569', fontSize: '0.8rem', borderTop: '1px solid #1E293B', marginTop: '4rem' }}>
        © Maribel Pinheiro & Miguel González | Dic-2025
      </footer>
    </div>
  );
};

export default AdminWiki;