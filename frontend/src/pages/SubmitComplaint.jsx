/**
 * SmartComplaintHandler - Official Campus Grievance Intake Portal
 * Blueprint Reference: V1/M2/frontend/02_submit_complaint_page.md
 * Role: Modern, streamlined student & faculty intake portal featuring interactive category selection,
 *       real-time AI triage assessment, and guaranteed turnaround SLA assignment.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitComplaint } from '../api/complaints';
import LiveTriageCard from '../components/LiveTriageCard';
import SubmissionSuccessModal from '../components/SubmissionSuccessModal';

const CAMPUS_BUILDINGS = [
  'Ramanujan House (Boys Hostel)',
  'Bhabha House (Boys Hostel)',
  'Raman House (Boys Hostel)',
  'Bose House (Hostel)',
  'Shabhari House (Girls Hostel)',
  'Academic Block 1 — Smart Classrooms (120-Seater)',
  'Academic Block 2 — AI, Data Science & Big Data Labs',
  'Academic Block 2 — VLSI, IoT & Embedded Systems Labs',
  'Academic Block 2 — Networks & Information Security Labs',
  'Central Library (Knowledge Resource Centre)',
  'Student Activity Center (SAC) & Gymnasium',
  'Campus Dining Hall & Cafeteria',
  'Administrative Complex & Director Office',
  'Campus Health Centre & Dispensary',
];

const CATEGORY_CARDS = [
  {
    id: 'electrical',
    title: 'Electrical & Power',
    subtitle: 'Lighting, fans, switchboards, wiring, UPS',
    fullCategory: 'Electrical & Power (Wiring, Lighting, Fans, Switchboards)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'from-amber-500/10 to-amber-500/5 text-amber-700 border-amber-200',
  },
  {
    id: 'plumbing',
    title: 'Plumbing & Water',
    subtitle: 'RO coolers, taps, leaks, washroom drainage',
    fullCategory: 'Plumbing & Water (Coolers, Leaks, Restroom Drainage)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    color: 'from-blue-500/10 to-blue-500/5 text-blue-700 border-blue-200',
  },
  {
    id: 'network',
    title: 'IT & Campus Network',
    subtitle: 'Wi-Fi access points, LAN ports, lab PCs',
    fullCategory: 'IT & Networks (Wi-Fi, Lab Systems, Connectivity)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
    color: 'from-indigo-500/10 to-indigo-500/5 text-indigo-700 border-indigo-200',
  },
  {
    id: 'carpentry',
    title: 'Carpentry & Furniture',
    subtitle: 'Hostel cots, study desks, chairs, door locks',
    fullCategory: 'Carpentry & Civil (Desks, Chairs, Doors, Windows)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: 'from-amber-600/10 to-amber-600/5 text-amber-800 border-amber-200',
  },
  {
    id: 'sanitation',
    title: 'Sanitation & Hygiene',
    subtitle: 'Washroom cleaning, waste disposal, pest control',
    fullCategory: 'Sanitation & Hygiene (Cleaning, Waste Disposal, Restrooms)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    color: 'from-teal-500/10 to-teal-500/5 text-teal-700 border-teal-200',
  },
  {
    id: 'general',
    title: 'Civil & Campus Facilities',
    subtitle: 'Walls, glass panes, sports courts, dining area',
    fullCategory: 'General Administration (Miscellaneous Estate Maintenance)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: 'from-slate-500/10 to-slate-500/5 text-slate-700 border-slate-200',
  },
];

export default function SubmitComplaint() {
  const { currentPersona, currentUser } = useAuth();

  const [selectedCategoryId, setSelectedCategoryId] = useState(CATEGORY_CARDS[0].id);
  const [building, setBuilding] = useState(CAMPUS_BUILDINGS[0]);
  const [specificLocation, setSpecificLocation] = useState('Room 204, Wing B');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const studentName = currentUser?.name || currentPersona?.name || 'Nikhil (Student)';
  const studentEmail = currentUser?.email || currentPersona?.email || 'nikhil26100@iiitnr.edu.in';
  const studentIdentifier = currentUser?.identifier || currentPersona?.identifier || 'Student';
  const studentDepartment = currentUser?.department || currentPersona?.department || 'Computer Science & Engineering';

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
        student_name: studentName,
        student_email: studentEmail,
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
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-16">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <Link to="/student" className="hover:text-indigo-600 transition-colors">
              Campus Facilities
            </Link>
            <span>/</span>
            <span className="text-indigo-600">Lodge Grievance</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Lodge a Campus Facility Grievance
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Report maintenance issues across hostels, academic blocks, or labs. Automated AI triage routes your request directly to the assigned campus squad under binding resolution SLAs.
          </p>
        </div>

        <Link
          to="/student"
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 self-start sm:self-auto border border-slate-200/60"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>View My Dashboard</span>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Container */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-start space-x-2.5">
              <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Compact Requestor Strip */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shadow-2xs">
                🎓
              </div>
              <div>
                <span className="font-bold text-slate-900 block leading-tight">
                  {studentName}
                </span>
                <span className="text-[11px] text-slate-400">
                  {studentIdentifier} • {studentDepartment}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
              Verified Student
            </span>
          </div>

          {/* Step 1: Select Facility Category (Interactive Visual Cards) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                1. Select Maintenance Category <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Click to choose</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORY_CARDS.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-600/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div className={`p-2 rounded-xl border bg-linear-to-b ${cat.color}`}>
                        {cat.icon}
                      </div>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <span className={`text-xs font-bold block leading-tight ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                        {cat.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                        {cat.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Campus Building & Specific Room */}
          <div className="space-y-2.5 pt-1 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 block">
              2. Campus Location Details <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="building" className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Campus Building / Block
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
                <label htmlFor="specificLocation" className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Room, Wing or Area Specification
                </label>
                <input
                  id="specificLocation"
                  type="text"
                  required
                  placeholder="e.g. Room 204, Wing B or Lab 131C"
                  value={specificLocation}
                  onChange={(e) => setSpecificLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Issue Title & Narrative */}
          <div className="space-y-4 pt-1 border-t border-slate-100">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="title" className="block text-xs font-bold text-slate-800">
                  3. Issue Summary / Title <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[10px] font-mono font-medium ${title.trim().length >= 5 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {title.trim().length}/5 chars min
                </span>
              </div>
              <input
                id="title"
                type="text"
                required
                minLength={5}
                maxLength={150}
                placeholder="e.g. Water cooler leaking heavily on 2nd floor, or Lab switchboard sparking"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="description" className="block text-xs font-bold text-slate-800">
                  Detailed Narrative of Physical Damage <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[10px] font-mono font-medium ${description.trim().length >= 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
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
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex justify-center items-center space-x-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Dispatching Request to Campus Desk...</span>
                </>
              ) : (
                <>
                  <span>Submit Maintenance Request</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live AI Triage Sidebar */}
        <div className="lg:col-span-5 space-y-4">
          <LiveTriageCard title={title} description={description} />

          {/* Campus SLA Standards Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-500 space-y-2 shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <h4 className="font-bold text-slate-800 text-xs">
                IIIT-NR Facilities Governance
              </h4>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Upon submission, your complaint receives a permanent tracking code (<code className="font-bold text-slate-700 font-mono">TICK-XXXX</code>). A field technician squad is automatically notified, and live timeline progress is published to your student dashboard.
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
