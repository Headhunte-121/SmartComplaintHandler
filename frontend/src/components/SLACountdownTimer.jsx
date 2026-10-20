/**
 * SmartComplaintHandler - SLA Countdown Timer
 * Blueprint Reference: V1/M5/frontend/02_sla_countdown_timer.md
 * Role: Dynamic countdown pill ticking every second; high-contrast dark command center styling.
 */
import React, { useState, useEffect } from 'react';
import { parseUtcTimestamp } from '../utils/dateUtils';

export default function SLACountdownTimer({
  slaDeadline,
  deadline,
  status = 'SUBMITTED',
  resolvedAt = null,
  resolved_at = null,
  showIcon = true,
  dark = true,
}) {
  const [now, setNow] = useState(Date.now());

  const effectiveDeadline = slaDeadline || deadline;
  const effectiveResolvedAt = resolvedAt || resolved_at;

  const isTerminal = ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(status);

  // Set up ticking interval for active tickets
  useEffect(() => {
    if (isTerminal || !effectiveDeadline) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isTerminal, effectiveDeadline]);

  const deadlineDate = parseUtcTimestamp(effectiveDeadline);

  if (!deadlineDate) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          dark
            ? 'bg-slate-900 text-slate-400 border-slate-800'
            : 'bg-slate-100 text-slate-600 border-slate-200'
        }`}
      >
        No Deadline
      </span>
    );
  }

  // Handle Terminal States (RESOLVED, CLOSED, CANCELLED)
  if (status === 'RESOLVED') {
    const resolvedDate = parseUtcTimestamp(effectiveResolvedAt);
    const isPastSla = resolvedDate && deadlineDate && resolvedDate.getTime() > deadlineDate.getTime();
    if (isPastSla) {
      return (
        <span
          role="timer"
          aria-live="polite"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            dark
              ? 'bg-amber-950/80 text-amber-300 border-amber-800/80 shadow-xs'
              : 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs'
          }`}
        >
          {showIcon && (
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          Resolved (SLA Breached)
        </span>
      );
    }
    return (
      <span
        role="timer"
        aria-live="polite"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
          dark
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 shadow-xs'
            : 'bg-green-50 text-green-700 border-green-200 shadow-xs'
        }`}
      >
        {showIcon && (
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        Resolved on Time
      </span>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          dark
            ? 'bg-slate-900 text-slate-500 border-slate-800'
            : 'bg-slate-50 text-slate-500 border-slate-200'
        }`}
      >
        Cancelled
      </span>
    );
  }

  if (status === 'CLOSED') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          dark
            ? 'bg-slate-900 text-slate-400 border-slate-800'
            : 'bg-slate-100 text-slate-600 border-slate-300'
        }`}
      >
        Closed
      </span>
    );
  }

  // Active Ticket Calculation
  const deadlineTime = deadlineDate.getTime();
  const totalSeconds = Math.floor((deadlineTime - now) / 1000);
  const isBreached = totalSeconds < 0;

  // 1. Breached state (< 0s)
  if (isBreached) {
    const overdueSeconds = Math.abs(totalSeconds);
    const hours = Math.floor(overdueSeconds / 3600);
    const minutes = Math.floor((overdueSeconds % 3600) / 60);

    return (
      <span
        role="timer"
        aria-live="polite"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border animate-pulse ${
          dark
            ? 'bg-rose-950/90 text-rose-300 border-rose-800/90 shadow-xs'
            : 'bg-rose-100 text-rose-700 border-rose-300 shadow-xs'
        }`}
      >
        {showIcon && (
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        Overdue by {hours}h {minutes}m
      </span>
    );
  }

  // 2. Urgent / Approaching Breach (< 1 hour)
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return (
      <span
        role="timer"
        aria-live="polite"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border animate-pulse ${
          dark
            ? 'bg-amber-950/90 text-amber-300 border-amber-800/90 shadow-xs'
            : 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
        }`}
      >
        {showIcon && (
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {minutes}m {seconds}s remaining
      </span>
    );
  }

  // 3. Standard active window (1 to 4 hours)
  if (totalSeconds < 14400) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return (
      <span
        role="timer"
        aria-live="polite"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
          dark
            ? 'bg-sky-950/90 text-sky-300 border-sky-800/90 shadow-xs'
            : 'bg-sky-50 text-sky-700 border-sky-200 shadow-xs'
        }`}
      >
        {showIcon && (
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {hours}h {minutes}m remaining
      </span>
    );
  }

  // 4. Plentiful buffer (> 4 hours)
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return (
    <span
      role="timer"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
        dark
          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800/90 shadow-xs'
          : 'bg-green-50 text-green-700 border-green-200 shadow-xs'
      }`}
    >
      {showIcon && (
        <svg className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {hours}h {minutes}m remaining
    </span>
  );
}
