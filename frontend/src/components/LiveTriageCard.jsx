/**
 * SmartComplaintHandler - Auto-Detection AI Triage Inspector Card
 * Dark Command Twin Theme with High-Contrast Telemetry
 */
import React, { useState, useEffect } from 'react';
import { fetchTriagePreview } from '../api/triage';
import { useTheme } from '../context/ThemeContext';
import PriorityBadge from './PriorityBadge';

const DOMAIN_META = {
  Electrical: {
    label: 'Electrical & Power',
    icon: '⚡',
  },
  Plumbing: {
    label: 'Plumbing & Water',
    icon: '💧',
  },
  'IT Support': {
    label: 'IT & Campus Wi-Fi',
    icon: '📶',
  },
  Carpentry: {
    label: 'Carpentry & Civil',
    icon: '🪚',
  },
  Infrastructure: {
    label: 'Carpentry & Civil',
    icon: '🪚',
  },
  Sanitation: {
    label: 'Sanitation & Hygiene',
    icon: '🧹',
  },
  General: {
    label: 'General Facilities',
    icon: '🏢',
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
  const { isDark } = useTheme();
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
    // 2500ms (2.5 full seconds) idle debounce: only queries once user completely stops typing for a few seconds
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
    }, 2500);

    return () => clearTimeout(timer);
  }, [title, description, lastQueried]);

  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();

  if (cleanTitle.length < 5 || cleanDesc.length < 10) {
    return (
      <div className={`p-5 sm:p-6 space-y-4 rounded-2xl border transition-colors ${
        isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-xl' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Auto-Triage Inspector
            </span>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
            isDark
              ? 'text-emerald-400 bg-zinc-800 border-zinc-700'
              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
          }`}>
            ● Standby
          </span>
        </div>

        <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
          Start typing your issue summary and details. The classification engine automatically assigns the{' '}
          <span className={isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-semibold'}>Department</span>,{' '}
          <span className={isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-semibold'}>Squad</span>, and{' '}
          <span className={isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-semibold'}>SLA Priority</span>.
        </p>

        {/* Domain Accent Badges */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
          {STANDBY_DOMAINS.map((dom) => (
            <div
              key={dom.name}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-colors text-xs font-semibold ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  : 'bg-slate-100 hover:bg-slate-200/80 border-slate-300/80 hover:border-slate-400 text-slate-700 shadow-2xs'
              }`}
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
      <div className={`p-5 space-y-3 rounded-2xl border animate-pulse ${
        isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex justify-between items-center">
          <div className={`h-4 w-36 rounded ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`} />
          <div className={`h-4 w-16 rounded ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`} />
        </div>
        <div className={`h-2 w-full rounded ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`} />
      </div>
    );
  }

  if (!triageData) return null;

  const confidencePct = Math.round((triageData.confidence || 0) * 100);
  const rawCat = triageData.category || 'General';
  const domainInfo = DOMAIN_META[rawCat] || DOMAIN_META.General;
  const priorityKey = (triageData.priority || 'MEDIUM').toUpperCase();

  return (
    <div className={`p-5 sm:p-6 space-y-4 rounded-2xl border transition-colors ${
      isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-xl' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
    }`}>
      <div className={`flex items-center justify-between border-b pb-3 ${
        isDark ? 'border-zinc-800' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
            AI Triage
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
            isDark ? 'bg-zinc-800 text-cyan-400 border-zinc-700' : 'bg-cyan-50 text-cyan-800 border-cyan-200'
          }`}>
            {triageData.model_used ? (triageData.model_used.includes('allam') ? 'ALLaM 2 7B' : triageData.model_used) : (triageData.ai_powered ? 'ALLaM 2 7B' : 'Local Heuristic')}
          </span>
        </div>
        <PriorityBadge priority={priorityKey} size="sm" dark={isDark} />
      </div>

      {triageData.hazard_detected && (
        <div className={`rounded-xl border p-3 text-xs font-semibold flex items-center gap-2 ${
          isDark ? 'bg-rose-950/80 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          <span>⚠️</span>
          <span>Safety Hazard Detected — Escalated to CRITICAL (2-Hour Emergency SLA)</span>
        </div>
      )}

      {/* Target Department Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
        isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-slate-100/90 border-slate-300/80 shadow-2xs'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg ${
            isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-300/80 shadow-2xs'
          }`}>
            {domainInfo.icon}
          </span>
          <div>
            <span className={`text-[10px] font-mono uppercase tracking-wider block font-semibold ${
              isDark ? 'text-zinc-500' : 'text-slate-500'
            }`}>
              Detected Department
            </span>
            <span className={`text-sm font-bold mt-0.5 block ${
              isDark ? 'text-zinc-100' : 'text-slate-900'
            }`}>
              {domainInfo.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-[10px] font-mono uppercase block font-semibold ${
            isDark ? 'text-zinc-500' : 'text-slate-500'
          }`}>Target SLA</span>
          <span className={`text-xs font-mono font-bold mt-0.5 block ${
            isDark ? 'text-emerald-400' : 'text-emerald-700'
          }`}>
            {SLA_BY_PRIORITY[priorityKey] || '24 Hours'}
          </span>
        </div>
      </div>

      {/* AI Rationale & Explanation */}
      {triageData.reason && (
        <div className={`p-3 rounded-xl border text-xs leading-relaxed font-sans ${
          isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-300' : 'bg-slate-100/80 border-slate-300/80 text-slate-700 shadow-2xs'
        }`}>
          <span className={`text-[10px] font-mono uppercase block font-semibold mb-0.5 ${
            isDark ? 'text-zinc-500' : 'text-slate-500'
          }`}>
            AI Triage Rationale
          </span>
          {triageData.reason}
        </div>
      )}

      {/* Confidence Meter */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className={isDark ? 'text-zinc-400 font-semibold' : 'text-slate-600 font-semibold'}>Classification Match</span>
          <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{confidencePct}%</span>
        </div>
        <div className={`w-full rounded-full h-2 overflow-hidden border ${
          isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-200 border-slate-300'
        }`}>
          <div
            className="h-full rounded-full transition-all duration-300 bg-emerald-500"
            style={{ width: `${Math.max(12, confidencePct)}%` }}
          />
        </div>
      </div>

      {/* Matched Keywords */}
      {triageData.matched_keywords && triageData.matched_keywords.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className={`text-[10px] font-mono uppercase tracking-wider block font-semibold ${
            isDark ? 'text-zinc-500' : 'text-slate-500'
          }`}>
            Matched Telemetry Signals
          </span>
          <div className="flex flex-wrap gap-1.5">
            {triageData.matched_keywords.map((kw, idx) => (
              <span
                key={idx}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-semibold border ${
                  isDark
                    ? 'bg-[#0e1117] text-emerald-400 border-zinc-800'
                    : 'bg-slate-100 text-emerald-700 border-slate-200'
                }`}
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
