/**
 * SmartComplaintHandler - Grievance Status Tracker
 * Flush Edge-to-Edge Command Layout with Exact SubmitComplaint Dual Theme Palette
 * (Zero Gradients, Pure High-Contrast Solid Surfaces)
 */
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchTicketByCode, fetchComplaints } from '../api/complaints';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';

export default function TrackTicket() {
  const { isDark } = useTheme();
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
        return isDark
          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'IN_PROGRESS':
        return isDark
          ? 'bg-blue-950/80 text-blue-400 border-blue-800/80'
          : 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ESCALATED':
        return isDark
          ? 'bg-rose-950/80 text-rose-400 border-rose-800/80'
          : 'bg-rose-100 text-rose-800 border-rose-300';
      case 'ASSIGNED':
        return isDark
          ? 'bg-purple-950/80 text-purple-400 border-purple-800/80'
          : 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return isDark
          ? 'bg-amber-950/80 text-amber-400 border-amber-800/80'
          : 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  const stepIndex = ticket ? getStepIndex(ticket.status) : 0;

  return (
    <div className={`w-full min-h-screen flex flex-col space-y-0 transition-colors animate-fade-in ${
      isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-900'
    }`}>
      {/* Flush Command Deck Header (Solid surfaces, no gradients) */}
      <div className={`w-full border-b px-4 sm:px-8 lg:px-12 py-8 relative transition-colors ${
        isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10 max-w-5xl mx-auto">
          <div className="space-y-3">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold shadow-xs border ${
              isDark
                ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Real-Time SLA &amp; Squad Telemetry Tracker</span>
              <span className={isDark ? 'text-emerald-500' : 'text-emerald-400'}>·</span>
              <span className={`font-mono text-[11px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Live</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
              isDark ? 'text-zinc-100' : 'text-slate-900'
            }`}>
              Track Request Status
            </h1>
            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
              isDark ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              Enter your official reference code to inspect live repair milestones, assigned squad triage, and SLA countdown timers.
            </p>
          </div>

          {/* Quick Navigation Action Links */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/submit"
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-2xs transition-all inline-flex items-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-[#1c2128] border-zinc-700 text-emerald-400 hover:text-emerald-300'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-emerald-800 hover:text-emerald-900'
              }`}
            >
              <span>+ Lodge New Request</span>
            </Link>
            <Link
              to="/student"
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-2xs transition-all inline-flex items-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-[#1c2128] border-zinc-700 text-zinc-200 hover:text-white'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800 hover:text-slate-950'
              }`}
            >
              <span>My Requests →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`w-full px-4 sm:px-8 lg:px-12 py-10 transition-colors flex-1 ${
        isDark ? 'bg-[#0e1117]' : 'bg-white'
      }`}>
        <div className="max-w-4xl mx-auto space-y-6 w-full">
          {/* Search Card (Solid emerald top accent, no gradient) */}
          <div className={`p-6 sm:p-7 space-y-5 rounded-2xl relative overflow-hidden border transition-colors ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-md' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
          }`}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />

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
                  className={`w-full px-4 py-3 rounded-xl border font-mono uppercase text-xs sm:text-sm tracking-wider focus:outline-none transition-all ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      : 'bg-[#e2e8f0] border-slate-300 text-slate-900 placeholder-slate-500 hover:border-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                  }`}
                />
                {searchCode && (
                  <button
                    type="button"
                    onClick={() => setSearchCode('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                      isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !searchCode.trim()}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Track →'}
              </button>
            </form>

            {/* Recent Ticket Chips (Authenticated Student Only) */}
            {currentUser && recentTickets.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                  isDark ? 'text-zinc-500' : 'text-slate-600'
                }`}>
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
                    className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold border cursor-pointer transition-all shadow-xs ${
                      isDark
                        ? 'bg-[#0e1117] hover:bg-[#1c2128] text-emerald-400 border-zinc-800 hover:border-emerald-500/80'
                        : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] text-emerald-800 border-slate-300 hover:border-emerald-600'
                    }`}
                  >
                    {item.tracking_code}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className={`p-4 rounded-xl border text-xs font-semibold shadow-xs flex items-center gap-2.5 ${
              isDark ? 'bg-rose-950/80 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Ticket Details Inspection Card */}
          {ticket && (
            <div className={`p-6 sm:p-8 space-y-6 rounded-2xl relative overflow-hidden border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-md' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
            }`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />

              {/* Header Row */}
              <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 ${
                isDark ? 'border-zinc-800' : 'border-slate-300'
              }`}>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`font-mono text-xl sm:text-2xl font-black ${
                      isDark ? 'text-emerald-400' : 'text-emerald-700'
                    }`}>
                      {ticket.tracking_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(ticket.tracking_code)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                        isDark
                          ? 'bg-[#0e1117] hover:bg-[#1c2128] text-zinc-300 hover:text-white border-zinc-700'
                          : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-800 hover:text-slate-950 border-slate-300'
                      }`}
                    >
                      {copied ? '✓ Copied' : 'Copy Code'}
                    </button>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide border uppercase font-mono ${
                      getStatusBadgeClass(ticket.status)
                    }`}>
                      {ticket.status}
                    </span>
                    <PriorityBadge priority={ticket.priority} size="md" dark={isDark} />
                  </div>
                  <h2 className={`text-base sm:text-lg font-bold ${
                    isDark ? 'text-zinc-100' : 'text-slate-900'
                  }`}>
                    {ticket.title}
                  </h2>
                </div>

                <SLACountdownTimer
                  slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                  priority={ticket.priority}
                  status={ticket.status}
                  dark={isDark}
                />
              </div>

              {/* Escalation Warning (if applicable) */}
              {ticket.status === 'ESCALATED' && (
                <div className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-3 ${
                  isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}>
                  <span className="text-lg">🚨</span>
                  <div>
                    <span className="font-bold block">Supervisory Escalation Active</span>
                    <span className="text-[11px] opacity-90 mt-0.5 block">
                      This incident has exceeded standard operational thresholds and is directly monitored by Facilities Command.
                    </span>
                  </div>
                </div>
              )}

              {/* 3-Step Milestone Pipeline (Solid rails and circles, no gradient) */}
              <div className={`p-5 sm:p-6 rounded-xl border ${
                isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0]/80 border-slate-300'
              }`}>
                <div className="relative flex items-center justify-between px-2 sm:px-8 py-3">
                  <div className={`absolute top-8 left-10 right-10 h-1 -z-0 ${
                    isDark ? 'bg-zinc-800' : 'bg-slate-300'
                  }`} />
                  <div
                    className="absolute top-8 left-10 h-1 bg-emerald-600 transition-all duration-500 -z-0"
                    style={{
                      width: stepIndex === 2 ? 'calc(100% - 5rem)' : stepIndex === 1 ? '50%' : '0%',
                    }}
                  />

                  {/* Stage 1: Submitted */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-600 text-white shadow-xs ring-4 ${
                      isDark ? 'ring-emerald-950' : 'ring-emerald-100'
                    }`}>
                      ✓
                    </div>
                    <span className={`text-xs font-bold mt-2 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Submitted</span>
                    <span className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'Logged'}
                    </span>
                  </div>

                  {/* Stage 2: In Repair */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                        stepIndex >= 1
                          ? `bg-emerald-600 text-white ring-4 ${isDark ? 'ring-emerald-950' : 'ring-emerald-100'}`
                          : isDark
                            ? 'bg-[#161b22] border-2 border-zinc-700 text-zinc-500'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {stepIndex > 1 ? '✓' : '2'}
                    </div>
                    <span className={`text-xs font-bold mt-2 ${
                      stepIndex >= 1
                        ? isDark ? 'text-zinc-100' : 'text-slate-900'
                        : isDark ? 'text-zinc-500' : 'text-slate-500'
                    }`}>
                      {ticket.status === 'ESCALATED' ? 'Escalated' : 'In Repair'}
                    </span>
                    <span className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
                      {ticket.assigned_team_name || 'Squad Dispatched'}
                    </span>
                  </div>

                  {/* Stage 3: Resolved */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                        stepIndex === 2
                          ? `bg-emerald-600 text-white ring-4 ${isDark ? 'ring-emerald-950' : 'ring-emerald-100'}`
                          : isDark
                            ? 'bg-[#161b22] border-2 border-zinc-700 text-zinc-500'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {stepIndex === 2 ? '✓' : '3'}
                    </div>
                    <span className={`text-xs font-bold mt-2 ${
                      stepIndex === 2
                        ? isDark ? 'text-emerald-400 font-black' : 'text-emerald-800 font-black'
                        : isDark ? 'text-zinc-500' : 'text-slate-500'
                    }`}>
                      Resolved
                    </span>
                    <span className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
                      {stepIndex === 2 ? 'Closure Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4-Box Telemetry Metadata Grid */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border text-xs ${
                isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
              }`}>
                <div>
                  <span className={`font-bold block text-[10px] uppercase font-mono ${
                    isDark ? 'text-zinc-500' : 'text-slate-600'
                  }`}>Department</span>
                  <span className={`font-bold mt-0.5 block ${
                    isDark ? 'text-emerald-400' : 'text-emerald-800'
                  }`}>
                    {ticket.department_name || 'General Maintenance'}
                  </span>
                </div>
                <div>
                  <span className={`font-bold block text-[10px] uppercase font-mono ${
                    isDark ? 'text-zinc-500' : 'text-slate-600'
                  }`}>Assigned Squad</span>
                  <span className={`font-bold mt-0.5 block ${
                    isDark ? 'text-zinc-100' : 'text-slate-900'
                  }`}>
                    {ticket.assigned_team_name || 'Pending Squad'}
                  </span>
                </div>
                <div>
                  <span className={`font-bold block text-[10px] uppercase font-mono ${
                    isDark ? 'text-zinc-500' : 'text-slate-600'
                  }`}>Location</span>
                  <span className={`font-bold mt-0.5 block truncate ${
                    isDark ? 'text-zinc-100' : 'text-slate-900'
                  }`} title={ticket.location}>
                    📍 {ticket.location || 'Campus Facilities'}
                  </span>
                </div>
                <div>
                  <span className={`font-bold block text-[10px] uppercase font-mono ${
                    isDark ? 'text-zinc-500' : 'text-slate-600'
                  }`}>Logged On</span>
                  <span className={`font-bold mt-0.5 block ${
                    isDark ? 'text-zinc-100' : 'text-slate-900'
                  }`}>
                    {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Recent'}
                  </span>
                </div>
              </div>

              {/* Description Card */}
              <div className="space-y-1.5">
                <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}>
                  Reported Issue Description
                </span>
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-300' : 'bg-[#e2e8f0] border-slate-300 text-slate-800'
                }`}>
                  {ticket.description}
                </div>
              </div>

              {/* Resolution Notes Log (if resolved) */}
              {ticket.resolution_notes && (
                <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                  isDark
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-zinc-200'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}>
                  <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                    <span>✓</span>
                    <span>Official Resolution Log</span>
                  </div>
                  <pre className={`font-mono text-[11px] whitespace-pre-wrap ${
                    isDark ? 'text-zinc-300' : 'text-slate-700'
                  }`}>
                    {ticket.resolution_notes}
                  </pre>
                </div>
              )}

              {/* Feedback Rating Display (if rated) */}
              {ticket.feedback_rating != null && (
                <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                }`}>
                  <div>
                    <span className={`font-bold block text-[10px] uppercase font-mono ${
                      isDark ? 'text-zinc-500' : 'text-slate-600'
                    }`}>Student Satisfaction Rating</span>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${star <= ticket.feedback_rating ? 'text-amber-400' : isDark ? 'text-zinc-700' : 'text-slate-400'}`}
                        >
                          ★
                        </span>
                      ))}
                      <span className={`text-xs font-bold ml-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                        {ticket.feedback_rating} / 5
                      </span>
                    </div>
                  </div>
                  {ticket.feedback_comments && (
                    <span className={`text-xs italic ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      "{ticket.feedback_comments}"
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Initial / Empty State Card (When no ticket is currently searched) */}
          {!ticket && !loading && !error && (
            <div className={`p-8 rounded-2xl border text-center space-y-5 transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-300' : 'bg-[#f1f5f9] border-slate-300 text-slate-700 shadow-sm'
            }`}>
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto text-2xl ${
                isDark ? 'bg-[#0e1117] border-zinc-800 text-emerald-400' : 'bg-[#e2e8f0] border-slate-300 text-emerald-700'
              }`}>
                🔍
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                  Live SLA &amp; Dispatch Tracking
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Paste your tracking reference code above or tap any recent ticket code to inspect real-time squad assignments and repair status.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2 max-w-2xl mx-auto">
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                }`}>
                  <div className="text-emerald-500 font-bold text-xs mb-1">1. Auto-Triage</div>
                  <div className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Categorized into taxonomy and bound to strict SLA response times.
                  </div>
                </div>
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                }`}>
                  <div className="text-blue-500 font-bold text-xs mb-1">2. Squad Dispatch</div>
                  <div className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Dispatched to dedicated hostel or academic facility repair squads.
                  </div>
                </div>
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                }`}>
                  <div className="text-emerald-500 font-bold text-xs mb-1">3. Verified Closure</div>
                  <div className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Confirmed with mandatory resolution logs and student star ratings.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
