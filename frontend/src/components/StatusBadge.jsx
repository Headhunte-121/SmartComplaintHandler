/**
 * SmartComplaintHandler - Unified Status Badge Component
 * Guarantees visual distinction across all ticket lifecycle states
 * while maintaining the dark obsidian / smoked glass design language.
 */
import React from 'react';
import { Clock, Play, Pause, AlertTriangle, CheckCircle2, UserCheck, ShieldAlert } from 'lucide-react';

const STATUS_CONFIG = {
  SUBMITTED: {
    label: 'SUBMITTED',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    icon: Clock,
  },
  ASSIGNED: {
    label: 'ASSIGNED',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    dot: 'bg-purple-400',
    icon: UserCheck,
  },
  IN_PROGRESS: {
    label: 'IN PROGRESS',
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    dot: 'bg-blue-400',
    icon: Play,
  },
  ON_HOLD: {
    label: 'ON HOLD',
    border: 'border-orange-500/40',
    bg: 'bg-orange-500/15',
    text: 'text-orange-300',
    dot: 'bg-orange-400',
    icon: Pause,
  },
  ESCALATED: {
    label: 'ESCALATED',
    border: 'border-rose-500/50',
    bg: 'bg-rose-500/20',
    text: 'text-rose-300',
    dot: 'bg-rose-400 animate-ping',
    icon: ShieldAlert,
    extra: 'ring-1 ring-rose-500/30',
  },
  RESOLVED: {
    label: 'RESOLVED',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
  },
  CLOSED: {
    label: 'CLOSED',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
};

export default function StatusBadge({
  status = 'SUBMITTED',
  size = 'sm',
  showIcon = true,
  className = '',
}) {
  const normalized = (status || 'SUBMITTED').toString().trim().toUpperCase();
  const cfg = STATUS_CONFIG[normalized] || STATUS_CONFIG.SUBMITTED;
  const IconComponent = cfg.icon;

  const isSmall = size === 'sm';
  const sizeClasses = isSmall
    ? 'px-2 py-0.5 text-[10px]'
    : 'px-2.5 py-1 text-xs';
  const iconSize = isSmall ? 10 : 12;

  return (
    <span
      role="status"
      aria-label={`Status: ${cfg.label}`}
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-bold uppercase tracking-wider ${cfg.border} ${cfg.bg} ${cfg.text} ${cfg.extra || ''} ${sizeClasses} ${className}`}
    >
      {showIcon && IconComponent && <IconComponent size={iconSize} className="shrink-0" />}
      <span>{cfg.label}</span>
    </span>
  );
}
