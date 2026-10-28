/**
 * SmartComplaintHandler - Ticket Submission Success Modal
 * High-Density Obsidian Command Desk Standard:
 *  - Translucent glassmorphic dialog with cyan glow
 *  - Prominent tracking code badge with 1-click clipboard copy
 *  - Dynamic SLA and department metadata pods
 *  - Direct live track navigation button
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
      <div className="rounded-3xl max-w-md w-full shadow-2xl border border-white/[0.12] bg-[#0c1017]/95 p-6 md:p-8 text-center space-y-6 relative overflow-hidden text-slate-100">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-white">
            Complaint Registered Successfully
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your maintenance complaint has been logged, routed to the relevant campus squad, and assigned a resolution timer.
          </p>
        </div>

        {/* Official Tracking Code Box */}
        <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0b0f19] space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider block text-slate-400 font-bold">
            Official Tracking Code
          </span>
          <div className="flex items-center justify-center space-x-2">
            <span className="font-mono text-2xl font-black tracking-wider px-3.5 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              {trackingCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copy tracking code"
            >
              {copied ? (
                <span className="text-xs font-bold text-cyan-400 px-1">Copied!</span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Triage & SLA Summary Pill Row */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl border border-white/[0.06] bg-[#0b0f19] text-left">
            <span className="text-[10px] font-mono uppercase block font-bold text-slate-500">
              Department
            </span>
            <span className="text-xs font-bold text-slate-200 truncate block mt-0.5">
              {ticket.department_name || 'Assigned Domain'}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-white/[0.06] bg-[#0b0f19] text-left">
            <span className="text-[10px] font-mono uppercase block font-bold text-slate-500">
              SLA Commitment
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400 block mt-0.5">
              {slaTarget}
            </span>
          </div>
        </div>

        {/* Priority Badge */}
        <div className="flex items-center justify-center gap-2 pt-1 text-xs">
          <PriorityBadge priority={priorityKey} size="sm" showSlaTooltip={true} dark={true} />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleTrackDirectly}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Track Live Status</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close &amp; Submit Another
          </button>
        </div>
      </div>
    </div>
  );
}
