/**
 * SmartComplaintHandler - Reassign Squad Modal
 * Styled in High-Density Obsidian Glassmorphic Theme to match modern Operations Desk.
 */
import React, { useState, useEffect } from 'react';
import { UsersRound, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { fetchSquadWorkloads, reassignSquad } from '../api/assignment';

export default function ReassignTeamModal({ isOpen, ticket, onClose, onReassigned }) {
  const [squads, setSquads] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchSquadWorkloads()
        .then((data) => {
          setSquads(Array.isArray(data) ? data : []);
          if (data.length > 0 && !selectedTeamId) {
            setSelectedTeamId(data[0].team_id);
          }
        })
        .catch(() => {});
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setError('Please select a target maintenance squad.');
      return;
    }
    if (reason.trim().length < 5) {
      setError('Reassignment justification must contain at least 5 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await reassignSquad(ticket.id, Number(selectedTeamId), reason.trim());
      if (onReassigned) {
        onReassigned(res);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to reassign squad.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0d121c] p-6 shadow-2xl text-slate-100 transform transition-all">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-indigo-400/30 bg-indigo-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-300">
                Squad Dispatch Control
              </span>
              <span className="font-mono text-xs text-slate-400">
                {ticket.tracking_code || `#${ticket.id}`}
              </span>
            </div>
            <h2 className="mt-1.5 text-base font-bold text-white tracking-tight">
              Reassign Maintenance Squad
            </h2>
            <p className="mt-0.5 max-w-sm truncate text-xs text-slate-400">
              {ticket.title} · Currently: {ticket.assigned_team_name || 'Unassigned'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target Squad Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
              Target Maintenance Squad <span className="text-rose-400">*</span>
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {squads.map((s) => {
                const isSelected = String(selectedTeamId) === String(s.team_id);
                return (
                  <button
                    key={s.team_id}
                    type="button"
                    onClick={() => setSelectedTeamId(s.team_id)}
                    className={`w-full flex items-center justify-between rounded-xl border p-2.5 text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-400/50 bg-indigo-500/15 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-400/40'
                        : 'border-white/[0.07] bg-white/[0.02] text-slate-300 hover:border-white/[0.15] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white tracking-tight">{s.team_name}</p>
                      <p className="text-[10px] text-slate-400">{s.department_name} · {s.assigned_technicians || 0} Technicians</p>
                    </div>
                    <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-slate-300">
                      {s.active_ticket_count || 0} active
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Justification Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="reassign-reason" className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Reason for Reassignment <span className="text-rose-400">*</span>
              </label>
              <span className={`text-[10px] font-mono ${reason.trim().length >= 5 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
                {reason.trim().length}/500 (min 5 chars)
              </span>
            </div>
            <textarea
              id="reassign-reason"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Original squad overloaded; specialized three-phase electrical tools needed..."
              className="w-full rounded-xl border border-white/[0.1] bg-[#070a10] p-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/10 resize-none transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || reason.trim().length < 5 || !selectedTeamId}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <span>Reassigning…</span>
              ) : (
                <>
                  <UsersRound size={14} />
                  <span>Confirm Reassignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
