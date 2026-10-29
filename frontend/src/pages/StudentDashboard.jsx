/**
 * SmartComplaintHandler - Student Portal & Request History Workstation
 * Glossy Obsidian Command Desk Standard with Smoked Black Glass
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchComplaints, submitFeedback } from '../api/complaints';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import DepartmentBadge from '../components/DepartmentBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';
import CampusMapSelector from '../components/CampusMapSelector';
import SetPasswordModal from '../components/SetPasswordModal';
import {
  GraduationCap, Home, MapPin, KeyRound, Compass, Plus,
  RefreshCw, Search, Star, AlertTriangle, CheckCircle2,
  Clock, ArrowRight, X, Layers, Inbox,
} from 'lucide-react';
import {
  IIITNR_MAP_UPDATED_EVENT,
  getCampusBuildings,
  getHostelBuildings,
  getFloorsForBuilding,
  getRoomsForBuilding,
  inferFloorFromItem,
} from '../data/iiitnrCampusData';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { currentUser, updateProfile } = useAuth();
  const activeUser = currentUser;

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
  const [selectedFloor, setSelectedFloor] = useState(() => {
    return inferFloorFromItem(activeUser?.room_number) || '2';
  });
  const [selectedRoom, setSelectedRoom] = useState(activeUser?.room_number || '');
  const [customRoomInput, setCustomRoomInput] = useState('');
  const [savingResidence, setSavingResidence] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [selectedTicketForFeedback, setSelectedTicketForFeedback] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingHover, setRatingHover] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const studentEmail = activeUser?.email || null;

  useEffect(() => {
    const sync = () => setAllBuildings(getCampusBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
  }, []);

  const availableFloors = useMemo(
    () => getFloorsForBuilding(selectedHostel, allBuildings),
    [selectedHostel, allBuildings]
  );

  const availableRooms = useMemo(
    () => getRoomsForBuilding(selectedHostel, selectedFloor, null, allBuildings),
    [selectedHostel, selectedFloor, allBuildings]
  );

  const filteredRooms = useMemo(() => {
    const onlyRooms = availableRooms.filter((r) => r.includes('Room') || r.includes('Suite'));
    return onlyRooms.length > 0 ? onlyRooms : availableRooms;
  }, [availableRooms]);

  const handleSelectHostel = (newHostelName) => {
    setSelectedHostel(newHostelName);
    setCustomRoomInput('');
    const targetFloors = getFloorsForBuilding(newHostelName, allBuildings);
    const validFloorIds = targetFloors.map((f) => String(f.id));
    const nextFloor = validFloorIds.includes(String(selectedFloor))
      ? selectedFloor
      : (targetFloors[0]?.id || '1');
    setSelectedFloor(nextFloor);
    const targetRooms = getRoomsForBuilding(newHostelName, nextFloor, null, allBuildings);
    const roomCandidates = targetRooms.filter((r) => r.includes('Room') || r.includes('Suite'));
    const finalRoomList = roomCandidates.length > 0 ? roomCandidates : targetRooms;
    if (finalRoomList.length > 0) {
      setSelectedRoom(finalRoomList[0]);
    } else {
      setSelectedRoom('');
    }
  };

  const handleSelectFloor = (newFloor) => {
    setSelectedFloor(newFloor);
    setCustomRoomInput('');
    const nextRooms = getRoomsForBuilding(selectedHostel, newFloor, null, allBuildings);
    const roomCandidates = nextRooms.filter((r) => r.includes('Room') || r.includes('Suite'));
    const finalRoomList = roomCandidates.length > 0 ? roomCandidates : nextRooms;
    if (finalRoomList.length > 0) {
      setSelectedRoom(finalRoomList[0]);
    } else {
      setSelectedRoom('');
    }
  };

  useEffect(() => {
    if (filteredRooms.length > 0 && !filteredRooms.includes(selectedRoom) && !customRoomInput) {
      setSelectedRoom(filteredRooms[0]);
    }
  }, [filteredRooms]);

  const loadStudentTickets = async () => {
    if (!studentEmail) {
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchComplaints({ student_email: studentEmail, limit: 100 });
      setTickets(Array.isArray(data) ? data : []);
    } catch (_) {
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
        return 'bg-white/10 text-white border-white/20';
      case 'ASSIGNED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'IN_PROGRESS':
        return 'bg-white/10 text-white border-white/20';
      case 'ESCALATED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-white/[0.04] text-zinc-400 border-white/[0.08]';
    }
  };

  const isDayScholar = activeUser?.hostel_name === 'Day Scholar (Off-Campus)';
  const currentHostelLabel = activeUser?.hostel_name
    ? (isDayScholar ? 'Day Scholar' : activeUser.hostel_name)
    : 'Residence Not Set';
  const displayBatch = useMemo(() => {
    const email = activeUser?.email || '';
    const match = email.match(/(\d{2})/);
    if (match) {
      const admissionYear = parseInt(match[1], 10);
      const gradYear = (admissionYear + 4) % 100;
      return `Batch '${gradYear < 10 ? '0' + gradYear : gradYear}`;
    }
    const id = activeUser?.identifier || '';
    const idMatch = id.match(/20(\d{2})/);
    if (idMatch) {
      const gradYear = (parseInt(idMatch[1], 10) + 4) % 100;
      return `Batch '${gradYear < 10 ? '0' + gradYear : gradYear}`;
    }
    return null;
  }, [activeUser?.email, activeUser?.identifier]);

  const currentRoomLabel = isDayScholar
    ? 'Off-Campus'
    : (activeUser?.room_number || 'Not Set');

  return (
    <div className="w-full min-h-screen bg-[#121317] text-zinc-100 font-sans antialiased selection:bg-[#ff5a36]/30 selection:text-white p-4 sm:p-6 lg:p-8 space-y-6 relative overflow-hidden">
      {/* Subtle Specular Ambient */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_60%_0%,rgba(255,90,50,0.035),transparent_60%)]" />

      {/* Header Profile Section */}
      <div className="relative z-10 p-6 sm:p-7 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#1b1d24] to-[#14151b] backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] overflow-hidden">
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent pointer-events-none" />

        <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner border border-white/[0.1] bg-white/[0.04] text-[#ff5a36]">
              <GraduationCap size={28} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border border-white/[0.1] bg-white/[0.04] text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Student Portal</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {activeUser?.name}
                </h1>
                {displayBatch && (
                  <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full border border-white/[0.1] bg-white/[0.04] text-zinc-200 tracking-wider">
                    {displayBatch}
                  </span>
                )}
                {activeUser?.department && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="text-xs font-mono text-zinc-400">{activeUser.department}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                Lodge and track campus repair requests with real-time technician triage.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-200">
                  <Home size={13} className="text-emerald-400" />
                  <span>{currentHostelLabel.split(' (')[0]}</span>
                  <span className="text-emerald-500/60">·</span>
                  <span className="font-mono font-bold text-white">{currentRoomLabel}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsResidenceModalOpen(true)}
                  className="px-3 py-1 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  {activeUser?.hostel_name ? 'Change Room' : 'Set Room'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCampusMap((prev) => !prev)}
                  className="px-3 py-1 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Compass size={13} />
                  <span>{showCampusMap ? 'Hide Map' : 'Campus Map'}</span>
                </button>
                {(!activeUser?.has_password || activeUser?.auth_provider === 'google') && (
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="px-3 py-1 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <KeyRound size={13} />
                    <span>Set Password</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <Link
              to="/submit"
              className="px-4 py-2.5 rounded-xl bg-[#ff5722] hover:bg-[#f4511e] text-white font-medium text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} />
              <span>Submit Issue</span>
            </Link>
            <button
              onClick={loadStudentTickets}
              className="p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs"
              title="Refresh telemetry"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Digital Twin Campus Map Drawer */}
      {showCampusMap && (
        <div className="relative z-10 w-full rounded-2xl border border-white/[0.1] overflow-hidden bg-[#050608] shadow-2xl">
          <CampusMapSelector
            flush={true}
            selectedBuilding={currentHostelLabel}
            selectedRoom={currentRoomLabel}
            studentSavedHostel={currentHostelLabel}
            studentSavedRoom={currentRoomLabel}
            onSelectBuilding={(bName) => {
              handleSelectHostel(bName);
              setIsResidenceModalOpen(true);
            }}
            onConfirmLocation={(bName, rm) => {
              const params = new URLSearchParams();
              if (bName) params.set('building', bName);
              if (rm) params.set('room', rm);
              navigate(`/submit?${params.toString()}`);
            }}
          />
        </div>
      )}

      {/* Bento KPI Row (Clean, Restrained) */}
      <div className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Active Issues */}
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#14161f]/90 hover:border-white/[0.14] transition-all backdrop-blur-xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-400">Active Issues</span>
              <div className="text-2xl font-bold mt-1 text-white font-mono">{activeTickets.length}</div>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">Under squad triage</span>
            </div>
            <div className="w-9 h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-300 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
        </div>

        {/* Card 2: Resolved Cases */}
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#14161f]/90 hover:border-white/[0.14] transition-all backdrop-blur-xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-400">Resolved Cases</span>
              <div className="text-2xl font-bold mt-1 text-white font-mono">{resolvedTickets.length}</div>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">Completed & verified</span>
            </div>
            <div className="w-9 h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-300 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
        </div>

        {/* Card 3: Satisfaction Index */}
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#14161f]/90 hover:border-white/[0.14] transition-all backdrop-blur-xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-400">Satisfaction Index</span>
              <div className="text-2xl font-bold mt-1 text-white font-mono">
                {avgSatisfaction ? `${avgSatisfaction} / 5` : '5.0 / 5'}
              </div>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">Verified scholar ratings</span>
            </div>
            <div className="w-9 h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-300 flex items-center justify-center">
              <Star size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Issues List Card */}
      <div className="relative z-10 border border-white/[0.08] bg-gradient-to-b from-[#181a21] to-[#14151a] backdrop-blur-xl rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.07)]">
        <div className="p-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-black tracking-tight text-white">
            My Maintenance Requests
          </h2>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code, room, title..."
                className="w-full sm:w-60 px-3.5 py-2 pl-9 rounded-xl text-xs border border-white/[0.1] bg-[#050608] text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none transition-all"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
            </div>

            <div className="inline-flex items-center p-1 rounded-xl gap-1 border border-white/[0.1] bg-[#050608]">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-[inset_0_1px_0_0_rgba(52,211,153,0.2)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All ({tickets.length})
              </button>
              <button
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-all ${
                  activeTab === 'ACTIVE'
                    ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-[inset_0_1px_0_0_rgba(52,211,153,0.2)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Active ({activeTickets.length})
              </button>
              <button
                onClick={() => setActiveTab('RESOLVED')}
                className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-all ${
                  activeTab === 'RESOLVED'
                    ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-[inset_0_1px_0_0_rgba(52,211,153,0.2)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Resolved ({resolvedTickets.length})
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-zinc-500">
            Loading requests...
          </div>
        ) : displayedTickets.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl border border-white/[0.08] bg-[#050608] flex items-center justify-center mx-auto text-zinc-500">
              <Inbox size={22} />
            </div>
            <p className="text-xs text-zinc-400">No maintenance requests found.</p>
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_2px_12px_rgba(59,130,246,0.25)] border border-blue-400/30 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Submit Issue</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {displayedTickets.map((ticket) => {
              const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
              const hasRating = ticket.feedback_rating != null;

              return (
                <div
                  key={ticket.id || ticket.tracking_code}
                  className="p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-white/[0.02]"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className="font-mono font-bold px-2.5 py-0.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:text-blue-200 transition-colors"
                      >
                        {ticket.tracking_code}
                      </Link>
                      <PriorityBadge priority={ticket.priority} size="sm" dark={true} />
                      <StatusBadge status={ticket.status} size="sm" />
                      {ticket.department_name && (
                        <DepartmentBadge name={ticket.department_name} size="sm" />
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white hover:underline transition-colors">
                      {ticket.title}
                    </h3>
                    <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                      <MapPin size={12} className="text-blue-400" />
                      <span>{ticket.location}</span>
                      <span className="text-zinc-600">·</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0">
                    {!isResolved ? (
                      <SLACountdownTimer
                        slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                        priority={ticket.priority}
                        status={ticket.status}
                        resolvedAt={ticket.resolved_at}
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
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 cursor-pointer transition-colors"
                      >
                        ★ {hasRating ? `${ticket.feedback_rating}/5` : 'Rate'}
                      </button>
                    )}

                    <Link
                      to={`/track?code=${ticket.tracking_code}`}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsResidenceModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 sm:p-7 shadow-2xl space-y-4 border border-white/[0.14] bg-[#0c0d12]/95 text-zinc-100 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-black text-white">Select Your Hostel &amp; Room</h3>
              <button
                type="button"
                onClick={() => setIsResidenceModalOpen(false)}
                className="w-7 h-7 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center transition-colors border border-white/[0.1] bg-white/[0.04] text-zinc-400 hover:text-white"
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
                      onClick={() => handleSelectHostel(h.name)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-white/40 bg-white/[0.1] shadow-xs'
                          : 'border-white/[0.08] bg-[#07080c] hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">
                        {h.shortName}
                      </div>
                      <div className="text-[10px] text-zinc-400">{h.type}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Floor</label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => handleSelectFloor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs transition-all border border-white/[0.1] bg-[#050608] text-white focus:border-white/30"
                  >
                    {availableFloors.length > 0 ? (
                      availableFloors.map((f) => (
                        <option key={f.id} value={f.id} className="bg-[#050608] text-white">
                          {f.label}
                        </option>
                      ))
                    ) : (
                      <option value="1" className="bg-[#050608] text-white">
                        Floor 1
                      </option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Room Number</label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => {
                      setSelectedRoom(e.target.value);
                      setCustomRoomInput('');
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs transition-all border border-white/[0.1] bg-[#050608] text-white focus:border-white/30"
                  >
                    {filteredRooms.length > 0 ? (
                      filteredRooms.map((r) => (
                        <option key={r} value={r} className="bg-[#050608] text-white">
                          {r}
                        </option>
                      ))
                    ) : (
                      <option value="" className="bg-[#050608] text-white">
                        No rooms on this floor
                      </option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Or Custom Room / Spot</label>
                <input
                  type="text"
                  placeholder="e.g. Room 312 or Guest Suite"
                  value={customRoomInput}
                  onChange={(e) => setCustomRoomInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs transition-all border border-white/[0.1] bg-[#050608] text-white placeholder-zinc-500 focus:border-white/30"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsResidenceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResidence}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_2px_12px_rgba(59,130,246,0.25)] border border-blue-400/30 transition-all cursor-pointer disabled:opacity-50"
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
            className="w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl space-y-4 border border-white/[0.14] bg-[#0c0d12]/95 text-zinc-100 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

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
                    <span className={(ratingHover || ratingScore) >= star ? 'text-amber-400' : 'text-zinc-700'}>
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
                className="w-full p-3 rounded-xl text-xs resize-none transition-all border border-white/[0.1] bg-[#050608] text-white placeholder-zinc-500 focus:border-white/30"
              />
              <div className="flex justify-end space-x-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForFeedback(null)}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_2px_12px_rgba(59,130,246,0.25)] border border-blue-400/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SetPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
