/**
 * SmartComplaintHandler - Administrative Priority Override Modal
 * Blueprint Reference: docs/V1/M3/frontend/04_priority_override_modal.md
 * Role: Controlled human-in-the-loop supervisor dialog requiring mandatory 5-character justification
 *       for institutional audit trail logging before modifying priority tiers.
 */
import React, { useState, useEffect } from 'react';
import { overrideTicketPriority } from '../api/triage';
import PriorityBadge from './PriorityBadge';

const PRIORITY_OPTIONS = [
  { value: 'CRITICAL', label: 'CRITICAL (4-Hour Emergency SLA)', desc: 'Life safety or catastrophic structural failure' },
  { value: 'HIGH', label: 'HIGH (12-Hour Urgent SLA)', desc: 'Major operational disruption or facility outage' },
  { value: 'MEDIUM', label: 'MEDIUM (24-Hour Standard SLA)', desc: 'Standard operational routine maintenance' },
  { value: 'LOW', label: 'LOW (72-Hour Cosmetic SLA)', desc: 'Minor cosmetic defect or aesthetic touchup' },
];

export default function PriorityOverrideModal({
  ticket,
  isOpen,
  onClose,
  onPriorityUpdated,
}) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <h3 id="modal-headline" className="text-base font-bold text-slate-800">
              Adjust Urgency Priority
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Incident #{ticket.tracking_code || ticket.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
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
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Target Incident
            </div>
            <p className="text-sm font-semibold text-slate-800 line-clamp-2">
              {ticket.title}
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-xs text-slate-500">Current Level:</span>
              <PriorityBadge priority={ticket.priority} size="sm" />
            </div>
          </div>

          {/* Target Priority Selector */}
          <div>
            <label htmlFor="priority-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              New Priority Tier <span className="text-rose-500">*</span>
            </label>
            <select
              id="priority-select"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:opacity-60"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {!isPriorityChanged && (
              <p className="text-xs text-amber-600 mt-1">
                Please select a different priority tier to enable override.
              </p>
            )}
          </div>

          {/* Mandatory Justification Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="override-reason" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Institutional Justification <span className="text-rose-500">*</span>
              </label>
              <span className={`text-xs ${overrideReason.length >= 5 ? 'text-slate-400' : 'text-rose-500 font-medium'}`}>
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
              placeholder="State reason for manual priority adjustment (e.g. site inspection confirmed false alarm, or issue escalated to flood danger)..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:opacity-60 resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              This explanation is permanently committed into the incident audit notes alongside your identity.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start space-x-2">
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
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
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
