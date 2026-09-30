/**
 * SmartComplaintHandler - Reassign Squad Modal
 * Blueprint Reference: V1/M4/frontend/04_reassign_modal.md
 * Role: Administrative modal allowing squad transfer with mandatory reason audit logging.
 */
import React, { useState, useEffect } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Supervisor Reassignment Gate
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-1">
              Reassign Maintenance Squad
            </h2>
            <p className="text-xs text-slate-500">
              Ticket: <strong className="font-mono text-slate-800">{ticket.tracking_code}</strong> — {ticket.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Target Maintenance Squad <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Reason for Reassignment <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] font-mono ${reason.trim().length >= 5 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {reason.trim().length}/5 chars min
              </span>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Original squad overloaded; specialized high-voltage equipment required."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div className="p-4 bg-slate-50 -mx-6 -mb-6 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || reason.trim().length < 5}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
            >
              {submitting ? 'Reassigning...' : 'Confirm Reassignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
