/**
 * SmartComplaintHandler - Minimal Ticket Status Tracker
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
      setError(err.response?.data?.detail || `No request found for '${clean}'.`);
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

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
          Track Maintenance Request
        </h1>
        <p className="text-xs text-slate-500">
          Enter your reference code to check repair status
        </p>
      </div>

      {/* Minimal Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            performLookup(searchCode);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            placeholder="SCH-20261015-..."
            className="enterprise-input font-mono uppercase flex-1"
          />
          <button
            type="submit"
            disabled={loading || !searchCode.trim()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {recentTickets.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400">Recent:</span>
            {recentTickets.map((item) => (
              <button
                key={item.tracking_code}
                type="button"
                onClick={() => {
                  setSearchCode(item.tracking_code);
                  performLookup(item.tracking_code);
                }}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 font-mono text-[11px] text-slate-700 cursor-pointer"
              >
                {item.tracking_code}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      {ticket && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-semibold text-indigo-600">
                  {ticket.tracking_code}
                </span>
                <PriorityBadge priority={ticket.priority} size="sm" />
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                  {ticket.status}
                </span>
              </div>
              <h2 className="text-base font-semibold text-slate-900">{ticket.title}</h2>
            </div>

            <SLACountdownTimer
              slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
              priority={ticket.priority}
              status={ticket.status}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Location</span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {ticket.location}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Department</span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {ticket.department_name || 'General'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Assigned Squad</span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {ticket.assigned_team_name || 'Pending'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
            {ticket.description}
          </div>

          {ticket.resolution_notes && (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
              <div className="font-semibold">Resolution Notes</div>
              <pre className="font-mono text-[11px] whitespace-pre-wrap">
                {ticket.resolution_notes}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
