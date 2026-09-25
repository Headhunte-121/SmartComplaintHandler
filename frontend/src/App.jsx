/**
 * SmartComplaintHandler - Root Application Component
 * Blueprint Reference: docs/V1/M3/00_M3_CENTRAL_OVERVIEW.md & docs/V1/M5/00_M5_CENTRAL_OVERVIEW.md
 * Role: Demonstrates Module M3 Triage & Priority Engine alongside Module M5 SLA Tracking.
 */
import React, { useState } from 'react';
import LiveTriageCard from './components/LiveTriageCard';
import PriorityBadge from './components/PriorityBadge';
import PriorityOverrideModal from './components/PriorityOverrideModal';
import SLACountdownTimer from './components/SLACountdownTimer';
import ResolutionNotesModal from './components/ResolutionNotesModal';
import SLABreachTable from './components/SLABreachTable';

export default function App() {
  // M3 Live Triage Playground State
  const [demoTitle, setDemoTitle] = useState('Water cooler electrical wire sparking in corridor');
  const [demoDescription, setDemoDescription] = useState('Continuous visible fire sparks coming from the exposed electrical wire near the water cooler basin.');

  // M3 Override Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideTicket, setOverrideTicket] = useState({
    id: 1,
    tracking_code: 'TICK-M3-4412',
    title: 'Ceiling fan smoking in Room 204',
    priority: 'CRITICAL',
    resolution_notes: null,
  });

  // M5 Resolve Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  // M5 Live timer timestamps
  const now = new Date();
  const futureHealthy = new Date(now.getTime() + 5 * 3600 * 1000).toISOString();
  const futureStandard = new Date(now.getTime() + 2 * 3600 * 1000).toISOString();
  const futureUrgent = new Date(now.getTime() + 45 * 60 * 1000).toISOString();
  const pastOverdue = new Date(now.getTime() - 90 * 60 * 1000).toISOString();

  const handleOpenResolve = (ticket) => {
    setSelectedTicket(ticket);
    setIsResolveModalOpen(true);
  };

  const handleTicketResolved = (updatedTicket) => {
    alert(`Ticket ${updatedTicket.tracking_code} has been marked as RESOLVED!`);
  };

  const handlePriorityUpdated = (updated) => {
    setOverrideTicket(updated);
    alert(`Priority override saved: ${updated.tracking_code} is now ${updated.priority}!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Main Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                Module M3 & M5 Active
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Smart Complaint Handler v1.0
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">
              Automated Triage, Priority Intelligence & SLA Governance
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic 5-domain taxonomy classification, life-safety hazard short-circuiting, supervisor overrides, and closed-loop SLA countdown tracking.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setIsOverrideModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Adjust Priority (Supervisor Gate)
            </button>
            <button
              onClick={() => handleOpenResolve({
                id: 101,
                tracking_code: 'TICK-DEMO-99',
                title: 'Water Leakage in 3rd Floor Washroom',
              })}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Launch Resolution Gateway
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* MODULE M3: DETERMINISTIC CLASSIFICATION & LIVE TRIAGE CARD          */}
        {/* =================================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">
              Module M3 — Live Triage Card & Priority Scoring Engine
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              500ms Keystroke Debounced REST Intake
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Keystroke Interactive Input Controls */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  Interactive Keystroke Simulator
                </h3>
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Type to test triage
                </span>
              </div>

              <div>
                <label htmlFor="demo-title" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Complaint Title:
                </label>
                <input
                  id="demo-title"
                  type="text"
                  value={demoTitle}
                  onChange={(e) => setDemoTitle(e.target.value)}
                  placeholder="e.g. Broken water pipe, or Switchboard sparking"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="demo-desc" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Grievance Description:
                </label>
                <textarea
                  id="demo-desc"
                  rows={3}
                  value={demoDescription}
                  onChange={(e) => setDemoDescription(e.target.value)}
                  placeholder="Detailed narrative..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              {/* Preset Sample Buttons */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Test Case Presets:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setDemoTitle('Switchboard sparking and smoking heavily');
                      setDemoDescription('Active electrical fire hazard observed in computer lab 302, visible sparks.');
                    }}
                    className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium border border-rose-200 transition-colors"
                  >
                    Hazard: Fire & Spark (CRITICAL)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoTitle('Main water pipe burst in hallway');
                      setDemoDescription('Waterline broken, floor 2 is flooding heavily near stairs.');
                    }}
                    className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium border border-amber-200 transition-colors"
                  >
                    Outage: Pipe Burst (HIGH)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoTitle('Ceiling fan making squeaking sound');
                      setDemoDescription('Ceiling fan rotates slowly with continuous squeak.');
                    }}
                    className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium border border-blue-200 transition-colors"
                  >
                    Routine: Squeaky Fan (MEDIUM)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoTitle('Study desk paint peeling off');
                      setDemoDescription('Cosmetic paint scratches and peeling on seminar hall table.');
                    }}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-300 transition-colors"
                  >
                    Cosmetic: Paint Peel (LOW)
                  </button>
                </div>
              </div>
            </div>

            {/* Live Triage Card Component Render */}
            <div className="lg:col-span-6 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Live Prediction Component (&lt;LiveTriageCard /&gt;)
              </span>
              <LiveTriageCard title={demoTitle} description={demoDescription} />
            </div>
          </div>
        </div>

        {/* Priority Badges Row */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            Atomic Priority Badges (&lt;PriorityBadge /&gt; — WCAG 2.1 Compliant)
          </h3>
          <p className="text-xs text-slate-500">
            Hover to inspect target SLA response times. CRITICAL tier pulses continuously to anchor human focus.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Critical (4h):</span>
              <PriorityBadge priority="CRITICAL" size="md" showSlaTooltip={true} />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">High (12h):</span>
              <PriorityBadge priority="HIGH" size="md" showSlaTooltip={true} />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Medium (24h):</span>
              <PriorityBadge priority="MEDIUM" size="md" showSlaTooltip={true} />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Low (72h):</span>
              <PriorityBadge priority="LOW" size="md" showSlaTooltip={true} />
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* MODULE M5: SLA COUNTDOWN TIMERS & SUPERVISORY BREACH ESCALATION     */}
        {/* =================================================================== */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-black text-slate-900">
            Module M5 — Dynamic SLA Countdown Timers & Breach Triage
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              SLACountdownTimer — Multi-Tier Urgency Thresholds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 block">Tier 1: Safe Buffer (&gt; 4h)</span>
                <SLACountdownTimer slaDeadline={futureHealthy} status="IN_PROGRESS" />
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 block">Tier 2: Standard (1h - 4h)</span>
                <SLACountdownTimer slaDeadline={futureStandard} status="IN_PROGRESS" />
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 block">Tier 3: Approaching (&lt; 1h)</span>
                <SLACountdownTimer slaDeadline={futureUrgent} status="IN_PROGRESS" />
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 block">Tier 4: Breached (Overdue)</span>
                <SLACountdownTimer slaDeadline={pastOverdue} status="IN_PROGRESS" />
              </div>
            </div>
          </div>

          {/* Supervisory SLA Breach Escalation Panel */}
          <SLABreachTable
            onEscalate={(ticket) => alert(`Escalate action triggered for ${ticket.tracking_code}`)}
            onReassign={(ticket) => alert(`Reassign action triggered for ${ticket.tracking_code}`)}
          />
        </div>

        {/* Modal 1: M3 Priority Override Modal */}
        <PriorityOverrideModal
          isOpen={isOverrideModalOpen}
          ticket={overrideTicket}
          onClose={() => setIsOverrideModalOpen(false)}
          onPriorityUpdated={handlePriorityUpdated}
        />

        {/* Modal 2: M5 Resolution Gateway Modal */}
        <ResolutionNotesModal
          isOpen={isResolveModalOpen}
          ticket={selectedTicket}
          onClose={() => setIsResolveModalOpen(false)}
          onResolved={handleTicketResolved}
        />
      </div>
    </div>
  );
}
