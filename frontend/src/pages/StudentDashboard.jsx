/**
 * SmartComplaintHandler - Student Portal & Request History Workstation
 * Flush Edge-to-Edge Dark Command Twin Layout with Consistent Institutional Palette
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
        return 'bg-sky-950/80 text-sky-400 border-sky-800/80';
      case 'ASSIGNED':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
      case 'IN_PROGRESS':
        return 'bg-indigo-950/80 text-indigo-400 border-indigo-800/80';
      case 'ESCALATED':
        return 'bg-rose-950/80 text-rose-400 border-rose-800/80 animate-pulse';
      case 'RESOLVED':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const currentHostelLabel = activeUser?.hostel_name || hostelsList[0]?.name || 'Ramanujan House';
  const currentRoomLabel = activeUser?.room_number || 'Room 204';

  return (
    <div className="w-full bg-[#080C14] text-white min-h-screen flex flex-col space-y-0 animate-fade-in">
      {/* Flush Command Deck Student Profile Header */}
      <div className="w-full bg-[#0B0F19] border-b border-slate-800/80 px-4 sm:px-8 lg:px-12 py-8 relative overflow-hidden">
        {/* Ambient background glow auras */}
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center text-2xl shrink-0 shadow-lg">
              {activeUser?.avatar || '🎓'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                  {activeUser?.name}
                </h1>
                <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                  {activeUser?.identifier}
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400 font-medium">{activeUser?.department}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold">
                  <span>🏠 {currentHostelLabel.split(' (')[0]}</span>
                  <span className="text-slate-500">·</span>
                  <span className="font-mono text-emerald-400 font-bold">{currentRoomLabel}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsResidenceModalOpen(true)}
                  className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  ✏️ Change Room
                </button>
                <button
                  type="button"
                  onClick={() => setShowCampusMap((prev) => !prev)}
                  className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-emerald-800/80 text-emerald-400 text-xs font-bold transition-colors cursor-pointer"
                >
                  🗺️ {showCampusMap ? 'Hide Map' : 'Campus Map'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <Link
              to="/submit"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-600 text-white font-black text-xs shadow-md shadow-emerald-700/30 transition-all inline-flex items-center gap-2 cursor-pointer border border-emerald-500/50 hover:-translate-y-0.5 active:translate-y-0"
            >
              + Submit Issue
            </Link>
            <button
              onClick={loadStudentTickets}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs"
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Digital Twin Campus Map Drawer */}
      {showCampusMap && (
        <div className="w-full border-b border-slate-800">
          <CampusMapSelector
            flush={true}
            selectedBuilding={currentHostelLabel}
            selectedRoom={currentRoomLabel}
            studentSavedHostel={currentHostelLabel}
            studentSavedRoom={currentRoomLabel}
            onSelectBuilding={(bName) => {
              setSelectedHostel(bName);
              setIsResidenceModalOpen(true);
            }}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="w-full bg-[#080C14] px-4 sm:px-8 lg:px-12 py-10 space-y-8">
        {/* Bento KPI Row with Multi-Layer Depth */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 sm:p-6 bg-[#0B101D] border border-slate-800 shadow-2xl rounded-2xl relative overflow-hidden flex items-center justify-between text-white">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                Active Issues
              </span>
              <div className="text-3xl font-black text-white mt-1">{activeTickets.length}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/80 text-amber-400 flex items-center justify-center text-lg font-bold shadow-xs">
              ⚡
            </div>
          </div>

          <div className="p-5 sm:p-6 bg-[#0B101D] border border-slate-800 shadow-2xl rounded-2xl relative overflow-hidden flex items-center justify-between text-white">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                Resolved
              </span>
              <div className="text-3xl font-black text-white mt-1">{resolvedTickets.length}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center text-lg font-bold shadow-xs">
              ✓
            </div>
          </div>

          <div className="p-5 sm:p-6 bg-[#0B101D] border border-slate-800 shadow-2xl rounded-2xl relative overflow-hidden flex items-center justify-between text-white">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-indigo-500" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                Avg Satisfaction
              </span>
              <div className="text-3xl font-black text-white mt-1">
                {avgSatisfaction ? `${avgSatisfaction} / 5` : '—'}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-950/80 border border-sky-800/80 text-sky-400 flex items-center justify-center text-lg font-bold shadow-xs">
              ★
            </div>
          </div>
        </div>

        {/* Issues List Card */}
        <div className="bg-[#0B101D] border border-slate-800 shadow-2xl rounded-2xl overflow-hidden text-white relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />

          <div className="p-5 border-b border-slate-800/80 bg-[#0B0F19] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-black text-white tracking-tight">My Maintenance Requests</h2>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code, room, title..."
                className="w-full sm:w-60 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />

              <div className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl gap-1">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-all ${
                    activeTab === 'ALL'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white font-medium'
                  }`}
                >
                  All ({tickets.length})
                </button>
                <button
                  onClick={() => setActiveTab('ACTIVE')}
                  className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-all ${
                    activeTab === 'ACTIVE'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white font-medium'
                  }`}
                >
                  Active ({activeTickets.length})
                </button>
                <button
                  onClick={() => setActiveTab('RESOLVED')}
                  className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-all ${
                    activeTab === 'RESOLVED'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white font-medium'
                  }`}
                >
                  Resolved ({resolvedTickets.length})
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400 font-mono">Loading requests...</div>
          ) : displayedTickets.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
                📂
              </div>
              <p className="text-xs text-slate-400">No maintenance requests found.</p>
              <Link
                to="/submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
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
                    className="p-5 hover:bg-slate-900/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Link
                          to={`/track?code=${ticket.tracking_code}`}
                          className="font-mono font-bold text-emerald-400 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-700 hover:border-emerald-500 transition-colors"
                        >
                          {ticket.tracking_code}
                        </Link>
                        <PriorityBadge priority={ticket.priority} size="sm" dark={true} />
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold ${getStatusBadge(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        {ticket.department_name && (
                          <span className="text-slate-300 text-[11px] font-semibold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                            {ticket.department_name}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {ticket.title}
                      </h3>
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
                          dark={true}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicketForFeedback(ticket);
                            setRatingScore(ticket.feedback_rating || 5);
                            setFeedbackComments(ticket.feedback_comments || '');
                          }}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-950/80 hover:bg-amber-900/80 border border-amber-800 text-amber-300 cursor-pointer transition-colors"
                        >
                          ★ {hasRating ? `${ticket.feedback_rating}/5` : 'Rate'}
                        </button>
                      )}

                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 hover:text-white transition-colors"
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
      </div>

      {/* Hostel & Room Modal */}
      {isResidenceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsResidenceModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-[#0B101D] p-6 shadow-2xl space-y-4 border border-slate-800 text-white relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Select Your Hostel &amp; Room</h3>
              <button
                type="button"
                onClick={() => setIsResidenceModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs cursor-pointer flex items-center justify-center transition-colors border border-slate-800"
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
                          ? 'border-emerald-500 bg-emerald-950/60 shadow-xs'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{h.shortName}</div>
                      <div className="text-[10px] text-slate-400">{h.type}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Floor</label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-400 focus:outline-none"
                  >
                    {HOSTEL_FLOORS.map((f) => (
                      <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Room Number</label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => {
                      setSelectedRoom(e.target.value);
                      setCustomRoomInput('');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-400 focus:outline-none"
                  >
                    {availableRooms
                      .filter((r) => r.includes('Room') || r.includes('Suite'))
                      .map((r) => (
                        <option key={r} value={r} className="bg-slate-900 text-white">
                          {r}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Or Custom Room / Spot</label>
                <input
                  type="text"
                  placeholder="e.g. Room 312 or Guest Suite"
                  value={customRoomInput}
                  onChange={(e) => setCustomRoomInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResidenceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResidence}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedTicketForFeedback(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#0B101D] p-6 shadow-2xl space-y-4 border border-slate-800 text-white relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />

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
                placeholder="Optional comments regarding work order quality..."
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-emerald-400 focus:outline-none resize-none"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForFeedback(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
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
