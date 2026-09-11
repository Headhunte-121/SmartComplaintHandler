/**
 * SmartComplaintHandler - Priority Override Modal
 * Blueprint Reference: V1/M3/frontend/04_priority_override_modal.md
 * Role: Supervisor modal for priority re-classification with mandatory reason guard.
 */
import React, { useState } from 'react';

export default function PriorityOverrideModal({ isOpen, currentPriority, onSave, onClose }) {
  const [priority, setPriority] = useState(currentPriority);
  const [reason, setReason] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Override Ticket Priority</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for priority override (min 5 chars)..."
          className="w-full border border-slate-300 rounded-lg p-2 text-sm mb-4"
          rows={3}
        />
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm text-slate-600">Cancel</button>
          <button
            disabled={reason.trim().length < 5}
            onClick={() => onSave(priority, reason)}
            className="px-4 py-2 bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            Confirm Override
          </button>
        </div>
      </div>
    </div>
  );
}
