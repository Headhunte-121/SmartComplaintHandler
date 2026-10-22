/**
 * SmartComplaintHandler - Minimal Institutional Footer
 * Style: Dark Enterprise Operations Footer
 */
import React from 'react';

export default function Footer({ isDark = false }) {
  return (
    <footer
      className={`border-t mt-auto transition-colors ${
        isDark
          ? 'bg-[#0B0F14] text-[#94A3B8] border-[#252D38]'
          : 'bg-[#f1f5f9] text-slate-600 border-slate-300'
      }`}
    >
      <div className="w-full px-5 sm:px-8 lg:px-10 xl:px-12 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <img
            src="/iiitnr_logo.png"
            alt="IIIT-NR"
            className="h-4.5 w-auto object-contain opacity-90"
          />
          <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-slate-900'}`}>
            IIIT Naya Raipur
          </span>
          <span className={isDark ? 'text-[#64748B]' : 'text-slate-400'}>·</span>
          <span className={isDark ? 'text-[#94A3B8]' : 'text-slate-500'}>
            Sector 24, Atal Nagar – 493661
          </span>
        </div>

        <div className={`flex flex-wrap items-center gap-4 text-[11px] font-mono ${isDark ? 'text-[#94A3B8]' : 'text-slate-600'}`}>
          <span>Electrical: <span className={isDark ? 'text-[#F1F5F9] font-semibold' : 'text-slate-900 font-medium'}>0771-2474109</span></span>
          <span>Estate: <span className={isDark ? 'text-[#F1F5F9] font-semibold' : 'text-slate-900 font-medium'}>0771-2474104</span></span>
          <span>IT NOC: <span className="text-[#00B386] font-bold">Room 131C</span></span>
        </div>
      </div>
    </footer>
  );
}
