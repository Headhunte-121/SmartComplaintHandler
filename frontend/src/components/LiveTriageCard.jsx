/**
 * SmartComplaintHandler - Live Triage Preview Card (Rich visual design, zero filler copy)
 */
import React, { useState, useEffect } from 'react';
import { fetchTriagePreview } from '../api/triage';
import PriorityBadge from './PriorityBadge';

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
    }, 450);

    return () => clearTimeout(timer);
  }, [title, description]);

  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();

  if (cleanTitle.length < 5 || cleanDesc.length < 10) {
    return (
      <div className="bento-card p-5 text-center border-dashed border-slate-300 bg-slate-50/50">
        <p className="text-xs font-semibold text-slate-500">
          Type your issue title &amp; details to preview department routing and priority
        </p>
      </div>
    );
  }

  if (loading && !triageData) {
    return (
      <div className="bento-card p-5 space-y-3 animate-pulse">
        <div className="flex justify-between">
          <div className="h-5 w-28 bg-slate-200 rounded" />
          <div className="h-5 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="h-2 w-full bg-slate-200 rounded" />
      </div>
    );
  }

  if (!triageData) return null;

  const confidencePct = Math.round((triageData.confidence || 0) * 100);

  return (
    <div className="bento-card p-5 space-y-4">
      {triageData.hazard_detected && (
        <div className="rounded-xl bg-rose-50 border-l-4 border-rose-600 p-3.5 text-xs text-rose-900 font-semibold">
          🚨 Safety Hazard Detected — Escalated to CRITICAL (2-Hour SLA)
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Department
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {triageData.category || 'General'}
          </span>
        </div>

        <PriorityBadge priority={triageData.priority} size="md" />
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-medium mb-1">
          <span className="text-slate-500">Match Confidence</span>
          <span className="font-bold text-slate-800">{confidencePct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              confidencePct >= 80 ? 'bg-emerald-500' : confidencePct >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.max(8, confidencePct)}%` }}
          />
        </div>
      </div>

      {triageData.matched_keywords && triageData.matched_keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {triageData.matched_keywords.map((kw, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200"
            >
              #{kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
