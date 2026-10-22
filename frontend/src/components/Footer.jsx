/**
 * SmartComplaintHandler - Ultra-Compact Institutional Footer
 * Style: Slim Dark Enterprise Bar (~32-36px)
 */
import React from 'react';

export default function Footer({ isDark = false }) {
  return (
    <footer
      className={`border-t mt-auto transition-colors shrink-0 ${
        isDark
          ? 'bg-[#0B0F14] text-[#64748B] border-[#252D38]'
          : 'bg-[#f8fafc] text-slate-500 border-slate-200'
      }`}
    >
      <div className="w-full px-5 sm:px-8 lg:px-9 xl:px-10 py-1.5 sm:py-2 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px]">
        {/* Left: Institute identity */}
        <div className="flex items-center space-x-2">
          <img
            src="/iiitnr_logo.png"
            alt="IIIT-NR"
            className="h-3.5 w-auto object-contain opacity-80"
          />
          <span className={`font-semibold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-slate-800'}`}>
            IIIT Naya Raipur
          </span>
          <span className={isDark ? 'text-[#343E4B]' : 'text-slate-300'}>·</span>
          <span className={`text-[10px] hidden sm:inline ${isDark ? 'text-[#64748B]' : 'text-slate-500'}`}>
            Campus Facilities Directorate
          </span>
        </div>

        {/* Right: Compact direct maintenance contacts */}
        <div className={`flex flex-wrap items-center gap-3 text-[10px] font-mono ${isDark ? 'text-[#64748B]' : 'text-slate-500'}`}>
          <span>Electrical: <span className={isDark ? 'text-[#94A3B8]' : 'text-slate-700'}>0771-2474109</span></span>
          <span className={isDark ? 'text-[#343E4B]' : 'text-slate-300'}>·</span>
          <span>Estate: <span className={isDark ? 'text-[#94A3B8]' : 'text-slate-700'}>0771-2474104</span></span>
          <span className={isDark ? 'text-[#343E4B]' : 'text-slate-300'}>·</span>
          <span>IT NOC: <span className="text-[#00B386] font-semibold">131C</span></span>
        </div>
      </div>
    </footer>
  );
}
