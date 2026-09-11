/**
 * SmartComplaintHandler - Submit Complaint Page
 * Blueprint Reference: V1/M2/frontend/02_submit_complaint_page.md
 * Role: Student intake form with live validation and integrated LiveTriageCard preview.
 */
import React, { useState } from 'react';
import LiveTriageCard from '../components/LiveTriageCard';
import SubmissionSuccessModal from '../components/SubmissionSuccessModal';

export default function SubmitComplaint() {
  const [formData, setFormData] = useState({ title: '', description: '', location: '' });
  const [successCode, setSuccessCode] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessCode('TICK-' + Math.random().toString(36).substring(2, 6).toUpperCase());
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Submit Campus Grievance</h2>
      <p className="text-sm text-slate-600 mb-6">Our automated system classifies urgency and dispatches the nearest maintenance squad.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Complaint Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="Brief summary of the issue..."
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Location</label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. Hostel B, Room 204 or Library 1st Floor"
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Detailed Description</label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the issue in detail..."
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
          />
        </div>
        <LiveTriageCard detectedDepartment="" priority="LOW" />
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition">
          Submit Complaint
        </button>
      </form>
      <SubmissionSuccessModal isOpen={!!successCode} trackingCode={successCode} onClose={() => setSuccessCode(null)} />
    </div>
  );
}
