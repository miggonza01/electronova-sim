// client/src/components/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { user } = useAuth();

  // Si hay usuario, renderiza el contenido (Outlet).
  // Si no, redirige a /login.
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;