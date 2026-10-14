/**
 * SmartComplaintHandler - Institutional Global Footer
 * Blueprint Reference: V1/M1/frontend/03_layout_and_navigation.md
 * Role: Persistent footer providing official IIIT Naya Raipur campus emergency hotlines,
 *       service desk hours, and estate management governance notices.
 */
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/90 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          {/* Institutional Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2.5 text-white font-bold text-sm">
              <img
                src="/iiitnr_logo.png"
                alt="IIIT-NR"
                className="h-7 w-auto object-contain"
              />
              <span>IIIT-NR Estate Division</span>
            </div>
            <p className="leading-relaxed text-slate-400 text-[11px]">
              Automated closed-loop facility maintenance and grievance routing platform for Dr. SPM International Institute of Information Technology, Naya Raipur.
            </p>
          </div>

          {/* Quick Portal Links */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Service Portal
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/submit" className="hover:text-white transition-colors">Lodge Facility Grievance</Link>
              </li>
              <li>
                <Link to="/student" className="hover:text-white transition-colors">Student Grievance History</Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors">Track Ticket by Code</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">Supervisor Operations Console</Link>
              </li>
            </ul>
          </div>

          {/* Emergency Hotlines */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-rose-400 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>24/7 Campus Emergency Desk</span>
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <span className="text-slate-200 block font-semibold">⚡ Electrical &amp; Substation</span>
                <span className="font-mono text-slate-400">0771-2474109 • Room 131</span>
              </li>
              <li>
                <span className="text-slate-200 block font-semibold">🚰 Estate &amp; Water Works</span>
                <span className="font-mono text-slate-400">0771-2474104 • Estate Office</span>
              </li>
              <li>
                <span className="text-slate-200 block font-semibold">🌐 Campus Network &amp; IT</span>
                <span className="font-mono text-slate-400">Room 131C / 131E (IT Cell)</span>
              </li>
            </ul>
          </div>

          {/* Administration & Office Hours */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Campus Location
            </h4>
            <p className="leading-relaxed text-[11px]">
              Plot No. 7, Sector 24, Near Purkhoti Muktangan<br />
              Atal Nagar – Nava Raipur, Chhattisgarh 493661<br />
              Mon – Sat: 09:00 AM – 05:30 PM IST
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center space-x-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>SLA Watchdog Engine v1.0</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© 2026 IIIT Naya Raipur Facilities &amp; Estate Directorate. All rights reserved.</p>
          <div className="flex items-center space-x-4 font-mono text-[10px]">
            <span>Vercel Serverless</span>
            <span>•</span>
            <span>Supabase PostgreSQL</span>
            <span>•</span>
            <span>Google OIDC SSO</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
