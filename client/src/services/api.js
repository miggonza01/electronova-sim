// client/src/services/api.js
import axios from 'axios';

// Definimos la dirección base del Backend
// Si estás en desarrollo local, es el puerto 5000
// Si existe VITE_API_URL (en la nube), úsala. Si no, usa localhost.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Creamos una instancia de Axios con configuración predeterminada
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR: Inyectar el Token automáticamente
// Antes de enviar CUALQUIER petición, revisa si tenemos el token guardado
// y lo pega en la cabecera "Authorization".
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Buscar token en el navegador
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;