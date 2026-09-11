/**
 * SmartComplaintHandler - Submission Success Modal
 * Blueprint Reference: V1/M2/frontend/03_submission_success_modal.md
 * Role: Confirmation modal showing unique tracking code with 1-click clipboard copy.
 */
import React from 'react';

export default function SubmissionSuccessModal({ isOpen, trackingCode, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Complaint Submitted Successfully!</h3>
        <p className="text-sm text-slate-600 mb-4">Save your tracking code to monitor resolution progress:</p>
        <div className="bg-slate-100 p-3 rounded-lg font-mono text-xl font-bold text-blue-600 mb-6">
          {trackingCode}
        </div>
        <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
          Done
        </button>
      </div>
    </div>
  );
}
