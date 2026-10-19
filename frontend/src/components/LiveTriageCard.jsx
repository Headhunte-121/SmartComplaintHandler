/**
 * SmartComplaintHandler - Campus Facility Triage & SLA Guide
 * 100% Client-Side Standby Guide — 0 Background Network Calls & 0 Token Burn While Typing.
 * Classification & Dynamic SLA are executed strictly once upon submission.
 */
import React from 'react';
import { useTheme } from '../context/ThemeContext';

const DEPARTMENTS = [
  { name: 'Electrical', icon: '⚡', scope: 'Power, lights, fans, AC, MCB, geysers' },
  { name: 'Plumbing', icon: '💧', scope: 'Pipes, leaks, taps, RO, flush, drains' },
  { name: 'Sanitation', icon: '🧹', scope: 'Garbage, cleaning, hygiene, pests' },
  { name: 'Carpentry', icon: '🪚', scope: 'Doors, windows, furniture, locks, hinges' },
  { name: 'IT Support', icon: '📶', scope: 'Wi-Fi, LAN, internet, smart displays' },
  { name: 'Facilities', icon: '🏢', scope: 'Roads, gates, signage, civil campus infra' },
];

const SLA_TIERS = [
  { level: 'CRITICAL', time: '2h SLA', desc: 'Severe facility failure (pipe burst, full power cut)', colorDark: 'text-rose-400 border-rose-800/80 bg-rose-950/40', colorLight: 'text-rose-700 border-rose-300 bg-rose-50' },
  { level: 'HIGH', time: '8h SLA', desc: 'Major room/lab disruption or locked out', colorDark: 'text-amber-400 border-amber-800/80 bg-amber-950/40', colorLight: 'text-amber-700 border-amber-300 bg-amber-50' },
  { level: 'MEDIUM', time: '24h SLA', desc: 'Routine functional maintenance (fans, taps)', colorDark: 'text-blue-400 border-blue-800/80 bg-blue-950/40', colorLight: 'text-blue-700 border-blue-300 bg-blue-50' },
  { level: 'LOW', time: '72h SLA', desc: 'Minor cosmetic & non-urgent repairs', colorDark: 'text-zinc-400 border-zinc-700 bg-zinc-800/50', colorLight: 'text-slate-700 border-slate-300 bg-slate-100' },
];

export default function LiveTriageCard({ title = '', description = '' }) {
  const { isDark } = useTheme();

  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();
  const isReady = cleanTitle.length >= 5 && cleanDesc.length >= 10;

  return (
    <div
      className={`p-5 sm:p-6 space-y-4 rounded-2xl border transition-colors ${
        isDark
          ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-xl'
          : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
      }`}
    >
      {/* Header bar */}
      <div
        className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-zinc-800' : 'border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isReady ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isReady ? 'bg-emerald-500' : 'bg-cyan-500'
              }`}
            />
          </span>
          <span
            className={`text-xs font-bold tracking-tight ${
              isDark ? 'text-zinc-100' : 'text-slate-900'
            }`}
          >
            Automated Facility Triage
          </span>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
            isReady
              ? isDark
                ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                : 'text-emerald-800 bg-emerald-100 border-emerald-300'
              : isDark
              ? 'text-zinc-400 bg-zinc-800 border-zinc-700'
              : 'text-slate-600 bg-slate-200 border-slate-300'
          }`}
        >
          {isReady ? 'Ready to Submit' : 'Awaiting Input'}
        </span>
      </div>

      {/* Explanatory text */}
      <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
        When you submit your complaint, it is automatically categorized to the right maintenance
        department, assigned a resolution timeline, and sent to the campus squad.
      </p>

      {/* Campus Service Domains */}
      <div className="space-y-1.5">
        <span
          className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
            isDark ? 'text-zinc-500' : 'text-slate-500'
          }`}
        >
          6 Maintenance Categories
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DEPARTMENTS.map((dept) => (
            <div
              key={dept.name}
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 hover:border-zinc-700'
                  : 'bg-[#e2e8f0] border-slate-300 hover:border-slate-400 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">{dept.icon}</span>
                <span
                  className={`text-xs font-bold truncate ${
                    isDark ? 'text-zinc-200' : 'text-slate-800'
                  }`}
                >
                  {dept.name}
                </span>
              </div>
              <span
                className={`text-[10px] mt-1 line-clamp-1 ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                {dept.scope}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic SLA Commitments */}
      <div className="space-y-1.5 pt-1">
        <span
          className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
            isDark ? 'text-zinc-500' : 'text-slate-500'
          }`}
        >
          Resolution Timeline Standards
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {SLA_TIERS.map((tier) => (
            <div
              key={tier.level}
              className={`p-2.5 rounded-xl border flex items-center justify-between ${
                isDark ? tier.colorDark : tier.colorLight
              }`}
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
      <div
        className={`p-2.5 rounded-xl border flex items-center gap-2 text-[11px] ${
          isDark
            ? 'bg-[#0e1117] border-zinc-800 text-zinc-400'
            : 'bg-[#e2e8f0] border-slate-300 text-slate-700 shadow-2xs'
        }`}
      >
        <span className="text-emerald-500 font-bold">✓ Direct Routing:</span>
        <span className="leading-tight">
          No manual department selection needed. Type naturally and submit.
        </span>
      </div>
    </div>
  );
}
