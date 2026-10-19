/**
 * SmartComplaintHandler - Reassign Squad Modal
 * Blueprint Reference: V1/M4/frontend/04_reassign_modal.md
 * Role: Administrative modal allowing squad transfer with mandatory reason audit logging and dual theme styling.
 */
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { fetchSquadWorkloads, reassignSquad } from '../api/assignment';

export default function ReassignTeamModal({ isOpen, ticket, onClose, onReassigned }) {
  const { isDark } = useTheme();
  const [squads, setSquads] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchSquadWorkloads()
        .then((data) => {
          setSquads(data);
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
      const res = await reassignSquad(ticket.id, Number(selectedTeamId), reason);
      if (onReassigned) {
        onReassigned(res);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reassign squad.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
      <div
        className={`rounded-2xl max-w-lg w-full shadow-2xl border overflow-hidden transition-all ${
          isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isDark ? 'border-zinc-800 bg-[#161b22]' : 'border-slate-300 bg-[#e2e8f0]/60'
          }`}
        >
          <div>
            <span
              className={`text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                isDark
                  ? 'text-indigo-400 bg-indigo-950/60 border-indigo-800'
                  : 'text-indigo-800 bg-indigo-100 border-indigo-300'
              }`}
            >
              Supervisor Reassignment Gate
            </span>
            <h2 className={`text-base font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Reassign Maintenance Squad
            </h2>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Ticket: <strong className={`font-mono ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{ticket.tracking_code}</strong> — {ticket.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-100 border-rose-300 text-rose-800'
              }`}
            >
              {error}
            </div>
          )}

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Select Target Maintenance Squad <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            >
              {squads.map((s) => (
                <option key={s.team_id} value={s.team_id}>
                  {s.team_name} ({s.department_name}) — Active: {s.active_ticket_count}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Reason for Reassignment <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] font-mono ${reason.trim().length >= 5 ? 'text-emerald-500 font-bold' : isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                {reason.trim().length}/5 chars min
              </span>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Original squad overloaded; specialized high-voltage equipment required."
              className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 resize-none ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
          </div>

          <div
            className={`p-4 -mx-6 -mb-6 border-t flex items-center justify-end space-x-2 ${
              isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0]/60 border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#161b22] hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || reason.trim().length < 5}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {submitting ? 'Reassigning...' : 'Confirm Reassignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
