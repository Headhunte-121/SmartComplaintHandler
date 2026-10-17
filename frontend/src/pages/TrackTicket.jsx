/**
 * SmartComplaintHandler - Grievance Status Tracker
 * Flush Edge-to-Edge Dark Command Twin Layout with Consistent Institutional Palette
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchTicketByCode, fetchComplaints } from '../api/complaints';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';

export default function TrackTicket() {
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
      setError(err.response?.data?.detail || `No ticket found matching '${clean}'.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints({ limit: 5 })
      .then((list) => {
        if (Array.isArray(list)) setRecentTickets(list.slice(0, 5));
      })
      .catch(() => {});
  }, []);

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

  const stepIndex = ticket ? getStepIndex(ticket.status) : 0;

  return (
    <div className="w-full bg-[#080C14] text-white min-h-screen flex flex-col space-y-0 animate-fade-in">
      {/* Flush Command Deck Header */}
      <div className="w-full bg-[#0B0F19] border-b border-slate-800/80 px-4 sm:px-8 lg:px-12 py-8 relative overflow-hidden">
        {/* Ambient background glow auras */}
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10 max-w-5xl mx-auto">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Real-Time SLA &amp; Squad Telemetry Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Track Request Status
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Enter your official reference code to inspect live repair milestones, assigned squad triage, and SLA countdown timers.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full bg-[#080C14] px-4 sm:px-8 lg:px-12 py-10">
        <div className="max-w-4xl mx-auto space-y-6 w-full">
          {/* Search Card */}
          <div className="p-6 sm:p-7 space-y-5 bg-[#0B101D] border border-slate-800 shadow-2xl rounded-2xl relative overflow-hidden text-white">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                performLookup(searchCode);
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="Enter Tracking Code (e.g. SCH-20261015-AB12CD)"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-mono uppercase text-sm tracking-wider focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all flex-1"
              />
              <button
                type="submit"
                disabled={loading || !searchCode.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/30 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Track →'}
              </button>
            </form>

            {recentTickets.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Recent:
                </span>
                {recentTickets.map((item) => (
                  <button
                    key={item.tracking_code}
                    type="button"
                    onClick={() => {
                      setSearchCode(item.tracking_code);
                      performLookup(item.tracking_code);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 hover:border-emerald-500/80 font-mono text-[11px] font-bold text-emerald-400 border border-slate-700 cursor-pointer transition-all shadow-xs"
                  >
                    {item.tracking_code}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-xs text-rose-300 font-semibold shadow-xs">
              {error}
            </div>
          )}

          {ticket && (
            <div className="p-6 sm:p-8 space-y-6 bg-[#0B101D] border border-slate-800 shadow-2xl rounded-2xl relative overflow-hidden text-white animate-fade-in">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400">
                      {ticket.tracking_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(ticket.tracking_code)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-[10px] font-bold text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                    <PriorityBadge priority={ticket.priority} size="md" dark={true} />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-1.5">{ticket.title}</h2>
                </div>

                <SLACountdownTimer
                  slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                  priority={ticket.priority}
                  status={ticket.status}
                  dark={true}
                />
              </div>

              {/* 3-Step Milestone Pipeline */}
              <div className="relative flex items-center justify-between px-4 sm:px-8 py-4">
                <div className="absolute top-9 left-12 right-12 h-1 bg-slate-800 -z-0" />
                <div
                  className="absolute top-9 left-12 h-1 bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500 -z-0"
                  style={{
                    width: stepIndex === 2 ? 'calc(100% - 6rem)' : stepIndex === 1 ? '50%' : '0%',
                  }}
                />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-emerald-600 text-white shadow-md ring-4 ring-emerald-950">
                    ✓
                  </div>
                  <span className="text-xs font-bold text-white mt-2">Submitted</span>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      stepIndex >= 1 ? 'bg-emerald-600 text-white ring-4 ring-emerald-950 shadow-md' : 'bg-slate-900 border-2 border-slate-700 text-slate-500'
                    }`}
                  >
                    {stepIndex > 1 ? '✓' : '2'}
                  </div>
                  <span className={`text-xs font-bold mt-2 ${stepIndex >= 1 ? 'text-white' : 'text-slate-500'}`}>
                    In Repair
                  </span>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      stepIndex === 2 ? 'bg-emerald-600 text-white ring-4 ring-emerald-950 shadow-md' : 'bg-slate-900 border-2 border-slate-700 text-slate-500'
                    }`}
                  >
                    {stepIndex === 2 ? '✓' : '3'}
                  </div>
                  <span className={`text-xs font-bold mt-2 ${stepIndex === 2 ? 'text-emerald-400 font-black' : 'text-slate-500'}`}>
                    Resolved
                  </span>
                </div>
              </div>

              {/* 4-Box Telemetry Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase font-mono">Department</span>
                  <span className="font-bold text-emerald-400 mt-0.5 block">
                    {ticket.department_name || 'General'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase font-mono">Assigned Squad</span>
                  <span className="font-bold text-white mt-0.5 block">
                    {ticket.assigned_team_name || 'Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase font-mono">Location</span>
                  <span className="font-bold text-white mt-0.5 block">{ticket.location}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase font-mono">Logged On</span>
                  <span className="font-bold text-white mt-0.5 block">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Description Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {ticket.description}
              </div>

              {/* Resolution Notes Log (if resolved) */}
              {ticket.resolution_notes && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-xs text-slate-200 space-y-1.5">
                  <div className="font-bold text-emerald-400">Resolution Log</div>
                  <pre className="text-slate-300 font-mono text-[11px] whitespace-pre-wrap">
                    {ticket.resolution_notes}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
