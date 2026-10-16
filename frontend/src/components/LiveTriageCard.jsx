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
      <div className="bento-card p-5 space-y-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-900">
              Auto-Triage Inspector
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-600 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
            Standby
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Start typing your issue summary and details. The classification engine automatically assigns the{' '}
          <span className="text-slate-800 font-semibold">Department</span>,{' '}
          <span className="text-slate-800 font-semibold">Squad</span>, and{' '}
          <span className="text-slate-800 font-semibold">SLA Priority</span>.
        </p>

        <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px] text-slate-600">
          {['Electrical', 'Plumbing', 'IT & Wi-Fi', 'Carpentry', 'Sanitation', 'Facilities'].map((dom) => (
            <div
              key={dom}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 truncate font-medium text-center"
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
      <div className="bento-card p-5 space-y-3 bg-white border border-slate-200 shadow-sm rounded-2xl animate-pulse">
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
    <div className="bento-card p-5 space-y-4 bg-white border border-green-200 shadow-sm rounded-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          <span className="text-xs font-bold text-green-800">
            Live Triage Classification
          </span>
        </div>
        <PriorityBadge priority={priorityKey} size="sm" />
      </div>

      {triageData.hazard_detected && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-semibold">
          Safety Hazard Detected — Escalated to CRITICAL (2-Hour Emergency SLA)
        </div>
      )}

      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
            Detected Department
          </span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block">
            {domainInfo.label}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Target SLA</span>
          <span className="text-xs font-mono font-bold text-green-700 mt-0.5 block">
            {SLA_BY_PRIORITY[priorityKey] || '24 Hours'}
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-600 font-medium">Match Confidence</span>
          <span className="font-mono font-bold text-green-700">{confidencePct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
          <div
            className="h-full rounded-full transition-all duration-300 bg-green-600"
            style={{ width: `${Math.max(12, confidencePct)}%` }}
          />
        </div>
      </div>

      {triageData.matched_keywords && triageData.matched_keywords.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
            Matched Signals
          </span>
          <div className="flex flex-wrap gap-1.5">
            {triageData.matched_keywords.map((kw, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-green-50 text-green-800 border border-green-200 font-medium"
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
