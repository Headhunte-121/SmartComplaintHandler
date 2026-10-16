/**
 * SmartComplaintHandler - Minimal Institutional Footer
 */
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white text-slate-500 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <img
            src="/iiitnr_logo.png"
            alt="IIIT-NR"
            className="h-5 w-auto object-contain opacity-90"
          />
          <span className="font-semibold text-slate-900">IIIT Naya Raipur</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">Sector 24, Atal Nagar – 493661</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-600">
          <span>Electrical: <span className="text-slate-900 font-medium">0771-2474109</span></span>
          <span>Estate: <span className="text-slate-900 font-medium">0771-2474104</span></span>
          <span>IT NOC: <span className="text-green-600 font-bold">Room 131C</span></span>
        </div>
      </div>
    </footer>
  );
}
