/**
 * SmartComplaintHandler - Submission Success Modal (Obsidian & Emerald Theme)
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PriorityBadge from './PriorityBadge';

export default function SubmissionSuccessModal({ isOpen, ticket, onClose }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !ticket) return null;

  const trackingCode = ticket.tracking_code || 'TICK-XXXX';

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTrackDirectly = () => {
    onClose();
    navigate(`/track?code=${trackingCode}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0e1624] rounded-3xl max-w-md w-full shadow-2xl border border-emerald-500/30 p-6 md:p-8 text-center space-y-6 text-slate-100">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-white">
            Request Logged &amp; Dispatched
          </h2>
          <p className="text-xs text-slate-400">
            Your issue has been auto-classified, assigned to a maintenance squad, and bound to a campus SLA timer.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d16] border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Official Tracking Code
          </span>
          <div className="flex items-center justify-center space-x-2">
            <span className="font-mono text-2xl font-black tracking-wider text-emerald-300 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-emerald-500/30 shadow-xs">
              {trackingCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Copy tracking code"
            >
              {copied ? (
                <span className="text-xs font-bold text-emerald-400 px-1">Copied!</span>
              ) : (
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1 text-xs">
          <PriorityBadge priority={ticket.priority || 'MEDIUM'} size="sm" showSlaTooltip={true} />
          {ticket.department_name && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
              {ticket.department_name}
            </span>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleTrackDirectly}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Track Live Status</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close &amp; Submit Another
          </button>
        </div>
      </div>
    </div>
  );
}
