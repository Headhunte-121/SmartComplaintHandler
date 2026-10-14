/**
 * SmartComplaintHandler - Official Campus Grievance Intake Portal (IIIT Naya Raipur)
 * Blueprint Reference: V1/M2/frontend/02_submit_complaint_page.md
 * Design Pattern: Enterprise two-column intake workstation with 1-click scenario templates,
 *                 interactive category selector, and sticky real-time hazard triage telemetry.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitComplaint } from '../api/complaints';
import LiveTriageCard from '../components/LiveTriageCard';
import SubmissionSuccessModal from '../components/SubmissionSuccessModal';

const CAMPUS_BUILDINGS = [
  'Ramanujan Hostel (Boys Block A)',
  'Bhabha Hostel (Boys Block B)',
  'Bose Hostel (Boys Block C)',
  'Saraswati Hostel (Girls Block)',
  'Academic Block — Ground & 1st Floor',
  'Computer Science & AI Lab Complex',
  'Electronics & VLSI Research Wing',
  'Central Library & Digital Knowledge Center',
  'Administrative & Directorate Block',
  'Student Activity Center & Dining Hall',
];

const SERVICE_CATEGORIES = [
  { id: 'Electrical', icon: '⚡', label: 'Electrical & Power', hint: 'Wiring, fans, AC, switchboards, lighting' },
  { id: 'Plumbing', icon: '🚰', label: 'Plumbing & Water', hint: 'RO coolers, pipe leaks, restroom drainage' },
  { id: 'IT Support', icon: '🌐', label: 'IT & Campus Wi-Fi', hint: 'LAN ports, access points, lab systems' },
  { id: 'Carpentry', icon: '🪑', label: 'Carpentry & Civil', hint: 'Doors, locks, windows, desks, furniture' },
  { id: 'Sanitation', icon: '🧹', label: 'Sanitation & Hygiene', hint: 'Restroom cleaning, waste, pest control' },
  { id: 'General', icon: '🏛️', label: 'General Facilities', hint: 'Pathways, common areas, miscellaneous' },
];

const QUICK_SCENARIO_TEMPLATES = [
  {
    label: '⚡ Sparking Switchboard (Critical)',
    category: 'Electrical',
    building: 'Computer Science & AI Lab Complex',
    room: 'Lab 204, Server Rack Row B',
    title: 'Main electrical switchboard emitting sparks and burning smell',
    description:
      'The three-phase distribution switchboard near Row B is emitting visible electrical sparks and a strong burning insulation odor. Immediate shutdown and inspection required.',
  },
  {
    label: '🚰 RO Water Cooler Leak (High)',
    category: 'Plumbing',
    building: 'Bhabha Hostel (Boys Block B)',
    room: '2nd Floor North Corridor',
    title: 'Drinking water cooler inlet pipe burst and flooding corridor',
    description:
      'The main inlet valve behind the 2nd floor RO water cooler has ruptured, causing continuous water pooling across the hostel corridor near the staircase.',
  },
  {
    label: '🌐 Hostel Wi-Fi Outage (Medium)',
    category: 'IT Support',
    building: 'Ramanujan Hostel (Boys Block A)',
    room: 'Wing B, Rooms 301–312',
    title: 'Ceiling Wi-Fi access point offline with red status LED',
    description:
      'The corridor ceiling access point serving Wing B rooms 301 to 312 has been blinking red since morning and students cannot connect to the institutional network.',
  },
];

export default function SubmitComplaint() {
  const { currentPersona, currentUser } = useAuth();
  const activeUser = currentUser || currentPersona;

  const [building, setBuilding] = useState(CAMPUS_BUILDINGS[0]);
  const [specificLocation, setSpecificLocation] = useState('Room 204');
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0].id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const applyQuickTemplate = (tpl) => {
    setCategory(tpl.category);
    setBuilding(tpl.building);
    setSpecificLocation(tpl.room);
    setTitle(tpl.title);
    setDescription(tpl.description);
    setError(null);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (title.trim().length < 5 || description.trim().length < 10) {
      setError('Please provide a descriptive title (at least 5 characters) and detailed narrative (at least 10 characters).');
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
        student_name: activeUser?.name || 'Nikhil (Student)',
        student_email: activeUser?.email || 'nikhil26100@iiitnr.edu.in',
      });

      setCreatedTicket(ticket);
      setIsSuccessModalOpen(true);
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Network error occurred while submitting grievance.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Enterprise Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl bg-dark-architectural-grid border border-slate-800">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>IIIT-NR Automated Grievance &amp; Dispatch Intake</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Lodge Campus Facility Maintenance Request
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every submission is analyzed in real time for life-safety hazards, routed to the appropriate engineering department, and assigned a binding SLA resolution deadline.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/student"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition-all"
            >
              View My History →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left (7 cols), Sticky Safety Intelligence Panel on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bento-card p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Incident Location &amp; Technical Narrative
              </h2>
              <p className="text-xs text-slate-500">
                Select the affected building and describe the issue clearly for rapid squad dispatch.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">* Required fields</span>
          </div>

          {/* 1-Click Quick Scenario Templates for Fast Testing / Demo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick-Fill Incident Templates (1-Click Demo)
              </span>
              {(title || description) && (
                <button
                  type="button"
                  onClick={() => {
                    setTitle('');
                    setDescription('');
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  Clear Form
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_SCENARIO_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => applyQuickTemplate(tpl)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/90 hover:border-indigo-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700 flex items-start space-x-2.5 animate-fade-in">
              <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Authenticated Requestor Identity Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shadow-2xs shrink-0">
                {activeUser?.avatar || '🎓'}
              </span>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  Verified Submitter Identity
                </span>
                <span className="font-bold text-slate-900 truncate block">
                  {activeUser?.name} • <span className="font-mono text-indigo-600">{activeUser?.email}</span>
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 shrink-0">
              {activeUser?.identifier}
            </span>
          </div>

          {/* Interactive Service Category Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Facility Domain Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SERVICE_CATEGORIES.map((cat) => {
                const selected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/15 shadow-2xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{cat.icon}</span>
                      {selected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1.5">
                      {cat.label}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {cat.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campus Building & Specific Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="building" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Campus Building / Hostel <span className="text-rose-500">*</span>
              </label>
              <select
                id="building"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="enterprise-input"
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
                Room / Wing / Floor <span className="text-rose-500">*</span>
              </label>
              <input
                id="specificLocation"
                type="text"
                required
                placeholder="e.g. Room 204, 2nd Floor"
                value={specificLocation}
                onChange={(e) => setSpecificLocation(e.target.value)}
                className="enterprise-input"
              />
            </div>
          </div>

          {/* Issue Title */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Incident Summary Title <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] font-mono font-semibold ${
                  title.trim().length >= 5 ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {title.trim().length} / 5+ chars
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
              className="enterprise-input text-sm"
            />
          </div>

          {/* Detailed Narrative */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Detailed Technical Description <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] font-mono font-semibold ${
                  description.trim().length >= 10 ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {description.trim().length} / 10+ chars
              </span>
            </div>
            <textarea
              id="description"
              required
              minLength={10}
              rows={4}
              placeholder="Describe the physical defect, duration, and any safety symptoms (such as sparks, smoke, or active water leakage)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              className="enterprise-input text-sm resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span>Dispatching Grievance to Maintenance Queue...</span>
            ) : (
              <>
                <span>Submit Official Maintenance Request</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Right Sticky Triage Telemetry Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Triage &amp; SLA Preview
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ● Deterministic Engine Active
            </span>
          </div>

          <LiveTriageCard title={title} description={description} />

          {/* SLA Reference Matrix Card */}
          <div className="bento-card p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Institutional SLA Resolution Targets
              </h4>
              <span className="text-[10px] font-mono text-slate-400">24/7 Watchdog</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/70">
                <span className="font-black text-rose-700 block">CRITICAL</span>
                <span className="text-rose-600 font-mono">2 Hours Max</span>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200/70">
                <span className="font-black text-orange-700 block">HIGH</span>
                <span className="text-orange-600 font-mono">8 Hours Max</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                <span className="font-black text-amber-800 block">MEDIUM</span>
                <span className="text-amber-700 font-mono">24 Hours Max</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                <span className="font-black text-emerald-700 block">LOW</span>
                <span className="text-emerald-600 font-mono">72 Hours Max</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SubmissionSuccessModal
        isOpen={isSuccessModalOpen}
        ticket={createdTicket}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
}
