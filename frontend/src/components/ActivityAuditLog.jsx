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
 * Parses raw resolution_notes into structured event objects.
 * Handles both standardized [TYPE: ISO_DATE | ...] tags and legacy/closure/override formats.
 */
export function parseAuditEntries(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  const text = rawText.replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const entries = [];
  // Split distinct log events demarcated by brackets at start of lines
  const rawBlocks = text.split(/(?=\n\s*\[)/);

  for (const rawBlock of rawBlocks) {
    const block = rawBlock.trim();
    if (!block) continue;

    // 1. Closure / Resolution Report
    // e.g.: [CLOSURE REPORT: 2026-10-30T09:15:16... | Technician: SuperAdmin | SLA Met: True]
    //       Work Summary: Fixed the leak
    //       Parts Replaced: None
    // or: [RESOLVED: 2026-10-30T... | Technician: ... | Parts Replaced: ... | Work Summary: ...]
    if (/^\[(?:CLOSURE\s*REPORT|RESOLVED)/i.test(block)) {
      const headerMatch = block.match(/^\[(?:CLOSURE\s*REPORT|RESOLVED):\s*([^|\]]+)(?:\|\s*([^\]]*))?\]/i);
      const timestampStr = headerMatch ? headerMatch[1].trim() : null;
      const rest = headerMatch ? headerMatch[2] || '' : '';

      let actor = 'Technician';
      let slaMet = null;
      let partsReplaced = null;
      let notes = '';

      if (rest) {
        const parts = rest.split('|').map((p) => p.trim());
        for (const p of parts) {
          const colonIdx = p.indexOf(':');
          if (colonIdx > 0) {
            const k = p.slice(0, colonIdx).trim().toLowerCase().replace(/\s+/g, '_');
            const v = p.slice(colonIdx + 1).trim();
            if (k === 'technician' || k === 'actor') actor = formatActorLabel(v);
            if (k === 'sla_met') slaMet = v;
            if (k === 'parts_replaced') partsReplaced = v;
            if (k === 'work_summary' || k === 'notes' || k === 'reason') notes = v;
          }
        }
      }

      // Check for multiline trailing fields
      const workSummaryMatch = block.match(/Work Summary:\s*(.*?)(?=\n\s*(?:Parts Replaced:|\[)|$)/is);
      if (workSummaryMatch && workSummaryMatch[1].trim()) {
        notes = workSummaryMatch[1].trim();
      }
      const partsMatch = block.match(/Parts Replaced:\s*(.*?)(?=\n\s*(?:Work Summary:|\[)|$)/is);
      if (partsMatch && partsMatch[1].trim() && partsMatch[1].trim().toLowerCase() !== 'none') {
        partsReplaced = partsMatch[1].trim();
      }

      let parsedDate = null;
      if (timestampStr) {
        try {
          const d = new Date(timestampStr);
          if (!isNaN(d.getTime())) parsedDate = d;
        } catch (_) {}
      }

      entries.push({
        type: 'RESOLVED',
        timestampStr,
        date: parsedDate,
        actor,
        notes: notes || 'Physical repair completed and verified by campus maintenance staff.',
        partsReplaced: partsReplaced && partsReplaced.toLowerCase() !== 'none' ? partsReplaced : null,
        slaMet,
        raw: block,
      });
      continue;
    }

    // 2. Priority Override / Severity Change
    // e.g.: [2026-10-30 09:16:38 UTC] [PRIORITY OVERRIDE] Priority changed from MEDIUM to LOW by SuperAdmin (superadmin@iiitnr.edu.in). Reason: Time Extension needed
    // or: [PRIORITY_OVERRIDE: 2026-10-30T... | Actor: ... | MEDIUM -> LOW | Reason: ...]
    if (/\[PRIORITY[\s_]*OVERRIDE/i.test(block)) {
      let timestampStr = null;
      const leadingTsMatch = block.match(/^\[([^\]]+)\]\s*\[PRIORITY/i);
      const colonTsMatch = block.match(/\[PRIORITY[\s_]*OVERRIDE:\s*([^|\]]+)/i);
      if (leadingTsMatch) {
        timestampStr = leadingTsMatch[1].trim();
      } else if (colonTsMatch) {
        timestampStr = colonTsMatch[1].trim();
      }

      let transitionPath = null;
      const transMatch = block.match(/(?:from\s+([A-Z_]+)\s+to\s+([A-Z_]+)|([A-Z_]+)\s*->\s*([A-Z_]+))/i);
      if (transMatch) {
        const fromP = transMatch[1] || transMatch[3];
        const toP = transMatch[2] || transMatch[4];
        transitionPath = `${fromP.toUpperCase()} -> ${toP.toUpperCase()}`;
      }

      let actor = 'Supervisor';
      const actorMatch = block.match(/by\s+(.*?)(?:\.\s*Reason:|\.\s*$|\s+Reason:|$)/i) || block.match(/Actor:\s*([^|\]]+)/i);
      if (actorMatch) {
        actor = formatActorLabel(actorMatch[1].trim());
      }

      let reason = '';
      const reasonMatch = block.match(/Reason:\s*(.*)/is);
      if (reasonMatch) {
        reason = reasonMatch[1].replace(/\]$/, '').trim();
      }

      let parsedDate = null;
      if (timestampStr) {
        try {
          const d = new Date(timestampStr.replace(' UTC', 'Z'));
          if (!isNaN(d.getTime())) parsedDate = d;
        } catch (_) {}
      }

      entries.push({
        type: 'PRIORITY_OVERRIDE',
        timestampStr,
        date: parsedDate,
        actor,
        notes: reason ? `Reason: ${reason}` : 'Priority tier adjusted with recalculation of resolution SLA deadline.',
        transitionPath,
        raw: block,
      });
      continue;
    }

    // 3. Team Reassignment
    // e.g.: [TEAM REASSIGNMENT] Reassigned from Hostel Electrical Squad 1 to Hostel Electrical Squad 1 by superadmin@iiitnr.edu.in. Reason: you are getting assigened S
    // or: [REASSIGNMENT: 2026-10-30T... | Actor: ... | Team A -> Team B | Reason: ...]
    if (/\[(?:TEAM\s+REASSIGNMENT|REASSIGNMENT)/i.test(block)) {
      let timestampStr = null;
      const tsMatch = block.match(/\[(?:TEAM\s+REASSIGNMENT|REASSIGNMENT):\s*([^|\]]+)/i);
      if (tsMatch) timestampStr = tsMatch[1].trim();

      let transitionPath = null;
      const squadMatch = block.match(/Reassigned from\s+(.*?)\s+to\s+(.*?)(?:\s+by|\.|\s+Reason:|$)/i)
        || block.match(/\|\s*([^|\]]+?)\s*->\s*([^|\]]+?)\s*\|/);
      if (squadMatch) {
        transitionPath = `${squadMatch[1].trim()} -> ${squadMatch[2].trim()}`;
      }

      let actor = 'Supervisor';
      const actorMatch = block.match(/by\s+(.*?)(?:\.\s*Reason:|\.\s*$|\s+Reason:|$)/i) || block.match(/Actor:\s*([^|\]]+)/i);
      if (actorMatch) {
        actor = formatActorLabel(actorMatch[1].trim());
      }

      let reason = '';
      const reasonMatch = block.match(/Reason:\s*(.*)/is);
      if (reasonMatch) {
        reason = reasonMatch[1].replace(/\]$/, '').trim();
      }

      let parsedDate = null;
      if (timestampStr) {
        try {
          const d = new Date(timestampStr);
          if (!isNaN(d.getTime())) parsedDate = d;
        } catch (_) {}
      }

      entries.push({
        type: 'REASSIGNMENT',
        timestampStr,
        date: parsedDate,
        actor,
        notes: reason ? `Reason: ${reason}` : 'Reassigned to specialized campus maintenance squad.',
        transitionPath,
        raw: block,
      });
      continue;
    }

    // 4. Student Feedback
    // e.g.: [2026-10-30 09:20:00 UTC] [STUDENT FEEDBACK] Rating: 5/5 Stars | Review: No written comments (Submitted by: Devansh)
    // or: [FEEDBACK: 2026-10-30T... | Student: ... | Rating: 5/5 | ...]
    if (/\[(?:STUDENT\s+FEEDBACK|FEEDBACK)/i.test(block)) {
      let timestampStr = null;
      const leadingTsMatch = block.match(/^\[([^\]]+)\]\s*\[(?:STUDENT\s+FEEDBACK|FEEDBACK)/i);
      const colonTsMatch = block.match(/\[(?:STUDENT\s+FEEDBACK|FEEDBACK):\s*([^|\]]+)/i);
      if (leadingTsMatch) timestampStr = leadingTsMatch[1].trim();
      else if (colonTsMatch) timestampStr = colonTsMatch[1].trim();

      const ratingMatch = block.match(/Rating:\s*([0-9]+(?:\.[0-9]+)?)/i);
      const rating = ratingMatch ? ratingMatch[1] : '5';

      let actor = 'Student';
      const studentMatch = block.match(/Submitted by:\s*([^)]+)/i) || block.match(/Student:\s*([^|\]]+)/i);
      if (studentMatch) actor = formatActorLabel(studentMatch[1].trim());

      let review = '';
      const reviewMatch = block.match(/Review:\s*([^()\]]+)/i) || block.match(/Comments:\s*([^|\]]+)/i);
      if (reviewMatch) review = reviewMatch[1].trim();

      let parsedDate = null;
      if (timestampStr) {
        try {
          const d = new Date(timestampStr.replace(' UTC', 'Z'));
          if (!isNaN(d.getTime())) parsedDate = d;
        } catch (_) {}
      }

      entries.push({
        type: 'FEEDBACK',
        timestampStr,
        date: parsedDate,
        actor,
        notes: review && review !== 'No written comments' ? `"${review}"` : 'Student verified service satisfaction.',
        rating,
        raw: block,
      });
      continue;
    }

    // 5. Standard bracketed format: [TYPE: ISO_DATE | key: val | ...]
    // e.g. [TRANSITION: ...], [ESCALATION: ...]
    const standardMatch = block.match(/^\[([A-Z_]+):\s*([^|\]]+)(?:\|\s*([^\]]*))?\]/is);
    if (standardMatch) {
      const type = standardMatch[1].trim().toUpperCase();
      const timestampStr = standardMatch[2]?.trim();
      const rest = standardMatch[3] || '';

      let parsedDate = null;
      try {
        const d = new Date(timestampStr);
        if (!isNaN(d.getTime())) parsedDate = d;
      } catch (_) {}

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
        raw: block,
      });
      continue;
    }

    // 6. Fallback for generic text
    entries.push({
      type: 'NOTE',
      timestampStr: null,
      date: null,
      actor: 'Institutional Log',
      notes: block,
      raw: block,
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
