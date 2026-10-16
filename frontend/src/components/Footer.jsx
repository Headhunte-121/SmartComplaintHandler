/**
 * SmartComplaintHandler - Minimal Institutional Footer
 */
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#0A110D] text-[#DAD0C6]/70 border-t border-[rgba(167,173,137,0.12)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <img
            src="/iiitnr_logo.png"
            alt="IIIT-NR"
            className="h-5 w-auto object-contain opacity-85"
          />
          <span className="font-semibold text-[#FAF7F2]">IIIT Naya Raipur</span>
          <span className="text-slate-600">·</span>
          <span className="text-[#DAD0C6]/60">Sector 24, Atal Nagar – 493661</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#DAD0C6]/70">
          <span>Electrical: <span className="text-[#FAF7F2]">0771-2474109</span></span>
          <span>Estate: <span className="text-[#FAF7F2]">0771-2474104</span></span>
          <span>IT NOC: <span className="text-[#A7AD89] font-bold">Room 131C</span></span>
        </div>
      </div>
    </footer>
  );
}
