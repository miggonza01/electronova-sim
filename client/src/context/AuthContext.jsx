// client/src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

// Creamos el contexto (la nube de datos)
const AuthContext = createContext();

// --- CORRECCIÓN AQUÍ ---
// Le decimos a Vite que ignore la advertencia en la siguiente línea
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

// Proveedor del Contexto (envuelve a toda la app)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Datos del usuario
  const [loading, setLoading] = useState(true); // ¿Estamos cargando?

  // Al iniciar, verificamos si ya había una sesión guardada
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        // Si hay datos guardados, restauramos la sesión
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, []);

  // Función de Login
  const login = async (email, password) => {
    try {
      // 1. Pedir al servidor que verifique credenciales
      const response = await api.post('/auth/login', { email, password });
      
      // 2. Si es exitoso, guardar Token y Usuario en el navegador (LocalStorage)
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // 3. Actualizar estado global
      setUser(user);
      return { success: true };
    } catch (error) {
      console.error("Login fallido:", error.response?.data?.error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error de conexión' 
      };
    }
  };

  // Función de Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login'; // Redirigir a login
  };

  // Exponemos estos datos y funciones a toda la app
  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};