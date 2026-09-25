/**
 * SmartComplaintHandler - Live Triage Preview Card
 * Blueprint Reference: docs/V1/M3/frontend/03_live_triage_card.md
 * Role: Real-time debounced complaint preview card displaying predicted category, priority tier,
 *       confidence meter, hazard alert banner, and matched keyword tags.
 */
import React, { useState, useEffect } from 'react';
import { fetchTriagePreview } from '../api/triage';
import PriorityBadge from './PriorityBadge';

export default function LiveTriageCard({ title = '', description = '' }) {
  const [triageData, setTriageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cleanTitle = (title || '').trim();
    const cleanDesc = (description || '').trim();

    // Guard: Below minimum length requirements
    if (cleanTitle.length < 5 || cleanDesc.length < 10) {
      setTriageData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // 500ms debounce timer to prevent keystroke network flooding
    const timer = setTimeout(async () => {
      try {
        const result = await fetchTriagePreview(cleanTitle, cleanDesc);
        setTriageData(result);
        setError(null);
      } catch (err) {
        setError(err.message || 'Unable to analyze complaint narrative.');
        setTriageData(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, description]);

  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();
  const isInputTooShort = cleanTitle.length < 5 || cleanDesc.length < 10;

  // 1. Idle state: instructions for user
  if (isInputTooShort) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center transition-all">
        <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          <p className="text-sm font-medium text-slate-600">
            Real-Time Automated Triage Preview
          </p>
          <p className="text-xs text-slate-400 max-w-sm">
            Enter at least 5 characters in Title and 10 in Description to see automated department routing, priority scoring, and hazard detection.
          </p>
        </div>
      </div>
    );
  }

  // 2. Loading skeleton state while debounced fetch is running
  if (loading && !triageData) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-slate-200 rounded"></div>
          <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
        </div>
        <div className="h-4 w-48 bg-slate-200 rounded"></div>
        <div className="h-2 w-full bg-slate-200 rounded"></div>
      </div>
    );
  }

  // 3. Error display state
  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm flex items-start space-x-3">
        <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="font-semibold text-amber-900">Preview Unavailable</p>
          <p className="text-xs text-amber-700 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  if (!triageData) return null;

  const confidencePct = Math.round((triageData.confidence || 0) * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 transition-all">
      {/* Hazard Warning Banner */}
      {triageData.hazard_detected && (
        <div className="rounded-lg bg-rose-50 border-l-4 border-rose-600 p-4 animate-pulse shadow-sm">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-rose-600 mr-2.5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Immediate Life-Safety Hazard Detected
              </h4>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                This grievance contains life-safety hazard terms. It will automatically short-circuit to <strong className="font-bold underline">CRITICAL</strong> priority upon submission with an expedited 4-hour emergency SLA.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header: Predicted Department & Computed Priority Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Predicted Route:
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {triageData.category || 'General'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Urgency Priority:
          </span>
          <PriorityBadge priority={triageData.priority} size="md" showSlaTooltip={true} />
        </div>
      </div>

      {/* Confidence Score Bar */}
      <div>
        <div className="flex items-center justify-between text-xs font-medium mb-1">
          <span className="text-slate-600">Classification Confidence</span>
          <span className="font-bold text-slate-800">{confidencePct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              confidencePct >= 80
                ? 'bg-emerald-500'
                : confidencePct >= 50
                ? 'bg-blue-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.max(5, confidencePct)}%` }}
          />
        </div>
      </div>

      {/* Diagnostic Explanation */}
      {triageData.reason && (
        <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-md border border-slate-100">
          &ldquo;{triageData.reason}&rdquo;
        </p>
      )}

      {/* Detected Keywords Chips */}
      {triageData.matched_keywords && triageData.matched_keywords.length > 0 && (
        <div className="pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            Detected Keywords:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {triageData.matched_keywords.map((kw, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
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
