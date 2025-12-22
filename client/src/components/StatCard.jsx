// client/src/components/StatCard.jsx
import React from 'react';
import { HelpCircle } from 'lucide-react'; // Icono por defecto por seguridad

/**
 * Componente de Tarjeta Estadística (KPI)
 * @param {string} title - Título de la tarjeta (ej. "Capital")
 * @param {string|number} value - El valor principal a mostrar
 * @param {component} icon - El componente de icono de Lucide (ej. DollarSign)
 * @param {string} color - Tema de color: 'blue', 'green', 'red', 'yellow'
 * @param {string} subtext - Texto pequeño debajo del valor
 */
const StatCard = ({ title, value, icon, color = "blue", subtext }) => {
  
  // 1. SEGURIDAD DE ICONO:
  // React requiere que los componentes empiecen con Mayúscula.
  // Asignamos la prop 'icon' (minúscula) a una variable 'IconComponent' (Mayúscula).
  // Si 'icon' es undefined, usamos 'HelpCircle' para evitar que la app explote.
  const IconComponent = icon || HelpCircle;

  // 2. DICCIONARIO DE TEMAS:
  // Define los estilos según el color elegido.
  const themes = {
    blue: {
      wrapper: "text-corporate-blue bg-corporate-blue/10 border-corporate-blue/20",
      text: "text-corporate-blue"
    },
    green: {
      wrapper: "text-corporate-success bg-corporate-success/10 border-corporate-success/20",
      text: "text-corporate-success"
    },
    red: {
      wrapper: "text-corporate-danger bg-corporate-danger/10 border-corporate-danger/20",
      text: "text-corporate-danger"
    },
    yellow: {
      wrapper: "text-corporate-warning bg-corporate-warning/10 border-corporate-warning/20",
      text: "text-corporate-warning"
    },
  };

  // Seleccionamos el tema o usamos blue por defecto
  const currentTheme = themes[color] || themes.blue;

  return (
    <div className="bg-corporate-slate p-6 rounded-xl border border-white/5 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        {/* Título */}
        <h3 className="text-corporate-muted text-xs font-bold uppercase tracking-wider">
          {title}
        </h3>
        
        {/* Icono con fondo de color */}
        <div className={`p-2 rounded-lg ${currentTheme.wrapper}`}>
          <IconComponent size={20} />
        </div>
      </div>
      
      {/* Valor y Subtexto */}
      <div className="flex flex-col">
        <span className="text-2xl font-mono font-bold text-white tracking-tight">
          {value}
        </span>
        {subtext && (
          <span className="text-xs text-corporate-muted mt-1 font-medium">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;