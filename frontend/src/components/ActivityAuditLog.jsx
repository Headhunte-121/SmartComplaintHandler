/**
 * SmartComplaintHandler - Activity & Institutional Audit Log
 * Renders structured audit trails, status transitions, squad dispatches,
 * and escalation logs into a clean, human-readable obsidian timeline.
 */
import React, { useState } from 'react';
import {
  ShieldAlert,
  Play,
  Pause,
  UsersRound,
  Sliders,
  CheckCircle2,
  Star,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * Normalizes ISO date string into human-friendly format: e.g. "29 Oct 2026, 9:20 PM"
 */
function formatLogTimestamp(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch (_) {
    return dateStr;
  }
}

/**
 * Cleans user actor identifiers (e.g. "superadmin@iiitnr.edu.in" -> "SuperAdmin", "tech@iiitnr.edu.in" -> "Technician")
 */
function formatActorLabel(actor) {
  if (!actor) return 'Staff';
  const clean = actor.trim();
  if (clean.includes('@')) {
    const userPart = clean.split('@')[0];
    if (userPart.toLowerCase().includes('superadmin')) return 'SuperAdmin Directorate';
    if (userPart.toLowerCase().includes('admin')) return 'Campus Admin';
    if (userPart.toLowerCase().includes('tech')) return 'Field Technician';
    return userPart.charAt(0).toUpperCase() + userPart.slice(1);
  }
  return clean;
}

/**
 * Parses raw bracketed resolution_notes into structured event objects.
 */
export function parseAuditEntries(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  // Match bracketed audit blocks: [TYPE: ISO_DATE | ...]
  const regex = /\[([A-Z_]+):\s*([^|\]]+)(?:\|\s*([^\]]*))?\]/g;
  const entries = [];
  let match;

  while ((match = regex.exec(rawText)) !== null) {
    const type = match[1].trim().toUpperCase();
    const timestampStr = match[2]?.trim();
    const rest = match[3] || '';

    let parsedDate = null;
    try {
      const d = new Date(timestampStr);
      if (!isNaN(d.getTime())) parsedDate = d;
    } catch (_) {}

    // Parse pipe-delimited fields
    const parts = rest.split('|').map((p) => p.trim()).filter(Boolean);
    const details = {};
    let transitionPath = null;

    parts.forEach((part) => {
      if (part.includes('->') && !part.toLowerCase().includes('notes:')) {
        transitionPath = part.trim();
        return;
      }
      const colonIdx = part.indexOf(':');
      if (colonIdx > 0) {
        const key = part.slice(0, colonIdx).trim().toLowerCase().replace(/\s+/g, '_');
        const val = part.slice(colonIdx + 1).trim();
        details[key] = val;
      } else {
        details.generic = part;
      }
    });

    entries.push({
      type,
      timestampStr,
      date: parsedDate,
      actor: formatActorLabel(details.actor || details.supervisor || details.technician || details.student || ''),
      notes: details.notes || details.reason || details.work_summary || details.comments || details.generic || '',
      partsReplaced: details.parts_replaced,
      rating: details.rating,
      transitionPath,
      raw: match[0],
    });
  }

  // Fallback for plain unformatted legacy text
  if (entries.length === 0 && rawText.trim().length > 0) {
    entries.push({
      type: 'NOTE',
      timestampStr: null,
      date: null,
      actor: 'Institutional Log',
      notes: rawText.trim(),
    });
  }

  return entries;
}

/**
 * Visual styling and metadata resolver for each audit event type
 */
