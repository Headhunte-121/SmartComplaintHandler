/**
 * SmartComplaintHandler - Staff Ticket Resolution Modal
 * Blueprint Reference: V1/M5/frontend/03_resolution_notes_modal.md
 * Role: Mandatory closure gate requiring min 10 chars of resolution notes, parts, and technician metadata.
 */
import React, { useState, useEffect } from 'react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 id="resolve-modal-title" className="text-lg font-bold text-slate-900">
              Resolve Complaint
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-mono font-semibold text-slate-700">{ticket.tracking_code}</span>
              {' — '}
              {ticket.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Resolution Notes Field */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="resolution_notes" className="block text-xs font-semibold text-slate-700">
                Detailed Resolution & Work Performed <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-medium ${trimmedLength >= 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {trimmedLength} / 1000 characters (min 10)
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
              className={`mt-1.5 w-full rounded-xl border p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 ${
                showValidationError
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
              }`}
            />
            {showValidationError && (
              <p className="mt-1 text-[11px] text-rose-500">
                Please enter at least 10 characters detailing the repair.
              </p>
            )}
          </div>

          {/* Parts Replaced Field */}
          <div>
            <label htmlFor="parts_replaced" className="block text-xs font-semibold text-slate-700">
              Parts Replaced / Materials Consumed <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="parts_replaced"
              disabled={isSubmitting}
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
              placeholder="e.g., 2x PVC Elbow 1-inch, 1x 15A Circuit Breaker"
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </div>

          {/* Technician Name Field */}
          <div>
            <label htmlFor="technician_name" className="block text-xs font-semibold text-slate-700">
              Technician / Staff Name <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="technician_name"
              disabled={isSubmitting}
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              placeholder="e.g., Dave Miller (Electrical Squad)"
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isNotesValid || isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                <span>Confirm Resolution & Close</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
