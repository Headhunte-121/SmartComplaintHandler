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
        return 'bg-[#A7AD89]/10 text-[#FAF7F2] border-[#A7AD89]/25';
      case 'ASSIGNED':
        return 'bg-[#B69B86]/20 text-[#DAD0C6] border-[#B69B86]/35';
      case 'IN_PROGRESS':
        return 'bg-[#8C906D]/20 text-[#FAF7F2] border-[#8C906D]/35';
      case 'ESCALATED':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'RESOLVED':
        return 'bg-[#A7AD89]/20 text-[#A7AD89] border-[#A7AD89]/40';
      default:
        return 'bg-[#0F1A14] text-[#DAD0C6]/70 border-[rgba(218,208,198,0.1)]';
    }
  };

  const currentHostelLabel = activeUser?.hostel_name || hostelsList[0]?.name || 'Ramanujan House';
  const currentRoomLabel = activeUser?.room_number || 'Room 204';

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Dark Student Profile & Residence Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0F1A14] via-[#14221B] to-[#0F1A14] text-[#FAF7F2] p-6 sm:p-7 shadow-xl border border-[rgba(167,173,137,0.25)] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-[#A7AD89]/15 border border-[#A7AD89]/30 flex items-center justify-center text-2xl shrink-0">
            {activeUser?.avatar || '🎓'}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#FAF7F2]">
                {activeUser?.name}
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#A7AD89]/20 border border-[#A7AD89]/35 text-[#FAF7F2]">
                {activeUser?.identifier}
              </span>
            </div>
            <p className="text-xs text-[#DAD0C6]/80">{activeUser?.department}</p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-[#8C906D]/20 border border-[#8C906D]/35 text-[#FAF7F2] text-xs font-semibold">
                <span>🏠 {currentHostelLabel.split(' (')[0]}</span>
                <span>·</span>
                <span className="font-mono text-[#FAF7F2]">{currentRoomLabel}</span>
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
            className="p-2.5 rounded-xl bg-[#0A120E] hover:bg-white/[0.08] border border-[rgba(218,208,198,0.12)] text-[#DAD0C6] transition-all cursor-pointer"
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
        <div className="bento-card p-5 border-l-4 border-l-[#D9824C] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C906D] block">
              Active Issues
            </span>
            <div className="text-3xl font-black text-[#FAF7F2] mt-1">{activeTickets.length}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#D9824C]/15 border border-[#D9824C]/30 flex items-center justify-center text-[#D9824C] text-lg font-bold">
            ⚡
          </div>
        </div>

        <div className="bento-card p-5 border-l-4 border-l-[#A7AD89] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C906D] block">
              Resolved
            </span>
            <div className="text-3xl font-black text-[#FAF7F2] mt-1">{resolvedTickets.length}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#A7AD89]/15 border border-[#A7AD89]/30 flex items-center justify-center text-[#A7AD89] text-lg font-bold">
            ✓
          </div>
        </div>

        <div className="bento-card p-5 border-l-4 border-l-[#B69B86] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C906D] block">
              Avg Rating
            </span>
            <div className="text-3xl font-black text-[#FAF7F2] mt-1">
              {avgSatisfaction ? `${avgSatisfaction} / 5` : '—'}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#B69B86]/15 border border-[#B69B86]/30 flex items-center justify-center text-[#B69B86] text-lg font-bold">
            ★
          </div>
        </div>
      </div>

      {/* Issues List Card */}
      <div className="bento-card overflow-hidden">
        <div className="p-5 border-b border-[rgba(167,173,137,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#14221B]/50">
          <h2 className="text-base font-black text-[#FAF7F2]">My Maintenance Requests</h2>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, room, title..."
              className="enterprise-input w-full sm:w-52"
            />

            <div className="flex items-center space-x-1 p-1 bg-[#0A120E] border border-[rgba(218,208,198,0.12)] rounded-xl">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer ${
                  activeTab === 'ALL' ? 'bg-[#A7AD89] text-[#0A110D] font-bold' : 'text-[#DAD0C6]/70 hover:text-[#FAF7F2]'
                }`}
              >
                All ({tickets.length})
              </button>
              <button
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer ${
                  activeTab === 'ACTIVE' ? 'bg-[#A7AD89] text-[#0A110D] font-bold' : 'text-[#DAD0C6]/70 hover:text-[#FAF7F2]'
                }`}
              >
                Active ({activeTickets.length})
              </button>
              <button
                onClick={() => setActiveTab('RESOLVED')}
                className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer ${
                  activeTab === 'RESOLVED' ? 'bg-[#A7AD89] text-[#0A110D] font-bold' : 'text-[#DAD0C6]/70 hover:text-[#FAF7F2]'
                }`}
              >
                Resolved ({resolvedTickets.length})
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[#DAD0C6]/60">Loading requests...</div>
        ) : displayedTickets.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-xs text-[#DAD0C6]/70">No maintenance requests found.</p>
            <Link
              to="/submit"
              className="btn-botanical-primary"
            >
              + Submit Issue
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(167,173,137,0.1)]">
            {displayedTickets.map((ticket) => {
              const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
              const hasRating = ticket.feedback_rating != null;

              return (
                <div
                  key={ticket.id || ticket.tracking_code}
                  className="p-5 hover:bg-[#14221B]/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className="font-mono font-bold text-[#A7AD89] bg-[#A7AD89]/15 px-2.5 py-0.5 rounded-lg border border-[#A7AD89]/35"
                      >
                        {ticket.tracking_code}
                      </Link>
                      <PriorityBadge priority={ticket.priority} />
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      {ticket.department_name && (
                        <span className="text-[#DAD0C6] text-[11px] font-semibold bg-[#0F1A14] border border-[rgba(218,208,198,0.12)] px-2 py-0.5 rounded">
                          {ticket.department_name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[#FAF7F2]">{ticket.title}</h3>
                    <div className="text-[11px] text-[#DAD0C6]/70">
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
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#8F755E]/30 hover:bg-[#8F755E]/50 border border-[#8F755E]/50 text-[#DAD0C6] cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsResidenceModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[#0F1A14] p-6 shadow-2xl space-y-4 border border-[rgba(167,173,137,0.25)] text-[#DAD0C6]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[rgba(167,173,137,0.15)] pb-3">
              <h3 className="text-base font-black text-[#FAF7F2]">Select Your Hostel &amp; Room</h3>
              <button
                type="button"
                onClick={() => setIsResidenceModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-[#DAD0C6] font-bold text-xs cursor-pointer flex items-center justify-center"
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
                          ? 'border-[#A7AD89] bg-[#A7AD89]/15 shadow-sm'
                          : 'border-[rgba(218,208,198,0.1)] bg-[#0A120E] hover:border-[#A7AD89]/30'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#FAF7F2]">{h.shortName}</div>
                      <div className="text-[10px] text-[#DAD0C6]/70">{h.type}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#DAD0C6] mb-1">Floor</label>
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
                  <label className="block text-xs font-bold text-[#DAD0C6] mb-1">Room Number</label>
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
              </div>

              <div>
                <label className="block text-xs font-bold text-[#DAD0C6] mb-1">Or Custom Room / Spot</label>
                <input
                  type="text"
                  placeholder="e.g. Room 312 or Guest Suite"
                  value={customRoomInput}
                  onChange={(e) => setCustomRoomInput(e.target.value)}
                  className="enterprise-input text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[rgba(167,173,137,0.15)]">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedTicketForFeedback(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#0F1A14] p-6 shadow-2xl space-y-4 border border-[rgba(167,173,137,0.25)] text-[#DAD0C6]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-[#FAF7F2]">
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
                    <span className={(ratingHover || ratingScore) >= star ? 'text-[#D4A359]' : 'text-white/20'}>
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
