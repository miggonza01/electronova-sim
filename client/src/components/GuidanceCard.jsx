import React, { useState } from 'react';

const GuidanceCard = ({ title, rules }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-blue-900/20 border border-blue-800 rounded-lg mb-6 overflow-hidden">
      <div 
        className="bg-blue-900/40 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-blue-900/60 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-blue-300 font-bold flex items-center gap-2">
          ℹ️ {title}
        </h3>
        <span className="text-blue-400 text-sm">{isOpen ? 'Ocultar ▲' : 'Mostrar ▼'}</span>
      </div>
      
      {isOpen && (
        <div className="p-4 text-sm text-blue-100/80 space-y-2">
          {rules.map((rule, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <span className="text-blue-400 font-bold">•</span>
              <p>{rule}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuidanceCard;