// ============================================
// FILE: client/src/pages/LoginPageV2.jsx
// PURPOSE: Autenticación Unificada (Login + Registro con Código de Sala)
// ============================================

import React, { useState } from 'react';
import api from '../services/api.v2.js';
import logo from '../assets/LogoElectroNova.png';

const LoginPageV2 = () => {
  const [isRegistering, setIsRegistering] = useState(false); // Toggle entre Login y Registro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado único para ambos formularios
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    gameCode: '' // Solo para registro
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegistering ? '/auth/register' : '/auth/login';

    try {
      const response = await api.post(endpoint, formData);
      const { token, name, companyId, role } = response.data;
      
      localStorage.setItem('token_v2', token);
      localStorage.setItem('user_v2', JSON.stringify({ name, companyId, role }));
      
      if (role === 'admin') {
          window.location.href = '/admin';
      } else {
          window.location.href = '/dashboard'; 
      }
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
      
      <div style={{ backgroundColor: '#1E293B', padding: '2.5rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '420px', border: '1px solid #334155', zIndex: 10 }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src={logo} alt="ElectroNova Logo" style={{ height: '60px', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#F8FAFC', fontSize: '1.2rem', fontWeight: 'bold' }}>Simulador de Estrategias</h2>
        </div>

        {/* TABS LOGIN/REGISTER */}
        <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: '1.5rem' }}>
            <button 
                onClick={() => { setIsRegistering(false); setError(''); }}
                style={{ flex: 1, padding: '0.75rem', color: !isRegistering ? '#3B82F6' : '#64748B', borderBottom: !isRegistering ? '2px solid #3B82F6' : 'none', fontWeight: 'bold', background: 'none', cursor: 'pointer' }}
            >
                Ingresar
            </button>
            <button 
                onClick={() => { setIsRegistering(true); setError(''); }}
                style={{ flex: 1, padding: '0.75rem', color: isRegistering ? '#3B82F6' : '#64748B', borderBottom: isRegistering ? '2px solid #3B82F6' : 'none', fontWeight: 'bold', background: 'none', cursor: 'pointer' }}
            >
                Registrarse
            </button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* CAMPOS SOLO REGISTRO */}
          {isRegistering && (
            <>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', color: '#CBD5E1', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Nombre Completo</label>
                    <input type="text" name="name" onChange={handleChange} required className="w-full"
                        style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: 'white' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', color: '#CBD5E1', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Nombre de tu Empresa</label>
                    <input type="text" name="companyName" onChange={handleChange} required 
                        style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: 'white' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', color: '#F59E0B', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>CÓDIGO DE SALA</label>
                    <input type="text" name="gameCode" onChange={handleChange} required placeholder="Ej: ROOM-ABCD"
                        style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0F172A', border: '1px solid #F59E0B', borderRadius: '0.5rem', color: 'white', textTransform: 'uppercase' }} />
                </div>
            </>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#CBD5E1', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Email</label>
            <input type="email" name="email" onChange={handleChange} required 
              style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: 'white' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#CBD5E1', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Contraseña</label>
            <input type="password" name="password" onChange={handleChange} required 
              style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: 'white' }} />
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Procesando...' : (isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión')}
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