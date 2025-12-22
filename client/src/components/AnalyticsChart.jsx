// client/src/components/AnalyticsChart.jsx
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const AnalyticsChart = ({ history }) => {
  
  // Si no hay historia (Ronda 1), mostramos datos vacíos o iniciales
  const data = history && history.length > 0 ? history : [
    { round: 0, cash: 500000 } // Punto de partida
  ];

  return (
    <div className="bg-corporate-slate p-6 rounded-xl border border-white/5 shadow-lg">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-corporate-blue"></span>
        Evolución de Capital
      </h3>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
              tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;