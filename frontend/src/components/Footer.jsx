/**
 * SmartComplaintHandler - Minimal Institutional Footer
 */
import React from 'react';

export default function Footer({ isDark = false }) {
  return (
    <footer
      className={`border-t mt-auto transition-colors ${
        isDark
          ? 'bg-[#060A10] text-slate-400 border-slate-800'
          : 'bg-white text-slate-500 border-slate-200'
      }`}
    >
      <div className="w-full px-4 sm:px-8 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <img
            src="/iiitnr_logo.png"
            alt="IIIT-NR"
            className="h-5 w-auto object-contain opacity-90"
          />
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            IIIT Naya Raipur
          </span>
          <span className="text-slate-500">·</span>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Sector 24, Atal Nagar – 493661
          </span>
        </div>

        <div className={`flex flex-wrap items-center gap-4 text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span>Electrical: <span className={isDark ? 'text-slate-200 font-semibold' : 'text-slate-900 font-medium'}>0771-2474109</span></span>
          <span>Estate: <span className={isDark ? 'text-slate-200 font-semibold' : 'text-slate-900 font-medium'}>0771-2474104</span></span>
          <span>IT NOC: <span className="text-emerald-400 font-bold">Room 131C</span></span>
        </div>
      </div>
    </footer>
  );
}
