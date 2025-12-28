import React from 'react';
// Usamos un router simple o el mismo Browser Router, pero definimos rutas v2
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPageV2 from './pages/LoginPageV2';
import DashboardPageV2 from './pages/DashboardPageV2';
import DecisionPageV2 from './pages/DecisionPageV2';

// Componente Placeholder para el Dashboard (Lo haremos en el siguiente paso)
const DashboardV2 = () => (
  <div style={{ color: 'white', background: '#0F172A', height: '100vh', padding: '2rem' }}>
    <h1>🚀 Dashboard V2 (En Construcción)</h1>
    <p>Bienvenido al simulador financiero.</p>
    <button onClick={() => {
        localStorage.removeItem('token_v2');
        window.location.href = '/';
    }}>Cerrar Sesión</button>
  </div>
);

const AppV2 = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPageV2 />} />
        <Route path="/login-v2" element={<LoginPageV2 />} />
        <Route path="/dashboard" element={<DashboardPageV2 />} /> {/* <--- Usar el componente real */}
        <Route path="/decision" element={<DecisionPageV2 />} />
        {/* Cualquier otra ruta redirige al login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppV2;