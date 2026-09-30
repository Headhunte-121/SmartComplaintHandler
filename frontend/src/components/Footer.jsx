/**
 * SmartComplaintHandler - Global Footer Component
 * Blueprint Reference: V1/M1/frontend/03_layout_and_navigation.md
 * Role: Persistent footer rendering campus maintenance disclaimers, emergency hotlines, and version metadata.
 */
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-500">
          {/* Institutional Mission */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
              Campus Facilities & Governance
            </h4>
            <p className="leading-relaxed">
              Closed-loop campus grievance resolution platform enforcing deterministic department routing, workload-balanced maintenance squad dispatch, and auditable SLA turnaround times.
            </p>
          </div>

          {/* Emergency Contacts */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
              Emergency Maintenance Hotlines
            </h4>
            <ul className="space-y-1">
              <li>⚡ Electrical Emergency: <span className="font-mono font-semibold text-slate-700">Ext 101 / +91-98765-00101</span></li>
              <li>🚰 Plumbing & Water Leakage: <span className="font-mono font-semibold text-slate-700">Ext 102 / +91-98765-00102</span></li>
              <li>🛡️ Campus Control Room: <span className="font-mono font-semibold text-slate-700">Ext 100 (24x7 Active)</span></li>
            </ul>
          </div>

          {/* Platform Status */}
          <div className="md:text-right">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
              System Architecture
            </h4>
            <p className="mb-2">
              FastAPI 0.110 • SQLite WAL • React 18 • Vite 5
            </p>
            <div className="inline-flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono font-bold text-slate-700 text-[11px]">v1.0.0-core</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>© 2026 Institutional Campus Facilities Management. All rights reserved.</p>
          <p className="mt-1 sm:mt-0">Designed for college engineering coursework & viva presentation.</p>
        </div>
      </div>
    </footer>
  );
}
