// ============================================
// FILE: client/src/pages/LoginPageV2.jsx
// PURPOSE: Login con Redirección basada en Rol (Admin vs Student)
// ============================================

import React, { useState } from 'react';
import api from '../services/api.v2.js';
import logo from '../assets/LogoElectroNova.png';

const LoginPageV2 = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      
      // Extraemos el ROL de la respuesta
      const { token, name, companyId, role } = response.data;
      
      localStorage.setItem('token_v2', token);
      localStorage.setItem('user_v2', JSON.stringify({ name, companyId, role }));
      
      // --- LÓGICA DE REDIRECCIÓN INTELIGENTE ---
      if (role === 'admin') {
          console.log("👮 Acceso Admin detectado. Redirigiendo al Panel Docente...");
          window.location.href = '/admin';
      } else {
          console.log("🎓 Acceso Estudiante detectado. Redirigiendo al Dashboard...");
          window.location.href = '/dashboard'; 
      }
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error de conexión con el servidor v2');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', backgroundColor: '#0F172A', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", position: 'relative'
    }}>
      
      <div style={{ 
        backgroundColor: '#1E293B', padding: '2.5rem', borderRadius: '1rem', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px',
        border: '1px solid #334155', zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img 
            src={logo} 
            alt="ElectroNova Logo" 
            style={{ 
                height: '60px', 
                marginBottom: '1rem',
                display: 'block',
                margin: '0 auto 1rem' 
            }} 
          />
          <h2 style={{ color: '#F8FAFC', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            Simulador de Estrategias de Negocios
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Acceso Corporativo v2.0
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: '#CBD5E1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Email Corporativo</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: 'white', outline: 'none' }}
              placeholder="user@electronova.inc"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#CBD5E1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Contraseña</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: 'white', outline: 'none' }}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Autenticando...' : 'Iniciar Simulación'}
          </button>
        </form>
      </div>

      <div style={{ position: 'absolute', bottom: '1rem', color: '#64748B', fontSize: '0.75rem', textAlign: 'center' }}>
        © Maribel Pinheiro & Miguel González | Dic-2025
      </div>
    </div>
  );
};

export default LoginPageV2;