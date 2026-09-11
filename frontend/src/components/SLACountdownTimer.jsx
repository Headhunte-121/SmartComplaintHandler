/**
 * SmartComplaintHandler - SLA Countdown Timer
 * Blueprint Reference: V1/M5/frontend/02_sla_countdown_timer.md
 * Role: Dynamic countdown pill ticking every second; transitions green -> amber -> pulsing red on breach.
 */
import React, { useState, useEffect } from 'react';

export default function SLACountdownTimer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isBreached, setIsBreached] = useState(false);

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) {
        setIsBreached(true);
        setTimeLeft('BREACHED');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        setTimeLeft(`${hours}h ${mins}m`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${isBreached ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
      {timeLeft || 'Calculating...'}
    </span>
  );
}
