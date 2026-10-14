/**
 * SmartComplaintHandler - Compact Inline Triage Preview Bar
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
    }, 400);

    return () => clearTimeout(timer);
  }, [title, description]);

  if (!loading && !triageData) return null;

  if (loading && !triageData) {
    return (
      <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400">
        Analyzing urgency &amp; routing...
      </div>
    );
  }

  if (!triageData) return null;

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
        triageData.hazard_detected
          ? 'bg-rose-50/80 border-rose-200 text-rose-900'
          : 'bg-slate-50 border-slate-200/80 text-slate-700'
      }`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-slate-400 font-medium">Auto-Route:</span>
        <span className="font-semibold text-slate-900">
          {triageData.category || 'General'}
        </span>
        {triageData.hazard_detected && (
          <span className="text-[11px] font-semibold text-rose-600">
            · Safety Hazard (2h SLA)
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <PriorityBadge priority={triageData.priority} size="sm" />
      </div>
    </div>
  );
}
