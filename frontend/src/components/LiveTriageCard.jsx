/**
 * SmartComplaintHandler - Auto-Detection AI Triage Inspector Card
 * Dark Command Twin Theme with High-Contrast Telemetry
 */
import React, { useState, useEffect } from 'react';
import { fetchTriagePreview } from '../api/triage';
import PriorityBadge from './PriorityBadge';

const DOMAIN_META = {
  Electrical: {
    label: 'Electrical & Power',
    icon: '⚡',
    border: 'border-amber-500/40',
    badge: 'bg-amber-950 text-amber-400 border-amber-800',
  },
  Plumbing: {
    label: 'Plumbing & Water',
    icon: '💧',
    border: 'border-sky-500/40',
    badge: 'bg-sky-950 text-sky-400 border-sky-800',
  },
  'IT Support': {
    label: 'IT & Campus Wi-Fi',
    icon: '📶',
    border: 'border-indigo-500/40',
    badge: 'bg-indigo-950 text-indigo-400 border-indigo-800',
  },
  Carpentry: {
    label: 'Carpentry & Civil',
    icon: '🪚',
    border: 'border-orange-500/40',
    badge: 'bg-orange-950 text-orange-400 border-orange-800',
  },
  Infrastructure: {
    label: 'Carpentry & Civil',
    icon: '🪚',
    border: 'border-orange-500/40',
    badge: 'bg-orange-950 text-orange-400 border-orange-800',
  },
  Sanitation: {
    label: 'Sanitation & Hygiene',
    icon: '🧹',
    border: 'border-teal-500/40',
    badge: 'bg-teal-950 text-teal-400 border-teal-800',
  },
  General: {
    label: 'General Facilities',
    icon: '🏢',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  },
};

const STANDBY_DOMAINS = [
  { name: 'Electrical', icon: '⚡' },
  { name: 'Plumbing', icon: '💧' },
  { name: 'IT & Wi-Fi', icon: '📶' },
  { name: 'Carpentry', icon: '🪚' },
  { name: 'Sanitation', icon: '🧹' },
  { name: 'Facilities', icon: '🏢' },
];

const SLA_BY_PRIORITY = {
  CRITICAL: '2 Hours',
  HIGH: '8 Hours',
  MEDIUM: '24 Hours',
  LOW: '72 Hours',
};

export default function LiveTriageCard({ title = '', description = '' }) {
  const [triageData, setTriageData] = useState(null);
  const [lastQueried, setLastQueried] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cleanTitle = (title || '').trim();
    const cleanDesc = (description || '').trim();

    // Strict minimum character requirements to avoid premature queries
    if (cleanTitle.length < 6 || cleanDesc.length < 15) {
      setTriageData(null);
      setLoading(false);
      return;
    }

    const currentKey = `${cleanTitle.toLowerCase()}:::${cleanDesc.toLowerCase()}`;
    if (currentKey === lastQueried) {
      return; // Skip duplicate query
    }

    setLoading(true);
    // 1000ms (1 full second) idle debounce: only queries once user completely stops typing
    const timer = setTimeout(async () => {
      try {
        const result = await fetchTriagePreview(cleanTitle, cleanDesc);
        setTriageData(result);
        setLastQueried(currentKey);
      } catch (_) {
        setTriageData(null);
      } finally {
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, description, lastQueried]);

  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();

  if (cleanTitle.length < 5 || cleanDesc.length < 10) {
    return (
      <div className="p-5 sm:p-6 space-y-4 bg-[#0B101D] border border-slate-800 shadow-2xl rounded-2xl relative overflow-hidden text-white">
        {/* Subtle top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-black tracking-tight text-white">
              Auto-Triage Inspector
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 shadow-xs">
            ● Standby
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Start typing your issue summary and details. The classification engine automatically assigns the{' '}
          <span className="text-emerald-400 font-bold">Department</span>,{' '}
          <span className="text-emerald-400 font-bold">Squad</span>, and{' '}
          <span className="text-emerald-400 font-bold">SLA Priority</span>.
        </p>

        {/* Domain Accent Badges */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
          {STANDBY_DOMAINS.map((dom) => (
            <div
              key={dom.name}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center gap-1.5 transition-all text-xs font-bold"
            >
              <span className="text-sm">{dom.icon}</span>
              <span className="truncate">{dom.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading && !triageData) {
    return (
      <div className="p-5 space-y-3 bg-[#0B101D] border border-slate-800 shadow-2xl rounded-2xl animate-pulse text-white">
        <div className="flex justify-between items-center">
          <div className="h-4 w-36 bg-slate-800 rounded" />
          <div className="h-4 w-16 bg-slate-800 rounded" />
        </div>
        <div className="h-2 w-full bg-slate-850 rounded" />
      </div>
    );
  }

  if (!triageData) return null;

  const confidencePct = Math.round((triageData.confidence || 0) * 100);
  const rawCat = triageData.category || 'General';
  const domainInfo = DOMAIN_META[rawCat] || DOMAIN_META.General;
  const priorityKey = (triageData.priority || 'MEDIUM').toUpperCase();

  return (
    <div className={`p-5 sm:p-6 space-y-4 bg-[#0B101D] border border-slate-800 shadow-2xl rounded-2xl relative overflow-hidden text-white`}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500" />

      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-black text-white tracking-tight">
            AI Triage
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 font-bold">
            {triageData.model_used ? (triageData.model_used.includes('allam') ? 'ALLaM 2 7B' : triageData.model_used) : (triageData.ai_powered ? 'ALLaM 2 7B' : 'Local Heuristic')}
          </span>
          {triageData.cached && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold">
              ⚡ Cached
            </span>
          )}
        </div>
        <PriorityBadge priority={priorityKey} size="sm" dark={true} />
      </div>

      {triageData.hazard_detected && (
        <div className="rounded-xl bg-rose-950/80 border border-rose-800 p-3 text-xs text-rose-300 font-bold flex items-center gap-2 shadow-xs">
          <span>⚠️</span>
          <span>Safety Hazard Detected — Escalated to CRITICAL (2-Hour Emergency SLA)</span>
        </div>
      )}

      {/* Target Department Banner with Rich Depth */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shadow-xs">
            {domainInfo.icon}
          </span>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">
              Detected Department
            </span>
            <span className="text-sm font-black text-white mt-0.5 block">
              {domainInfo.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">Target SLA</span>
          <span className="text-xs font-mono font-black text-emerald-400 mt-0.5 block">
            {SLA_BY_PRIORITY[priorityKey] || '24 Hours'}
          </span>
        </div>
      </div>

      {/* AI Rationale & Explanation */}
      {triageData.reason && (
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-300 leading-relaxed font-sans">
          <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold mb-0.5">
            AI Triage Rationale
          </span>
          {triageData.reason}
        </div>
      )}

      {/* Confidence Meter */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 font-semibold">Classification Match</span>
          <span className="font-mono font-black text-emerald-400">{confidencePct}%</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-400 shadow-xs"
            style={{ width: `${Math.max(12, confidencePct)}%` }}
          />
        </div>
      </div>

      {/* Matched Keywords */}
      {triageData.matched_keywords && triageData.matched_keywords.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">
            Matched Telemetry Signals
          </span>
          <div className="flex flex-wrap gap-1.5">
            {triageData.matched_keywords.map((kw, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono bg-slate-900 text-emerald-400 border border-slate-800 font-bold shadow-xs"
              >
                #{kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
