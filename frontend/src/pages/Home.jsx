/**
 * SmartComplaintHandler - Official IIIT Naya Raipur Campus Facilities & Grievance Command Hub
 * Blueprint Reference: V1/M2/frontend/01_home_landing_page.md
 * Features:
 * - Live telemetry metrics, interactive IIIT Naya Raipur 50-Acre Campus Map (Plot No. 7, Sector 24, Atal Nagar)
 * - Direct 1-click Hostel & Academic Building complaint launch
 * - Official IIIT-NR Estate, Electrical, and IT Network Engineer directory
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAnalyticsSummary, fetchComplaints } from '../api/complaints';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';
import CampusMapSelector from '../components/CampusMapSelector';
import {
  IIITNR_HOSTELS,
  IIITNR_ACADEMIC_BLOCKS,
  IIITNR_CAMPUS_METADATA,
} from '../data/iiitnrCampusData';

export default function Home() {
  const navigate = useNavigate();
  const { currentUser, isStudent, canAccessOperations, isTechnician } = useAuth();
  const [trackingCode, setTrackingCode] = useState('');
  const [summary, setSummary] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMapBuilding, setSelectedMapBuilding] = useState(IIITNR_HOSTELS[0].name);

  useEffect(() => {
    let isMounted = true;
    const loadTelemetry = async () => {
      try {
        const [analyticsData, ticketsData] = await Promise.all([
          fetchAnalyticsSummary().catch(() => null),
          fetchComplaints({ limit: 4 }).catch(() => []),
        ]);
        if (!isMounted) return;
        if (analyticsData) setSummary(analyticsData);
        if (Array.isArray(ticketsData)) setRecentTickets(ticketsData.slice(0, 4));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadTelemetry();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const cleaned = trackingCode.trim().toUpperCase();
    if (!cleaned) return;
    navigate(`/track?code=${encodeURIComponent(cleaned)}`);
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Dark Architectural Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-2xl bg-dark-architectural-grid border border-slate-800">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Dr. SPM IIIT Naya Raipur • Plot No. 7, Sector 24, Atal Nagar</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.12]">
              IIIT-NR Campus Facilities &amp; Hostel Maintenance Hub
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Report electrical, plumbing, Wi-Fi, or carpentry issues across{' '}
              <strong className="text-white">Ramanujan, Bhabha, Bose, Raman, and Shabhari Houses</strong>,{' '}
              <strong className="text-white">Smart E-Classrooms (E-101/E-102)</strong>, and{' '}
              <strong className="text-white">CSE/DSAI/ECE Research Labs</strong> with automated hazard triage and live SLA tracking.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/submit"
                className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
              >
                <span>+ Lodge Campus Grievance</span>
              </Link>

              {isStudent && (
                <Link
                  to="/student"
                  className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm transition-all"
                >
                  My Hostel &amp; Tickets ({currentUser?.hostel_name?.split(' ')[0] || 'Student Portal'}) →
                </Link>
              )}

              {canAccessOperations && (
                <Link
                  to="/admin"
                  className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm transition-all"
                >
                  Estate Operations Desk →
                </Link>
              )}

              {isTechnician && (
                <Link
                  to="/technician"
                  className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm transition-all"
                >
                  Technician Field Console →
                </Link>
              )}
            </div>
          </div>

          {/* Right Quick Ticket Tracker Card */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold block">
                  Real-Time SLA Lookup
                </span>
                <h2 className="text-base font-black text-white mt-0.5">
                  Instant Ticket Status Tracker
                </h2>
              </div>
              <span className="text-xl">🔍</span>
            </div>

            <form onSubmit={handleTrackSubmit} className="space-y-3">
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Enter Tracking ID (e.g., SCH-2026-0001)"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-white text-slate-950 hover:bg-indigo-50 font-black text-xs transition-all cursor-pointer"
              >
                Track Live Repair Timeline →
              </button>
            </form>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
              <div className="p-2 rounded-xl bg-white/5">
                <div className="text-lg font-black text-white">
                  {summary?.total_tickets ?? recentTickets.length}
                </div>
                <div className="text-[10px] text-slate-300">Total Logged</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <div className="text-lg font-black text-emerald-400">
                  {summary ? `${Math.round(summary.sla_compliance_rate || 100)}%` : '100%'}
                </div>
                <div className="text-[10px] text-slate-300">SLA Compliance</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <div className="text-lg font-black text-indigo-300">11</div>
                <div className="text-[10px] text-slate-300">Campus Zones</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive IIIT Naya Raipur Campus Map Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Interactive IIIT Naya Raipur Campus Master Plan &amp; Hostels
            </h2>
            <p className="text-xs text-slate-500">
              Click any Hostel House or Academic Building below to inspect its facilities or file a targeted maintenance request.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/submit?building=${encodeURIComponent(selectedMapBuilding)}`)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            Lodge Complaint for {selectedMapBuilding.split(' (')[0]} →
          </button>
        </div>

        <CampusMapSelector
          selectedBuilding={selectedMapBuilding}
          onSelectBuilding={(bName) => setSelectedMapBuilding(bName)}
          studentSavedHostel={currentUser?.hostel_name}
          studentSavedRoom={currentUser?.room_number}
        />
      </div>

      {/* Authentic IIIT-NR Hostels & Academic Blocks Directory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bento-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900">
                🏠 IIIT Naya Raipur Residential Hostels (Wings A &amp; B, Floors G–3)
              </h3>
              <p className="text-xs text-slate-500">
                Click any hostel house to report room, corridor RO water cooler, Wi-Fi, or washroom issues
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              Rooms G-01 to 324
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {IIITNR_HOSTELS.map((h) => (
              <div
                key={h.id}
                onClick={() => navigate(`/submit?building=${encodeURIComponent(h.name)}`)}
                className="p-4 rounded-2xl border border-slate-200/90 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/30 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    {h.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-indigo-700">
                    {h.mapZone.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {h.description}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {h.amenities.slice(0, 3).map((am) => (
                    <span
                      key={am}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200/80 text-slate-600"
                    >
                      {am}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Official IIIT-NR Estate, Electrical & Network Contacts */}
        <div className="lg:col-span-5 bento-card p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              📞 Official IIIT-NR Estate &amp; Engineering Authorities
            </h3>
            <p className="text-xs text-slate-500">
              Direct campus extensions for emergency electrical, civil, and network escalations
            </p>
          </div>

          <div className="space-y-3">
            {IIITNR_CAMPUS_METADATA.contacts.map((c) => (
              <div
                key={c.email}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 block">
                    {c.role}
                  </span>
                  <div className="font-bold text-slate-900">{c.name}</div>
                  <div className="text-[11px] text-slate-500">{c.office}</div>
                </div>
                <div className="text-right font-mono text-[11px] shrink-0">
                  <div className="font-bold text-slate-800">{c.phone}</div>
                  <div className="text-indigo-600">{c.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
