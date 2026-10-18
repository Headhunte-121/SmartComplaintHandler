import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import PriorityBadge from './PriorityBadge';

export default function SubmissionSuccessModal({ isOpen, ticket, onClose }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className={`rounded-2xl max-w-md w-full shadow-2xl border p-6 md:p-8 text-center space-y-6 relative overflow-hidden transition-colors ${
        isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center border ${
          isDark ? 'bg-zinc-800 border-zinc-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-1">
          <h2 className={`text-xl font-black ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
            Request Logged &amp; Dispatched
          </h2>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Your issue has been auto-classified, assigned to a maintenance squad, and bound to a campus SLA timer.
          </p>
        </div>

        <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Official Tracking Code
          </span>
          <div className="flex items-center justify-center space-x-2">
            <span className={`font-mono text-2xl font-black tracking-wider px-3.5 py-1.5 rounded-xl border ${
              isDark ? 'bg-zinc-800 text-emerald-400 border-zinc-700' : 'bg-white text-emerald-700 border-slate-200 shadow-2xs'
            }`}>
              {trackingCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-700' : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200 shadow-2xs'
              }`}
              title="Copy tracking code"
            >
              {copied ? (
                <span className="text-xs font-bold text-emerald-500 px-1">Copied!</span>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1 text-xs">
          <PriorityBadge priority={ticket.priority || 'MEDIUM'} size="sm" showSlaTooltip={true} dark={isDark} />
          {ticket.department_name && (
            <span className={`px-2.5 py-1 rounded-full font-semibold border ${
              isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {ticket.department_name}
            </span>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleTrackDirectly}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer border border-emerald-600"
          >
            <span>Track Live Status</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 px-4 border font-semibold text-xs rounded-xl transition-colors cursor-pointer ${
              isDark ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            Close &amp; Submit Another
          </button>
        </div>
      </div>
    </div>
  );
}
