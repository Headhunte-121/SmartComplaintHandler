/**
 * SmartComplaintHandler - Institutional Footer (Zero promotional filler)
 */
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/90 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <img
            src="/iiitnr_logo.png"
            alt="IIIT-NR"
            className="h-6 w-auto object-contain"
          />
          <span className="font-bold text-white">IIIT Naya Raipur</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Plot No. 7, Sector 24, Atal Nagar – 493661</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
          <span>⚡ Electrical: 0771-2474109</span>
          <span>🚰 Estate: 0771-2474104</span>
          <span>🌐 IT NOC: Room 131C / 131E</span>
        </div>
      </div>
    </footer>
  );
}