function getEventVisuals(entry) {
  switch (entry.type) {
    case 'ESCALATION':
      return {
        title: 'Escalated for Supervisory Review',
        badge: 'Escalation',
        badgeClass: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
        iconBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
        icon: ShieldAlert,
      };

    case 'TRANSITION':
      if (entry.transitionPath?.includes('ON_HOLD')) {
        return {
          title: 'Work Placed On Hold (Parts / Access)',
          badge: 'On Hold',
          badgeClass: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
          iconBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
          icon: Pause,
        };
      }
      if (entry.transitionPath?.includes('IN_PROGRESS')) {
        return {
          title: 'Physical Repair In Progress',
          badge: 'In Progress',
          badgeClass: 'border-blue-500/40 bg-blue-500/15 text-blue-300',
          iconBg: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
          icon: Play,
        };
      }
      return {
        title: entry.transitionPath ? `Status: ${entry.transitionPath}` : 'Status Updated',
        badge: 'Status Change',
        badgeClass: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300',
        iconBg: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300',
        icon: Clock,
      };

    case 'REASSIGNMENT':
      return {
        title: 'Maintenance Squad Reassigned',
        badge: 'Reassigned',
        badgeClass: 'border-purple-500/40 bg-purple-500/15 text-purple-300',
        iconBg: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
        icon: UsersRound,
      };

    case 'PRIORITY_OVERRIDE':
      return {
        title: 'Administrative Urgency Override',
        badge: 'Priority SLA',
        badgeClass: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
        iconBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
        icon: Sliders,
      };

    case 'RESOLVED':
      return {
        title: 'Repair Completed & Verified',
        badge: 'Resolved',
        badgeClass: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
        iconBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
        icon: CheckCircle2,
      };

    case 'FEEDBACK':
      return {
        title: 'Student Service Rating',
        badge: `${entry.rating || '5'}/5 Rating`,
        badgeClass: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
        iconBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
        icon: Star,
      };

    default:
      return {
        title: 'Institutional Audit Record',
        badge: 'Audit',
        badgeClass: 'border-zinc-500/40 bg-zinc-500/15 text-zinc-300',
        iconBg: 'bg-zinc-800 border-zinc-600 text-zinc-300',
        icon: FileText,
      };
  }
}

export default function ActivityAuditLog({
  notes,
  title = 'Audit Trail & Dispatch Log',
  compact = false,
  showAllInitially = false,
}) {
  const [expanded, setExpanded] = useState(showAllInitially);

  const entries = parseAuditEntries(notes);
  if (!entries || entries.length === 0) return null;

  // By default, show most recent events first
  const displayEntries = [...entries].reverse();
  const visibleEntries = expanded || displayEntries.length <= 3
    ? displayEntries
    : displayEntries.slice(0, 3);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#07080c] p-4 sm:p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-zinc-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            {title}
          </span>
          <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.2 text-[10px] font-mono text-zinc-400">
            {entries.length} {entries.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {displayEntries.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <span>{expanded ? 'Show latest only' : `View all (${displayEntries.length})`}</span>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-5 sm:pl-6 space-y-3 before:absolute before:left-2 sm:before:left-2.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/[0.08]">
        {visibleEntries.map((entry, idx) => {
          const visuals = getEventVisuals(entry);
          const Icon = visuals.icon;

          return (
            <div key={idx} className="relative group">
              {/* Timeline Node Icon */}
              <div
                className={`absolute -left-5 sm:-left-6 top-0.5 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center shadow-xs ${visuals.iconBg}`}
              >
                <Icon size={10} className="sm:hidden" />
                <Icon size={11} className="hidden sm:block" />
              </div>

              {/* Event Content Box */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs space-y-1.5 hover:border-white/[0.12] transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200 tracking-tight">
                      {visuals.title}
                    </span>
                    <span
                      className={`rounded-md border px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider ${visuals.badgeClass}`}
                    >
                      {visuals.badge}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-500">
                    {formatLogTimestamp(entry.timestampStr)}
                  </span>
                </div>

                {/* Subtitle / Transition details if present */}
                {(entry.actor || entry.transitionPath) && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                    {entry.actor && (
                      <span className="font-medium text-zinc-300">
                        By <span className="font-semibold text-white">{entry.actor}</span>
                      </span>
                    )}
                    {entry.transitionPath && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                        {entry.transitionPath}
                      </span>
                    )}
                  </div>
                )}

                {/* Notes Narrative */}
                {entry.notes && (
                  <p className="text-[11px] leading-relaxed text-zinc-300 bg-[#040507] p-2 rounded-lg border border-white/[0.04]">
                    {entry.notes}
                  </p>
                )}

                {/* Parts Replaced if resolved */}
                {entry.partsReplaced && (
                  <div className="text-[10px] text-emerald-400 font-mono">
                    <span className="text-zinc-500">Parts Replaced: </span>
                    {entry.partsReplaced}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
