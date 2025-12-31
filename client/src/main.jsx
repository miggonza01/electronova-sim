import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Importamos solo la V2 o la definimos como principal
import AppV2 from './AppV2';

// --- CAMBIO CRÍTICO PARA PRODUCCIÓN ---
// Forzamos que siempre sea V2, ya que este es el despliegue oficial.
const root = ReactDOM.createRoot(document.getElementById('root'));

console.log('🚀 BOOTSTRAP: Iniciando ElectroNova v2.0 (Producción)');

root.render(
  <React.StrictMode>
    <AppV2 />
  </React.StrictMode>
);