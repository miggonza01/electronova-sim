import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        setTimeLeft("00:00:00");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Formato discreto: 1d 02h 15m 30s
      let text = "";
      if (days > 0) text += `${days}d `;
      text += `${hours.toString().padStart(2, '0')}h `;
      text += `${minutes.toString().padStart(2, '0')}m `;
      text += `${seconds.toString().padStart(2, '0')}s`;

      setTimeLeft(text);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return <span className="text-slate-500">--:--</span>;

  return (
    <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded border border-slate-700">
      <span className="text-xs text-slate-400 uppercase">Tiempo Restante:</span>
      <span className="font-mono font-bold text-emerald-400 text-sm">{timeLeft}</span>
    </div>
  );
};

export default CountdownTimer;