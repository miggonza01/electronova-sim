// client/src/pages/WikiPage.jsx
import Navbar from '../components/Navbar';
import { BookOpen, AlertTriangle, TrendingUp, Truck } from 'lucide-react';

const WikiPage = () => {
  // Simulamos la ronda para el navbar (o podrías pasarla por props/contexto)
  const currentRound = "INFO"; 

  return (
    <div className="min-h-screen bg-corporate-navy font-sans text-white pb-20">
      <Navbar round={currentRound} />

      <main className="max-w-4xl mx-auto px-4 py-12">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold flex justify-center items-center gap-3 mb-4">
            <BookOpen className="text-corporate-blue" size={40} />
            Centro de Conocimiento
          </h1>
          <p className="text-corporate-muted text-lg">
            Reglas operativas y financieras de ElectroNova Inc.
          </p>
        </div>

        <div className="space-y-8">
          
          {/* SECCIÓN 1: INVENTARIOS */}
          <section className="bg-corporate-slate p-8 rounded-2xl border border-white/10 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-corporate-blue">
              <AlertTriangle /> Regla de Obsolescencia
            </h2>
            <p className="text-corporate-muted mb-4">
              La tecnología avanza rápido. Los productos almacenados pierden valor con el tiempo.
              Nuestro sistema utiliza el método <strong>FIFO (First-In, First-Out)</strong> para las ventas.
            </p>
            <div className="bg-corporate-navy p-4 rounded-lg border border-white/5">
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Edad 0-2 Rondas:</span>
                  <span className="text-corporate-success font-bold">Valor 100% (Vendible)</span>
                </li>
                <li className="flex justify-between">
                  <span>Edad 3 Rondas:</span>
                  <span className="text-corporate-warning font-bold">Alerta de Vencimiento</span>
                </li>
                <li className="flex justify-between">
                  <span>Edad 4+ Rondas:</span>
                  <span className="text-corporate-danger font-bold">OBSOLETO (Pérdida Total)</span>
                </li>
              </ul>
            </div>
          </section>

          {/* SECCIÓN 2: SCORECARD */}
          <section className="bg-corporate-slate p-8 rounded-2xl border border-white/10 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-corporate-warning">
              <TrendingUp /> Winner Scorecard (WSC)
            </h2>
            <p className="text-corporate-muted mb-4">
              Ganar no es solo tener dinero. El índice WSC mide la salud integral de tu empresa.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-corporate-navy p-4 rounded-lg">
                <div className="text-2xl font-bold text-corporate-blue">40%</div>
                <div className="text-xs text-corporate-muted uppercase mt-1">Rentabilidad</div>
              </div>
              <div className="bg-corporate-navy p-4 rounded-lg">
                <div className="text-2xl font-bold text-corporate-success">30%</div>
                <div className="text-xs text-corporate-muted uppercase mt-1">Ética</div>
              </div>
              <div className="bg-corporate-navy p-4 rounded-lg">
                <div className="text-2xl font-bold text-corporate-warning">30%</div>
                <div className="text-xs text-corporate-muted uppercase mt-1">Satisfacción</div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: LOGÍSTICA */}
          <section className="bg-corporate-slate p-8 rounded-2xl border border-white/10 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-corporate-success">
              <Truck /> Costos Operativos
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-corporate-muted">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2">Concepto</th>
                    <th className="py-2">Costo</th>
                    <th className="py-2">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-3 text-white">Producción</td>
                    <td className="py-3 font-mono">$50.00 / u</td>
                    <td>Costo fijo de manufactura.</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-white">Almacenaje</td>
                    <td className="py-3 font-mono">$0.20 / u</td>
                    <td>Se cobra por unidad al cierre de ronda.</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-white">Marketing</td>
                    <td className="py-3 font-mono">Variable</td>
                    <td>Rendimientos decrecientes (Logarítmico).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default WikiPage;