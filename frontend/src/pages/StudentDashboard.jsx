/**
 * SmartComplaintHandler - Student Portal (Botanical Earth Tone Theme)
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchComplaints, submitFeedback } from '../api/complaints';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';
import CampusMapSelector from '../components/CampusMapSelector';
import {
  IIITNR_MAP_UPDATED_EVENT,
  HOSTEL_FLOORS,
  getCampusBuildings,
  getHostelBuildings,
  getRoomsForBuilding,
} from '../data/iiitnrCampusData';

export default function StudentDashboard() {
  const { currentPersona, currentUser, updateProfile } = useAuth();
  const activeUser = currentUser || currentPersona;

  const [allBuildings, setAllBuildings] = useState(() => getCampusBuildings());
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCampusMap, setShowCampusMap] = useState(false);

  const hostelsList = useMemo(() => getHostelBuildings(allBuildings), [allBuildings]);

  const [isResidenceModalOpen, setIsResidenceModalOpen] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(
    activeUser?.hostel_name || hostelsList[0]?.name || 'Ramanujan House (Boys Hostel)'
  );
  const [selectedFloor, setSelectedFloor] = useState('2');
  const [selectedRoom, setSelectedRoom] = useState(activeUser?.room_number || 'Room 204');
  const [customRoomInput, setCustomRoomInput] = useState('');
  const [savingResidence, setSavingResidence] = useState(false);

  const [selectedTicketForFeedback, setSelectedTicketForFeedback] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingHover, setRatingHover] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const studentEmail = activeUser?.email || 'nikhil26100@iiitnr.edu.in';

  useEffect(() => {
    const sync = () => setAllBuildings(getCampusBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
  }, []);

  const availableRooms = useMemo(
    () => getRoomsForBuilding(selectedHostel, selectedFloor, null, allBuildings),
    [selectedHostel, selectedFloor, allBuildings]
  );

  const loadStudentTickets = async () => {
    setLoading(true);
    try {
      const data = await fetchComplaints({ student_email: studentEmail, limit: 100 });
      setTickets(data);
    } catch (_) {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentTickets();
  }, [studentEmail]);

  const handleSaveResidence = async (e) => {
    e.preventDefault();
    setSavingResidence(true);
    const finalRoom = customRoomInput.trim() || selectedRoom;
    try {
      await updateProfile({
        hostel_name: selectedHostel,
        room_number: finalRoom,
      });
      setIsResidenceModalOpen(false);
    } finally {
      setSavingResidence(false);
    }
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
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      setSelectedTicketForFeedback(null);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const activeTickets = tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
  const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
  const ratedTickets = tickets.filter((t) => t.feedback_rating != null);
  const avgSatisfaction =
    ratedTickets.length > 0
      ? (ratedTickets.reduce((sum, t) => sum + t.feedback_rating, 0) / ratedTickets.length).toFixed(1)
      : null;

  const tabFiltered =
    activeTab === 'ACTIVE' ? activeTickets : activeTab === 'RESOLVED' ? resolvedTickets : tickets;

  const displayedTickets = tabFiltered.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.tracking_code || '').toLowerCase().includes(q) ||
      (t.title || '').toLowerCase().includes(q) ||
      (t.location || '').toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-gradient-to-r from-sky-50 to-blue-50 text-sky-800 border-sky-300 shadow-2xs font-bold';
      case 'ASSIGNED':
        return 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 border-amber-300 shadow-2xs font-bold';
      case 'IN_PROGRESS':
        return 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-900 border-indigo-300 shadow-2xs font-bold';
      case 'ESCALATED':
        return 'bg-gradient-to-r from-rose-50 to-red-50 text-rose-900 border-rose-300 shadow-2xs font-bold animate-pulse';
      case 'RESOLVED':
        return 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-900 border-emerald-300 shadow-2xs font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 shadow-2xs font-medium';
    }
  };

  const currentHostelLabel = activeUser?.hostel_name || hostelsList[0]?.name || 'Ramanujan House';
  const currentRoomLabel = activeUser?.room_number || 'Room 204';

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Clean White Student Profile & Residence Header */}
      <div className="rounded-3xl bg-white text-slate-900 p-6 sm:p-7 shadow-sm border border-slate-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-2xl shrink-0">
            {activeUser?.avatar || '🎓'}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {activeUser?.name}
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-800">
                {activeUser?.identifier}
              </span>
            </div>
            <p className="text-xs text-slate-500">{activeUser?.department}</p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold">
                <span>🏠 {currentHostelLabel.split(' (')[0]}</span>
                <span>·</span>
                <span className="font-mono text-slate-900">{currentRoomLabel}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsResidenceModalOpen(true)}
                className="btn-botanical-secondary"
              >
                ✏️ Change Room
              </button>
              <button
                type="button"
                onClick={() => setShowCampusMap((prev) => !prev)}
                className="btn-botanical-moss"
              >
                🗺️ {showCampusMap ? 'Hide Map' : 'Campus Map'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <Link
            to="/submit"
            className="btn-botanical-primary"
          >
            + Submit Issue
          </Link>
          <button
            onClick={loadStudentTickets}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-all cursor-pointer shadow-xs"
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </div>

      {showCampusMap && (
        <CampusMapSelector
          selectedBuilding={currentHostelLabel}
          selectedRoom={currentRoomLabel}
          studentSavedHostel={currentHostelLabel}
          studentSavedRoom={currentRoomLabel}
          onSelectBuilding={(bName) => {
            setSelectedHostel(bName);
            setIsResidenceModalOpen(true);
          }}
        />
      )}

      {/* Bento KPI Row with Multi-Layer Depth */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card p-5 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/30 via-white to-white flex items-center justify-between shadow-2xs hover:shadow-xs transition-all">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Issues
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">{activeTickets.length}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100/90 to-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-lg font-bold shadow-2xs">
            ⚡
          </div>
        </div>

        <div className="bento-card p-5 border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/30 via-white to-white flex items-center justify-between shadow-2xs hover:shadow-xs transition-all">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Resolved
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">{resolvedTickets.length}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100/90 to-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-lg font-bold shadow-2xs">
            ✓
          </div>
        </div>

        <div className="bento-card p-5 border-l-4 border-l-sky-500 bg-gradient-to-br from-sky-50/30 via-white to-white flex items-center justify-between shadow-2xs hover:shadow-xs transition-all">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Avg Satisfaction
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {avgSatisfaction ? `${avgSatisfaction} / 5` : '—'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-100/90 to-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center text-lg font-bold shadow-2xs">
            ★
          </div>
        </div>
      </div>

      {/* Issues List Card */}
      <div className="bento-card overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <h2 className="text-base font-bold text-slate-900">My Maintenance Requests</h2>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, room, title..."
              className="enterprise-input w-full sm:w-52 bg-white border-slate-200"
            />

            <div className="flex items-center space-x-1 p-1 bg-slate-100 border border-slate-200 rounded-xl">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer ${
                  activeTab === 'ALL' ? 'bg-green-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                All ({tickets.length})
              </button>
              <button
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer ${
                  activeTab === 'ACTIVE' ? 'bg-green-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                Active ({activeTickets.length})
              </button>
              <button
                onClick={() => setActiveTab('RESOLVED')}
                className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer ${
                  activeTab === 'RESOLVED' ? 'bg-green-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                Resolved ({resolvedTickets.length})
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading requests...</div>
        ) : displayedTickets.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-xs text-slate-500">No maintenance requests found.</p>
            <Link
              to="/submit"
              className="btn-botanical-primary"
            >
              + Submit Issue
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
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className="font-mono font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-lg border border-green-200"
                      >
                        {ticket.tracking_code}
                      </Link>
                      <PriorityBadge priority={ticket.priority} />
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      {ticket.department_name && (
                        <span className="text-slate-700 text-[11px] font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {ticket.department_name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{ticket.title}</h3>
                    <div className="text-[11px] text-slate-500">
                      📍 {ticket.location} · {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0">
                    {!isResolved ? (
                      <SLACountdownTimer
                        slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                        priority={ticket.priority}
                        status={ticket.status}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTicketForFeedback(ticket);
                          setRatingScore(ticket.feedback_rating || 5);
                          setFeedbackComments(ticket.feedback_comments || '');
                        }}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 cursor-pointer"
                      >
                        ★ {hasRating ? `${ticket.feedback_rating}/5` : 'Rate'}
                      </button>
                    )}

                    <Link
                      to={`/track?code=${ticket.tracking_code}`}
                      className="btn-botanical-secondary"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hostel & Room Modal */}
      {isResidenceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setIsResidenceModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Select Your Hostel &amp; Room</h3>
              <button
                type="button"
                onClick={() => setIsResidenceModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResidence} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hostelsList.map((h) => {
                  const active = selectedHostel === h.name;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        setSelectedHostel(h.name);
                        setCustomRoomInput('');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-green-500 bg-green-50/60 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{h.shortName}</div>
                      <div className="text-[10px] text-slate-500">{h.type}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Floor</label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(e.target.value)}
                    className="enterprise-input text-xs bg-white border-slate-200 text-slate-900"
                  >
                    {HOSTEL_FLOORS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number</label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => {
                      setSelectedRoom(e.target.value);
                      setCustomRoomInput('');
                    }}
                    className="enterprise-input text-xs bg-white border-slate-200 text-slate-900"
                  >
                    {availableRooms
                      .filter((r) => r.includes('Room') || r.includes('Suite'))
                      .map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Or Custom Room / Spot</label>
                <input
                  type="text"
                  placeholder="e.g. Room 312 or Guest Suite"
                  value={customRoomInput}
                  onChange={(e) => setCustomRoomInput(e.target.value)}
                  className="enterprise-input text-xs bg-white border-slate-200 text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResidenceModalOpen(false)}
                  className="btn-botanical-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResidence}
                  className="btn-botanical-primary"
                >
                  {savingResidence ? 'Saving...' : 'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {selectedTicketForFeedback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSelectedTicketForFeedback(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900">
              Rate Repair ({selectedTicketForFeedback.tracking_code})
            </h3>
            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div className="flex justify-center space-x-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingScore(star)}
                    onMouseEnter={() => setRatingHover(star)}
                    onMouseLeave={() => setRatingHover(0)}
                    className="text-3xl cursor-pointer"
                  >
                    <span className={(ratingHover || ratingScore) >= star ? 'text-amber-500' : 'text-slate-200'}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                placeholder="Optional comments..."
                className="enterprise-input resize-none bg-white border-slate-200 text-slate-900"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForFeedback(null)}
                  className="btn-botanical-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="btn-botanical-primary"
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
