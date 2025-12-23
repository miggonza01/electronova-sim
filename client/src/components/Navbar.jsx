// client/src/components/Navbar.jsx
import { useAuth } from '../context/AuthContext';
import { LogOut, BarChart3, User, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = ({ round }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-corporate-slate border-b border-corporate-blue/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <BarChart3 className="text-corporate-blue" size={28} />
            <span className="text-white font-bold text-xl tracking-tight">
              ElectroNova <span className="text-corporate-blue">Inc.</span>
            </span>
          </div>

          {/* Info Central: La Ronda */}
          <div className="hidden md:flex items-center bg-corporate-navy px-4 py-1 rounded-full border border-corporate-blue/30">
            <span className="text-corporate-muted text-xs uppercase font-bold mr-2">Estado:</span>
            <span className="text-corporate-success font-mono font-bold">RONDA {round || '-'} ACTIVA</span>
          </div>

          {/* Usuario y Logout */}
          <div className="flex items-center gap-4">
            {/* BOTÓN WIKI */}
            <Link to="/wiki" className="text-corporate-muted hover:text-white transition-colors" title="Ayuda">
                <BookOpen size={20} />
            </Link>
            <div className="flex items-center gap-2 text-right">
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-corporate-muted">CEO</p>
              </div>
              <div className="bg-corporate-blue/20 p-2 rounded-full">
                <User size={20} className="text-corporate-blue" />
              </div>
            </div>

            <button 
              onClick={logout}
              className="text-corporate-muted hover:text-corporate-danger transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;