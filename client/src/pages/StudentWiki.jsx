// ============================================
// FILE: client/src/pages/StudentWiki.jsx
// PURPOSE: Manual Didáctico Detallado para el Estudiante
// ============================================

import React from 'react';
import { useNavigate } from 'react-router-dom';

const StudentWiki = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. Guía de Interfaz: El Dashboard",
      content: (
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Encabezado:</strong> Muestra el nombre de tu Sala, el Código, tus datos de usuario, el <strong>Temporizador</strong> (tiempo restante para enviar decisión) y el número de Ronda actual.</li>
          <li><strong>Tarjetas KPI (Superiores):</strong>
            <ul className="list-circle pl-5 mt-1 text-slate-400">
              <li><em>Caja Disponible:</em> Dinero efectivo actual. Debajo verás la "Proyección" según lo que estés decidiendo en el momento.</li>
              <li><em>Nivel Tecnológico:</em> Determina la calidad base de tus productos (Impacta en ventas).</li>
              <li><em>Índice de Ética:</em> Tu reputación corporativa (Impacta en mercados conscientes como Veridia).</li>
            </ul>
          </li>
          <li><strong>Gráficas de Tendencia:</strong> Visualiza tu desempeño histórico en Utilidad Neta y Flujo de Caja vs Ventas.</li>
          <li><strong>Tablas de Inventario:</strong>
            <ul className="list-circle pl-5 mt-1 text-slate-400">
              <li><em>Materia Prima:</em> Muestra stock actual, consumo planeado (en rojo) y stock final proyectado.</li>
              <li><em>Producto Terminado:</em> Muestra cuánto inventario tienes disponible para la venta en cada una de las 4 plazas.</li>
            </ul>
          </li>
          <li><strong>Historial:</strong> Registro de todas tus decisiones pasadas con opción de ver el detalle.</li>
        </ul>
      )
    },
    {
      title: "2. Mecánicas de Juego y Fórmulas",
      content: (
        <div className="space-y-4">
          <div>
            <strong className="text-blue-300">A. Producción y Capacidad</strong>
            <p>La capacidad de planta (6,000 u) es compartida. Costos de Manufactura:</p>
            <ul className="list-disc pl-5 text-slate-400 text-xs">
              <li>Alta: $50/u (Requiere 2 Alfa + 3 Beta)</li>
              <li>Media: $30/u (Requiere 2 Alfa + 1 Omega)</li>
              <li>Básica: $15/u (Requiere 3 Omega)</li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-300">B. Abastecimiento (Proveedores)</strong>
            <ul className="list-disc pl-5 text-slate-400 text-xs">
              <li><strong>Local:</strong> Costo Base + 20%. Llega en 1 Ronda. Ética +5 pts.</li>
              <li><strong>Importado:</strong> Costo Base. Llega en 2 Rondas. Ética +0 pts.</li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-300">C. Logística</strong>
            <p>Debes mover productos de Fábrica a las Plazas para vender.</p>
            <ul className="list-disc pl-5 text-slate-400 text-xs">
              <li><strong>Aéreo:</strong> $15/u. Llega en 0 turnos (Venta inmediata).</li>
              <li><strong>Terrestre:</strong> $5/u. Llega en 1 turno (Venta en la siguiente ronda).</li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-300">D. Finanzas y Obsolescencia</strong>
            <p>Costo de Ventas (COGS) usa método FIFO. Inventario con antigüedad &gt; 3 rondas paga multa del 10% de su valor.</p>
          </div>
        </div>
      )
    },
    {
      title: "3. Interpretación del Estudio de Mercado",
      content: (
        <div>
          <p className="mb-2">Al comprar el reporte en la pestaña "Herramientas", verás:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Sensibilidad al Precio (Elasticidad):</strong> Indica qué tanto cae la demanda si subes el precio.
                <br/><span className="text-xs text-slate-400">Ej: 1.5 es muy sensible (clientes buscan ofertas). 0.7 es poco sensible (clientes pagan calidad).</span>
            </li>
            <li><strong>Precio Máximo (Hard Cap):</strong> El techo psicológico del mercado. Si tu precio supera este valor, la demanda caerá exponencialmente (casi a cero).</li>
            <li><strong>Preferencias (Pesos):</strong> Qué valora el cliente para elegirte.
                <br/><span className="text-xs text-slate-400">Ej: Si "Ética" tiene una barra grande, invertir en proveedores locales aumentará tus ventas en esa plaza.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "4. Condición de Victoria (WSC)",
      content: (
        <div>
          <p>El ganador se decide por el <strong>Winner Scorecard</strong>:</p>
          <div className="bg-slate-900 p-3 rounded border border-slate-700 font-mono text-center text-emerald-400 my-2">
            WSC = 0.4(Utilidad) + 0.3(Ventas) + 0.2(Ética) + 0.1(Tech)
          </div>
          <p className="text-xs text-slate-400">No basta con ganar dinero; debes mantener cuota de mercado y ser una empresa ética y tecnológica.</p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-8 flex flex-col">
      <div className="max-w-4xl mx-auto flex-grow">
        <button 
            onClick={() => navigate('/dashboard')}
            className="mb-6 text-blue-400 hover:text-white flex items-center gap-2 transition-colors"
        >
            ← Volver al Dashboard
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">📘 Manual del CEO</h1>
        <p className="text-slate-400 mb-8">Guía estratégica y técnica para la simulación ElectroNova.</p>

        <div className="space-y-6">
            {sections.map((sec, idx) => (
                <div key={idx} className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-xl font-bold text-blue-300 mb-3">{sec.title}</h2>
                    <div className="text-slate-300 leading-relaxed text-sm">
                        {typeof sec.content === 'string' ? <p>{sec.content}</p> : sec.content}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* FOOTER SOLICITADO */}
      <footer style={{ textAlign: 'center', padding: '2rem', color: '#475569', fontSize: '0.8rem', borderTop: '1px solid #1E293B', marginTop: '4rem' }}>
        © Maribel Pinheiro & Miguel González | Dic-2025
      </footer>
    </div>
  );
};

export default StudentWiki;