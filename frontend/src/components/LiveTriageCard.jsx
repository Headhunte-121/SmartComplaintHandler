/**
 * SmartComplaintHandler - Campus Facility Triage & SLA Guide
 * Glossy Smoked Glass Design
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
  { level: 'MEDIUM', time: '24h SLA', desc: 'Routine functional maintenance', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { level: 'LOW', time: '72h SLA', desc: 'Cosmetic / minor servicing', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
];

export default function LiveTriageCard({ title = '', description = '' }) {
  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();
  const isReady = cleanTitle.length >= 5 && cleanDesc.length >= 10;

  return (
    <div className="p-5 sm:p-6 space-y-4 rounded-2xl border border-white/[0.12] bg-[#0c0d12]/90 backdrop-blur-xl text-zinc-100 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)] relative overflow-hidden">
      <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isReady ? 'bg-emerald-400' : 'bg-zinc-500'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isReady ? 'bg-emerald-400' : 'bg-zinc-500'
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
              ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
              : 'text-zinc-400 bg-white/[0.03] border-white/[0.08]'
          }`}
        >
          {isReady ? 'Ready for Dispatch' : 'Awaiting Input'}
        </span>
      </div>

      {/* Explanatory text */}
      <p className="text-xs text-zinc-400 leading-relaxed">
        When submitted, NLP triage dynamically categorizes the trade, commits an SLA target, and auto-dispatches to the assigned squad.
      </p>

      {/* Campus Service Domains */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider block font-bold text-zinc-500">
          6 Maintenance Categories
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DEPARTMENTS.map((dept) => (
            <div
              key={dept.name}
              className="p-2.5 rounded-xl border border-white/[0.08] bg-[#07080c] hover:border-white/25 flex flex-col justify-between transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">{dept.icon}</span>
                <span className="text-xs font-bold text-zinc-200 truncate">
                  {dept.name}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 line-clamp-1">
                {dept.scope}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic SLA Commitments */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-mono uppercase tracking-wider block font-bold text-zinc-500">
          Resolution Timeline Standards
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {SLA_TIERS.map((tier) => (
            <div
              key={tier.level}
              className={`p-2.5 rounded-xl border flex items-center justify-between ${tier.color}`}
            >
              <div>
                <span className="font-bold block font-mono text-[11px]">{tier.level}</span>
                <span className="text-[10px] opacity-80 block">{tier.desc}</span>
              </div>
              <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-black/40 border border-white/10 shrink-0">
                {tier.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
