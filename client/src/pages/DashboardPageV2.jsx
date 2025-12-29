// ============================================
// FILE: client/src/pages/DashboardPageV2.jsx
// PURPOSE: Dashboard con Redirección de Fin de Juego
// ============================================

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.v2.js';
import logo from '../assets/LogoElectroNova.png';
import DecisionDetailModal from '../components/DecisionDetailModal';
import { useGameSimulation } from '../hooks/useGameSimulation';
import CountdownTimer from '../components/CountdownTimer';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import io from 'socket.io-client';

const DashboardPageV2 = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [company, setCompany] = useState(null);
  const [user, setUser] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  
  const [currentDecision, setCurrentDecision] = useState({ production: [], procurement: [], logistics: [], commercial: [] });
  const [decisionHistory, setDecisionHistory] = useState([]);
  const [financialHistory, setFinancialHistory] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileRes, prodRes, histRes, finRes, decRes] = await Promise.all([
            api.get('/auth/profile'),
            api.get('/products'),
            api.get('/decisions/history'),
            api.get('/financials'),
            api.get('/decisions/current').catch(() => ({ data: { data: null } }))
        ]);

        // VERIFICACIÓN DE FIN DE JUEGO
        if (profileRes.data.game && profileRes.data.game.status === 'FINISHED') {
            navigate('/game-over');
            return;
        }

        const matData = [{ name: 'Alfa', baseCost: 15 }, { name: 'Beta', baseCost: 25 }, { name: 'Omega', baseCost: 5 }];

        setCompany(profileRes.data.company);
        setUser(profileRes.data.user);
        setGameInfo(profileRes.data.game);
        setProducts(prodRes.data.data);
        setMaterials(matData);
        setDecisionHistory(histRes.data.data);
        setFinancialHistory(finRes.data.data);
        
        if (decRes.data.data) setCurrentDecision(decRes.data.data);

      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]); // Agregamos navigate a dependencias

  // Bloque de código de socket reemplazado
  useEffect(() => {
    // Conectar socket
    const socket = io(import.meta.env.VITE_API_URL.replace('/api', '')); 

    socket.on('round_change', (data) => {
        // Verificar si el evento es para mi juego
        if (company && data.gameId === company.gameId) {
            
            // LÓGICA DE FIN DE JUEGO
            if (data.gameStatus === 'FINISHED') {
                alert("🏁 EL JUEGO HA TERMINADO. Redirigiendo a resultados...");
                navigate('/game-over');
            } else {
                alert(`📢 ¡ATENCIÓN! La Ronda ${data.newRound} ha comenzado.`);
                window.location.reload(); 
            }
        }
    });

    return () => socket.disconnect();
  }, [company, navigate]); // <--- Importante incluir navigate en dependencias

  const handleLogout = () => {
    localStorage.removeItem('token_v2');
    window.location.href = '/login-v2';
  };

  const simulation = useGameSimulation(company, currentDecision, products, materials);
  const formatMoney = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();

  const chartData = useMemo(() => {
    let accumulatedNetIncome = 0;
    const data = financialHistory.map(f => {
        accumulatedNetIncome += parseFloat(f.incomeStatement.netIncome);
        return {
            round: `R${f.round}`,
            netIncome: parseFloat(f.incomeStatement.netIncome),
            accumulated: accumulatedNetIncome,
            cash: parseFloat(f.balanceSheet.assets.cash),
            revenue: parseFloat(f.incomeStatement.revenue)
        };
    });
    if (data.length === 0) {
        return [{ round: 'Inicio', netIncome: 0, accumulated: 0, cash: 500000, revenue: 0 }];
    }
    return data;
  }, [financialHistory]);

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Cargando Centro de Mando...</div>;
  if (!company) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Error de carga.</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', color: '#F8FAFC', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #334155', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="Logo" style={{ height: '45px' }} />
          <div>
            <h1 style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#F8FAFC', lineHeight: '1.2' }}>Simulador de Estrategias de Negocios v2.0</h1>
            <div style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: '600' }}>ElectroNova Inc.</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ textAlign: 'right', borderRight: '1px solid #334155', paddingRight: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#F8FAFC' }}>{user?.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{company.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: '0.25rem' }}>
                    <CountdownTimer targetDate={gameInfo?.roundEndsAt} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>RONDA ACTUAL</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#F8FAFC' }}>#{company.currentRound}</div>
            </div>
            <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '0.375rem', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>Salir</button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%', flexGrow: 1 }}>
        
        {/* KPI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: '#1E293B', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                <h3 style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>CAJA DISPONIBLE</h3>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10B981' }}>{formatMoney(company.cash)}</div>
                {simulation && (
                    <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: simulation.projectedCash < 0 ? '#EF4444' : '#64748B' }}>
                        Proyectado: {formatMoney(simulation.projectedCash)}
                    </div>
                )}
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                <h3 style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>NIVEL TECNOLÓGICO</h3>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3B82F6' }}>Nvl. {company.techLevel}</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#64748B' }}>Eficiencia Operativa</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                <h3 style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>ÍNDICE DE ÉTICA</h3>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: company.ethicsIndex > 80 ? '#10B981' : '#F59E0B' }}>
                    {company.ethicsIndex}/100
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#64748B' }}>Reputación</div>
            </div>
            
            <div style={{ backgroundColor: '#1E293B', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 50 }}>
                <button 
                    onClick={() => navigate('/decision')} 
                    style={{ 
                        backgroundColor: '#3B82F6', color: 'white', padding: '0.75rem 1.5rem', 
                        borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer', 
                        width: '100%', height: '100%', fontSize: '1.1rem',
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
                    }}
                >
                    Gestionar Ronda {company.currentRound} &rarr;
                </button>
            </div>
        </div>

        {/* --- SECCIÓN GRÁFICAS --- */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
            📊 Análisis de Tendencias
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            
            {/* GRÁFICA 1 */}
            <div style={{ backgroundColor: '#1E293B', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155', height: '350px', width: '100%', minWidth: 0 }}>
                <h3 style={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '1rem' }}>UTILIDAD NETA ACUMULADA</h3>
                <div style={{ width: '100%', height: '280px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorUtilidad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="round" stroke="#64748B" />
                            <YAxis stroke="#64748B" />
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }} />
                            <Area type="monotone" dataKey="accumulated" stroke="#10B981" fillOpacity={1} fill="url(#colorUtilidad)" name="Utilidad Acum." />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* GRÁFICA 2 */}
            <div style={{ backgroundColor: '#1E293B', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155', height: '350px', width: '100%', minWidth: 0 }}>
                <h3 style={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '1rem' }}>EVOLUCIÓN DE CAJA Y VENTAS</h3>
                <div style={{ width: '100%', height: '280px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="round" stroke="#64748B" />
                            <YAxis stroke="#64748B" />
                            <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }} />
                            <Legend />
                            <Line type="monotone" dataKey="cash" stroke="#3B82F6" strokeWidth={2} name="Caja" dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} name="Ventas" dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* --- SECCIÓN INVENTARIOS --- */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
            📦 Estado de Inventarios
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {/* Tabla MP */}
            <div style={{ backgroundColor: '#1E293B', borderRadius: '0.75rem', border: '1px solid #334155', padding: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#94A3B8', marginBottom: '1rem' }}>MATERIA PRIMA (ALMACÉN)</h3>
                <table style={{ width: '100%', fontSize: '0.85rem', color: '#CBD5E1' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem' }}>Insumo</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Actual</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Consumo Plan.</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Proyectado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materials.map(mat => {
                            const current = company.rawMaterials.find(rm => rm.materialType === mat.name)?.units || 0;
                            const consumption = simulation?.materialConsumption[mat.name] || 0;
                            const buying = currentDecision.procurement.find(p => p.materialType === mat.name)?.units || 0;
                            const projected = current - consumption + buying;
                            return (
                                <tr key={mat.name} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{mat.name}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{current.toLocaleString()}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right', color: '#EF4444' }}>-{consumption.toLocaleString()}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: projected < 0 ? '#EF4444' : '#10B981' }}>
                                        {Math.max(0, projected).toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Tabla PT */}
            <div style={{ backgroundColor: '#1E293B', borderRadius: '0.75rem', border: '1px solid #334155', padding: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#94A3B8', marginBottom: '1rem' }}>INVENTARIO EN PLAZAS (PT)</h3>
                <table style={{ width: '100%', fontSize: '0.85rem', color: '#CBD5E1' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem' }}>Producto</th>
                            <th style={{ padding: '0.5rem' }}>Plaza</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Stock Actual</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Costo Unit.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(prod => {
                            const stocks = company.inventory.filter(inv => inv.productLine === prod._id && inv.units > 0);
                            if (stocks.length === 0) return null;
                            return stocks.map((stock, idx) => (
                                <tr key={`${prod._id}-${idx}`} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '0.5rem' }}>{prod.name}</td>
                                    <td style={{ padding: '0.5rem', color: '#3B82F6' }}>{stock.market}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{stock.units.toLocaleString()} u</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>${parseFloat(stock.unitCost).toFixed(2)}</td>
                                </tr>
                            ));
                        })}
                        {(!company.inventory || company.inventory.length === 0) && (
                            <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#64748B' }}>Sin inventario en plazas.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* --- SECCIÓN HISTORIAL --- */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
            📋 Registro de Decisiones
        </h2>
        <div style={{ backgroundColor: '#1E293B', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#CBD5E1' }}>
                <thead style={{ backgroundColor: '#0F172A', borderBottom: '1px solid #334155' }}>
                    <tr>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Ronda</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Fecha Envío</th>
                        <th style={{ padding: '1rem', textAlign: 'center' }}>Estado</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {decisionHistory.length === 0 ? (
                        <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Sin decisiones previas.</td></tr>
                    ) : (
                        decisionHistory.map((dec) => (
                            <tr key={dec._id} style={{ borderBottom: '1px solid #334155' }}>
                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>#{dec.round}</td>
                                <td style={{ padding: '1rem' }}>{formatDate(dec.submittedAt)}</td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem' }}>Enviada</span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button onClick={() => setSelectedDecision(dec)} style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Ver Detalle</button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

      </main>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '2rem', color: '#475569', fontSize: '0.8rem', borderTop: '1px solid #1E293B', marginTop: 'auto' }}>
        © Maribel Pinheiro & Miguel González | Dic-2025
      </footer>

      {selectedDecision && <DecisionDetailModal decision={selectedDecision} products={products} onClose={() => setSelectedDecision(null)} />}
    </div>
  );
};

export default DashboardPageV2;