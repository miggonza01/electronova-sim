// client/src/components/AdminRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Verificando credenciales...</div>;

  // Si existe el usuario Y su rol es 'admin', déjalo pasar.
  // Si no, mándalo al dashboard normal (o al login).
  return (user && user.role === 'admin') 
    ? <Outlet /> 
    : <Navigate to="/dashboard" replace />;
};

export default AdminRoute;