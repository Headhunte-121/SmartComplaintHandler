/**
 * SmartComplaintHandler - Institutional Global Footer
 * Blueprint Reference: V1/M1/frontend/03_layout_and_navigation.md
 * Role: Persistent footer providing official campus emergency hotlines, service desk hours,
 *       facilities administration directory, and estate management governance notices.
 */
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          {/* Institutional Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <span className="text-xl">🏛️</span>
              <span>Campus Facilities Division</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Centralized estate maintenance and facility service desk ensuring prompt physical repair turnaround, emergency life-safety resolution, and auditable Service Level Agreements across all campus infrastructure.
            </p>
          </div>

          {/* Quick Portal Links */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Campus Service Desk
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Facilities Home</Link>
              </li>
              <li>
                <Link to="/submit" className="hover:text-white transition-colors">Report Maintenance Issue</Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors">Track Existing Grievance</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">Staff Operations Console</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Campus SSO Login</Link>
              </li>
            </ul>
          </div>

          {/* Emergency Hotlines */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-rose-400 uppercase tracking-wider text-[11px] flex items-center space-x-1">
              <span>⚠️</span>
              <span>24/7 Emergency Hotlines</span>
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="text-slate-300 block font-semibold">⚡ Electrical Hazard & Fire</span>
                <span className="font-mono text-slate-400">Ext 101 • +91-11-2345-0101</span>
              </li>
              <li>
                <span className="text-slate-300 block font-semibold">🚰 Water Main Flooding</span>
                <span className="font-mono text-slate-400">Ext 102 • +91-11-2345-0102</span>
              </li>
              <li>
                <span className="text-slate-300 block font-semibold">🛡️ Campus Control Room</span>
                <span className="font-mono text-slate-400">Ext 100 (Toll-Free Inside Campus)</span>
              </li>
            </ul>
          </div>

          {/* Administration & Office Hours */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Estate Office Information
            </h4>
            <p className="leading-relaxed">
              Ground Floor, Facilities Complex<br />
              Administrative Block, West Campus<br />
              Mon – Fri: 08:30 AM – 06:00 PM<br />
              Sat: 09:00 AM – 01:00 PM
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80 text-[11px] text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Automated SLA Engine Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Bottom Strip */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© 2026 University Facilities & Estate Management Directorate. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <Link to="/track" className="hover:text-slate-400 transition-colors">Service Standards</Link>
            <span>•</span>
            <Link to="/developer" className="hover:text-slate-400 transition-colors">Technical Architecture</Link>
            <span>•</span>
            <span>Internal Campus Network</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
