/**
 * SmartComplaintHandler - Administrative Priority Override Modal
 * Blueprint Reference: docs/V1/M3/frontend/04_priority_override_modal.md
 * Role: Controlled human-in-the-loop supervisor dialog requiring mandatory 5-character justification
 *       for institutional audit trail logging before modifying priority tiers.
 */
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { overrideTicketPriority } from '../api/triage';
import PriorityBadge from './PriorityBadge';

const PRIORITY_OPTIONS = [
  { value: 'CRITICAL', label: 'CRITICAL (2-Hour SLA)', desc: 'Severe facility failure or urgent safety defect' },
  { value: 'HIGH', label: 'HIGH (8-Hour SLA)', desc: 'Major room or lab disruption or locked out' },
  { value: 'MEDIUM', label: 'MEDIUM (24-Hour SLA)', desc: 'Standard operational routine maintenance' },
  { value: 'LOW', label: 'LOW (72-Hour SLA)', desc: 'Minor cosmetic defect or aesthetic touchup' },
];

export default function PriorityOverrideModal({
  ticket,
  isOpen,
  onClose,
  onPriorityUpdated,
}) {
  const { isDark } = useTheme();
  const [newPriority, setNewPriority] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Synchronize state when ticket opens or changes
  useEffect(() => {
    if (ticket) {
      setNewPriority(ticket.priority || 'MEDIUM');
      setOverrideReason('');
      setError(null);
      setSubmitting(false);
    }
  }, [ticket, isOpen]);

  // Handle escape key to dismiss
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !ticket) return null;

  const cleanReason = overrideReason.trim();
  const isReasonValid = cleanReason.length >= 5;
  const isPriorityChanged = newPriority.toUpperCase() !== (ticket.priority || '').toUpperCase();
  const canSubmit = isPriorityChanged && isReasonValid && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const updatedTicket = await overrideTicketPriority(
        ticket.id,
        newPriority,
        cleanReason
      );
      if (onPriorityUpdated) {
        onPriorityUpdated(updatedTicket);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update priority. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden transform transition-all ${
        isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-xl'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${
          isDark ? 'border-zinc-800 bg-[#161b22]' : 'border-slate-300 bg-[#e2e8f0]/60'
        }`}>
          <div>
            <h3 id="modal-headline" className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Adjust Urgency Priority
            </h3>
            <p className={`text-xs mt-0.5 font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Complaint #{ticket.tracking_code || ticket.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 cursor-pointer ${
              isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'
            }`}
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Incident Context Banner */}
          <div className={`rounded-xl border p-4 space-y-2 ${
            isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
          }`}>
            <div className={`text-xs font-semibold uppercase tracking-wider ${
              isDark ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              Complaint Details
            </div>
            <p className={`text-sm font-semibold line-clamp-2 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              {ticket.title}
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Current Level:</span>
              <PriorityBadge priority={ticket.priority} size="sm" dark={isDark} />
            </div>
          </div>

          {/* Target Priority Selector */}
          <div>
            <label htmlFor="priority-select" className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
              isDark ? 'text-zinc-300' : 'text-slate-700'
            }`}>
              New Priority Tier <span className="text-rose-500">*</span>
            </label>
            <select
              id="priority-select"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              disabled={submitting}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-medium shadow-sm transition-all focus:outline-none disabled:opacity-60 ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 focus:border-emerald-500'
                  : 'bg-[#e2e8f0] border-slate-300 text-slate-900 hover:border-slate-400 focus:bg-white focus:border-emerald-600'
              }`}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>
                  {opt.label}
                </option>
              ))}
            </select>
            {!isPriorityChanged && (
              <p className="text-xs text-amber-500 mt-1 font-medium">
                Please select a different priority tier to enable override.
              </p>
            )}
          </div>

          {/* Mandatory Justification Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="override-reason" className={`block text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-zinc-300' : 'text-slate-700'
              }`}>
                Institutional Justification <span className="text-rose-500">*</span>
              </label>
              <span className={`text-xs ${overrideReason.length >= 5 ? (isDark ? 'text-zinc-400' : 'text-slate-500') : 'text-rose-500 font-medium'}`}>
                {overrideReason.length}/500 (min 5 required)
              </span>
            </div>
            <textarea
              id="override-reason"
              rows={3}
              maxLength={500}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              disabled={submitting}
              placeholder="State reason for manual priority adjustment (e.g. routine tap leak rather than main pipe burst, or rescheduled maintenance)..."
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm shadow-sm transition-all focus:outline-none disabled:opacity-60 resize-none ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500'
                  : 'bg-[#e2e8f0] border-slate-300 text-slate-900 placeholder-slate-500 hover:border-slate-400 focus:bg-white focus:border-emerald-600'
              }`}
            />
            <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              This explanation is permanently committed into the ticket audit notes alongside your identity.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className={`rounded-xl border p-3 text-xs flex items-start space-x-2 ${
              isDark ? 'bg-rose-950/80 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`rounded-xl border px-4 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-[#1c2128] border-zinc-700 text-zinc-300 hover:text-white'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800 hover:text-slate-950'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-xs focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Applying Override...
                </>
              ) : (
                'Save Priority Change'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
