/**
 * SmartComplaintHandler - Minimal Institutional Footer
 */
import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/60 text-slate-400 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-600">IIIT Naya Raipur</span>
          <span>·</span>
          <span>Campus Facilities &amp; Hostel Maintenance</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span>Estate: 0771-2474104</span>
          <span>·</span>
          <span>Electrical: 0771-2474109</span>
          <span>·</span>
          <span>IT NOC: Room 131C</span>
        </div>
      </div>
    </footer>
  );
}
