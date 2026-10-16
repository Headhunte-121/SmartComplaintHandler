/**
 * SmartComplaintHandler - Student Portal (Obsidian-Slate & Emerald Theme)
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
  HOSTEL_WINGS,
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
  const [selectedWing, setSelectedWing] = useState('Wing A');
  const [selectedRoom, setSelectedRoom] = useState(activeUser?.room_number || 'Wing A, Room 204');
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
    () => getRoomsForBuilding(selectedHostel, selectedFloor, selectedWing, allBuildings),
    [selectedHostel, selectedFloor, selectedWing, allBuildings]
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
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'ASSIGNED':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'IN_PROGRESS':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'ESCALATED':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const currentHostelLabel = activeUser?.hostel_name || hostelsList[0]?.name || 'Ramanujan House';
  const currentRoomLabel = activeUser?.room_number || 'Wing A, Room 204';

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Dark Student Profile & Residence Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#09121e] via-[#0c1d24] to-[#09121e] text-white p-6 sm:p-7 shadow-xl bg-dark-architectural-grid border border-emerald-500/25 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-2xl shrink-0">
            {activeUser?.avatar || '🎓'}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {activeUser?.name}
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                {activeUser?.identifier}
              </span>
            </div>
            <p className="text-xs text-slate-300">{activeUser?.department}</p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <span>🏠 {currentHostelLabel.split(' (')[0]}</span>
                <span>·</span>
                <span className="font-mono text-white">{currentRoomLabel}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsResidenceModalOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-emerald-300 transition-all cursor-pointer"
              >
                ✏️ Change Room
              </button>
              <button
                type="button"
                onClick={() => setShowCampusMap((prev) => !prev)}
                className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-300 transition-all cursor-pointer"
              >
                🗺️ {showCampusMap ? 'Hide Map' : 'Campus Map'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <Link
            to="/submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            + Submit Issue
          </Link>
          <button
            onClick={loadStudentTickets}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-all cursor-pointer"
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

      {/* Bento KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card p-5 border-l-4 border-l-amber-400 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Issues
            </span>
            <div className="text-3xl font-black text-white mt-1">{activeTickets.length}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 text-lg font-bold">
            ⚡
          </div>
        </div>

        <div className="bento-card p-5 border-l-4 border-l-emerald-400 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Resolved
            </span>
            <div className="text-3xl font-black text-white mt-1">{resolvedTickets.length}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-lg font-bold">
            ✓
          </div>
        </div>

        <div className="bento-card p-5 border-l-4 border-l-teal-400 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Avg Rating
            </span>
            <div className="text-3xl font-black text-white mt-1">
              {avgSatisfaction ? `${avgSatisfaction} / 5` : '—'}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 text-lg font-bold">
            ★
          </div>
        </div>
      </div>

      {/* Issues List Card */}
      <div className="bento-card overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a101c]">
          <h2 className="text-base font-black text-white">My Maintenance Requests</h2>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, room, title..."
              className="enterprise-input w-full sm:w-52"
            />

            <div className="flex items-center space-x-1 p-1 bg-[#070b14] border border-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                  activeTab === 'ALL' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({tickets.length})
              </button>
              <button
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                  activeTab === 'ACTIVE' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Active ({activeTickets.length})
              </button>
              <button
                onClick={() => setActiveTab('RESOLVED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                  activeTab === 'RESOLVED' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Resolved ({resolvedTickets.length})
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Loading requests...</div>
        ) : displayedTickets.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-xs text-slate-400">No maintenance requests found.</p>
            <Link
              to="/submit"
              className="inline-flex px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl"
            >
              + Submit Issue
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {displayedTickets.map((ticket) => {
              const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
              const hasRating = ticket.feedback_rating != null;

              return (
                <div
                  key={ticket.id || ticket.tracking_code}
                  className="p-5 hover:bg-slate-800/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className="font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30"
                      >
                        {ticket.tracking_code}
                      </Link>
                      <PriorityBadge priority={ticket.priority} />
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      {ticket.department_name && (
                        <span className="text-slate-300 text-[11px] font-semibold bg-slate-800/90 border border-slate-700 px-2 py-0.5 rounded">
                          {ticket.department_name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white">{ticket.title}</h3>
                    <div className="text-[11px] text-slate-400">
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
                        className="px-3 py-1.5 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
                      >
                        ★ {hasRating ? `${ticket.feedback_rating}/5` : 'Rate'}
                      </button>
                    )}

                    <Link
                      to={`/track?code=${ticket.tracking_code}`}
                      className="px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsResidenceModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[#0e1624] p-6 shadow-2xl space-y-4 border border-slate-800 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Select Your Hostel &amp; Room</h3>
              <button
                type="button"
                onClick={() => setIsResidenceModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
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
                        active ? 'border-emerald-500 bg-emerald-500/15' : 'border-slate-800 bg-[#090f1a]'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{h.shortName}</div>
                      <div className="text-[10px] text-slate-400">{h.type}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Floor</label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(e.target.value)}
                    className="enterprise-input text-xs"
                  >
                    {HOSTEL_FLOORS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Wing</label>
                  <select
                    value={selectedWing}
                    onChange={(e) => setSelectedWing(e.target.value)}
                    className="enterprise-input text-xs"
                  >
                    {HOSTEL_WINGS.slice(0, 2).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Room Number</label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => {
                      setSelectedRoom(e.target.value);
                      setCustomRoomInput('');
                    }}
                    className="enterprise-input text-xs"
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
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Or Custom Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Wing B, Room 312"
                    value={customRoomInput}
                    onChange={(e) => setCustomRoomInput(e.target.value)}
                    className="enterprise-input text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResidenceModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResidence}
                  className="px-5 py-2 text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setSelectedTicketForFeedback(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#0e1624] p-6 shadow-2xl space-y-4 border border-slate-800 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-white">
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
                    <span className={(ratingHover || ratingScore) >= star ? 'text-amber-400' : 'text-slate-700'}>
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
                className="enterprise-input resize-none"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForFeedback(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="px-5 py-2 text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl"
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
