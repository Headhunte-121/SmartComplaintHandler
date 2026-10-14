/**
 * SmartComplaintHandler - Live AI Triage Copilot Card
 * Blueprint Reference: docs/V1/M3/frontend/03_live_triage_card.md
 * Role: Real-time debounced complaint preview displaying predicted department, priority tier,
 *       confidence score, life-safety hazard alerts, and binding turnaround SLA.
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

    if (cleanTitle.length < 5 || cleanDesc.length < 10) {
      setTriageData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // 400ms debounce timer for responsive real-time keystroke feedback
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
    }, 400);

    return () => clearTimeout(timer);
  }, [title, description]);

  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();
  const isInputTooShort = cleanTitle.length < 5 || cleanDesc.length < 10;

  // 1. Idle state: Clean, high-tech preview explaining what the AI triage engine does
  if (isInputTooShort) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-linear-to-b from-white to-slate-50/60 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-800">
              AI Triage &amp; Dispatch Engine
            </span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Live Engine
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          As you describe your maintenance issue, our automated triage engine evaluates urgency, assigns response SLAs, and dispatches to specialized maintenance squads.
        </p>

        <div className="space-y-2 pt-1 text-xs">
          <div className="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-indigo-600 font-bold text-sm shrink-0">⚡</span>
            <div>
              <span className="font-semibold text-slate-700 block">Instant Department Routing</span>
              <span className="text-[11px] text-slate-400">Routes to Electrical, Plumbing, IT, Carpentry, or Sanitation</span>
            </div>
          </div>
          <div className="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-amber-600 font-bold text-sm shrink-0">⏱️</span>
            <div>
              <span className="font-semibold text-slate-700 block">Binding SLA Guarantee</span>
              <span className="text-[11px] text-slate-400">Enforceable resolution deadlines based on verified severity</span>
            </div>
          </div>
          <div className="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-rose-600 font-bold text-sm shrink-0">🛡️</span>
            <div>
              <span className="font-semibold text-slate-700 block">Life-Safety Hazard Detection</span>
              <span className="text-[11px] text-slate-400">Sparks, smoke, or leaks auto-escalate to emergency tier</span>
            </div>
          </div>
        </div>

        <div className="pt-1 text-center">
          <span className="text-[11px] text-slate-400 font-medium">
            Type at least 5 chars in title and 10 in description to preview live analysis
          </span>
        </div>
      </div>
    );
  }

  // 2. Loading state while debouncing
  if (loading && !triageData) {
    return (
      <div className="rounded-2xl border border-indigo-200/60 bg-white p-5 shadow-xs space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 bg-indigo-100 rounded-md"></div>
          <div className="h-5 w-20 bg-indigo-100 rounded-full"></div>
        </div>
        <div className="h-3 w-48 bg-slate-100 rounded-md"></div>
        <div className="h-2 w-full bg-slate-100 rounded-full"></div>
        <p className="text-[11px] text-indigo-500 font-medium text-center">
          Analyzing complaint narrative with AI triage rules...
        </p>
      </div>
    );
  }

  // 3. Error state
  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-800 text-xs flex items-start space-x-3">
        <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="font-bold text-amber-900">Preview Engine Notice</p>
          <p className="text-[11px] text-amber-700 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  if (!triageData) return null;

  const confidencePct = Math.round((triageData.confidence || 0) * 100);

  return (
    <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-xs space-y-4 transition-all">
      {/* Hazard Warning Banner */}
      {triageData.hazard_detected && (
        <div className="rounded-xl bg-rose-50 border-l-4 border-rose-600 p-3.5 shadow-xs animate-pulse">
          <div className="flex items-start space-x-2.5">
            <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                Immediate Hazard Flagged
              </h4>
              <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                Contains hazard keywords. Will be expedited to <strong className="font-bold">CRITICAL</strong> with emergency priority dispatch.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header: Predicted Route & Priority */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Predicted Squad:
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {triageData.category || 'General Administration'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 text-right">
            Urgency Tier:
          </span>
          <PriorityBadge priority={triageData.priority} size="sm" showSlaTooltip={true} />
        </div>
      </div>

      {/* Confidence Score Bar */}
      <div>
        <div className="flex items-center justify-between text-xs font-medium mb-1.5">
          <span className="text-slate-600 text-xs">Automated Match Confidence</span>
          <span className="font-bold text-slate-800 text-xs">{confidencePct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              confidencePct >= 80
                ? 'bg-emerald-500'
                : confidencePct >= 50
                ? 'bg-indigo-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.max(8, confidencePct)}%` }}
          />
        </div>
      </div>

      {/* Diagnostic Explanation */}
      {triageData.reason && (
        <p className="text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100 leading-relaxed">
          &ldquo;{triageData.reason}&rdquo;
        </p>
      )}

      {/* Detected Keywords Chips */}
      {triageData.matched_keywords && triageData.matched_keywords.length > 0 && (
        <div className="pt-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Trigger Keywords:
          </span>
          <div className="flex flex-wrap gap-1">
            {triageData.matched_keywords.map((kw, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
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
