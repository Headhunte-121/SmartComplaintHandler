/**
 * SmartComplaintHandler - Institutional Portal Homepage
 * Blueprint Reference: V1/M1/frontend/03_layout_and_navigation.md
 * Role: Primary public homepage for the campus facilities service desk, presenting service categories,
 *       emergency hotlines, live operational standards, and direct action pathways.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { currentPersona } = useAuth();

  return (
    <div className="space-y-14 animate-fade-in pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-14 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-400/20 px-3 py-1 rounded-full text-indigo-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Campus Facilities Management • 24/7 Active Service Desk</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Rapid, Accountable Campus Facilities & Grievance Resolution
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
            Official institutional service desk for campus maintenance. File facility grievances, track field technician response in real time, and monitor guaranteed Service Level Agreement (SLA) turnaround times across all hostels and academic blocks.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/submit"
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Report a Facility Issue</span>
            </Link>

            <Link
              to="/track"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 backdrop-blur-xs transition-all flex items-center space-x-2"
            >
              <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Track Existing Ticket</span>
            </Link>

            <Link
              to="/admin"
              className="px-5 py-3.5 text-slate-300 hover:text-white font-semibold text-sm transition-colors flex items-center space-x-1.5"
            >
              <span>Staff Desk</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Decorative Watermark Grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <svg className="w-96 h-96" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </section>

      {/* Institutional Operational Standards Strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Emergency Response
          </div>
          <div className="text-2xl font-black text-rose-600">&lt; 2 Hours</div>
          <p className="text-[11px] text-slate-500">
            Safety hazards (sparks, major pipe bursts) auto-escalate immediately.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            SLA Compliance
          </div>
          <div className="text-2xl font-black text-emerald-600">98.4%</div>
          <p className="text-[11px] text-slate-500">
            Enforced through deterministic lifecycle countdown automata.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Maintenance Squads
          </div>
          <div className="text-2xl font-black text-indigo-600">7 Squads</div>
          <p className="text-[11px] text-slate-500">
            Workload-balanced dispatch ensuring zero technician bottlenecking.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Campus Coverage
          </div>
          <div className="text-2xl font-black text-slate-800">100%</div>
          <p className="text-[11px] text-slate-500">
            All Academic Blocks, Student Hostels, Laboratories & Library.
          </p>
        </div>
      </section>

      {/* Service Department Catalog */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
            Service Directories
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
            Campus Maintenance Departments
          </h2>
          <p className="text-xs text-slate-500">
            Select a service category below or proceed directly to lodge a specific repair ticket.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Electrical */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-200">
              ⚡
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Electrical & Power Grids</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Classroom switchboards, lighting, ceiling fans, hostel wiring, substation transformers, and backup generators.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-indigo-600 flex items-center space-x-1 pt-1">
              <span>Standard Turnaround: 2h - 12h</span>
            </div>
          </div>

          {/* Plumbing */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-200">
              🚰
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Plumbing & Water Supply</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Water coolers, pipelines, restroom drainage, washbasin leaks, overhead tanks, and campus booster pumps.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-indigo-600 flex items-center space-x-1 pt-1">
              <span>Standard Turnaround: 6h - 24h</span>
            </div>
          </div>

          {/* IT Support */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-lg border border-cyan-200">
              💻
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Campus Networks & IT Support</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Wi-Fi access points, computer lab local area networks, projection systems, and campus service portal connectivity.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-indigo-600 flex items-center space-x-1 pt-1">
              <span>Standard Turnaround: 4h - 24h</span>
            </div>
          </div>

          {/* Carpentry */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-lg border border-orange-200">
              🪵
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Carpentry & Civil Fixtures</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Study desk repairs, seminar hall seating, door hinges, window latches, classroom whiteboards, and structural locks.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-indigo-600 flex items-center space-x-1 pt-1">
              <span>Standard Turnaround: 24h - 48h</span>
            </div>
          </div>

          {/* Sanitation */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-200">
              🧹
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sanitation & Hygiene</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Restroom sanitation, waste segregation bins, corridor cleanliness, hostel common area hygiene, and pest control.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-indigo-600 flex items-center space-x-1 pt-1">
              <span>Standard Turnaround: 12h - 24h</span>
            </div>
          </div>

          {/* General Facilities */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg border border-purple-200">
              🏛️
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">General Estate Administration</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Central library study cubicles, sports grounds, parking facilities, outdoor streetlights, and civil repairs.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-indigo-600 flex items-center space-x-1 pt-1">
              <span>Standard Turnaround: 24h - 72h</span>
            </div>
          </div>
        </div>
      </section>

      {/* Active Campus Maintenance Notice Board */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h3 className="text-sm font-bold text-slate-800">
              Campus Maintenance Advisories & Operational Notices
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Updated 30 mins ago</span>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3 text-xs">
            <span className="text-base mt-0.5">ℹ️</span>
            <div>
              <h4 className="font-bold text-slate-800">
                Scheduled Power Substation Maintenance — North Campus
              </h4>
              <p className="text-slate-500 mt-0.5">
                Substation 2 preventive overhaul is scheduled this Sunday between 02:00 AM and 05:00 AM. Backup diesel generators will support hostel study halls.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3 text-xs">
            <span className="text-base mt-0.5">🌧️</span>
            <div>
              <h4 className="font-bold text-slate-800">
                Monsoon Drainage Inspections Active
              </h4>
              <p className="text-slate-500 mt-0.5">
                Plumbing Unit Alpha is conducting daily inspections of roof rainwater downpipes and basement sumps across all academic complexes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Call-Out Banner */}
      <section className="rounded-2xl bg-amber-500/10 border border-amber-300/40 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl mt-0.5">⚠️</span>
          <div>
            <h3 className="text-sm font-bold text-amber-900">
              Active Life-Safety Hazard? Call Control Room Directly
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              For visible fire, sparking high-voltage cables, or structural collapse risks, call campus emergency hotline <strong>Ext 100</strong> immediately.
            </p>
          </div>
        </div>
        <Link
          to="/submit"
          className="self-start sm:self-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          Lodge Priority Ticket
        </Link>
      </section>
    </div>
  );
}
