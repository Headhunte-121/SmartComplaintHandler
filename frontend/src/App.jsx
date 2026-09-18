/**
 * SmartComplaintHandler - Root Application Component
 * Blueprint Reference: docs/V1/M5/00_M5_CENTRAL_OVERVIEW.md
 * Role: Demonstrates Module M5 SLA Tracking, Escalation Automata & Resolution Gateways.
 */
import React, { useState } from 'react';
import SLACountdownTimer from './components/SLACountdownTimer';
import ResolutionNotesModal from './components/ResolutionNotesModal';
import SLABreachTable from './components/SLABreachTable';

export default function App() {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  // Demo tickets for live timer inspection
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="text-xs font-bold tracking-wider text-emerald-600 uppercase bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Module M5 Active
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              SLA Tracking, Escalation Automata & Resolution Gateways
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Automated closed-loop SLA countdowns, supervisory breach triage, and verified repair closure dialogs.
            </p>
          </div>
          <button
            onClick={() => handleOpenResolve({
              id: 101,
              tracking_code: 'TICK-DEMO-99',
              title: 'Water Leakage in 3rd Floor Washroom',
            })}
            className="self-start md:self-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Launch Resolution Gateway
          </button>
        </div>

        {/* Live SLA Countdown Timer Showcase */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            SLACountdownTimer — Dynamic Multi-Tier Severity Display
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
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

        {/* Modal Gateway */}
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
