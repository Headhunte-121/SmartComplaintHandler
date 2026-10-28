/**
 * SmartComplaintHandler - Grievance Status Tracker
 * High-Density Obsidian Command Desk Standard:
 *  - Deep Space Obsidian canvas (#090d14)
 *  - Translucent glassmorphic search & inspection cards (bg-[#0e131f]/80 border-white/[0.08])
 *  - Dynamic 3-stage milestone telemetry pipeline (Submitted -> In Repair -> Resolved)
 *  - Live SLA Countdown Timer and supervisory escalation indicators
 *  - Official Resolution Log and Student Feedback Star Rating inspection
 */
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchTicketByCode, fetchComplaints } from '../api/complaints';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';
import {
  Search, Copy, Check, AlertTriangle, ArrowRight, CheckCircle2,
  Clock, Wrench, ShieldAlert, Sparkles, MapPin, Building,
} from 'lucide-react';

export default function TrackTicket() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchCode, setSearchCode] = useState(searchParams.get('code') || '');
  const [ticket, setTicket] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const performLookup = async (codeToSearch) => {
    const clean = (codeToSearch || '').trim().toUpperCase();
    if (!clean) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTicketByCode(clean);
      setTicket(data);
      setSearchParams({ code: clean });
    } catch (err) {
      setTicket(null);
      setError(err.response?.data?.detail || `No ticket found matching '${clean}'. Please verify the tracking code.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?.email) {
      setRecentTickets([]);
      return;
    }
    fetchComplaints({ limit: 6, student_email: currentUser.email })
      .then((list) => {
        if (Array.isArray(list)) setRecentTickets(list.slice(0, 6));
      })
      .catch(() => {});
  }, [currentUser?.email]);

  useEffect(() => {
    const initialCode = searchParams.get('code');
    if (initialCode) {
      setSearchCode(initialCode);
      performLookup(initialCode);
    }
  }, [searchParams]);

  const handleCopyCode = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 2;
      case 'IN_PROGRESS':
      case 'ASSIGNED':
      case 'ESCALATED':
        return 1;
      default:
        return 0;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'IN_PROGRESS':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'ESCALATED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'ASSIGNED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  const stepIndex = ticket ? getStepIndex(ticket.status) : 0;

  return (
    <div className="w-full min-h-screen bg-[#090d14] text-slate-100 font-sans antialiased selection:bg-cyan-500/30 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] max-w-5xl mx-auto">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border bg-cyan-500/10 border-cyan-500/25 text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Live SLA &amp; Squad Telemetry
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Track Request Status
          </h1>
          <p className="text-xs text-slate-400">
            Enter your official tracking code to inspect live repair milestones, assigned squad triage, and countdown timers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/submit"
            className="px-3.5 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span>+ Lodge Request</span>
          </Link>
          <Link
            to="/student"
            className="px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white font-semibold text-xs transition flex items-center gap-1.5"
          >
            <span>My Requests</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Main Track Viewport */}
      <div className="max-w-4xl mx-auto space-y-6 w-full">
        {/* Search Card */}
        <div className="p-6 sm:p-7 space-y-5 rounded-2xl border border-white/[0.08] bg-[#0e131f]/80 backdrop-blur-md relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              performLookup(searchCode);
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="Enter Tracking Code (e.g. SCH-20261015-AB12CD)"
                className="w-full px-4 py-3 pl-10 rounded-xl border border-white/[0.08] bg-[#0b0f19] text-white font-mono uppercase text-xs sm:text-sm tracking-wider placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
              <Search size={16} className="absolute left-3.5 top-3.5 text-cyan-400" />
              {searchCode && (
                <button
                  type="button"
                  onClick={() => setSearchCode('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 hover:text-white cursor-pointer px-1.5 py-0.5"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !searchCode.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Track Ticket →'}
            </button>
          </form>

          {/* Recent Ticket Chips */}
          {currentUser && recentTickets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-white/[0.04]">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                Your Recent Grievances:
              </span>
              {recentTickets.map((item) => (
                <button
                  key={item.tracking_code}
                  type="button"
                  onClick={() => {
                    setSearchCode(item.tracking_code);
                    performLookup(item.tracking_code);
                  }}
                  className="px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border border-white/[0.08] bg-white/[0.03] hover:border-cyan-500/40 text-cyan-400 hover:text-cyan-300 cursor-pointer transition shadow-xs"
                >
                  {item.tracking_code}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-rose-800/80 bg-rose-950/60 text-xs font-semibold text-rose-300 flex items-center gap-2.5 shadow-xl">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Ticket Details Inspection Card */}
        {ticket && (
          <div className="p-6 sm:p-8 space-y-6 rounded-2xl border border-white/[0.08] bg-[#0e131f]/80 backdrop-blur-md relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xl sm:text-2xl font-black text-cyan-400">
                    {ticket.tracking_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(ticket.tracking_code)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border uppercase font-mono ${
                    getStatusBadgeClass(ticket.status)
                  }`}>
                    {ticket.status}
                  </span>
                  <PriorityBadge priority={ticket.priority} size="md" dark={true} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {ticket.title}
                </h2>
              </div>

              <SLACountdownTimer
                slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                priority={ticket.priority}
                status={ticket.status}
                resolvedAt={ticket.resolved_at}
                dark={true}
              />
            </div>

            {/* Escalation Warning (if applicable) */}
            {ticket.status === 'ESCALATED' && (
              <div className="p-4 rounded-xl border border-rose-800/80 bg-rose-950/40 text-xs font-semibold flex items-start gap-3 text-rose-300">
                <ShieldAlert size={18} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Supervisory Escalation Active</span>
                  <span className="text-[11px] opacity-90 mt-0.5 block">
                    This incident has exceeded standard operational thresholds and is directly monitored by Facilities Directorate.
                  </span>
                </div>
              </div>
            )}

            {/* 3-Step Milestone Pipeline */}
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-[#0b0f19]">
              <div className="relative flex items-center justify-between px-2 sm:px-8 py-3">
                <div className="absolute top-8 left-10 right-10 h-1 bg-white/[0.08] -z-0" />
                <div
                  className="absolute top-8 left-10 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500 -z-0"
                  style={{
                    width: stepIndex === 2 ? 'calc(100% - 5rem)' : stepIndex === 1 ? '50%' : '0%',
                  }}
                />

                {/* Stage 1: Submitted */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 ring-4 ring-cyan-950/80">
                    ✓
                  </div>
                  <span className="text-xs font-bold mt-2 text-white">Submitted</span>
                  <span className="text-[10px] font-mono mt-0.5 text-slate-500">
                    {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'Logged'}
                  </span>
                </div>

                {/* Stage 2: In Repair */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      stepIndex >= 1
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 ring-4 ring-cyan-950/80'
                        : 'bg-[#0e131f] border-2 border-white/[0.1] text-slate-500'
                    }`}
                  >
                    {stepIndex > 1 ? '✓' : '2'}
                  </div>
                  <span className={`text-xs font-bold mt-2 ${
                    stepIndex >= 1 ? 'text-white' : 'text-slate-500'
                  }`}>
                    {ticket.status === 'ESCALATED' ? 'Escalated' : 'In Repair'}
                  </span>
                  <span className="text-[10px] font-mono mt-0.5 text-slate-500">
                    {ticket.assigned_team_name || 'Squad Dispatched'}
                  </span>
                </div>

                {/* Stage 3: Resolved */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      stepIndex === 2
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-950/80'
                        : 'bg-[#0e131f] border-2 border-white/[0.1] text-slate-500'
                    }`}
                  >
                    {stepIndex === 2 ? '✓' : '3'}
                  </div>
                  <span className={`text-xs font-bold mt-2 ${
                    stepIndex === 2 ? 'text-emerald-400 font-black' : 'text-slate-500'
                  }`}>
                    Resolved
                  </span>
                  <span className="text-[10px] font-mono mt-0.5 text-slate-500">
                    {stepIndex === 2 ? 'Closure Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4-Box Telemetry Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#0b0f19] text-xs">
              <div>
                <span className="font-bold block text-[10px] uppercase font-mono text-slate-500">Department</span>
                <span className="font-bold mt-0.5 block text-cyan-400">
                  {ticket.department_name || 'General Maintenance'}
                </span>
              </div>
              <div>
                <span className="font-bold block text-[10px] uppercase font-mono text-slate-500">Assigned Squad</span>
                <span className="font-bold mt-0.5 block text-white">
                  {ticket.assigned_team_name || 'Pending Squad'}
                </span>
              </div>
              <div>
                <span className="font-bold block text-[10px] uppercase font-mono text-slate-500">Location</span>
                <span className="font-bold mt-0.5 block truncate text-slate-200" title={ticket.location}>
                  📍 {ticket.location || 'Campus Facilities'}
                </span>
              </div>
              <div>
                <span className="font-bold block text-[10px] uppercase font-mono text-slate-500">Logged On</span>
                <span className="font-bold mt-0.5 block text-slate-200">
                  {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Recent'}
                </span>
              </div>
            </div>

            {/* Description Card */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500">
                Reported Issue Description
              </span>
              <div className="p-4 rounded-xl border border-white/[0.06] bg-[#0b0f19] text-xs text-slate-300 leading-relaxed">
                {ticket.description}
              </div>
            </div>

            {/* Resolution Notes Log (if resolved) */}
            {ticket.resolution_notes && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 size={15} />
                  <span>Official Resolution Log</span>
                </div>
                <pre className="font-mono text-[11px] whitespace-pre-wrap text-slate-300">
                  {ticket.resolution_notes}
                </pre>
              </div>
            )}

            {/* Feedback Rating Display (if rated) */}
            {ticket.feedback_rating != null && (
              <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0b0f19] text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold block text-[10px] uppercase font-mono text-slate-500">Student Satisfaction Rating</span>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${star <= ticket.feedback_rating ? 'text-amber-400' : 'text-slate-700'}`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-xs font-bold ml-1.5 text-white font-mono">
                      {ticket.feedback_rating} / 5
                    </span>
                  </div>
                </div>
                {ticket.feedback_comments && (
                  <span className="text-xs italic text-slate-400">
                    "{ticket.feedback_comments}"
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Initial / Empty State Card */}
        {!ticket && !loading && !error && (
          <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#0e131f]/80 backdrop-blur-md text-center space-y-5 shadow-xl">
            <div className="w-14 h-14 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center mx-auto text-cyan-400">
              <Search size={24} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">
                Live SLA &amp; Dispatch Tracking
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste your tracking reference code above or tap any recent ticket code to inspect real-time squad assignments and repair status.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2 max-w-2xl mx-auto">
              <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0b0f19]">
                <div className="text-cyan-400 font-bold text-xs mb-1 font-mono">1. Auto-Triage</div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Categorized into taxonomy and bound to strict SLA response times.
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0b0f19]">
                <div className="text-blue-400 font-bold text-xs mb-1 font-mono">2. Squad Dispatch</div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Dispatched to dedicated hostel or academic facility repair squads.
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0b0f19]">
                <div className="text-emerald-400 font-bold text-xs mb-1 font-mono">3. Verified Closure</div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Confirmed with mandatory resolution logs and student star ratings.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
