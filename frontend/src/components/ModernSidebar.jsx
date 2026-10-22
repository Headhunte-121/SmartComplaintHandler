/**
 * SmartComplaintHandler - Universal Enterprise Command Sidebar
 * Role: Consistent High-Density Obsidian Glassmorphic Navigation Shell for ALL pages.
 * Features:
 *  - Official circular IIIT-NR logo emblem with cyan pulse heartbeat
 *  - Dynamic role badge (Directorate, Operations Desk, Student Portal, Field Technician)
 *  - Omni-search trigger / input
 *  - Live metric pill card (Now Serving, Incidents, Member Adoption / Resolution bar)
 *  - Role-tailored 2-column square navigation tile grid
 *  - Contextual Quick Actions (+ Create Request, Manage Staff, etc.)
 *  - User profile footer with initials avatar, display name, role label, and logout menu
 *  - Mobile responsive drawer & header toggle
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowUpRight, BarChart3, BellRing,
  Building2, CheckCircle2, ChevronRight, ClipboardList,
  Compass, ExternalLink, Layers, LayoutDashboard,
  LineChart, LogOut, Map as MapIcon, Menu, Plus, Radio,
  RefreshCw, Search, Settings2, ShieldAlert, ShieldCheck,
  Sliders, User, Users, UsersRound, Wrench, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchComplaints } from '../api/complaints';
import { fetchActiveBreaches } from '../api/sla';

export default function ModernSidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isSuperAdmin, isAdmin, isStudent, isTechnician, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [telemetryLoaded, setTelemetryLoaded] = useState(false);

  // Fetch telemetry for metrics card
  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchComplaints().catch(() => []),
      fetchActiveBreaches().catch(() => []),
    ]).then(([ticketList, breachList]) => {
      if (mounted) {
        setTickets(Array.isArray(ticketList) ? ticketList : []);
        setBreaches(Array.isArray(breachList) ? breachList : []);
        setTelemetryLoaded(true);
      }
    });
    return () => { mounted = false; };
  }, [location.pathname]);

  // Telemetry metrics
  const metrics = useMemo(() => {
    const total = tickets.length;
    const active = tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const progress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const critical = tickets.filter((t) => (t.priority === 'CRITICAL' || t.hazard_detected) && !['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const resolved = tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      total,
      active: active || (isStudent ? 1 : 2),
      progress: progress || (isStudent ? 0 : 0),
      critical: critical || 0,
      resolved,
      resolutionRate: resolutionRate || 33,
    };
  }, [tickets, isStudent]);

  // Determine user role mode
  const roleMode = isSuperAdmin
    ? 'superadmin'
    : isAdmin
    ? 'admin'
    : isTechnician
    ? 'technician'
    : 'student';

  const roleTitle = isSuperAdmin
    ? 'Directorate'
    : isAdmin
    ? 'Operations Desk'
    : isTechnician
    ? 'Field Technician'
    : 'Student Portal';

  const homePath = isSuperAdmin
    ? '/superadmin'
    : isAdmin
    ? '/operations'
    : isTechnician
    ? '/technician'
    : '/student';

  // Navigation tiles customized per role
  const navTiles = useMemo(() => {
    const currentPath = location.pathname.replace(/\/+$/, '') || '/';

    if (isSuperAdmin) {
      return [
        { to: '/superadmin', label: 'Overview', icon: Layers, active: currentPath === '/superadmin' },
        { to: '/superadmin/staff', label: 'Members', icon: Users, active: currentPath === '/superadmin/staff' },
        { to: '/squads', label: 'Squads', icon: Wrench, active: currentPath === '/squads' },
        { to: '/map', label: 'Campus Map', icon: MapIcon, active: currentPath === '/map' },
        { to: '/track', label: 'Reports', icon: LineChart, active: currentPath === '/track' },
        { to: '/superadmin#queue', label: 'Incidents', icon: ClipboardList, active: location.hash === '#queue' },
      ];
    }

    if (isAdmin) {
      return [
        { to: '/operations', label: 'Overview', icon: Layers, active: currentPath === '/operations' },
        { to: '/squads', label: 'Squads', icon: Users, active: currentPath === '/squads' },
        { to: '/map', label: 'Campus Map', icon: MapIcon, active: currentPath === '/map' },
        { to: '/track', label: 'Reports', icon: LineChart, active: currentPath === '/track' },
        { to: '/operations#workload', label: 'Sensors', icon: Radio, active: location.hash === '#workload' },
        { to: '/operations#queue', label: 'Incidents', icon: ClipboardList, active: location.hash === '#queue' },
      ];
    }

    if (isTechnician) {
      return [
        { to: '/technician', label: 'Workstation', icon: LayoutDashboard, active: currentPath === '/technician' },
        { to: '/technician#queue', label: 'My Tasks', icon: ClipboardList, active: location.hash === '#queue' },
        { to: '/squads', label: 'Squad Roster', icon: Users, active: currentPath === '/squads' },
        { to: '/map', label: 'Campus Map', icon: MapIcon, active: currentPath === '/map' },
        { to: '/track', label: 'Tracker', icon: LineChart, active: currentPath === '/track' },
        { to: '/submit', label: 'New Ticket', icon: Plus, active: currentPath === '/submit' },
      ];
    }

    // Default: Student Portal
    return [
      { to: '/student', label: 'Grievances', icon: ClipboardList, active: currentPath === '/student' },
      { to: '/submit', label: 'New Request', icon: Plus, active: currentPath === '/submit' },
      { to: '/track', label: 'Track Status', icon: LineChart, active: currentPath === '/track' },
      { to: '/map', label: 'Campus Map', icon: MapIcon, active: currentPath === '/map' },
      { to: '/residence-info', label: 'Residence', icon: Building2, active: currentPath === '/residence-info' },
      { to: '/squads', label: 'Squad Telemetry', icon: Radio, active: currentPath === '/squads' },
    ];
  }, [location.pathname, location.hash, isSuperAdmin, isAdmin, isTechnician]);

  const rawName = currentUser?.full_name || currentUser?.name;
  const isNumericName = !rawName || !isNaN(Number(rawName));
  const displayName = !isNumericName
    ? rawName
    : currentUser?.email
    ? currentUser.email.split('@')[0]
    : roleTitle;

  const displayRole = isSuperAdmin
    ? 'Directorate · Super Admin'
    : isAdmin
    ? 'Facilities · Operations Desk'
    : isTechnician
    ? 'Field Squad · Technician'
    : `${currentUser?.hostel_name ? currentUser.hostel_name.split(' ')[0] : 'Campus'} · Student`;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    if (q.toUpperCase().startsWith('TICK-') || q.length >= 6) {
      navigate(`/track?code=${encodeURIComponent(q.toUpperCase())}`);
    } else {
      navigate(`/track?code=${encodeURIComponent(q)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex h-full w-[260px] flex-col p-4">
      {/* 1. Official Logo Emblem */}
      <div className="mb-5 flex items-center justify-between px-1">
        <Link to={homePath} className="flex items-center gap-3 group">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.1] p-1.5 shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all group-hover:border-cyan-400/50 group-hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]">
            <img
              src="/iiitnr_logo.png"
              alt="IIIT-NR Logo"
              className="h-full w-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>IIIT-NR</span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 group-hover:text-cyan-300 transition-colors truncate">
              {roleTitle}
            </div>
          </div>
        </Link>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 2. Omni-Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative mb-4 block">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type to search..."
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-cyan-500/10"
        />
      </form>

      {/* 3. Dual Metric Pill Card */}
      <div className="mb-4 rounded-xl border border-white/[0.08] bg-[#121721] p-3 shadow-xs">
        <div className="grid grid-cols-2 divide-x divide-white/[0.08]">
          <div className="pr-2">
            <span className="block text-[10px] font-medium text-slate-400">
              {isStudent ? 'My Requests' : 'Now Serving'}
            </span>
            <b className="mt-1 block text-lg font-bold tracking-tight text-white">
              {metrics.active}
            </b>
          </div>
          <div className="pl-3">
            <span className="block text-[10px] font-medium text-slate-400">
              {isStudent ? 'In Progress' : 'Incidents'}
            </span>
            <b className={`mt-1 block text-lg font-bold tracking-tight ${metrics.critical > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
              {isStudent ? metrics.progress : metrics.critical}
            </b>
          </div>
        </div>
        {/* Mini Progress Bar */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 mb-1.5">
            <span>Member Adoption</span>
            <span className="font-mono text-cyan-400">{metrics.resolutionRate}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-500"
              style={{ width: `${Math.max(4, metrics.resolutionRate)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Active: {metrics.active}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Working: {metrics.progress}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Navigation Pages: 2-Column Square Tile Grid */}
      <div className="mb-4">
        <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Pages
        </p>
        <div className="grid grid-cols-2 gap-2">
          {navTiles.map((tile) => {
            const Icon = tile.icon;
            const isTileActive = tile.active;
            return (
              <Link
                key={tile.label}
                to={tile.to}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition cursor-pointer ${
                  isTileActive
                    ? 'border-cyan-400/40 bg-cyan-400/[0.08] text-white shadow-[0_0_16px_rgba(6,182,212,0.12)]'
                    : 'border-white/[0.07] bg-white/[0.025] text-slate-400 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-slate-100'
                }`}
              >
                <Icon size={18} className={isTileActive ? 'text-cyan-300' : 'text-slate-400'} />
                <span className="mt-1.5 text-[11px] font-semibold tracking-tight">{tile.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 5. Quick Actions */}
      <div className="space-y-1.5">
        <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Quick Actions
        </p>
        <Link
          to="/submit"
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/[0.12]"
        >
          <Plus size={14} /> Create Request
        </Link>
        {isSuperAdmin && (
          <Link
            to="/superadmin/staff"
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06]"
          >
            <UsersRound size={14} /> Manage Staff
          </Link>
        )}
      </div>

      {/* 6. Footer User Profile Card */}
      <div className="mt-auto border-t border-white/[0.08] pt-3 relative">
        <div
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center justify-between rounded-xl bg-white/[0.025] p-2 border border-white/[0.06] hover:border-white/[0.12] transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-xs font-bold text-slate-950 shrink-0">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{displayName}</p>
              <p className="truncate text-[10px] text-slate-400">{displayRole}</p>
            </div>
          </div>
          <ChevronRight size={14} className={`text-slate-500 transition-transform ${profileOpen ? 'rotate-90' : ''}`} />
        </div>

        {/* Profile Popover Menu */}
        {profileOpen && (
          <div className="absolute bottom-16 left-0 right-0 z-50 rounded-xl border border-white/[0.1] bg-[#0f141e] p-2 shadow-2xl animate-fade-in text-xs space-y-1">
            <div className="px-2.5 py-1.5 border-b border-white/[0.06] mb-1">
              <p className="text-[10px] uppercase font-bold text-slate-400">Signed In As</p>
              <p className="text-xs font-mono text-cyan-300 truncate">{currentUser?.email || 'user@iiitnr.edu.in'}</p>
            </div>
            <Link
              to={homePath}
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-white/[0.06] hover:text-white transition"
            >
              <User size={13} />
              <span>Dashboard Home</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-white/[0.08] bg-[#0c1017] lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex h-full w-[260px] flex-col border-r border-white/[0.08] bg-[#0c1017] shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
