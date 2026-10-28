/**
 * SmartComplaintHandler - Staff Ticket Resolution Modal
 * Styled in High-Density Obsidian Glassmorphic Theme to match modern Operations Desk.
 */
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Wrench, AlertTriangle, X } from 'lucide-react';
import { resolveTicket } from '../api/sla';

export default function ResolutionNotesModal({
  isOpen,
  ticket,
  onClose,
  onResolved,
}) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [touched, setTouched] = useState(false);

  // Reset form when modal opens with a new ticket
  useEffect(() => {
    if (isOpen) {
      setResolutionNotes('');
      setPartsReplaced('');
      setTechnicianName('');
      setErrorMessage(null);
      setTouched(false);
    }
  }, [isOpen, ticket]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !ticket) {
    return null;
  }

  const trimmedLength = resolutionNotes.trim().length;
  const isNotesValid = trimmedLength >= 10;
  const showValidationError = touched && !isNotesValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);

    if (!isNotesValid) {
      setErrorMessage('Resolution notes must contain at least 10 characters detailing the physical repair.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const updatedTicket = await resolveTicket(
        ticket.id,
        resolutionNotes.trim(),
        partsReplaced.trim(),
        technicianName.trim()
      );
      if (onResolved) {
        onResolved(updatedTicket);
      }
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Failed to resolve ticket. Please try again.';
      setErrorMessage(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/[0.14] bg-[#0c0d12]/95 backdrop-blur-2xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.1)] text-zinc-100 relative overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400">
                Ticket Closure Gate
              </span>
              <span className="font-mono text-xs text-slate-400">
                {ticket.tracking_code || `#${ticket.id}`}
              </span>
            </div>
            <h2 className="mt-1.5 text-base font-bold text-white tracking-tight">
              Resolve Incident & Commit Notes
            </h2>
            <p className="mt-0.5 max-w-sm truncate text-xs text-slate-400">
              {ticket.title} · {ticket.location || 'Campus Location'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Resolution Notes Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="resolution_notes" className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Physical Work Completed <span className="text-rose-400">*</span>
              </label>
              <span className={`text-[10px] font-mono ${trimmedLength >= 10 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                {trimmedLength}/1000 (min 10 chars)
              </span>
            </div>
            <textarea
              id="resolution_notes"
              rows={3}
              required
              disabled={isSubmitting}
              value={resolutionNotes}
              onChange={(e) => {
                setResolutionNotes(e.target.value);
                if (!touched) setTouched(true);
              }}
              placeholder="Detail the physical diagnosis completed, repairs executed, or verified operation..."
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090f] border-white/[0.16] shadow-inner p-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/10 resize-none transition"
            />
            {showValidationError && (
              <p className="mt-1 text-[11px] text-rose-400">
                Please enter at least 10 characters detailing the physical repair.
              </p>
            )}
          </div>

          {/* Parts Replaced Field */}
          <div>
            <label htmlFor="parts_replaced" className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
              Parts Replaced / Materials Consumed <span className="text-[10px] font-normal text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              id="parts_replaced"
              disabled={isSubmitting}
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
              placeholder="e.g. 2x PVC Elbow 1-inch, 1x 16A MCB Breaker, Cat6 patch cable"
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090f] border-white/[0.16] shadow-inner px-3.5 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-white/40 transition"
            />
          </div>

          {/* Technician Name Field */}
          <div>
            <label htmlFor="technician_name" className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
              Technician / Lead Sign-Off <span className="text-[10px] font-normal text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              id="technician_name"
              disabled={isSubmitting}
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              placeholder="e.g. Dave Miller (Electrical Squad Lead)"
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090f] border-white/[0.16] shadow-inner px-3.5 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-white/40 transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isNotesValid || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/30 px-5 py-2 text-xs font-bold transition shadow-[0_2px_14px_rgba(16,185,129,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <span>Resolving Incident…</span>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Confirm Resolution &amp; Close</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
