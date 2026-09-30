/**
 * SmartComplaintHandler - Submit Complaint Page
 * Blueprint Reference: V1/M2/frontend/02_submit_complaint_page.md & V1/M3/00_M3_CENTRAL_OVERVIEW.md
 * Role: Student intake form with integrated LiveTriageCard preview, real-time hazard detection,
 *       and automated ticket ingestion.
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitComplaint } from '../api/complaints';
import LiveTriageCard from '../components/LiveTriageCard';
import SubmissionSuccessModal from '../components/SubmissionSuccessModal';

export default function SubmitComplaint() {
  const { currentPersona, isStudent } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: currentPersona?.location || 'Hostel Block B, Room 204',
  });

  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (formData.title.trim().length < 5 || formData.description.trim().length < 10) {
      setError('Please provide a descriptive title (>= 5 chars) and description (>= 10 chars).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const ticket = await submitComplaint({
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim() || 'Campus',
      });

      setCreatedTicket(ticket);
      setIsSuccessModalOpen(true);
      setFormData({
        title: '',
        description: '',
        location: currentPersona?.location || 'Hostel Block B, Room 204',
      });
    } catch (err) {
      setError(err.message || 'Network error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              Module M2 Intake Portal
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Student Grievance Gateway
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">
            File a Campus Grievance / Maintenance Ticket
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Smart Complaint Handler dynamically classifies your report, identifies safety hazards, and routes it to the designated squad with guaranteed SLA resolution.
          </p>
        </div>

        {/* Persona Indicator Box */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3 text-left">
          <span className="text-2xl">{currentPersona.avatar}</span>
          <div>
            <div className="text-xs font-bold text-slate-800">
              Filing as: {currentPersona.name}
            </div>
            <div className="text-[11px] text-slate-500">
              {currentPersona.roleLabel} • {currentPersona.identifier}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, Live Triage Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800">Incident Details</h2>
            <span className="text-[11px] text-slate-400 font-medium">Fields with * are required</span>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-start space-x-2">
              <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Complaint Title <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] font-mono ${formData.title.trim().length >= 5 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {formData.title.trim().length}/5 chars min
              </span>
            </div>
            <input
              id="title"
              name="title"
              type="text"
              required
              minLength={5}
              maxLength={200}
              placeholder="e.g. Water cooler wire sparking, or Room 302 ceiling fan stopped"
              value={formData.title}
              onChange={handleChange}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Grievance Narrative / Description <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] font-mono ${formData.description.trim().length >= 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {formData.description.trim().length}/10 chars min
              </span>
            </div>
            <textarea
              id="description"
              name="description"
              required
              minLength={10}
              rows={4}
              placeholder="Provide specific details about the issue. If sparks, smoke, or leaks are occurring, please mention them clearly for hazard escalation."
              value={formData.description}
              onChange={handleChange}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Campus Location <span className="text-rose-500">*</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              required
              placeholder="e.g. Hostel Block B Room 204, or Science Lab 3"
              value={formData.location}
              onChange={handleChange}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="pt-1">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
              Quick Test Presets:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    title: 'Switchboard sparking and smoking heavily',
                    description: 'Active electrical fire hazard observed in computer lab 302, visible sparks.',
                    location: 'Computer Lab 302, Academic Block'
                  });
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-200 transition-colors"
              >
                ⚡ Fire & Spark (CRITICAL)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    title: 'Main water pipe burst in hallway',
                    description: 'Waterline broken, floor 2 is flooding heavily near stairs.',
                    location: 'Hostel 4, 2nd Floor Corridor'
                  });
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold border border-amber-200 transition-colors"
              >
                🚰 Pipe Burst (HIGH)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    title: 'Study desk paint peeling off',
                    description: 'Cosmetic paint scratches and peeling on seminar hall table.',
                    location: 'Seminar Hall B, Floor 1'
                  });
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-300 transition-colors"
              >
                🪵 Paint Peel (LOW)
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex justify-center items-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? 'Registering Complaint...' : 'Register Grievance Ticket'}
          </button>
        </form>

        {/* Live Triage Preview Card Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live AI/Rule Intelligence Preview
            </span>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Module M3 Active
            </span>
          </div>

          <LiveTriageCard title={formData.title} description={formData.description} />

          <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 space-y-2">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              How Triage Works
            </h4>
            <p>
              As you type, the system scans for safety keywords (e.g. <em>spark, smoke, fire, leak</em>) to detect emergencies, classifies the department, and stamps the SLA target.
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SubmissionSuccessModal
        isOpen={isSuccessModalOpen}
        ticket={createdTicket}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
}
