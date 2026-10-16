/**
 * SmartComplaintHandler - Auto-Detection AI Triage Inspector Card
 */
import React, { useState, useEffect } from 'react';
import { fetchTriagePreview } from '../api/triage';
import PriorityBadge from './PriorityBadge';

const DOMAIN_META = {
  Electrical: { label: 'Electrical & Power' },
  Plumbing: { label: 'Plumbing & Water' },
  'IT Support': { label: 'IT & Campus Wi-Fi' },
  Carpentry: { label: 'Carpentry & Civil' },
  Infrastructure: { label: 'Carpentry & Civil' },
  Sanitation: { label: 'Sanitation & Hygiene' },
  General: { label: 'General Facilities' },
};

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
      <div className="bento-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-white">
              Auto-Triage Inspector
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.07]">
            Standby
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Start typing your issue summary and details. The classification engine automatically assigns the{' '}
          <span className="text-slate-200 font-medium">Department</span>,{' '}
          <span className="text-slate-200 font-medium">Squad</span>, and{' '}
          <span className="text-slate-200 font-medium">SLA Priority</span>.
        </p>

        <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px] text-slate-400">
          {['Electrical', 'Plumbing', 'IT & Wi-Fi', 'Carpentry', 'Sanitation', 'Facilities'].map((dom) => (
            <div
              key={dom}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] truncate"
            >
              {dom}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading && !triageData) {
    return (
      <div className="bento-card p-5 space-y-3 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-4 w-36 bg-white/[0.06] rounded" />
          <div className="h-4 w-16 bg-white/[0.06] rounded" />
        </div>
        <div className="h-2 w-full bg-white/[0.06] rounded" />
      </div>
    );
  }

  if (!triageData) return null;

  const confidencePct = Math.round((triageData.confidence || 0) * 100);
  const rawCat = triageData.category || 'General';
  const domainInfo = DOMAIN_META[rawCat] || DOMAIN_META.General;
  const priorityKey = (triageData.priority || 'MEDIUM').toUpperCase();

  return (
    <div className="bento-card p-5 space-y-4 border-emerald-500/35">
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-emerald-400">
            Live Triage Classification
          </span>
        </div>
        <PriorityBadge priority={priorityKey} size="sm" />
      </div>

      {triageData.hazard_detected && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-200 font-medium">
          Safety Hazard Detected — Escalated to CRITICAL (2-Hour Emergency SLA)
        </div>
      )}

      <div className="p-3.5 rounded-xl bg-[#070b12] border border-emerald-500/25 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Detected Department
          </span>
          <span className="text-sm font-semibold text-white mt-0.5 block">
            {domainInfo.label}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Target SLA</span>
          <span className="text-xs font-mono font-semibold text-emerald-400 mt-0.5 block">
            {SLA_BY_PRIORITY[priorityKey] || '24 Hours'}
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400">Match Confidence</span>
          <span className="font-mono font-semibold text-emerald-300">{confidencePct}%</span>
        </div>
        <div className="w-full bg-[#070b12] rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-300 bg-emerald-500"
            style={{ width: `${Math.max(12, confidencePct)}%` }}
          />
        </div>
      </div>

      {triageData.matched_keywords && triageData.matched_keywords.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Matched Signals
          </span>
          <div className="flex flex-wrap gap-1.5">
            {triageData.matched_keywords.map((kw, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
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
