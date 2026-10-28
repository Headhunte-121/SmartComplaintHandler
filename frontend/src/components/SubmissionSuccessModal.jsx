/**
 * SmartComplaintHandler - Ticket Submission Success Modal
 * Glossy Smoked Glass Design
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Copy, Check, ArrowRight } from 'lucide-react';
import PriorityBadge from './PriorityBadge';

const SLA_MAP = {
  CRITICAL: '2 Hours',
  HIGH: '8 Hours',
  MEDIUM: '24 Hours',
  LOW: '72 Hours',
};

export default function SubmissionSuccessModal({ isOpen, ticket, onClose }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !ticket) return null;

  const trackingCode = ticket.tracking_code || 'TICK-XXXX';
  const priorityKey = (ticket.priority || 'MEDIUM').toUpperCase();
  const slaTarget = SLA_MAP[priorityKey] || '24 Hours';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="rounded-2xl max-w-md w-full shadow-[0_24px_60px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.12)] border border-white/[0.14] bg-[#0c0d12]/95 p-6 md:p-8 text-center space-y-6 relative overflow-hidden text-zinc-100">
        {/* Specular Top Rim */}
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        {/* Success Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center border border-white/20 bg-white/[0.05] text-emerald-400 shadow-inner">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-white">
            Complaint Registered Successfully
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your maintenance complaint has been logged, routed to the relevant campus squad, and assigned a resolution timer.
          </p>
        </div>

        {/* Official Tracking Code Box */}
        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080c] space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider block text-zinc-500 font-bold">
            Official Tracking Code
          </span>
          <div className="flex items-center justify-center space-x-2">
            <span className="font-mono text-2xl font-black tracking-wider px-3.5 py-1.5 rounded-xl border border-white/20 bg-white/[0.05] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
              {trackingCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Copy tracking code"
            >
              {copied ? (
                <span className="text-xs font-bold text-white px-1">Copied!</span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Triage & SLA Summary Pill Row */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl border border-white/[0.08] bg-[#07080c] text-left">
            <span className="text-[10px] font-mono uppercase block font-bold text-zinc-500">
              Department
            </span>
            <span className="text-xs font-bold text-zinc-200 truncate block mt-0.5">
              {ticket.department_name || 'Assigned Domain'}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-white/[0.08] bg-[#07080c] text-left">
            <span className="text-[10px] font-mono uppercase block font-bold text-zinc-500">
              SLA Commitment
            </span>
            <span className="text-xs font-mono font-bold text-zinc-200 block mt-0.5">
              {slaTarget}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-bold text-xs transition cursor-pointer"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handleTrackDirectly}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-[0_2px_12px_rgba(255,255,255,0.12)] border border-white/30 transition cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <span>Track Live</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
