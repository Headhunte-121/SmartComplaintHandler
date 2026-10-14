/**
 * SmartComplaintHandler - Grievance Status & Field Dispatch Tracker
 * Blueprint Reference: V1/M2/frontend/04_track_ticket_page.md & V1/M5/00_M5_CENTRAL_OVERVIEW.md
 * Design Pattern: Enterprise self-service tracking console with live recent-ticket quick pills,
 *                 1-click copy reference code, 3-stage progress pipeline, and audit trail viewer.
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
      setError(
        err.response?.data?.detail ||
          err.message ||
          `No grievance ticket found matching reference code '${clean}'.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints({ limit: 5 })
      .then((list) => {
        if (Array.isArray(list)) {
          setRecentTickets(list.slice(0, 5));
        }
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performLookup(searchCode);
  };

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
      case 'SUBMITTED':
      default:
        return 0;
    }
  };

  const stepIndex = ticket ? getStepIndex(ticket.status) : 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Dark Architectural Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl bg-dark-architectural-grid border border-slate-800">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-bold uppercase tracking-wider">
            <span>Live Dispatch Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Grievance Status &amp; Repair Dispatch Tracker
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Enter your ticket tracking code to inspect real-time squad assignment, physical repair stage, SLA countdown timer, and verified closure notes.
          </p>
        </div>
      </div>

      {/* Search Input Workstation */}
      <div className="bento-card p-6 sm:p-8 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              placeholder="Enter Tracking Code (e.g. SCH-20261015-AB12CD)"
              className="enterprise-input font-mono uppercase text-sm tracking-wider py-3 pr-10"
            />
            {searchCode && (
              <button
                type="button"
                onClick={() => setSearchCode('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !searchCode.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <span>Querying Database...</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Track Progress</span>
              </>
            )}
          </button>
        </form>

        {/* Live Recent Tickets Quick-Select */}
        {recentTickets.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Recent Campus Tickets:
            </span>
            {recentTickets.map((item) => (
              <button
                key={item.tracking_code}
                type="button"
                onClick={() => {
                  setSearchCode(item.tracking_code);
                  performLookup(item.tracking_code);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 font-mono text-[11px] font-semibold text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                {item.tracking_code}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-3 animate-fade-in">
          <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <strong className="font-bold">Record Not Found:</strong> {error}
          </div>
        </div>
      )}

      {/* Ticket Details & Timeline */}
      {ticket && (
        <div className="bento-card p-6 sm:p-8 space-y-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xl sm:text-2xl font-black text-indigo-700">
                  {ticket.tracking_code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(ticket.tracking_code)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
                >
                  {copied ? '✓ Copied' : 'Copy Code'}
                </button>
                <PriorityBadge priority={ticket.priority} size="md" showSlaTooltip={true} />
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1.5">
                {ticket.title}
              </h2>
            </div>

            <div className="self-start sm:self-center">
              <SLACountdownTimer
                slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                priority={ticket.priority}
                status={ticket.status}
              />
            </div>
          </div>

          {/* 3-Step Lifecycle Progress Stepper */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Grievance Resolution Pipeline
            </span>
            <div className="relative flex items-center justify-between px-4 sm:px-8 pt-4 pb-2">
              <div className="absolute top-9 left-10 right-10 h-1 bg-slate-200 -z-0" />
              <div
                className="absolute top-9 left-10 h-1 bg-indigo-600 transition-all duration-500 -z-0"
                style={{
                  width: stepIndex === 2 ? 'calc(100% - 5rem)' : stepIndex === 1 ? '50%' : '0%',
                }}
              />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-indigo-600 text-white shadow-sm">
                  ✓
                </div>
                <span className="text-xs font-bold text-slate-900 mt-2">Submitted</span>
                <span className="text-[10px] text-slate-500">Triage Verified</span>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    stepIndex >= 1
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {stepIndex > 1 ? '✓' : '2'}
                </div>
                <span className={`text-xs font-bold mt-2 ${stepIndex >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                  In Repair
                </span>
                <span className="text-[10px] text-slate-500">
                  {ticket.assigned_team_name || 'Squad Dispatched'}
                </span>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    stepIndex === 2
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {stepIndex === 2 ? '✓' : '3'}
                </div>
                <span className={`text-xs font-bold mt-2 ${stepIndex === 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  Resolved
                </span>
                <span className="text-[10px] text-slate-500">Verified Complete</span>
              </div>
            </div>
          </div>

          {/* Ticket Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                Department
              </span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {ticket.department_name || 'General Administration'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                Assigned Squad
              </span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {ticket.assigned_team_name || 'Auto-Dispatch Pending'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                Location
              </span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {ticket.location || 'Campus'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                Reported On
              </span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {new Date(ticket.created_at).toLocaleDateString()}{' '}
                {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Reported Incident Narrative
            </span>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
              {ticket.description}
            </div>
          </div>

          {ticket.resolution_notes && (
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-emerald-800">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Maintenance Audit &amp; Closure Log</span>
              </div>
              <pre className="pl-7 text-emerald-900 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                {ticket.resolution_notes}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
