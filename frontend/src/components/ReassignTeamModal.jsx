/**
 * SmartComplaintHandler - Reassign Squad Modal
 * Blueprint Reference: V1/M4/frontend/04_reassign_modal.md
 * Role: Administrative modal allowing squad transfer with mandatory reason audit logging.
 */
import React, { useState } from 'react';

export default function ReassignTeamModal({ isOpen, teams = [], onSave, onClose }) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [reason, setReason] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Reassign Ticket Squad</h3>
        <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="w-full border rounded-lg p-2 text-sm mb-3">
          <option value="">Select Maintenance Squad</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for reassignment (min 5 chars)..."
          className="w-full border rounded-lg p-2 text-sm mb-4"
          rows={3}
        />
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm text-slate-600">Cancel</button>
          <button disabled={!selectedTeam || reason.trim().length < 5} onClick={() => onSave(selectedTeam, reason)} className="px-4 py-2 bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            Reassign
          </button>
        </div>
      </div>
    </div>
  );
}
