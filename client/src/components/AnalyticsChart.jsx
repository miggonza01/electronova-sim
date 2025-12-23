// client/src/components/AnalyticsChart.jsx
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const AnalyticsChart = ({ history }) => {
  
  // PREPARACIÓN DE DATOS ROBUSTA
  // 1. Definimos el Punto Cero (Inicio del juego)
  const initialPoint = { 
    round: 0, 
    cash: 500000, // Capital inicial base
    wsc: 0 
  };

  // 2. Combinamos: Si hay historia, la usamos. Si no, solo el punto inicial.
  // Usamos el "Spread Operator" (...) para crear un nuevo array limpio.
  let chartData = [initialPoint];

  if (history && history.length > 0) {
    chartData = [...chartData, ...history];
  }

  return (
    <div className="bg-corporate-slate p-6 rounded-xl border border-white/5 shadow-lg">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-corporate-blue"></span>
        Evolución de Capital
      </h3>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="round" 
              stroke="#94A3B8" 
              tick={{fill: '#94A3B8', fontSize: 12}}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R${value}`}
            />
            <YAxis 
              stroke="#94A3B8"
              tick={{fill: '#94A3B8', fontSize: 12}}
              tickLine={false}
              axisLine={false}
              // Formateamos para que $500,000 se vea como $500k
              tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
              // Forzamos que el eje Y siempre incluya el 0 y el 500k para perspectiva
              domain={['auto', 'auto']} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }}
              formatter={(value) => [`$${value.toLocaleString()}`, 'Capital']}
              labelFormatter={(label) => `Ronda ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="cash" 
              stroke="#3B82F6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCash)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;