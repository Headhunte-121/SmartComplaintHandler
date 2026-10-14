/**
 * SmartComplaintHandler - Student Self-Service Grievance Portal
 * Blueprint Reference: V1/M2/frontend & V1/M5/frontend/04_feedback_rating.md
 * Enhanced with mint/emerald contrast, space-optimized split architecture,
 * live campus utility telemetry, fast-lodge shortcuts, and contractual SLA telemetry.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchComplaints, submitFeedback } from '../api/complaints';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';
import {
  GraduationCap,
  Building2,
  MapPin,
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Star,
  Plus,
  RotateCw,
  Search,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  X,
  Sparkles,
  ArrowRight,
  Calendar,
  Zap,
  Droplets,
  Wifi,
  Phone,
  Shield,
  Info,
  ChevronRight
} from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { currentPersona, currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'ACTIVE', 'IN_PROGRESS', 'RESOLVED'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Rating Modal State
  const [selectedTicketForFeedback, setSelectedTicketForFeedback] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingHover, setRatingHover] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);

  const studentEmail = currentPersona?.email || currentUser?.email || 'nikhil26100@iiitnr.edu.in';
  const studentName = currentPersona?.name || currentUser?.full_name || 'Nikhil (Student)';
  const rollNumber = currentPersona?.identifier || currentUser?.roll_number || '2024CSE100';
  const department = currentPersona?.department || 'Computer Science & Engineering';
  const location = currentPersona?.location || 'Hostel Block B, Room 204';

  const loadStudentTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints({ student_email: studentEmail, limit: 100 });
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load student complaints:', err);
      try {
        const allData = await fetchComplaints({ limit: 100 });
        if (Array.isArray(allData)) {
          const filtered = allData.filter(
            (t) =>
              (t.student_email && t.student_email.toLowerCase() === studentEmail.toLowerCase()) ||
              (t.student_name && t.student_name.toLowerCase() === (currentPersona?.name || '').toLowerCase())
          );
          setTickets(filtered);
        } else {
          setTickets([]);
        }
      } catch (fallbackErr) {
        setError('Unable to retrieve grievance records. Please verify connection to campus backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentTickets();
  }, [studentEmail]);

  // Derived subsets
  const activeTickets = useMemo(() => {
    return tickets.filter(
      (t) => t.status === 'SUBMITTED' || t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'ESCALATED'
    );
  }, [tickets]);

  const inProgressTickets = useMemo(() => {
    return tickets.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'ESCALATED');
  }, [tickets]);

  const resolvedTickets = useMemo(() => {
    return tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
  }, [tickets]);

  const ratedTickets = useMemo(() => {
    return tickets.filter((t) => t.feedback_rating != null);
  }, [tickets]);

  const avgSatisfaction = useMemo(() => {
    if (ratedTickets.length === 0) return null;
    const sum = ratedTickets.reduce((acc, t) => acc + Number(t.feedback_rating), 0);
    return (sum / ratedTickets.length).toFixed(1);
  }, [ratedTickets]);

  // Filtered tickets based on search and tab
  const filteredTickets = useMemo(() => {
    let result = tickets;

    if (activeTab === 'ACTIVE') {
      result = activeTickets;
    } else if (activeTab === 'IN_PROGRESS') {
      result = inProgressTickets;
    } else if (activeTab === 'RESOLVED') {
      result = resolvedTickets;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          (t.tracking_code && t.tracking_code.toLowerCase().includes(q)) ||
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.location && t.location.toLowerCase().includes(q))
      );
    }

    return result;
  }, [tickets, activeTab, searchQuery, activeTickets, inProgressTickets, resolvedTickets]);

  const handleCopyCode = (code, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

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
        studentName
      );

      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );

      setFeedbackSuccess(`Thank you! Your feedback for ticket ${selectedTicketForFeedback.tracking_code} has been registered.`);
      setTimeout(() => {
        handleCloseFeedback();
      }, 1400);
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return {
          pill: 'bg-sky-50 text-sky-700 border-sky-200/80',
          dot: 'bg-sky-500',
          label: 'In Intake Queue'
        };
      case 'ASSIGNED':
        return {
          pill: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 font-medium',
          dot: 'bg-indigo-500',
          label: 'Squad Assigned'
        };
      case 'IN_PROGRESS':
        return {
          pill: 'bg-amber-50 text-amber-700 border-amber-200/80 font-medium',
          dot: 'bg-amber-500 animate-pulse',
          label: 'Repair In Progress'
        };
      case 'ESCALATED':
        return {
          pill: 'bg-rose-50 text-rose-700 border-rose-200/80 font-semibold',
          dot: 'bg-rose-500 animate-ping',
          label: 'Escalated to Officer'
        };
      case 'RESOLVED':
        return {
          pill: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
          dot: 'bg-emerald-500',
          label: 'Resolved & Restored'
        };
      case 'CLOSED':
        return {
          pill: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          label: 'Audit Closed'
        };
      default:
        return {
          pill: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          label: status
        };
    }
  };

  const starLabels = {
    1: '1/5 - Unsatisfactory (Issues persist)',
    2: '2/5 - Needs Improvement (Partial fix)',
    3: '3/5 - Acceptable (Standard resolution)',
    4: '4/5 - Good Quality (Prompt & clean fix)',
    5: '5/5 - Outstanding Service (Exceeded SLA)'
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Student Identity Hero Banner with Mint/Emerald Accent */}
      <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 sm:p-6 shadow-xs relative overflow-hidden bg-gradient-to-r from-emerald-50/40 via-white to-teal-50/30">
        {/* Top vibrant accent strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pt-1">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs shrink-0">
              <GraduationCap className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {studentName}
                </h1>
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>IIIT-NR Verified Student</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                <span className="text-slate-800 font-semibold">{rollNumber}</span>
                <span>•</span>
                <span>{department}</span>
                <span>•</span>
                <span className="text-slate-600 font-mono text-[11px]">{studentEmail}</span>
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-slate-700 pt-0.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Primary Campus Quarters: <strong className="text-slate-900">{location}</strong></span>
              </div>
            </div>
          </div>

          {/* Action CTAs with Emerald Gradient */}
          <div className="flex items-center space-x-3 shrink-0 pt-2 md:pt-0">
            <button
              onClick={loadStudentTickets}
              disabled={loading}
              title="Refresh grievance history"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors text-xs flex items-center justify-center disabled:opacity-50 bg-white"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <Link
              to="/submit"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Lodge New Grievance</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. High-Contrast Key Metrics Telemetry Grid (Distinct Tinted Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Grievances */}
        <div className="bg-amber-50/70 rounded-xl border border-amber-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Active Grievances</div>
            <div className="text-2xl font-black text-amber-950">{activeTickets.length}</div>
            <div className="text-[11px] text-amber-700/80 font-medium">Under triage or repair</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100/90 border border-amber-300/80 flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Squad Dispatched */}
        <div className="bg-sky-50/70 rounded-xl border border-sky-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-sky-800 uppercase tracking-wider">In Progress</div>
            <div className="text-2xl font-black text-sky-950">{inProgressTickets.length}</div>
            <div className="text-[11px] text-sky-700/80 font-medium">Technician on-site</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-100/90 border border-sky-300/80 flex items-center justify-center text-sky-700">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        {/* Resolved & Verified (Hero Mint Accent) */}
        <div className="bg-emerald-50 rounded-xl border border-emerald-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Resolved & Closed</div>
            <div className="text-2xl font-black text-emerald-950">{resolvedTickets.length}</div>
            <div className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Repaired & verified</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100/90 border border-emerald-300/80 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Student Satisfaction */}
        <div className="bg-yellow-50/60 rounded-xl border border-yellow-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-yellow-800 uppercase tracking-wider">Satisfaction Rating</div>
            <div className="text-2xl font-black text-yellow-950">
              {avgSatisfaction ? `${avgSatisfaction} ★` : '—'}
            </div>
            <div className="text-[11px] text-yellow-700/80 font-medium">
              {ratedTickets.length > 0 ? `${ratedTickets.length} reviews registered` : 'Awaiting feedback'}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-yellow-100/90 border border-yellow-300/80 flex items-center justify-center text-yellow-700">
            <Star className="w-5 h-5 fill-yellow-500" />
          </div>
        </div>
      </div>

      {/* 3. Space-Optimized 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Grievance Audit History & Quick Triage Launcher */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Section Header with Tabs & Search */}
            <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                    <span>Grievance Audit History</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time contractual SLA timers, automated supervisor routing, and closed-loop service ratings.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto border border-slate-200/80">
                  <button
                    onClick={() => setActiveTab('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({tickets.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('ACTIVE')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'ACTIVE'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Active ({activeTickets.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('IN_PROGRESS')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'IN_PROGRESS'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    In Progress ({inProgressTickets.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('RESOLVED')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'RESOLVED'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Resolved ({resolvedTickets.length})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ticket title, code (e.g. ELEC-...), category, or location..."
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Body */}
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium text-slate-500">Retrieving grievance records from campus database...</p>
              </div>
            ) : error ? (
              <div className="py-14 text-center space-y-3 px-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-rose-700">{error}</p>
                <button
                  onClick={loadStudentTickets}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Retry Connection
                </button>
              </div>
            ) : filteredTickets.length === 0 ? (
              /* Enhanced Empty State + Fast-Lodge Launcher (Eliminates Empty Space!) */
              <div className="p-6 space-y-5">
                <div className="bg-emerald-50/60 rounded-xl border border-emerald-200/80 p-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {searchQuery ? 'No matching grievances found' : 'All Clear! No Pending Issues in Your Quarters'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {searchQuery
                          ? 'Try clearing the search query or filtering by another status tab.'
                          : 'Your registered hostel quarters and academic facilities have zero pending complaint tickets.'}
                      </p>
                    </div>
                  </div>

                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all shrink-0"
                    >
                      Clear Search
                    </button>
                  ) : (
                    <Link
                      to="/submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
                    >
                      Lodge Complaint
                    </Link>
                  )}
                </div>

                {/* Fast-Lodge Shortcut Tiles */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600">
                      Frequently Reported Campus Issues (Fast-Track)
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold">1-Click Auto-Triage</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                      to="/submit?category=electrical&title=Room%20fan%20or%20tube-light%20malfunction"
                      className="p-3.5 rounded-xl border border-slate-200/80 hover:border-amber-300 bg-white hover:bg-amber-50/30 transition-all group flex items-start space-x-3 shadow-2xs"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 group-hover:text-amber-900 flex items-center justify-between">
                          <span>Room Fan / Light Fault</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 transition-colors" />
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          Ceiling fan, tube light, switchboard, socket
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/submit?category=plumbing&title=Hostel%20washroom%20tap%20or%20cooler%20leak"
                      className="p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 bg-white hover:bg-blue-50/30 transition-all group flex items-start space-x-3 shadow-2xs"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-900 flex items-center justify-between">
                          <span>Plumbing & Water Cooler</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          Water leak, RO cooler, tap faucet, flush
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/submit?category=network&title=Hostel%20room%20Wi-Fi%20or%20LAN%20connectivity%20drop"
                      className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 bg-white hover:bg-indigo-50/30 transition-all group flex items-start space-x-3 shadow-2xs"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Wifi className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 flex items-center justify-between">
                          <span>Wi-Fi & LAN Network Drop</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          Hostel AP offline, slow speeds, RJ45 port
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/submit?category=carpentry&title=Hostel%20study%20table%20or%20door%20lock%20repair"
                      className="p-3.5 rounded-xl border border-slate-200/80 hover:border-amber-400 bg-white hover:bg-amber-50/30 transition-all group flex items-start space-x-3 shadow-2xs"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 group-hover:text-amber-900 flex items-center justify-between">
                          <span>Furniture & Door Lock</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 transition-colors" />
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          Cot latch, study table, cupboard, lock
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Ticket Records List */
              <div className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => {
                  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
                  const hasRating = ticket.feedback_rating != null;
                  const statusCfg = getStatusBadge(ticket.status);

                  return (
                    <div
                      key={ticket.id || ticket.tracking_code}
                      className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                    >
                      <div className="space-y-2.5 flex-1 min-w-0">
                        {/* Top Metadata Badges */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {/* Tracking Code Chip with Copy */}
                          <div className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 text-[11px] font-mono font-bold transition-colors">
                            <span>{ticket.tracking_code}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(ticket.tracking_code, e)}
                              title="Copy tracking code"
                              className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                            >
                              {copiedCode === ticket.tracking_code ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          <PriorityBadge priority={ticket.priority} size="sm" />

                          {/* Status Pill */}
                          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[10px] ${statusCfg.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            <span>{statusCfg.label}</span>
                          </span>

                          {/* Category Tag */}
                          {ticket.category && (
                            <span className="text-slate-600 text-[11px] font-semibold bg-slate-100/90 border border-slate-200/60 px-2 py-0.5 rounded-md">
                              {ticket.category}
                            </span>
                          )}

                          {/* Assigned Squad */}
                          {ticket.assigned_team_name && (
                            <span className="text-slate-500 text-[11px] font-medium flex items-center space-x-1">
                              <Wrench className="w-3 h-3 text-slate-400" />
                              <span>Squad:</span>
                              <strong className="text-slate-700">{ticket.assigned_team_name}</strong>
                            </span>
                          )}
                        </div>

                        {/* Ticket Title & Description */}
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                            {ticket.title}
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                            {ticket.description}
                          </p>
                        </div>

                        {/* Location & Logged Date */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-400">
                          <span className="flex items-center space-x-1 text-slate-500 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{ticket.location}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1 text-slate-500">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              Reported: {ticket.created_at ? new Date(ticket.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </span>
                          </span>
                        </div>

                        {/* Student Feedback Quote if available */}
                        {hasRating && (
                          <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs flex items-start space-x-2">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <div className="font-bold text-amber-900 flex items-center space-x-2 text-[11px]">
                                <span>Rated {ticket.feedback_rating} out of 5 stars</span>
                                <span className="text-[10px] text-amber-700/80 font-normal">
                                  (Submitted by you)
                                </span>
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

                      {/* Right Side: SLA Countdown Clock & Rating Button */}
                      <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {!isResolved ? (
                          <div className="space-y-1 text-left sm:text-right">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                              Contractual SLA Target
                            </span>
                            <SLACountdownTimer
                              slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                              priority={ticket.priority}
                              status={ticket.status}
                            />
                          </div>
                        ) : (
                          <div className="space-y-1 text-left sm:text-right">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Resolution Verified</span>
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {ticket.resolved_at
                                ? new Date(ticket.resolved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'Closed'}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                          <Link
                            to={`/track?code=${ticket.tracking_code}`}
                            className="inline-flex items-center space-x-1 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
                          >
                            <span>Audit Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>

                          {isResolved && (
                            <button
                              type="button"
                              onClick={() => handleOpenFeedback(ticket)}
                              className={`inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                hasRating
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80'
                                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                              }`}
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{hasRating ? 'Edit Review' : 'Rate Service'}</span>
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
        </div>

        {/* Right Column (4 cols): Campus Facility Telemetry, SLA Guarantees, & Helpdesk */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Live Campus Facility & Utility Status (Mint/Emerald Contrast Widget) */}
          <div className="bg-white rounded-2xl border border-emerald-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Campus Facility Health
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                All Systems Normal
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">33kV Campus Substation</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Active (230V)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">RO Water & Overheads</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Normal Flow
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Wifi className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium">Wi-Fi 6 Academic Mesh</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  1 Gbps Low Latency
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">Hostel Water Heaters</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Scheduled (6-9 AM)
                </span>
              </div>
            </div>
          </div>

          {/* 2. Institutional Turnaround Commitments (Binding SLAs) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Shield className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Binding SLA Commitments
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/70">
                <div className="space-y-0.5">
                  <div className="font-bold text-rose-900">Critical Hazard</div>
                  <div className="text-[10px] text-rose-700">Gas, lift, major water rupture</div>
                </div>
                <span className="font-black text-rose-700 text-xs font-mono">&lt; 4 Hours</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                <div className="space-y-0.5">
                  <div className="font-bold text-amber-900">High Urgency</div>
                  <div className="text-[10px] text-amber-700">Room fan, cooler fault, lab PC</div>
                </div>
                <span className="font-black text-amber-700 text-xs font-mono">&lt; 12 Hours</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70">
                <div className="space-y-0.5">
                  <div className="font-bold text-blue-900">Routine Maintenance</div>
                  <div className="text-[10px] text-blue-700">Carpentry, painting, latch</div>
                </div>
                <span className="font-black text-blue-700 text-xs font-mono">&lt; 24 Hours</span>
              </div>
            </div>
          </div>

          {/* 3. Caretaker & Maintenance Helpdesk */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
              <Phone className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Campus Maintenance Desk
              </h3>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between items-center py-1 border-b border-slate-100/70">
                <span className="text-slate-500">Block B Caretaker:</span>
                <strong className="text-slate-800">Mr. Ramesh (Ext 2041)</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100/70">
                <span className="text-slate-500">Emergency Desk:</span>
                <strong className="text-slate-800 font-mono">+91 771 247 4000</strong>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Desk Hours:</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                  8:00 AM - 8:00 PM
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Closed-Loop Student Satisfaction Rating Modal */}
      {selectedTicketForFeedback && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={handleCloseFeedback}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-7 shadow-xl space-y-5 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Rate Campus Repair Service
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Ticket <strong className="font-mono text-slate-700">{selectedTicketForFeedback.tracking_code}</strong>: {selectedTicketForFeedback.title}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseFeedback}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="py-8 text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Feedback Successfully Registered!
                </h4>
                <p className="text-xs text-slate-500">{feedbackSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} className="space-y-5">
                {/* 5-Star Interactive Rating Selector */}
                <div className="space-y-2 text-center py-2 bg-slate-50/60 rounded-xl p-4 border border-slate-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    How satisfied are you with the repairs?
                  </label>
                  <div className="flex items-center justify-center space-x-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingScore(star)}
                        onMouseEnter={() => setRatingHover(star)}
                        onMouseLeave={() => setRatingHover(0)}
                        className="p-1 transition-transform hover:scale-115 focus:outline-hidden"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            (ratingHover || ratingScore) >= star
                              ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="text-xs font-bold text-amber-700 h-4">
                    {starLabels[ratingHover || ratingScore]}
                  </div>
                </div>

                {/* Review Comments */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Technician Feedback & Comments (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder="e.g. Technician arrived within SLA timeframe, replaced the faulty fixture, and left the room tidy..."
                    className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    Your closed-loop rating is recorded in the institutional audit trail to ensure vendor SLA accountability.
                  </p>
                </div>

                {/* Modal Buttons */}
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
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-60 flex items-center space-x-2"
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Service Review</span>
                    )}
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
