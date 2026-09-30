/**
 * SmartComplaintHandler - Official Campus Grievance Intake Portal
 * Blueprint Reference: V1/M2/frontend/02_submit_complaint_page.md
 * Role: Official student & faculty intake form for campus maintenance requests, featuring automated
 *       hazard identification, departmental categorization, and guaranteed SLA deadline assignment.
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitComplaint } from '../api/complaints';
import LiveTriageCard from '../components/LiveTriageCard';
import SubmissionSuccessModal from '../components/SubmissionSuccessModal';

const CAMPUS_BUILDINGS = [
  'Hostel Block B (Boys)',
  'Hostel Block A (Boys)',
  'Hostel Block C (Girls)',
  'Hostel Block D (Girls)',
  'Main Academic Complex — Block 1',
  'Science & Technology Building — Block 2',
  'Computer Science & Engineering Labs',
  'Central University Library',
  'Administrative Block & Dean Office',
  'Indoor Sports Complex & Gymnasium',
  'Dining Hall & Student Cafeteria'
];

const SERVICE_CATEGORIES = [
  'Electrical & Power (Wiring, Lighting, Fans, Switchboards)',
  'Plumbing & Water (Coolers, Leaks, Restroom Drainage)',
  'IT & Networks (Wi-Fi, Lab Systems, Connectivity)',
  'Carpentry & Civil (Desks, Chairs, Doors, Windows)',
  'Sanitation & Hygiene (Cleaning, Waste Disposal, Restrooms)',
  'General Administration (Miscellaneous Estate Maintenance)'
];

export default function SubmitComplaint() {
  const { currentPersona } = useAuth();

  const [building, setBuilding] = useState(CAMPUS_BUILDINGS[0]);
  const [specificLocation, setSpecificLocation] = useState('Room 204');
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (title.trim().length < 5 || description.trim().length < 10) {
      setError('Please provide a descriptive title (>= 5 chars) and detailed narrative (>= 10 chars).');
      return;
    }

    setSubmitting(true);
    setError(null);

    const fullLocation = `${building}, ${specificLocation.trim() || 'General Area'}`;

    try {
      const ticket = await submitComplaint({
        title: title.trim(),
        description: description.trim(),
        location: fullLocation,
      });

      setCreatedTicket(ticket);
      setIsSuccessModalOpen(true);
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err.message || 'Network error occurred while submitting grievance.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Institutional Breadcrumb & Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Campus Facilities</span>
          <span>/</span>
          <span>Service Desk</span>
          <span>/</span>
          <span className="font-semibold text-indigo-600">Lodge Grievance</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          Campus Facility Maintenance Request Form
        </h1>
        <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
          Submit official requests for electrical, plumbing, network, carpentry, or sanitation repairs. All grievances are automatically evaluated for life-safety hazards and dispatched to assigned campus maintenance squads under binding resolution deadlines.
        </p>
      </div>

      {/* Main Grid: Form on Left, Safety Intelligence Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Grievance Narrative & Location Details
            </h2>
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

          {/* User Identity Pre-check */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="text-xl">{currentPersona.avatar}</span>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  Requestor Identity
                </span>
                <span className="font-bold text-slate-800">
                  {currentPersona.name} ({currentPersona.roleLabel})
                </span>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {currentPersona.identifier}
            </span>
          </div>

          {/* Service Category */}
          <div>
            <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Service Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
            >
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Campus Building & Specific Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="building" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Campus Building / Zone <span className="text-rose-500">*</span>
              </label>
              <select
                id="building"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              >
                {CAMPUS_BUILDINGS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="specificLocation" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Room / Area Specification <span className="text-rose-500">*</span>
              </label>
              <input
                id="specificLocation"
                type="text"
                required
                placeholder="e.g. Room 204, Floor 2 East Wing"
                value={specificLocation}
                onChange={(e) => setSpecificLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Issue Summary / Title <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] font-mono ${title.trim().length >= 5 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {title.trim().length}/5 chars min
              </span>
            </div>
            <input
              id="title"
              type="text"
              required
              minLength={5}
              maxLength={150}
              placeholder="e.g. Water cooler leaking heavily, or Lab switchboard sparking"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Detailed Narrative */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Detailed Narrative of Physical Damage <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] font-mono ${description.trim().length >= 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {description.trim().length}/10 chars min
              </span>
            </div>
            <textarea
              id="description"
              required
              minLength={10}
              rows={4}
              placeholder="Describe what occurred, any strange sounds, smells, or visual signs. Mention if visible sparks, smoke, or water flooding are present to ensure rapid emergency dispatch."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          {/* Submission Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex justify-center items-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? 'Registering Incident in Campus Database...' : 'Submit Grievance to Facilities Desk'}
          </button>
        </form>

        {/* Real-time Triage Telemetry Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Automated Triage Assessment
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Rule Engine Active
            </span>
          </div>

          <LiveTriageCard title={title} description={description} />

          {/* Institutional Advisory Notice */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 space-y-2 shadow-2xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <span>🛡️</span>
              <span>Campus Service Standards</span>
            </h4>
            <p className="leading-relaxed">
              Upon submission, your complaint is assigned a permanent tracking code (<code className="font-bold text-slate-700">TICK-XXXX</code>). A field technician is automatically dispatched, and real-time updates are published to the student portal.
            </p>
          </div>
        </div>
      </div>

      {/* Success Confirmation Modal */}
      <SubmissionSuccessModal
        isOpen={isSuccessModalOpen}
        ticket={createdTicket}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
}
