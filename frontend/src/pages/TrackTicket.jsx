/**
 * SmartComplaintHandler - Grievance Status Tracker (Rich visual design, zero filler copy)
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
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10">
      {/* Compact Dark Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 shadow-xl bg-dark-architectural-grid border border-slate-800">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          Track Request Status
        </h1>
        <p className="text-xs text-slate-300 mt-0.5">
          Enter your reference code to view repair status and SLA countdown
        </p>
      </div>

      {/* Search Card */}
      <div className="bento-card p-6 space-y-4">
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
            className="enterprise-input font-mono uppercase text-sm tracking-wider py-3 flex-1"
          />
          <button
            type="submit"
            disabled={loading || !searchCode.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {recentTickets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 font-mono text-[11px] font-semibold text-slate-700 border border-slate-200 cursor-pointer"
              >
                {item.tracking_code}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
          {error}
        </div>
      )}

      {ticket && (
        <div className="bento-card p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xl font-black text-indigo-700">
                  {ticket.tracking_code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(ticket.tracking_code)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 cursor-pointer"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
                <PriorityBadge priority={ticket.priority} size="md" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1.5">{ticket.title}</h2>
            </div>

            <SLACountdownTimer
              slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
              priority={ticket.priority}
              status={ticket.status}
            />
          </div>

          {/* 3-Step Pipeline */}
          <div className="relative flex items-center justify-between px-4 sm:px-8 pt-2 pb-2">
            <div className="absolute top-7 left-10 right-10 h-1 bg-slate-200 -z-0" />
            <div
              className="absolute top-7 left-10 h-1 bg-indigo-600 transition-all duration-500 -z-0"
              style={{
                width: stepIndex === 2 ? 'calc(100% - 5rem)' : stepIndex === 1 ? '50%' : '0%',
              }}
            />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-indigo-600 text-white shadow-sm">
                ✓
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">Submitted</span>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  stepIndex >= 1 ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {stepIndex > 1 ? '✓' : '2'}
              </div>
              <span className={`text-xs font-bold mt-2 ${stepIndex >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                In Repair
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  stepIndex === 2 ? 'bg-emerald-600 text-white' : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {stepIndex === 2 ? '✓' : '3'}
              </div>
              <span className={`text-xs font-bold mt-2 ${stepIndex === 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
                Resolved
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Department</span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {ticket.department_name || 'General'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Assigned Squad</span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {ticket.assigned_team_name || 'Pending'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Location</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{ticket.location}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Logged On</span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {new Date(ticket.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            {ticket.description}
          </div>

          {ticket.resolution_notes && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
              <div className="font-bold text-emerald-800">Resolution Log</div>
              <pre className="text-emerald-900 font-mono text-[11px] whitespace-pre-wrap">
                {ticket.resolution_notes}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
