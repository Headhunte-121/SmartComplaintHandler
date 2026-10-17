/**
 * SmartComplaintHandler - Auto-Detection AI Triage Inspector Card
 * Enhanced with rich domain accent colors, ambient elevation shadows, and deep telemetry depth.
 */
import React, { useState, useEffect } from 'react';
import { fetchTriagePreview } from '../api/triage';
import PriorityBadge from './PriorityBadge';

const DOMAIN_META = {
  Electrical: {
    label: 'Electrical & Power',
    icon: '⚡',
    gradient: 'from-amber-500/10 via-amber-50/50 to-white',
    border: 'border-amber-300/80',
    text: 'text-amber-900',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  Plumbing: {
    label: 'Plumbing & Water',
    icon: '💧',
    gradient: 'from-sky-500/10 via-sky-50/50 to-white',
    border: 'border-sky-300/80',
    text: 'text-sky-900',
    badge: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  'IT Support': {
    label: 'IT & Campus Wi-Fi',
    icon: '📶',
    gradient: 'from-indigo-500/10 via-indigo-50/50 to-white',
    border: 'border-indigo-300/80',
    text: 'text-indigo-900',
    badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  },
  Carpentry: {
    label: 'Carpentry & Civil',
    icon: '🪚',
    gradient: 'from-orange-500/10 via-orange-50/50 to-white',
    border: 'border-orange-300/80',
    text: 'text-orange-900',
    badge: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  Infrastructure: {
    label: 'Carpentry & Civil',
    icon: '🪚',
    gradient: 'from-orange-500/10 via-orange-50/50 to-white',
    border: 'border-orange-300/80',
    text: 'text-orange-900',
    badge: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  Sanitation: {
    label: 'Sanitation & Hygiene',
    icon: '🧹',
    gradient: 'from-teal-500/10 via-teal-50/50 to-white',
    border: 'border-teal-300/80',
    text: 'text-teal-900',
    badge: 'bg-teal-100 text-teal-900 border-teal-300',
  },
  General: {
    label: 'General Facilities',
    icon: '🏢',
    gradient: 'from-emerald-500/10 via-emerald-50/50 to-white',
    border: 'border-emerald-300/80',
    text: 'text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
};

const STANDBY_DOMAINS = [
  { name: 'Electrical', icon: '⚡', cls: 'chip-domain-electrical' },
  { name: 'Plumbing', icon: '💧', cls: 'chip-domain-plumbing' },
  { name: 'IT & Wi-Fi', icon: '📶', cls: 'chip-domain-it' },
  { name: 'Carpentry', icon: '🪚', cls: 'chip-domain-carpentry' },
  { name: 'Sanitation', icon: '🧹', cls: 'chip-domain-sanitation' },
  { name: 'Facilities', icon: '🏢', cls: 'chip-domain-facilities' },
];

const SLA_BY_PRIORITY = {
  CRITICAL: '2 Hours',
  HIGH: '8 Hours',
  MEDIUM: '24 Hours',
  LOW: '72 Hours',
};

export default function LiveTriageCard({ title = '', description = '' }) {
  const [triageData, setTriageData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cleanTitle = (title || '').trim();
    const cleanDesc = (description || '').trim();

    if (cleanTitle.length < 5 || cleanDesc.length < 10) {
      setTriageData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await fetchTriagePreview(cleanTitle, cleanDesc);
        setTriageData(result);
      } catch (_) {
        setTriageData(null);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [title, description]);

  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();

  if (cleanTitle.length < 5 || cleanDesc.length < 10) {
    return (
      <div className="bento-card p-5 space-y-4 bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/30 border-2 border-slate-200/90 shadow-md rounded-3xl relative overflow-hidden">
        {/* Subtle top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-black tracking-tight text-slate-900">
              Auto-Triage Inspector
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-800 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 shadow-2xs">
            ● Standby
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Start typing your issue summary and details. The classification engine automatically assigns the{' '}
          <span className="text-emerald-900 font-bold">Department</span>,{' '}
          <span className="text-emerald-900 font-bold">Squad</span>, and{' '}
          <span className="text-emerald-900 font-bold">SLA Priority</span>.
        </p>

        {/* Vibrant Domain Accent Badges */}
        <div className="grid grid-cols-3 gap-2.5 pt-1 text-[11px]">
          {STANDBY_DOMAINS.map((dom) => (
            <div
              key={dom.name}
              className={`px-3 py-2.5 rounded-2xl ${dom.cls} flex items-center justify-center gap-1.5 cursor-default transition-all`}
            >
              <span className="text-sm">{dom.icon}</span>
              <span className="font-bold truncate">{dom.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading && !triageData) {
    return (
      <div className="bento-card p-5 space-y-3 bg-white border border-slate-200/90 shadow-sm rounded-2xl animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-200 rounded" />
        </div>
        <div className="h-2 w-full bg-slate-100 rounded" />
      </div>
    );
  }

  if (!triageData) return null;

  const confidencePct = Math.round((triageData.confidence || 0) * 100);
  const rawCat = triageData.category || 'General';
  const domainInfo = DOMAIN_META[rawCat] || DOMAIN_META.General;
  const priorityKey = (triageData.priority || 'MEDIUM').toUpperCase();

  return (
    <div className={`bento-card p-5 space-y-4 bg-gradient-to-br ${domainInfo.gradient} border-2 ${domainInfo.border} shadow-md rounded-3xl relative overflow-hidden`}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500" />

      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-black text-slate-900 tracking-tight">
            Live Triage Classification
          </span>
        </div>
        <PriorityBadge priority={priorityKey} size="sm" />
      </div>

      {triageData.hazard_detected && (
        <div className="rounded-xl bg-gradient-to-r from-rose-50 to-red-50 border border-rose-300 p-3 text-xs text-rose-900 font-bold flex items-center gap-2 shadow-xs">
          <span>⚠️</span>
          <span>Safety Hazard Detected — Escalated to CRITICAL (2-Hour Emergency SLA)</span>
        </div>
      )}

      {/* Target Department Banner with Rich Depth */}
      <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg shadow-2xs border border-slate-200">
            {domainInfo.icon}
          </span>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">
              Detected Department
            </span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block">
              {domainInfo.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">Target SLA</span>
          <span className="text-xs font-mono font-black text-emerald-700 mt-0.5 block">
            {SLA_BY_PRIORITY[priorityKey] || '24 Hours'}
          </span>
        </div>
      </div>

      {/* Confidence Meter */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-600 font-semibold">Classification Match</span>
          <span className="font-mono font-black text-emerald-700">{confidencePct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200 p-[1px]">
          <div
            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 shadow-xs"
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
                className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono bg-white text-emerald-900 border border-emerald-200/90 font-bold shadow-2xs"
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
