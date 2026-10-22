/**
 * SmartComplaintHandler - Administrative Priority Override Modal
 * Styled in High-Density Obsidian Glassmorphic Theme to match modern Operations Desk.
 */
import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Clock, Check, X } from 'lucide-react';
import { overrideTicketPriority } from '../api/triage';
import PriorityBadge from './PriorityBadge';

const PRIORITY_OPTIONS = [
  { value: 'CRITICAL', label: 'CRITICAL', sla: '2-Hour SLA', desc: 'Severe facility failure or urgent campus safety hazard', color: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
  { value: 'HIGH', label: 'HIGH', sla: '8-Hour SLA', desc: 'Major room, classroom, or lab disruption', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  { value: 'MEDIUM', label: 'MEDIUM', sla: '24-Hour SLA', desc: 'Standard operational routine maintenance', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' },
  { value: 'LOW', label: 'LOW', sla: '72-Hour SLA', desc: 'Minor cosmetic defect or scheduled upgrade', color: 'border-slate-500/40 bg-slate-500/10 text-slate-300' },
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
      setError(err.response?.data?.detail || err.message || 'Failed to update priority. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0d121c] p-6 shadow-2xl text-slate-100 transform transition-all">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                Administrative Override
              </span>
              <span className="font-mono text-xs text-slate-400">
                {ticket.tracking_code || `#${ticket.id}`}
              </span>
            </div>
            <h2 className="mt-1.5 text-base font-bold text-white tracking-tight">
              Adjust Urgency Priority & SLA
            </h2>
            <p className="mt-0.5 max-w-sm truncate text-xs text-slate-400">
              {ticket.title}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Current Level Pill */}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#070a10] px-3.5 py-2.5">
            <span className="text-xs text-slate-400">Current Assigned Priority:</span>
            <PriorityBadge priority={ticket.priority} size="sm" dark />
          </div>

          {/* Priority Tier Cards Grid */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">
              Target Priority Tier <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITY_OPTIONS.map((opt) => {
                const isSelected = newPriority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewPriority(opt.value)}
                    className={`rounded-xl border p-2.5 text-left transition cursor-pointer relative ${
                      isSelected
                        ? `${opt.color} shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/50`
                        : 'border-white/[0.07] bg-white/[0.02] text-slate-400 hover:border-white/[0.15] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white tracking-tight">{opt.label}</span>
                      <span className="text-[10px] font-mono opacity-80">{opt.sla}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400 line-clamp-1">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
            {!isPriorityChanged && (
              <p className="mt-1 text-[11px] text-amber-400">
                Select a different tier to initiate the override.
              </p>
            )}
          </div>

          {/* Mandatory Justification */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="override-reason" className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Institutional Justification <span className="text-rose-400">*</span>
              </label>
              <span className={`text-[10px] font-mono ${cleanReason.length >= 5 ? 'text-slate-400' : 'text-rose-400 font-semibold'}`}>
                {cleanReason.length}/500 (min 5 chars)
              </span>
            </div>
            <textarea
              id="override-reason"
              rows={3}
              maxLength={500}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              disabled={submitting}
              placeholder="State institutional reason (e.g. verified secondary leak, lab exam rescheduled, severe safety hazard)..."
              className="w-full rounded-xl border border-white/[0.1] bg-[#070a10] p-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/10 resize-none transition"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Audit log permanently attaches your administrative signature to this action.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
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
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'Applying Override…' : 'Save Priority Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
