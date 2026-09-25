/**
 * SmartComplaintHandler - Submit Complaint Page
 * Blueprint Reference: V1/M2/frontend/02_submit_complaint_page.md & V1/M3/00_M3_CENTRAL_OVERVIEW.md
 * Role: Student intake form with integrated LiveTriageCard preview, real-time hazard detection,
 *       and automated ticket ingestion.
 */
import React, { useState } from 'react';
import LiveTriageCard from '../components/LiveTriageCard';
import PriorityBadge from '../components/PriorityBadge';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export default function SubmitComplaint() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
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
      const response = await fetch(`${API_BASE_URL}/tickets/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          location: formData.location.trim() || 'Campus',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to submit complaint.');
      }

      const ticket = await response.json();
      setSubmittedTicket(ticket);
      setFormData({ title: '', description: '', location: '' });
    } catch (err) {
      setError(err.message || 'Network error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
          Campus Maintenance
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">
          File a Campus Grievance / Maintenance Ticket
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Smart Complaint Handler dynamically classifies your report, identifies safety hazards, and routes it to the designated squad with guaranteed SLA resolution.
        </p>
      </div>

      {submittedTicket && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm space-y-3 animate-fade-in">
          <div className="flex items-center space-x-2 text-emerald-800">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold">Complaint Registered Successfully!</h3>
          </div>
          <p className="text-sm text-emerald-900">
            Your tracking code is <strong className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{submittedTicket.tracking_code}</strong>.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <span className="text-slate-600">Assigned Priority:</span>
            <PriorityBadge priority={submittedTicket.priority} size="md" showSlaTooltip={true} />
            {submittedTicket.department_name && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                {submittedTicket.department_name}
              </span>
            )}
          </div>
          <button
            onClick={() => setSubmittedTicket(null)}
            className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
          >
            Submit Another Complaint
          </button>
        </div>
      )}

      {/* Main Grid: Form on Left, Live Triage Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-800">Incident Details</h2>

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Complaint Title <span className="text-rose-500">*</span>
            </label>
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
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Grievance Description <span className="text-rose-500">*</span>
            </label>
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
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

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
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex justify-center items-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? 'Registering Complaint...' : 'Submit Grievance Ticket'}
          </button>
        </form>

        {/* Live Triage Preview Card Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Intelligence Preview
            </span>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Module M3
            </span>
          </div>

          <LiveTriageCard title={formData.title} description={formData.description} />
        </div>
      </div>
    </div>
  );
}
