// client/src/pages/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle } from 'lucide-react'; // Iconos

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      // --- CORRECCIÓN AQUÍ ---
      // Verificamos el rol del usuario que acabamos de loguear
      // El 'result.user' debe venir del AuthContext modificado (ver paso siguiente)
      // O podemos leerlo del localStorage temporalmente
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (user && user.role === 'admin') {
        navigate('/admin'); // Admin a su torre
      } else {
        navigate('/dashboard'); // Estudiante a su panel
      }
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-corporate-navy flex items-center justify-center p-4">
      <div className="bg-corporate-slate w-full max-w-md p-8 rounded-2xl shadow-2xl border border-corporate-blue/10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white font-sans tracking-tight">
            ElectroNova <span className="text-corporate-blue">Inc.</span>
          </h1>
          <p className="text-corporate-muted mt-2 text-sm">
            Terminal de Acceso Corporativo
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Alerta de Error */}
          {error && (
            <div className="bg-corporate-danger/10 border border-corporate-danger text-corporate-danger px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Input Email */}
          <div className="space-y-2">
            <label className="text-corporate-muted text-xs font-bold uppercase tracking-wider">
              ID Corporativo (Email)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-corporate-muted" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-corporate-navy border border-corporate-blue/30 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-corporate-blue focus:ring-1 focus:ring-corporate-blue transition-all"
                placeholder="ej. admin@electronova.com"
                required
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-2">
            <label className="text-corporate-muted text-xs font-bold uppercase tracking-wider">
              Clave de Acceso
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-corporate-muted" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-corporate-navy border border-corporate-blue/30 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-corporate-blue focus:ring-1 focus:ring-corporate-blue transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Botón Submit */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all 
              ${isSubmitting 
                ? 'bg-corporate-muted cursor-wait' 
                : 'bg-corporate-blue hover:bg-blue-600 shadow-corporate-blue/25'
              }`}
          >
            {isSubmitting ? 'Autenticando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-corporate-muted">
          Sistema Seguro v1.0 | Acceso restringido a personal autorizado
        </div>
      </div>
    </div>
  );
};

export default LoginPage;