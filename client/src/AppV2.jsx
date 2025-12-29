// ============================================
// FILE: client/src/AppV2.jsx
// PURPOSE: Enrutador Principal (Incluye ruta de Admin)
// ============================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importación de Páginas
import LoginPageV2 from './pages/LoginPageV2';
import DashboardPageV2 from './pages/DashboardPageV2';
import DecisionPageV2 from './pages/DecisionPageV2';
import AdminDashboardV2 from './pages/AdminDashboardV2'; // <--- VERIFICA ESTA IMPORTACIÓN
import GameOverPage from './pages/GameOverPage';

const AppV2 = () => {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<LoginPageV2 />} />
        <Route path="/login-v2" element={<LoginPageV2 />} />

        {/* Rutas de Estudiante */}
        <Route path="/dashboard" element={<DashboardPageV2 />} />
        <Route path="/decision" element={<DecisionPageV2 />} />

        {/* Ruta de Admin (ESTA ES LA QUE FALTABA O ESTABA MAL) */}
        <Route path="/admin" element={<AdminDashboardV2 />} />

        {/* Fallback: Cualquier ruta desconocida vuelve al login */}
        <Route path="*" element={<Navigate to="/" replace />} />

        {/* Ruta de Game Over */}
        <Route path="/game-over" element={<GameOverPage />} />

      </Routes>
    </Router>
  );
};

export default AppV2;