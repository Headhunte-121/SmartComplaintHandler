/**
 * SmartComplaintHandler - Student Self-Service Grievance Portal (IIIT Naya Raipur)
 * Blueprint Reference: V1/M2/frontend & V1/M5/frontend/04_feedback_rating.md
 * Design Pattern: Enterprise Bento KPI dashboard with search/filter bar, live SLA countdowns,
 *                 and interactive 5-star closed-loop resolution rating modal.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchComplaints, submitFeedback } from '../api/complaints';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';

export default function StudentDashboard() {
  const { currentPersona, currentUser } = useAuth();
  const activeUser = currentUser || currentPersona;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Rating Modal State
  const [selectedTicketForFeedback, setSelectedTicketForFeedback] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingHover, setRatingHover] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);

  const studentEmail = activeUser?.email || 'nikhil26100@iiitnr.edu.in';

  const loadStudentTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints({ student_email: studentEmail, limit: 100 });
      setTickets(data);
    } catch (err) {
      try {
        const allData = await fetchComplaints({ limit: 100 });
        const filtered = allData.filter(
          (t) =>
            (t.student_email && t.student_email.toLowerCase() === studentEmail.toLowerCase()) ||
            (t.student_name && t.student_name.toLowerCase() === (activeUser?.name || '').toLowerCase())
        );
        setTickets(filtered);
      } catch (_) {
        setError('Unable to retrieve grievance records. Please ensure the campus backend is online.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentTickets();
  }, [studentEmail]);

  const activeTickets = tickets.filter(
    (t) => t.status === 'SUBMITTED' || t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'ESCALATED'
  );
  const resolvedTickets = tickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  );

  const ratedTickets = tickets.filter((t) => t.feedback_rating != null);
  const avgSatisfaction =
    ratedTickets.length > 0
      ? (ratedTickets.reduce((sum, t) => sum + t.feedback_rating, 0) / ratedTickets.length).toFixed(1)
      : null;

  const tabFiltered =
    activeTab === 'ACTIVE'
      ? activeTickets
      : activeTab === 'RESOLVED'
      ? resolvedTickets
      : tickets;

  const displayedTickets = tabFiltered.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.tracking_code || '').toLowerCase().includes(q) ||
      (t.title || '').toLowerCase().includes(q) ||
      (t.location || '').toLowerCase().includes(q) ||
      (t.department_name || '').toLowerCase().includes(q)
    );
  });

  const handleOpenFeedback = (ticket) => {
    setSelectedTicketForFeedback(ticket);
    setRatingScore(ticket.feedback_rating || 5);
    setFeedbackComments(ticket.feedback_comments || '');
    setFeedbackSuccess(null);
  };

  const handleCloseFeedback = () => {
    if (isSubmittingFeedback) return;
    setSelectedTicketForFeedback(null);
    setRatingScore(5);
    setFeedbackComments('');
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!selectedTicketForFeedback) return;

    setIsSubmittingFeedback(true);
    try {
      const updated = await submitFeedback(
        selectedTicketForFeedback.tracking_code,
        ratingScore,
        feedbackComments,
        activeUser?.name
      );

      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );

      setFeedbackSuccess(
        `Thank you! Your ${ratingScore}/5 rating for ${selectedTicketForFeedback.tracking_code} has been recorded.`
      );
      setTimeout(() => {
        handleCloseFeedback();
      }, 1100);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ASSIGNED':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ESCALATED':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const starLabels = {
    1: '1/5 — Unsatisfactory',
    2: '2/5 — Needs Improvement',
    3: '3/5 — Acceptable',
    4: '4/5 — Good Quality',
    5: '5/5 — Outstanding Service',
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Student Profile & Portal Welcome Banner (Fixed Tailwind v3 bg-gradient-to-r) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl bg-dark-architectural-grid border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-3xl shadow-inner shrink-0">
              {activeUser?.avatar || '🎓'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {activeUser?.name}
                </h1>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/25 border border-indigo-400/30 text-indigo-200">
                  {activeUser?.roleLabel || 'Student'}
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 font-medium">
                {activeUser?.identifier} • {activeUser?.department}
              </p>
              <p className="text-xs text-slate-300 font-mono">
                {activeUser?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/submit"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Lodge New Grievance</span>
            </Link>
            <button
              onClick={loadStudentTickets}
              title="Refresh Ticket History"
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all text-xs flex items-center justify-center cursor-pointer"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bento-card p-5 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Active In-Flight
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">{activeTickets.length}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Under live SLA countdown
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 text-xl font-bold">
            ⚡
          </div>
        </div>

        <div className="bento-card p-5 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Repaired &amp; Verified
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">{resolvedTickets.length}</div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Closed with technician notes
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 text-xl font-bold">
            ✓
          </div>
        </div>

        <div className="bento-card p-5 border-l-4 border-l-indigo-600 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Satisfaction Score
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {avgSatisfaction ? `${avgSatisfaction} / 5.0` : '—'}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {ratedTickets.length} rated resolution(s)
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-indigo-600 text-xl font-bold">
            ★
          </div>
        </div>
      </div>

      {/* Main Grievances Section */}
      <div className="bento-card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/40">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              My Campus Grievance History
            </h2>
            <p className="text-xs text-slate-500">
              Live status tracking, assigned engineering squads, and resolution satisfaction feedback.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by code, room, or title..."
              className="enterprise-input w-full sm:w-56"
            />

            <div className="flex items-center space-x-1 p-1 bg-slate-200/70 rounded-xl">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({tickets.length})
              </button>
              <button
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'ACTIVE'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({activeTickets.length})
              </button>
              <button
                onClick={() => setActiveTab('RESOLVED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'RESOLVED'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Resolved ({resolvedTickets.length})
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Retrieving your grievance records...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
              !
            </div>
            <p className="text-xs font-bold text-rose-700">{error}</p>
            <button
              onClick={loadStudentTickets}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : displayedTickets.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-sm mx-auto px-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl">
              📋
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">No Grievances Found</h3>
              <p className="text-xs text-slate-500">
                You have no complaints matching the current filter. Report any hostel, lab, or campus issue below.
              </p>
            </div>
            <Link
              to="/submit"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <span>Lodge a Facility Grievance</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedTickets.map((ticket) => {
              const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
              const hasRating = ticket.feedback_rating != null;

              return (
                <div
                  key={ticket.id || ticket.tracking_code}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className="font-mono font-bold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200/80 transition-colors"
                      >
                        {ticket.tracking_code}
                      </Link>
                      <PriorityBadge priority={ticket.priority} />
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      {ticket.department_name && (
                        <span className="text-slate-600 text-[11px] font-semibold bg-slate-100 px-2.5 py-0.5 rounded-md">
                          {ticket.department_name}
                        </span>
                      )}
                      {ticket.assigned_team_name && (
                        <span className="text-slate-500 text-[11px] font-medium">
                          🔧 Squad: <strong className="text-slate-700">{ticket.assigned_team_name}</strong>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        {ticket.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                        {ticket.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-400">
                      <span className="text-slate-500 font-medium">
                        📍 {ticket.location}
                      </span>
                      <span>•</span>
                      <span>
                        Logged: {new Date(ticket.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {hasRating && (
                      <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs flex items-start space-x-2.5">
                        <span className="text-amber-500 text-sm">★</span>
                        <div className="space-y-0.5">
                          <div className="font-bold text-amber-900">
                            Your Rating: {ticket.feedback_rating} / 5 Stars
                          </div>
                          {ticket.feedback_comments && (
                            <p className="text-amber-800 text-[11px] italic">
                              "{ticket.feedback_comments}"
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {!isResolved ? (
                      <div className="space-y-1 text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                          SLA Target Countdown
                        </span>
                        <SLACountdownTimer
                          slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                          priority={ticket.priority}
                          status={ticket.status}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 flex items-center sm:justify-end space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Verified Resolved</span>
                        </span>
                        <span className="text-xs font-semibold text-slate-500 block">
                          {ticket.resolved_at
                            ? new Date(ticket.resolved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Closed'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
                      >
                        Track Timeline
                      </Link>

                      {isResolved && (
                        <button
                          type="button"
                          onClick={() => handleOpenFeedback(ticket)}
                          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                            hasRating
                              ? 'bg-amber-100/80 hover:bg-amber-200 text-amber-900 border border-amber-200'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                          }`}
                        >
                          <span>★</span>
                          <span>{hasRating ? 'Update Rating' : 'Rate Repair'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Closed-Loop Student Satisfaction Rating Modal */}
      {selectedTicketForFeedback && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseFeedback}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">⭐</span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Rate Maintenance Resolution
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Ticket <strong className="font-mono text-indigo-600">{selectedTicketForFeedback.tracking_code}</strong>: {selectedTicketForFeedback.title}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseFeedback}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="py-8 text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">
                  ✓
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  Feedback Recorded!
                </h4>
                <p className="text-xs text-slate-500">{feedbackSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} className="space-y-5">
                <div className="space-y-2 text-center py-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Select Satisfaction Score
                  </label>
                  <div className="flex items-center justify-center space-x-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingScore(star)}
                        onMouseEnter={() => setRatingHover(star)}
                        onMouseLeave={() => setRatingHover(0)}
                        className="text-3xl sm:text-4xl transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                      >
                        <span
                          className={
                            (ratingHover || ratingScore) >= star
                              ? 'text-amber-400'
                              : 'text-slate-200'
                          }
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="text-xs font-bold text-amber-700 h-4">
                    {starLabels[ratingHover || ratingScore]}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Review Comments (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder="Share your feedback on repair quality and technician timeliness..."
                    className="enterprise-input resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseFeedback}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-colors disabled:opacity-60"
                  >
                    {isSubmittingFeedback ? 'Saving...' : 'Submit Rating'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
