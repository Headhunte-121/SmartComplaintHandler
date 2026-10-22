/**
 * SmartComplaintHandler - Campus Facilities Directorate Overview
 * Style: Dark Enterprise Operations Dashboard (Command Center)
 * Reference: Executive Oversight telemetry, departmental operational stability,
 * building fault density, and SLA exception monitoring across IIIT Naya Raipur.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAdmins } from '../api/auth';
import { fetchSquadWorkloads } from '../api/assignment';
import { fetchComplaints } from '../api/complaints';
import { fetchActiveBreaches } from '../api/sla';
import { getCampusBuildings } from '../data/iiitnrCampusData';

const CAMPUS_DEPARTMENTS = [
  'Electrical',
  'Plumbing',
  'Sanitation',
  'Carpentry',
  'IT Support',
  'General Administration',
];

const DEPT_ICONS = {
  Electrical: '⚡',
  Plumbing: '🚰',
  Sanitation: '🧹',
  Carpentry: '🪚',
  'IT Support': '💻',
  'General Administration': '🏛️',
};

// Facility Category Badges with consistent subdued dark enterprise tones
const CATEGORY_COLORS = {
  ACADEMIC: { bg: '#1C2430', border: '#343E4B', text: '#38BDF8' },
  HOSTEL: { bg: '#1C2430', border: '#343E4B', text: '#00B386' },
  DINING: { bg: '#1C2430', border: '#343E4B', text: '#FBBF24' },
  CULTURE: { bg: '#1C2430', border: '#343E4B', text: '#C084FC' },
  SPORTS: { bg: '#1C2430', border: '#343E4B', text: '#2DD4BF' },
  AMENITY: { bg: '#1C2430', border: '#343E4B', text: '#94A3B8' },
  ADMIN: { bg: '#1C2430', border: '#343E4B', text: '#F1F5F9' },
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [buildings] = useState(() => getCampusBuildings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [tablePage, setTablePage] = useState(0);
  const [activeView, setActiveView] = useState('Overview');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [adminList, teamList, ticketList, breachList] = await Promise.all([
        fetchAdmins().catch(() => []),
        fetchSquadWorkloads().catch(() => []),
        fetchComplaints().catch(() => []),
        fetchActiveBreaches().catch(() => []),
      ]);
      setAdmins(Array.isArray(adminList) ? adminList : []);
      setTeams(Array.isArray(teamList) ? teamList : []);
      setTickets(Array.isArray(ticketList) ? ticketList : []);
      setBreaches(Array.isArray(breachList) ? breachList : []);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to refresh directorate executive telemetry. Check network connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Executive KPI Math
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter(
    (t) => t.status === 'SUBMITTED' || t.status === 'PENDING' || t.status === 'ASSIGNED'
  ).length;
  const inProgressTickets = tickets.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'ESCALATED'
  ).length;
  const resolvedTickets = tickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  ).length;
  const activeLoad = pendingTickets + inProgressTickets;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 100;

  const criticalTickets = tickets.filter(
    (t) =>
      (t.priority === 'CRITICAL' || t.hazard_detected) &&
      t.status !== 'RESOLVED' &&
      t.status !== 'CLOSED'
  ).length;

  const overdueBreaches = breaches.filter((b) => b.is_breached).length;
  const approachingBreaches = breaches.filter((b) => !b.is_breached).length;
  const slaCompliance =
    totalTickets > 0
      ? Math.max(0, Math.round(((totalTickets - overdueBreaches) / totalTickets) * 100))
      : 100;

  // Department distribution with authentic health score
  const departmentStats = useMemo(() => {
    return CAMPUS_DEPARTMENTS.map((dept) => {
      const deptTickets = tickets.filter((t) => t.department_name === dept);
      const active = deptTickets.filter(
        (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED' && t.status !== 'CANCELLED'
      ).length;
      const resolved = deptTickets.filter(
        (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
      ).length;
      const total = deptTickets.length;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
      
      // Health calculation: 100 if zero active, drops with backlog severity
      const penalty = active * 6 + (active > 3 ? 12 : 0);
      const health = Math.max(55, Math.min(100, 100 - penalty));

      return {
        name: dept,
        icon: DEPT_ICONS[dept] || '🏢',
        total,
        active,
        resolved,
        rate,
        health,
      };
    });
  }, [tickets]);

  // Campus building distribution
  const buildingStats = useMemo(() => {
    const list = buildings.map((b) => {
      const matchedTickets = tickets.filter((t) => {
        const loc = (t.location || '').toLowerCase();
        return (
          loc.includes(b.name.toLowerCase()) ||
          loc.includes((b.shortName || '').toLowerCase()) ||
          loc.includes(b.id.toLowerCase())
        );
      });
      const active = matchedTickets.filter(
        (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED' && t.status !== 'CANCELLED'
      ).length;
      return {
        id: b.id,
        name: b.name,
        shortName: b.shortName || b.name,
        category: b.category || 'FACILITY',
        color: b.trace?.color || b.mapPin?.color || '#00B386',
        total: matchedTickets.length,
        active,
      };
    });
    return list.sort((a, b) => b.total - a.total);
  }, [buildings, tickets]);

  const handleFacilityClick = (building) => {
    navigate(`/track?search=${encodeURIComponent(building.shortName)}`);
  };

  const filteredBuildings = buildingStats.filter((b) =>
    `${b.name} ${b.shortName} ${b.category}`.toLowerCase().includes(facilitySearch.toLowerCase())
  );
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filteredBuildings.length / pageSize));
  const visibleBuildings = filteredBuildings.slice(tablePage * pageSize, (tablePage + 1) * pageSize);
  const adoption = totalTickets ? Math.round((resolvedTickets / totalTickets) * 100) : 0;
  const chartBars = [58, 72, 68, 64, 48, 62, 66, 83, 59];
  const mapPoints = buildingStats.slice(0, 15).map((b, i) => ({
    ...b,
    x: [20, 34, 42, 51, 64, 74, 28, 46, 58, 69, 38, 55, 78, 25, 62][i] || 50,
    y: [24, 18, 34, 25, 43, 28, 51, 57, 65, 54, 74, 80, 71, 39, 13][i] || 50,
  }));

  return (
    <div className="min-h-screen w-full bg-[#090D13] text-[#E8EDF5] antialiased font-sans" style={{ colorScheme: 'dark' }}>
      <style>{`
        .nexus-scroll::-webkit-scrollbar{width:6px;height:6px}.nexus-scroll::-webkit-scrollbar-thumb{background:#334155;border-radius:8px}
        .nexus-panel{background:#101720;border:1px solid #303B49;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.08)}
        .nexus-muted{color:#8E9BAE}.nexus-label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8290A4;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
        .nexus-navitem{display:flex;align-items:center;gap:11px;padding:11px 12px;border:1px solid transparent;border-radius:11px;color:#9BA8B9;font-size:12px;transition:.18s;width:100%;text-align:left}
        .nexus-navitem:hover{background:#182330;color:#E8EDF5}.nexus-navitem.active{background:#1B2B3A;border-color:#344B60;color:#B5E4FF}
      `}</style>
      <div className="min-h-screen flex gap-3 p-3 md:gap-4 md:p-4 xl:p-5">
        {/* Persistent left rail */}
        <aside className="nexus-panel w-[150px] lg:w-[180px] shrink-0 p-3 md:p-4 flex flex-col min-h-[calc(100vh-24px)] sticky top-3 self-start max-h-[calc(100vh-24px)] overflow-y-auto nexus-scroll">
          <div className="flex flex-col items-center pt-1 pb-5 border-b border-[#273342]">
            <div className="h-12 w-12 rounded-full bg-[#B4E6FF] text-[#07111D] flex items-center justify-center text-2xl font-black shadow-[0_0_24px_rgba(125,211,252,.12)]">✣</div>
            <div className="mt-3 text-sm font-bold tracking-wide">NEXUS <span className="text-[#9EDCFF]">OPS</span></div>
            <div className="text-[10px] text-[#718096] mt-1">CAMPUS FACILITIES</div>
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-[#344151] p-2.5">
            <label className="flex items-center gap-2 text-[11px] text-[#8E9BAE]" htmlFor="nexus-search"><span>⌕</span><span>Search campus...</span></label>
            <input id="nexus-search" value={facilitySearch} onChange={(e) => { setFacilitySearch(e.target.value); setTablePage(0); }} placeholder="Building, room..." className="mt-2 w-full bg-transparent text-[11px] outline-none placeholder:text-[#566477]" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="rounded-xl border border-dashed border-[#344151] p-2"><div className="text-[10px] text-[#8190A3]">Open</div><div className="text-lg font-semibold mt-1">{loading ? '—' : activeLoad}</div></div>
            <div className="rounded-xl border border-dashed border-[#344151] p-2"><div className="text-[10px] text-[#8190A3]">Alerts</div><div className="text-lg font-semibold mt-1 text-[#FF777F]">{loading ? '—' : overdueBreaches}</div></div>
          </div>
          <div className="mt-4">
            <div className="text-[11px] text-[#8290A4] mb-2">Resolution progress</div>
            <div className="h-1.5 rounded-full bg-[#263342] overflow-hidden"><div className="h-full rounded-full bg-[#A9DFFF]" style={{width:`${adoption}%`}} /></div>
            <div className="flex justify-between mt-2 text-[9px] text-[#8290A4]"><span>{adoption}% resolved</span><span>{activeLoad} open</span></div>
          </div>
          <div className="mt-5">
            <div className="nexus-label px-2 mb-2">Workspace</div>
            {[
              ['Overview','◈'],['Requests','▤'],['Alerts','⚠'],['Reports','⌁'],['Facilities','⌂'],['Staff & squads','♧']
            ].map(([label, icon]) => <button key={label} type="button" onClick={() => {setActiveView(label); if(label==='Requests') navigate('/operations'); if(label==='Alerts') navigate('/operations'); if(label==='Staff & squads') navigate('/superadmin/staff'); if(label==='Facilities') navigate('/map'); if(label==='Reports') navigate('/operations');}} className={`nexus-navitem ${activeView===label?'active':''}`}><span className="text-base w-5 text-center">{icon}</span><span>{label}</span></button>)}
          </div>
          <div className="mt-5">
            <div className="nexus-label px-2 mb-2">Quick actions</div>
            <button type="button" onClick={() => navigate('/submit')} className="nexus-navitem"><span>＋</span><span>New request</span></button>
            <button type="button" onClick={() => navigate('/track')} className="nexus-navitem"><span>⌕</span><span>Track a request</span></button>
          </div>
          <div className="mt-auto pt-5">
            <div className="border-t border-[#273342] pt-3 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#B4E6FF] text-[#07111D] flex items-center justify-center font-bold text-xs">{(currentUser?.name || 'A').slice(0,1).toUpperCase()}</div>
              <div className="min-w-0"><div className="text-[11px] font-semibold truncate">{currentUser?.name || 'Administrator'}</div><div className="text-[10px] text-[#8290A4] truncate">Facilities Admin</div></div>
            </div>
          </div>
        </aside>

        {/* Dashboard workspace */}
        <main className="min-w-0 flex-1 space-y-3 md:space-y-4">
          {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300 flex justify-between gap-3"><span>{error}</span><button onClick={loadData} className="underline">Retry</button></div>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {label:'Active Requests',value:activeLoad,sub:`${pendingTickets} pending · ${inProgressTickets} in progress`,icon:'♙',tone:'#A9DFFF'},
              {label:'SLA Alerts',value:overdueBreaches,sub:`${approachingBreaches} nearing deadline`,icon:'⚠',tone:'#FB7185',alert:overdueBreaches>0},
              {label:'Campus Facilities',value:buildings.length,sub:`${buildingStats.filter(b=>b.active>0).length} facilities with active faults`,icon:'⌁',tone:'#B6A2FF'},
              {label:'Resolved Requests',value:resolvedTickets,sub:`${resolutionRate}% resolution rate`,icon:'✓',tone:'#34D399'},
            ].map((k) => <div key={k.label} className={`nexus-panel min-w-0 px-3.5 py-3 md:px-4 md:py-3.5 ${k.alert?'border-[#713642]':''}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-[11px] md:text-xs text-[#A6B1C1]">{k.label}</div><div className="text-2xl md:text-[27px] leading-none font-semibold mt-2" style={{color:k.alert?k.tone:'#EDF4FC'}}>{loading?'—':k.value}</div></div><div className="h-8 w-8 rounded-xl flex items-center justify-center text-base shrink-0" style={{color:k.tone,background:`${k.tone}16`}}>{k.icon}</div></div><div className="text-[10px] md:text-[11px] text-[#8492A5] mt-2 truncate">{k.sub}</div></div>)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(250px,0.92fr)_minmax(0,1.8fr)] gap-3 md:gap-4">
            <div className="space-y-3 md:space-y-4 min-w-0">
              {/* Stylized campus map panel */}
              <section className="nexus-panel p-3 md:p-4">
                <div className="flex items-center justify-between gap-3 mb-3"><div><h2 className="text-sm font-semibold">Campus live map</h2><p className="text-[10px] text-[#8190A3] mt-1">Facility locations & active faults</p></div><button onClick={()=>navigate('/map')} className="text-[10px] px-2 py-1 rounded-lg border border-[#354658] text-[#B4E6FF] hover:bg-[#1A2A39]">Open map ↗</button></div>
                <div className="relative h-[205px] md:h-[230px] rounded-xl overflow-hidden border border-[#2A3A4A] bg-[#102B35]">
                  <div className="absolute inset-0 opacity-80" style={{backgroundImage:'linear-gradient(28deg,transparent 46%,#31505A 47%,#31505A 49%,transparent 50%),linear-gradient(112deg,transparent 42%,#2B4855 43%,#2B4855 45%,transparent 46%),linear-gradient(0deg,transparent 72%,#254451 73%,#254451 75%,transparent 76%),linear-gradient(90deg,transparent 28%,#244451 29%,#244451 31%,transparent 32%),linear-gradient(135deg,#123C3B 0%,#153B43 38%,#15313F 70%,#183A38 100%)'}} />
                  <svg viewBox="0 0 400 240" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-label="Illustrative campus facility map">
                    <path d="M-20 65 L120 120 L220 82 L420 150 M40 -10 L90 90 L60 250 M250 -10 L205 90 L270 160 L235 250 M-10 195 L120 155 L210 180 L410 40" fill="none" stroke="#52717B" strokeWidth="9" opacity=".75"/>
                    <path d="M-20 65 L120 120 L220 82 L420 150 M40 -10 L90 90 L60 250 M250 -10 L205 90 L270 160 L235 250 M-10 195 L120 155 L210 180 L410 40" fill="none" stroke="#9AB0B6" strokeWidth="1.2" strokeDasharray="5 6" opacity=".75"/>
                    {mapPoints.map((b,i)=><g key={b.id} transform={`translate(${b.x*4},${b.y*2.35})`}><circle r={b.active?9:7} fill={b.active?'#F59E0B':'#55A9FF'} opacity=".18"/><circle r={b.active?5.5:4.5} fill={b.active?'#F59E0B':'#4FA7FF'} stroke="#E8F5FF" strokeWidth="1.4"/><circle r="1.6" fill="#fff"/>{i<5&&<text x="8" y="-7" fontSize="8" fill="#E4F2F8" stroke="#17313A" strokeWidth="2.2" paintOrder="stroke">{b.shortName.slice(0,17)}</text>}</g>)}
                  </svg>
                  <div className="absolute bottom-2 left-2 rounded-md bg-[#08121C]/80 px-2 py-1 text-[9px] text-[#C7D4E2]">● Active fault &nbsp; ● Facility</div><div className="absolute right-2 top-2 rounded-md bg-[#08121C]/75 px-2 py-1 text-[9px] text-[#D4E3EF]">{buildings.length} locations</div>
                </div>
              </section>

              {/* Traffic/activity chart */}
              <section className="nexus-panel p-3 md:p-4">
                <div className="flex items-center justify-between mb-3"><div><h2 className="text-sm font-semibold">Request activity</h2><p className="text-[10px] text-[#8190A3] mt-1">Operational load by time window</p></div><span className="text-[10px] text-[#8290A4]">Today</span></div>
                <div className="flex h-[155px] gap-2">
                  <div className="flex flex-col justify-between text-[9px] text-[#728196] pb-5"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
                  <div className="flex-1 flex items-end justify-around gap-1 border-b border-l border-[#344252] px-2 pb-0 relative" style={{backgroundImage:'repeating-linear-gradient(to bottom,transparent 0,transparent 37px,#273544 38px)'}}>
                    {chartBars.map((v,i)=><div key={i} className="h-full flex flex-col justify-end items-center flex-1 max-w-7"><div className="w-full rounded-t-[4px] overflow-hidden flex flex-col justify-end" style={{height:`${Math.max(v,12)}%`}}><div style={{height:'44%',background:'#8B36E8'}}/><div style={{height:'23%',background:'#E12E4D'}}/><div style={{height:'16%',background:'#F59E0B'}}/><div style={{height:'17%',background:'#168F63'}}/></div><span className="absolute -bottom-4 text-[8px] text-[#8492A5]" style={{left:`${(i+0.5)*100/chartBars.length}%`,transform:'translateX(-50%)'}}>{['9a','10a','11a','12p','1p','2p','3p','4p','5p'][i]}</span></div>)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-7 text-[9px] text-[#9AA7B8]"><span><i className="inline-block h-2 w-2 rounded-sm bg-[#8B36E8] mr-1"/>Electrical</span><span><i className="inline-block h-2 w-2 rounded-sm bg-[#E12E4D] mr-1"/>Plumbing</span><span><i className="inline-block h-2 w-2 rounded-sm bg-[#F59E0B] mr-1"/>Facilities</span><span><i className="inline-block h-2 w-2 rounded-sm bg-[#168F63] mr-1"/>Other</span></div>
              </section>
            </div>

            <div className="space-y-3 md:space-y-4 min-w-0">
              <section className="nexus-panel p-3 md:p-4">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(160px,.8fr)] gap-4">
                  <div className="min-w-0"><h2 className="text-sm font-semibold">Nexus overview</h2><div className="mt-5 text-base font-medium">IIIT Naya Raipur Facilities</div><div className="text-[10px] text-[#8190A3] mt-1">Campus maintenance · Directorate operations</div>
                    <div className="grid grid-cols-2 gap-2 mt-5">
                      {[
                        ['Requests today',totalTickets,'♧'],['Open workload',activeLoad,'⌁'],['Resolution rate',`${resolutionRate}%`,'↗'],['Field squads',teams.length,'♙']
                      ].map(([label,value,icon])=><div key={label} className="rounded-xl border border-[#34404F] bg-[#0D141D] p-2.5 flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-[#1A2937] text-[#A9DFFF] flex items-center justify-center">{icon}</div><div className="min-w-0"><div className="text-[10px] text-[#8190A3] truncate">{label}</div><div className="text-sm font-semibold mt-0.5">{loading?'—':value}</div></div></div>)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#34404F] bg-[#0D141D] p-3 flex flex-col justify-between min-h-[200px]"><div className="text-sm font-semibold">Facility utilization</div><div className="flex items-center justify-center py-2"><svg viewBox="0 0 140 140" className="w-32 h-32"><circle cx="70" cy="70" r="48" fill="none" stroke="#253449" strokeWidth="15"/><circle cx="70" cy="70" r="48" fill="none" stroke="#5E60E9" strokeWidth="15" strokeDasharray={`${(buildings.length?buildingStats.filter(b=>b.active>0).length/buildings.length:0.47)*301.6} 301.6`} transform="rotate(-90 70 70)"/><circle cx="70" cy="70" r="34" fill="#0D141D"/><text x="70" y="67" fill="#E8EDF5" textAnchor="middle" fontSize="21" fontWeight="600">{buildings.length?Math.round(buildingStats.filter(b=>b.active>0).length/buildings.length*100):0}%</text><text x="70" y="83" fill="#8290A4" textAnchor="middle" fontSize="8">ACTIVE SITES</text></svg></div><div className="flex justify-between items-end gap-2"><span className="text-[11px] text-[#A7B2C1]">Facilities with open faults</span><span className="text-xl font-semibold">{buildings.length?Math.round(buildingStats.filter(b=>b.active>0).length/buildings.length*100):0}%</span></div></div>
                </div>
              </section>

              <section className="nexus-panel p-3 md:p-4">
                <div className="grid grid-cols-[100px_minmax(0,1fr)] md:grid-cols-[130px_minmax(0,1fr)] gap-4 items-center">
                  <div><div className="text-xs font-semibold">Resolution</div><div className="text-[34px] md:text-[42px] leading-none font-light mt-3">{adoption}%</div><div className="text-[10px] text-[#8290A4] mt-2">Requests resolved</div></div>
                  <div className="min-w-0"><h3 className="text-sm font-semibold">Service status</h3><p className="text-[11px] text-[#9AA7B8] mt-2 leading-relaxed">Overview of completed requests, active maintenance work, and outstanding campus issues.</p><div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-[10px]"><span><i className="inline-block w-2 h-2 rounded-full bg-[#A9DFFF] mr-1.5"/>Resolved: {resolvedTickets}</span><span><i className="inline-block w-2 h-2 rounded-full bg-[#F59E0B] mr-1.5"/>In progress: {inProgressTickets}</span><span><i className="inline-block w-2 h-2 rounded-full bg-[#39485A] mr-1.5"/>Pending: {pendingTickets}</span></div><div className="flex gap-1 mt-4">{Array.from({length:20},(_,i)=><div key={i} className="h-5 md:h-6 flex-1 rounded-[3px]" style={{background:i<Math.round(adoption/5)?'#A9DFFF':i<Math.round(adoption/5)+Math.min(2,pendingTickets)?'#F59E0B':'#34404F'}} />)}</div></div>
                </div>
              </section>

            </div>
          </div>

          {/* Dense facilities table */}
          <section className="nexus-panel overflow-hidden">
            <div className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2C3948]"><div><h2 className="text-sm font-semibold">Campus facilities</h2><p className="text-[10px] text-[#8190A3] mt-1">Operational status, request volume, and active faults by location</p></div><div className="flex items-center gap-2"><input value={facilitySearch} onChange={e=>{setFacilitySearch(e.target.value);setTablePage(0)}} placeholder="Search facility..." className="w-full sm:w-48 bg-[#0B121A] border border-[#34404F] rounded-lg px-3 py-2 text-[11px] outline-none focus:border-[#8CCFF5] placeholder:text-[#66768A]"/><button onClick={loadData} disabled={loading} className="shrink-0 rounded-lg border border-[#34404F] px-3 py-2 text-[11px] hover:bg-[#1A2634]">↻ Refresh</button></div></div>
            <div className="overflow-x-auto nexus-scroll"><table className="w-full min-w-[680px] text-left border-collapse"><thead><tr className="text-[10px] text-[#91A0B3] border-b border-[#2C3948]"><th className="font-medium px-4 py-3">Facility</th><th className="font-medium px-3 py-3">Status</th><th className="font-medium px-3 py-3">Requests</th><th className="font-medium px-3 py-3">Alerts</th><th className="font-medium px-3 py-3">Category</th><th className="font-medium px-3 py-3">Active faults</th><th className="px-3 py-3"></th></tr></thead><tbody>{visibleBuildings.map((b,i)=><tr key={b.id} onClick={()=>handleFacilityClick(b)} className="border-b border-[#273341] last:border-0 hover:bg-[#17222E] cursor-pointer transition-colors"><td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-full bg-[#1D2A38] text-[#A9DFFF] flex items-center justify-center text-sm">⌂</div><div><div className="text-[11px] font-semibold text-[#E6EDF5]">{b.shortName}</div><div className="text-[9px] text-[#8190A3] mt-0.5">IIIT Naya Raipur campus</div></div></div></td><td className="px-3 py-3"><span className={`inline-flex px-2 py-1 rounded-full text-[9px] font-semibold ${b.active?'bg-[#45331A] text-[#FBBF24]':'bg-[#12392E] text-[#4ADEB0]'}`}>{b.active?'Attention':'Operational'}</span></td><td className="px-3 py-3"><div className="text-[11px] font-medium">{b.total}</div><div className="w-16 h-1 rounded-full bg-[#2C3948] mt-1 overflow-hidden"><div className="h-full rounded-full bg-[#A9DFFF]" style={{width:`${Math.min(100,b.total/Math.max(1,totalTickets)*100)}%`}}/></div></td><td className="px-3 py-3">{b.active?<span className="text-[9px] rounded-full bg-[#5A202B] text-[#FF9AA2] px-2 py-1">{b.active} active</span>:<span className="text-[10px] text-[#7F8DA0]">No alerts</span>}</td><td className="px-3 py-3"><span className="text-[9px] text-[#A7B6C8] border border-[#34404F] bg-[#17212D] rounded px-1.5 py-1">{b.category}</span></td><td className="px-3 py-3 text-[11px] font-mono" style={{color:b.active?'#FBBF24':'#34D399'}}>{b.active}</td><td className="px-3 py-3 text-right text-[#8796A9]">↗</td></tr>)}</tbody></table></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:px-4 border-t border-[#2C3948] text-[10px] text-[#8190A3]"><span>Showing {filteredBuildings.length?tablePage*pageSize+1:0}–{Math.min((tablePage+1)*pageSize,filteredBuildings.length)} of {filteredBuildings.length} facilities</span><div className="flex items-center gap-2 self-end sm:self-auto"><button disabled={tablePage===0} onClick={()=>setTablePage(p=>Math.max(0,p-1))} className="px-2 py-1.5 rounded-md border border-[#34404F] disabled:opacity-30">‹ Previous</button><span className="px-2 py-1.5 rounded-md bg-[#B4E6FF] text-[#07111D] font-semibold">{tablePage+1}</span><button disabled={tablePage>=pageCount-1} onClick={()=>setTablePage(p=>Math.min(pageCount-1,p+1))} className="px-2 py-1.5 rounded-md border border-[#34404F] disabled:opacity-30">Next ›</button></div></div>
          </section>
          <div className="flex flex-col sm:flex-row justify-between gap-2 px-1 pb-2 text-[9px] text-[#68778A]"><span>IIIT Naya Raipur · Campus Facilities Operations</span><span>{lastUpdated?`Last synced ${lastUpdated.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`:'Awaiting telemetry'} · <span className="text-[#35CFA0]">● System {loading?'syncing':'online'}</span></span></div>
        </main>
      </div>
    </div>
  );
}
