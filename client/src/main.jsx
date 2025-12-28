import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Importamos ambas versiones
import App from './App';
import AppV2 from './AppV2';

// Leemos el modo desde Vite
// Si ejecutamos "npm run dev:v2", el mode será 'v2' (definido en package.json)
const isV2 = import.meta.env.MODE === 'v2';

const root = ReactDOM.createRoot(document.getElementById('root'));

if (isV2) {
  console.log('🚀 BOOTSTRAP: Iniciando en MODO V2 (Corporate Tech)');
  root.render(
    <React.StrictMode>
      <AppV2 />
    </React.StrictMode>
  );
} else {
  console.log('ℹ️ BOOTSTRAP: Iniciando en MODO V1 (Legacy)');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}