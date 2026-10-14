/**
 * SmartComplaintHandler - Minimal Student Dashboard (IIIT Naya Raipur)
 * Aesthetic: Clean Linear-style issue list with inline Hostel/Room editor modal.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchComplaints, submitFeedback } from '../api/complaints';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';
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

  // Residence Modal
  const [isResidenceModalOpen, setIsResidenceModalOpen] = useState(false);
  const hostelsList = useMemo(() => getHostelBuildings(allBuildings), [allBuildings]);
  const [selectedHostel, setSelectedHostel] = useState(
    activeUser?.hostel_name || hostelsList[0]?.name || 'Ramanujan House (Boys Hostel)'
  );
  const [selectedFloor, setSelectedFloor] = useState('2');
  const [selectedRoom, setSelectedRoom] = useState(activeUser?.room_number || 'Wing A, Room 204');
  const [savingResidence, setSavingResidence] = useState(false);

  // Feedback Modal
  const [selectedTicketForFeedback, setSelectedTicketForFeedback] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const studentEmail = activeUser?.email || 'nikhil26100@iiitnr.edu.in';

  useEffect(() => {
    const sync = () => setAllBuildings(getCampusBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
  }, []);

  const availableRooms = useMemo(
    () => getRoomsForBuilding(selectedHostel, selectedFloor, 'Wing A', allBuildings),
    [selectedHostel, selectedFloor, allBuildings]
  );

  const loadStudentTickets = async () => {
    setLoading(true);
    try {
      const data = await fetchComplaints({ student_email: studentEmail, limit: 100 });
      setTickets(data);
    } catch (_) {
      setTickets([]);
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
    try {
      await updateProfile({
        hostel_name: selectedHostel,
        room_number: selectedRoom,
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

  const currentHostelLabel = activeUser?.hostel_name || hostelsList[0]?.name || 'Ramanujan House';
  const currentRoomLabel = activeUser?.room_number || 'Wing A, Room 204';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Minimal Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
              {activeUser?.name}
            </h1>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{activeUser?.identifier}</span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-600">
              🏠 {currentHostelLabel.split(' (')[0]} · <strong className="font-medium text-slate-900">{currentRoomLabel}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsResidenceModalOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              Change room
            </button>
          </div>
        </div>

        <Link
          to="/submit"
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
        >
          + New Request
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-slate-200/60 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            All ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'ACTIVE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Active ({activeTickets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'RESOLVED' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Resolved ({resolvedTickets.length})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search requests..."
          className="enterprise-input w-full sm:w-56"
        />
      </div>

      {/* Clean Minimal Issue List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading requests...</div>
        ) : displayedTickets.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <p className="text-xs text-slate-500">No maintenance requests found.</p>
            <Link
              to="/submit"
              className="inline-block text-xs font-medium text-indigo-600 hover:underline"
            >
              Submit a new request →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedTickets.map((ticket) => {
              const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
              return (
                <div
                  key={ticket.id || ticket.tracking_code}
                  className="p-4 sm:px-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className="font-mono font-medium text-indigo-600 hover:underline"
                      >
                        {ticket.tracking_code}
                      </Link>
                      <span className="text-slate-300">·</span>
                      <span className="font-medium text-slate-900 truncate">{ticket.title}</span>
                      <PriorityBadge priority={ticket.priority} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                      <span>{ticket.location}</span>
                      {ticket.assigned_team_name && (
                        <>
                          <span>·</span>
                          <span>{ticket.assigned_team_name}</span>
                        </>
                      )}
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
                        className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium cursor-pointer"
                      >
                        {ticket.feedback_rating ? `★ ${ticket.feedback_rating}/5` : '★ Rate'}
                      </button>
                    )}

                    <Link
                      to={`/track?code=${ticket.tracking_code}`}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Minimal Hostel & Room Modal */}
      {isResidenceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
          onClick={() => setIsResidenceModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-4 border border-slate-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Your Hostel &amp; Room</h3>
              <button
                type="button"
                onClick={() => setIsResidenceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResidence} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hostel</label>
                <select
                  value={selectedHostel}
                  onChange={(e) => setSelectedHostel(e.target.value)}
                  className="enterprise-input"
                >
                  {hostelsList.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name}
                    </option>
                  ))}
                  <option value="Day Scholar">Day Scholar</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Floor</label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(e.target.value)}
                    className="enterprise-input"
                  >
                    {HOSTEL_FLOORS.map((f) => (
                      <option key={f.id} value={f.id}>
                        Floor {f.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Room No.</label>
                  <input
                    type="text"
                    list="modal-room-list"
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="enterprise-input"
                  />
                  <datalist id="modal-room-list">
                    {availableRooms.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResidenceModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResidence}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium cursor-pointer"
                >
                  {savingResidence ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Minimal Rating Modal */}
      {selectedTicketForFeedback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
          onClick={() => setSelectedTicketForFeedback(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-4 border border-slate-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">
              Rate Resolution ({selectedTicketForFeedback.tracking_code})
            </h3>
            <form onSubmit={handleSubmitRating} className="space-y-3">
              <div className="flex justify-center space-x-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingScore(star)}
                    className={`text-2xl cursor-pointer ${
                      ratingScore >= star ? 'text-amber-400' : 'text-slate-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                placeholder="Optional feedback..."
                className="enterprise-input resize-none"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForFeedback(null)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
