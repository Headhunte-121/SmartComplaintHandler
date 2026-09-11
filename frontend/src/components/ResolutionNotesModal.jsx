/**
 * SmartComplaintHandler - Resolution Notes Modal
 * Blueprint Reference: V1/M5/frontend/03_resolution_notes_modal.md
 * Role: Staff ticket closure dialog enforcing a mandatory 10-character resolution report.
 */
import React, { useState } from 'react';

export default function ResolutionNotesModal({ isOpen, onResolve, onClose }) {
  const [notes, setNotes] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Resolve Complaint</h3>
        <p className="text-xs text-slate-500 mb-4">Document repairs performed before completing closure (min 10 chars):</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Replaced faulty 15A circuit breaker and tested voltage..."
          className="w-full border rounded-lg p-3 text-sm mb-4"
          rows={4}
        />
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm text-slate-600">Cancel</button>
          <button disabled={notes.trim().length < 10} onClick={() => onResolve(notes)} className="px-4 py-2 bg-green-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            Confirm Resolution
          </button>
        </div>
      </div>
    </div>
  );
}
