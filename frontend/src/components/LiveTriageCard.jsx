/**
 * SmartComplaintHandler - Campus Facility Triage & SLA Guide
 * High-Density Obsidian Command Desk Standard:
 *  - Translucent glassmorphic card container (bg-[#0e131f]/80 border-white/[0.08])
 *  - Cyan/Emerald glowing pulse live triage status
 *  - High-density department category cards
 *  - Standard SLA resolution commitment badges
 */
import React from 'react';

const DEPARTMENTS = [
  { name: 'Electrical', icon: '⚡', scope: 'Power, lights, fans, AC, MCB, geysers' },
  { name: 'Plumbing', icon: '💧', scope: 'Pipes, leaks, taps, RO, flush, drains' },
  { name: 'Sanitation', icon: '🧹', scope: 'Garbage, cleaning, hygiene, pests' },
  { name: 'Carpentry', icon: '🪚', scope: 'Doors, windows, furniture, locks, hinges' },
  { name: 'IT Support', icon: '📶', scope: 'Wi-Fi, LAN, internet, smart displays' },
  { name: 'Facilities', icon: '🏢', scope: 'Roads, gates, signage, civil campus infra' },
];

const SLA_TIERS = [
  { level: 'CRITICAL', time: '2h SLA', desc: 'Severe hazard / full outage', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  { level: 'HIGH', time: '8h SLA', desc: 'Disruption or locked out', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { level: 'MEDIUM', time: '24h SLA', desc: 'Routine functional maintenance', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  { level: 'LOW', time: '72h SLA', desc: 'Cosmetic / minor servicing', color: 'text-slate-400 border-white/[0.08] bg-white/[0.03]' },
];

export default function LiveTriageCard({ title = '', description = '' }) {
  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();
  const isReady = cleanTitle.length >= 5 && cleanDesc.length >= 10;

  return (
    <div className="p-5 sm:p-6 space-y-4 rounded-2xl border border-white/[0.08] bg-[#0e131f]/80 backdrop-blur-md text-slate-100 shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isReady ? 'bg-cyan-400' : 'bg-slate-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isReady ? 'bg-cyan-400' : 'bg-slate-500'
              }`}
            />
          </span>
          <span className="text-xs font-bold tracking-tight text-white">
            Automated Facility Triage
          </span>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border tracking-wider uppercase ${
            isReady
              ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
              : 'text-slate-400 bg-white/[0.04] border-white/[0.08]'
          }`}
        >
          {isReady ? 'Ready for Dispatch' : 'Awaiting Input'}
        </span>
      </div>

      {/* Explanatory text */}
      <p className="text-xs text-slate-400 leading-relaxed">
        When submitted, NLP triage dynamically categorizes the trade, commits an SLA target, and auto-dispatches to the assigned squad.
      </p>

      {/* Campus Service Domains */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider block font-bold text-slate-500">
          6 Maintenance Categories
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DEPARTMENTS.map((dept) => (
            <div
              key={dept.name}
              className="p-2.5 rounded-xl border border-white/[0.06] bg-[#0b0f19] hover:border-cyan-500/30 flex flex-col justify-between transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">{dept.icon}</span>
                <span className="text-xs font-bold text-slate-200 truncate">
                  {dept.name}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                {dept.scope}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic SLA Commitments */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-mono uppercase tracking-wider block font-bold text-slate-500">
          Resolution Timeline Standards
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {SLA_TIERS.map((tier) => (
            <div
              key={tier.level}
              className={`p-2.5 rounded-xl border flex items-center justify-between ${tier.color}`}
            >
              <div>
                <span className="block font-black text-xs">{tier.level}</span>
                <span className="block text-[10px] opacity-80">{tier.desc}</span>
              </div>
              <span className="font-mono font-black text-xs shrink-0 ml-1">{tier.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Routine Complaint Assurance */}
      <div className="p-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex items-center gap-2 text-[11px] text-slate-300">
        <span className="text-cyan-400 font-bold font-mono">✓ AI Triage:</span>
        <span className="leading-tight">
          No manual trade routing needed. Detail your issue and our system classifies automatically.
        </span>
      </div>
    </div>
  );
}
