/**
 * SmartComplaintHandler - Staff Ticket Resolution Modal
 * Blueprint Reference: V1/M5/frontend/03_resolution_notes_modal.md
 * Role: Mandatory closure gate requiring min 10 chars of resolution notes, parts, and technician metadata with dual theme styling.
 */
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { resolveTicket } from '../api/sla';

export default function ResolutionNotesModal({
  isOpen,
  ticket,
  onClose,
  onResolved,
}) {
  const { isDark } = useTheme();
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
      setErrorMessage('Resolution notes must contain at least 10 characters detailing the repair.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const updatedTicket = await resolveTicket(
        ticket.id,
        resolutionNotes,
        partsReplaced,
        technicianName
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
      aria-labelledby="resolve-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden transition-all ${
          isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-start justify-between border-b p-6 ${
            isDark ? 'border-zinc-800 bg-[#161b22]' : 'border-slate-300 bg-[#e2e8f0]/60'
          }`}
        >
          <div>
            <span
              className={`text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                isDark
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                  : 'text-emerald-800 bg-emerald-100 border-emerald-300'
              }`}
            >
              Incident Resolution Gate
            </span>
            <h3 id="resolve-modal-title" className={`text-base font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Resolve Complaint
            </h3>
            <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              <span className={`font-mono font-bold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{ticket.tracking_code}</span>
              {' — '}
              {ticket.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
              isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            className={`m-6 mb-0 rounded-xl border p-3 text-xs ${
              isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-100 border-rose-300 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Resolution Notes Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="resolution_notes" className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Detailed Resolution &amp; Work Performed <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-mono ${trimmedLength >= 10 ? 'text-emerald-500 font-bold' : isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                {trimmedLength} / 1000 chars (min 10)
              </span>
            </div>
            <textarea
              id="resolution_notes"
              rows={4}
              required
              disabled={isSubmitting}
              value={resolutionNotes}
              onChange={(e) => {
                setResolutionNotes(e.target.value);
                if (!touched) setTouched(true);
              }}
              placeholder="Detail the physical repairs completed, components replaced, or verification performed..."
              className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 resize-none ${
                showValidationError
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                  : isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
            {showValidationError && (
              <p className="mt-1 text-[11px] text-rose-400">
                Please enter at least 10 characters detailing the repair.
              </p>
            )}
          </div>

          {/* Parts Replaced Field */}
          <div>
            <label htmlFor="parts_replaced" className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Parts Replaced / Materials Consumed <span className={`text-[11px] font-normal ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>(Optional)</span>
            </label>
            <input
              type="text"
              id="parts_replaced"
              disabled={isSubmitting}
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
              placeholder="e.g., 2x PVC Elbow 1-inch, 1x 15A Circuit Breaker"
              className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
          </div>

          {/* Technician Name Field */}
          <div>
            <label htmlFor="technician_name" className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Technician / Staff Name <span className={`text-[11px] font-normal ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>(Optional)</span>
            </label>
            <input
              type="text"
              id="technician_name"
              disabled={isSubmitting}
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              placeholder="e.g., Dave Miller (Electrical Squad)"
              className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div
            className={`p-4 -mx-6 -mb-6 border-t flex items-center justify-end space-x-2 ${
              isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0]/60 border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-[#161b22] hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isNotesValid || isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-xs disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Resolving Ticket...</span>
                </>
              ) : (
                <span>Confirm Resolution &amp; Close</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
