// ============================================
// FILE: client/src/services/api.v2.js
// VERSION: v2.0.0
// PURPOSE: Cliente HTTP dedicado para Backend v2
// ============================================

import axios from 'axios';

// Vite carga las variables según el modo (--mode v2 busca .env.v2)
const API_URL = import.meta.env.VITE_API_URL || 'https://electronova-backend-mvp.onrender.com/api';

console.log('🔌 CONECTANDO A BACKEND V2:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para inyectar Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token_v2'); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Interceptor para manejo de errores global
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token_v2');
            window.location.href = '/login-v2';
        }
        return Promise.reject(error);
    }
);

export default api;