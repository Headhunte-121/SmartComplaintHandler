/**
 * SmartComplaintHandler - SuperAdmin Campus & Ticket Data Studio
 * 
 * Master Data Correction & Entry Hub for Directorate SuperAdmins:
 * - Campus Infrastructure & Building Directory (Name, Category, Color, Badges, Digital Twin Coordinates)
 * - Floor & Room Directory (Pure hierarchical: Building -> Floor -> Rooms; NO WINGS)
 * - Inline Typo Correction, Single Room Adder, Bulk Batch Room Adder, and Quick Standard Generator
 * - Real-Time Grievance / Ticket Inspector & Editor (Status, Priority, Department, Location, Resolution Notes)
 * - JSON Data Studio (Copy, Download Backup, Live Import with Validation, Reset to Verified Defaults)
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  IIITNR_MAP_UPDATED_EVENT,
  HOSTEL_FLOORS,
  getCampusBuildings,
  saveCustomCampusBuildings,
  resetCampusBuildingsToDefault,
  getFloorsForBuilding,
  getRoomsForBuilding,
} from '../data/iiitnrCampusData';
import { fetchComplaints, submitComplaint } from '../api/complaints';
import { updateTicketStatus, resolveTicket } from '../api/sla';
import { overrideTicketPriority } from '../api/triage';
import { reassignSquad } from '../api/assignment';

const CAMPUS_CATEGORIES = [
  { id: 'ALL', label: 'All Buildings' },
  { id: 'HOSTEL', label: 'Hostels & Residences' },
  { id: 'ACADEMIC', label: 'Academic & Labs' },
  { id: 'AMENITY', label: 'Dining & Gathering' },
  { id: 'UTILITY', label: 'Utilities & Admin' },
  { id: 'SPORTS', label: 'Sports Complex' },
];

const DEPARTMENTS = [
  'Electrical',
  'Plumbing',
  'IT Support',
  'Sanitation',
  'Carpentry',
  'General Administration',
];

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function SuperAdminDataEditor() {
  const navigate = useNavigate();
  const { currentUser, isSuperAdmin } = useAuth();
  const { isDark } = useTheme();

  // Active Main Studio Tab
  const [activeTab, setActiveTab] = useState('CAMPUS'); // 'CAMPUS' | 'ROOMS' | 'TICKETS' | 'JSON'

  // Master Campus Data State
  const [buildings, setBuildings] = useState(() => getCampusBuildings());
  const [selectedBuildingId, setSelectedBuildingId] = useState(() => buildings[0]?.id || 'academic_block');
  const [buildingFilterCategory, setBuildingFilterCategory] = useState('ALL');
  const [buildingSearch, setBuildingSearch] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [notification, setNotification] = useState(null);

  // Room Directory Tab State
  const [roomActiveFloor, setRoomActiveFloor] = useState('G');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [editingRoomIndex, setEditingRoomIndex] = useState(null);
  const [editingRoomText, setEditingRoomText] = useState('');
  const [newSingleRoomName, setNewSingleRoomName] = useState('');
  const [bulkRoomText, setBulkRoomText] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Tickets Directory Tab State
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketEditModalOpen, setIsTicketEditModalOpen] = useState(false);
  const [ticketEditStatus, setTicketEditStatus] = useState('PENDING');
  const [ticketEditPriority, setTicketEditPriority] = useState('MEDIUM');
  const [ticketEditDept, setTicketEditDept] = useState('Electrical');
  const [ticketEditLocation, setTicketEditLocation] = useState('');
  const [ticketEditNotes, setTicketEditNotes] = useState('');
  const [ticketSaving, setTicketSaving] = useState(false);

  // Manual Ticket Creator State
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketLocation, setNewTicketLocation] = useState('');
  const [newTicketSubmitting, setNewTicketSubmitting] = useState(false);

  // JSON Studio State
  const [jsonText, setJsonText] = useState('');
  const [jsonCopyNotice, setJsonCopyNotice] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonInput, setImportJsonInput] = useState('');
  const [importError, setImportError] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // New Building Modal State
  const [isNewBuildingModalOpen, setIsNewBuildingModalOpen] = useState(false);
  const [newBldgId, setNewBldgId] = useState('');
  const [newBldgName, setNewBldgName] = useState('');
  const [newBldgShortName, setNewBldgShortName] = useState('');
  const [newBldgCategory, setNewBldgCategory] = useState('ACADEMIC');
  const [newBldgBadge, setNewBldgBadge] = useState('ZONE');
  const [newBldgColor, setNewBldgColor] = useState('#10b981');
  const [newBldgDesc, setNewBldgDesc] = useState('');

  // Notify helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3800);
  };

  // Sync with window events
  useEffect(() => {
    const handleUpdate = () => {
      const current = getCampusBuildings();
      setBuildings(current);
      setJsonText(JSON.stringify(current, null, 2));
    };
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
    setJsonText(JSON.stringify(buildings, null, 2));
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
  }, []);

  // Load live tickets
  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const data = await fetchComplaints({ limit: 200 });
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Backend tickets offline, using local simulation:', err);
      // Fallback ticket items for demonstration
      setTickets([
        {
          id: 101,
          tracking_code: 'TICK-1001',
          title: 'Split AC units blowing warm air in Smart E-Classroom E-101',
          description: 'The overhead cassette AC units in Room 101 (Academic Block, Ground Floor) are not cooling.',
          location: 'Main Academic & Administrative Building, Ground Floor, Room 101',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          department_name: 'Electrical',
          student_name: 'Nikhil (Student)',
          student_email: 'nikhil26100@iiitnr.edu.in',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          resolution_notes: 'Technician dispatched with gas recharge kit.',
        },
        {
          id: 102,
          tracking_code: 'TICK-1002',
          title: 'Wi-Fi router offline in Ramanujan House, 2nd Floor',
          description: 'The ceiling Wi-Fi access point near Room 204 in Ramanujan House is blinking red.',
          location: 'Raman House (Boys Hostel 1), 2nd Floor, Room 204',
          priority: 'MEDIUM',
          status: 'PENDING',
          department_name: 'IT Support',
          student_name: 'Rahul Sharma',
          student_email: 'rahul26101@iiitnr.edu.in',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          resolution_notes: null,
        },
        {
          id: 103,
          tracking_code: 'TICK-1003',
          title: 'Corridor drinking water cooler leaking',
          description: 'Water leaking from base filter onto floor tiles near staircase.',
          location: 'Bhabha House (Boys Hostel 2), 1st Floor, Corridor RO Cooler',
          priority: 'HIGH',
          status: 'RESOLVED',
          department_name: 'Plumbing',
          student_name: 'Amit Patel',
          student_email: 'amit26102@iiitnr.edu.in',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          resolution_notes: 'Replaced brass inlet washer and silicone sealant gasket.',
        },
      ]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Filtered Buildings List
  const filteredBuildings = useMemo(() => {
    return buildings.filter((b) => {
      const matchCat = buildingFilterCategory === 'ALL' || b.category === buildingFilterCategory;
      const q = buildingSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.name?.toLowerCase().includes(q) ||
        b.shortName?.toLowerCase().includes(q) ||
        b.id?.toLowerCase().includes(q) ||
        b.trace?.badge?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [buildings, buildingFilterCategory, buildingSearch]);

  // Current Selected Building Object
  const currentBuilding = useMemo(() => {
    return buildings.find((b) => b.id === selectedBuildingId) || buildings[0];
  }, [buildings, selectedBuildingId]);

  // Available floors for currently selected building
  const availableFloors = useMemo(() => {
    if (!currentBuilding) return HOSTEL_FLOORS;
    return getFloorsForBuilding(currentBuilding.id, buildings);
  }, [currentBuilding, buildings]);

  // Make sure active floor is valid
  useEffect(() => {
    if (availableFloors.length > 0) {
      const exists = availableFloors.some((f) => String(f.id) === String(roomActiveFloor));
      if (!exists) {
        setRoomActiveFloor(availableFloors[0].id);
      }
    }
  }, [availableFloors, roomActiveFloor]);

  // Current Floor's Room List (Without Wings!)
  const currentFloorRooms = useMemo(() => {
    if (!currentBuilding) return [];
    return getRoomsForBuilding(currentBuilding.id, roomActiveFloor, null, buildings);
  }, [currentBuilding, roomActiveFloor, buildings]);

  // Filtered rooms in current floor
  const filteredRooms = useMemo(() => {
    const q = roomSearchQuery.toLowerCase().trim();
    if (!q) return currentFloorRooms;
    return currentFloorRooms.filter((r) => r.toLowerCase().includes(q));
  }, [currentFloorRooms, roomSearchQuery]);

  // Save current buildings state to storage
  const commitBuildings = (updatedList, toastMsg = 'Changes saved successfully!') => {
    setBuildings(updatedList);
    saveCustomCampusBuildings(updatedList);
    setJsonText(JSON.stringify(updatedList, null, 2));
    setHasUnsavedChanges(false);
    showToast(toastMsg);
  };

  // Update a field on the current building
  const handleUpdateCurrentBuildingField = (field, value) => {
    if (!currentBuilding) return;
    const updated = buildings.map((b) => {
      if (b.id !== currentBuilding.id) return b;

      if (field.startsWith('trace.')) {
        const sub = field.split('.')[1];
        return {
          ...b,
          trace: {
            ...(b.trace || {}),
            [sub]: sub === 'cx' || sub === 'cy' || sub === 'w' || sub === 'h' || sub === 'angle'
              ? Number(value) || 0
              : value,
          },
        };
      }

      if (field === 'badge') {
        return {
          ...b,
          mapPin: { ...(b.mapPin || {}), badge: value.toUpperCase() },
          trace: { ...(b.trace || {}), badge: value.toUpperCase() },
        };
      }

      if (field === 'color') {
        return {
          ...b,
          mapPin: { ...(b.mapPin || {}), color: value },
          trace: { ...(b.trace || {}), color: value },
        };
      }

      return { ...b, [field]: value };
    });

    commitBuildings(updated, `Updated ${field} for ${currentBuilding.shortName}`);
  };

  // Add a brand new building
  const handleCreateBuilding = (e) => {
    e.preventDefault();
    if (!newBldgName.trim()) {
      showToast('Building Name is required.', 'error');
      return;
    }
    const cleanId = (newBldgId.trim() || newBldgName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')) + `_${Date.now()}`;
    const newEntry = {
      id: cleanId,
      name: newBldgName.trim(),
      shortName: newBldgShortName.trim() || newBldgName.trim(),
      category: newBldgCategory,
      floors: [
        { id: 'G', label: 'Ground Floor (G)', rooms: [`${newBldgShortName.trim() || 'Zone'} Main Floor`] },
        { id: '1', label: '1st Floor (1xx)', rooms: [] },
      ],
      roomsPerFloor: 12,
      roomPrefix: 'Room ',
      customRooms: [],
      trace: {
        cx: 350,
        cy: 450,
        w: 50,
        h: 40,
        angle: 0,
        shape: 'generic_rect',
        color: newBldgColor,
        badge: newBldgBadge.toUpperCase(),
      },
      mapPin: { badge: newBldgBadge.toUpperCase(), color: newBldgColor },
      gps: `Campus Grid (350, 450)`,
      description: newBldgDesc.trim() || 'Institutional facility added via SuperAdmin Data Studio.',
    };

    const updated = [...buildings, newEntry];
    commitBuildings(updated, `Created ${newEntry.name}!`);
    setSelectedBuildingId(cleanId);
    setIsNewBuildingModalOpen(false);
    setNewBldgId('');
    setNewBldgName('');
    setNewBldgShortName('');
    setNewBldgDesc('');
  };

  // Delete a building
  const handleDeleteBuilding = (idToDelete) => {
    const target = buildings.find((b) => b.id === idToDelete);
    if (!target) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${target.name}"? This cannot be undone.`)) {
      return;
    }
    const updated = buildings.filter((b) => b.id !== idToDelete);
    const fallbackId = updated[0]?.id || '';
    commitBuildings(updated, `Removed ${target.name}.`);
    setSelectedBuildingId(fallbackId);
  };

  // ================= ROOM MANAGEMENT (DIRECT BUILDING -> FLOOR -> ROOMS, NO WINGS) =================
  const updateFloorRooms = (buildingId, floorId, newRoomsArray) => {
    const updated = buildings.map((b) => {
      if (b.id !== buildingId) return b;

      // If building has structured floor objects
      if (Array.isArray(b.floors) && typeof b.floors[0] === 'object') {
        const floorExists = b.floors.some((f) => String(f.id) === String(floorId));
        let updatedFloors;
        if (floorExists) {
          updatedFloors = b.floors.map((f) =>
            String(f.id) === String(floorId) ? { ...f, rooms: newRoomsArray } : f
          );
        } else {
          updatedFloors = [
            ...b.floors,
            { id: String(floorId), label: `Floor ${floorId}`, rooms: newRoomsArray },
          ];
        }
        return { ...b, floors: updatedFloors };
      }

      // If building is hostel with customRooms or string floors: convert to structured floors to save exact custom edits
      const currentFloors = Array.isArray(b.floors) ? b.floors : ['G', '1', '2', '3'];
      const structuredFloors = currentFloors.map((fl) => {
        const flId = typeof fl === 'object' ? fl.id : fl;
        const flLabel = typeof fl === 'object' ? fl.label : fl === 'G' ? 'Ground Floor (G)' : `Floor ${fl}`;
        if (String(flId) === String(floorId)) {
          return { id: String(flId), label: flLabel, rooms: newRoomsArray };
        }
        // copy existing generated or mapped rooms for the other floors
        const existingRooms = getRoomsForBuilding(b.id, flId, null, buildings);
        return { id: String(flId), label: flLabel, rooms: existingRooms };
      });

      return {
        ...b,
        floors: structuredFloors,
      };
    });

    commitBuildings(updated, `Updated Floor ${floorId} rooms for ${currentBuilding.shortName}`);
  };

  // Inline typo edit save
  const handleSaveInlineRoomEdit = (index) => {
    if (!editingRoomText.trim()) return;
    const nextRooms = [...currentFloorRooms];
    nextRooms[index] = editingRoomText.trim();
    updateFloorRooms(currentBuilding.id, roomActiveFloor, nextRooms);
    setEditingRoomIndex(null);
    setEditingRoomText('');
  };

  // Delete a room
  const handleDeleteRoom = (index) => {
    const roomToDelete = currentFloorRooms[index];
    if (!window.confirm(`Delete "${roomToDelete}" from Floor ${roomActiveFloor}?`)) return;
    const nextRooms = currentFloorRooms.filter((_, idx) => idx !== index);
    updateFloorRooms(currentBuilding.id, roomActiveFloor, nextRooms);
  };

  // Add single room
  const handleAddSingleRoom = (e) => {
    e.preventDefault();
    if (!newSingleRoomName.trim()) return;
    const nextRooms = [...currentFloorRooms, newSingleRoomName.trim()];
    updateFloorRooms(currentBuilding.id, roomActiveFloor, nextRooms);
    setNewSingleRoomName('');
  };

  // Bulk add rooms (newline or comma separated)
  const handleAddBulkRooms = () => {
    if (!bulkRoomText.trim()) return;
    const splitRooms = bulkRoomText
      .split(/[\n,]+/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (splitRooms.length === 0) return;
    const nextRooms = [...currentFloorRooms, ...splitRooms];
    updateFloorRooms(currentBuilding.id, roomActiveFloor, nextRooms);
    setBulkRoomText('');
    setIsBulkOpen(false);
    showToast(`Added ${splitRooms.length} rooms to Floor ${roomActiveFloor}!`);
  };

  // Quick standard room generator (Rooms 1 to 24)
  const handleGenerateStandardRooms = (count = 24) => {
    const prefix = currentBuilding.roomPrefix || 'Room ';
    const generated = [];
    for (let i = 1; i <= count; i += 1) {
      const padded = String(i).padStart(2, '0');
      if (roomActiveFloor === 'G') {
        generated.push(`${prefix}G-${padded}`);
      } else {
        generated.push(`${prefix}${roomActiveFloor}${padded}`);
      }
    }
    if (
      currentFloorRooms.length > 0 &&
      !window.confirm(`Floor ${roomActiveFloor} already has ${currentFloorRooms.length} rooms. Overwrite with standard ${count} rooms?`)
    ) {
      return;
    }
    updateFloorRooms(currentBuilding.id, roomActiveFloor, generated);
    showToast(`Generated standard rooms (${generated[0]} to ${generated[generated.length - 1]})!`);
  };

  // ================= TICKET ACTIONS =================
  const handleOpenTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setTicketEditStatus(ticket.status || 'PENDING');
    setTicketEditPriority(ticket.priority || 'MEDIUM');
    setTicketEditDept(ticket.department_name || DEPARTMENTS[0]);
    setTicketEditLocation(ticket.location || '');
    setTicketEditNotes(ticket.resolution_notes || '');
    setIsTicketEditModalOpen(true);
  };

  const handleSaveTicketChanges = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setTicketSaving(true);
    try {
      // 1. Update status
      if (ticketEditStatus !== selectedTicket.status) {
        if (ticketEditStatus === 'RESOLVED') {
          await resolveTicket(
            selectedTicket.id,
            ticketEditNotes.trim() || 'Resolved and verified by SuperAdmin Directorate.',
            null,
            currentUser?.name || 'SuperAdmin'
          ).catch(() => null);
        } else {
          await updateTicketStatus(
            selectedTicket.id,
            ticketEditStatus,
            ticketEditNotes.trim() || `Status updated to ${ticketEditStatus} by SuperAdmin`,
            currentUser?.email || 'superadmin@iiitnr.edu.in'
          ).catch(() => null);
        }
      }

      // 2. Update priority
      if (ticketEditPriority !== selectedTicket.priority) {
        await overrideTicketPriority(
          selectedTicket.id,
          ticketEditPriority,
          'SuperAdmin manual priority re-calibration in Data Studio'
        ).catch(() => null);
      }

      // 3. Update local list state
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? {
                ...t,
                status: ticketEditStatus,
                priority: ticketEditPriority,
                department_name: ticketEditDept,
                location: ticketEditLocation.trim() || t.location,
                resolution_notes: ticketEditNotes.trim() || t.resolution_notes,
              }
            : t
        )
      );

      showToast(`Updated ticket ${selectedTicket.tracking_code || `#${selectedTicket.id}`}!`);
      setIsTicketEditModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to update ticket.', 'error');
    } finally {
      setTicketSaving(false);
    }
  };

  const handleCreateManualTicket = async (e) => {
    e.preventDefault();
    if (newTicketTitle.trim().length < 5 || newTicketDesc.trim().length < 10) {
      showToast('Title must be at least 5 chars and Description 10 chars.', 'error');
      return;
    }
    setNewTicketSubmitting(true);
    try {
      const ticket = await submitComplaint({
        title: newTicketTitle.trim(),
        description: newTicketDesc.trim(),
        location: newTicketLocation.trim() || `${currentBuilding?.name}, Floor ${roomActiveFloor}`,
        student_name: 'Directorate / SuperAdmin',
        student_email: currentUser?.email || 'director@iiitnr.edu.in',
      });
      setTickets((prev) => [ticket, ...prev]);
      showToast(`Logged new ticket ${ticket.tracking_code || `#${ticket.id}`}!`);
      setIsNewTicketModalOpen(false);
      setNewTicketTitle('');
      setNewTicketDesc('');
      setNewTicketLocation('');
    } catch (err) {
      showToast(err.message || 'Ticket creation failed.', 'error');
    } finally {
      setNewTicketSubmitting(false);
    }
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchStatus = ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter;
      const q = ticketSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.tracking_code?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q) ||
        t.department_name?.toLowerCase().includes(q) ||
        t.student_name?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [tickets, ticketStatusFilter, ticketSearch]);

  // ================= JSON STUDIO ACTIONS =================
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildings, null, 2));
      setJsonCopyNotice(true);
      setTimeout(() => setJsonCopyNotice(false), 2400);
      showToast('Copied campus dataset JSON to clipboard!');
    } catch {
      showToast('Clipboard access denied.', 'error');
    }
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(buildings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `iiitnr_campus_dataset_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Downloaded dataset JSON backup file.');
  };

  const handleApplyImportJson = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importJsonInput);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Dataset must be a non-empty array of building entities.');
      }
      for (const b of parsed) {
        if (!b.id || !b.name) {
          throw new Error(`Every building must possess at least 'id' and 'name'. Offending item: ${JSON.stringify(b).slice(0, 50)}...`);
        }
      }
      commitBuildings(parsed, `Successfully imported ${parsed.length} buildings!`);
      setIsImportModalOpen(false);
      setImportJsonInput('');
    } catch (err) {
      setImportError(err.message || 'Invalid JSON format.');
    }
  };

  const handleResetToVerifiedDefaults = () => {
    const defaults = resetCampusBuildingsToDefault();
    setBuildings(defaults);
    setJsonText(JSON.stringify(defaults, null, 2));
    setIsResetConfirmOpen(false);
    showToast('Reset campus infrastructure data to verified institutional defaults.');
  };

  return (
    <div
      className={`w-full min-h-screen flex flex-col space-y-0 transition-colors duration-200 animate-fade-in ${
        isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-800'
      }`}
    >
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-2xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
            notification.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-600/40 shadow-rose-950/50'
              : isDark
              ? 'bg-[#161b22] text-zinc-100 border-emerald-800 shadow-2xl'
              : 'bg-white text-slate-900 border-emerald-400 shadow-2xl'
          }`}
        >
          <span>{notification.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Flush Edge-to-Edge Directorate Master Banner */}
      <div
        className={`w-full border-b px-4 sm:px-8 lg:px-12 py-8 relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#161b22] border-zinc-800 text-zinc-100'
            : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-xs'
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border ${
                isDark
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SUPERADMIN DIRECTORY &amp; INFRASTRUCTURE STUDIO</span>
            </div>
            <h1
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isDark ? 'text-zinc-100' : 'text-slate-900'
              }`}
            >
              Campus Data Correction &amp; Entry Hub
            </h1>
            <p
              className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
                isDark ? 'text-zinc-400' : 'text-slate-600'
              }`}
            >
              Direct institutional editor for IIIT Naya Raipur. Inspect and edit buildings, correct floor/room typos, batch-add classrooms or labs, manage maintenance tickets, and export verified datasets. No wings—clean hierarchical layout.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/superadmin"
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800'
              }`}
            >
              <span>← Directorate Console</span>
            </Link>
            <Link
              to="/map"
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-emerald-400 hover:text-emerald-300'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-emerald-800'
              }`}
            >
              <span>🗺️ Digital Twin Map</span>
            </Link>
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>{jsonCopyNotice ? '✓ Copied!' : '📋 Copy JSON'}</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t ${
            isDark ? 'border-zinc-800' : 'border-slate-300'
          }`}
        >
          <div
            className={`p-3 rounded-xl border transition-colors ${
              isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300 shadow-2xs'
            }`}
          >
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Total Buildings
            </span>
            <span className={`text-lg font-bold font-mono block ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              {buildings.length}
            </span>
            <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Active on Twin
            </span>
          </div>

          <div
            className={`p-3 rounded-xl border transition-colors ${
              isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300 shadow-2xs'
            }`}
          >
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Current Building
            </span>
            <span className={`text-sm font-bold truncate block ${isDark ? 'text-zinc-100' : 'text-slate-900'}`} title={currentBuilding?.name}>
              {currentBuilding?.shortName || currentBuilding?.name}
            </span>
            <span className={`text-[10px] font-mono block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              {currentBuilding?.category || 'CAMPUS'}
            </span>
          </div>

          <div
            className={`p-3 rounded-xl border transition-colors ${
              isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300 shadow-2xs'
            }`}
          >
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Floor {roomActiveFloor} Rooms
            </span>
            <span className={`text-lg font-bold font-mono block ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              {currentFloorRooms.length}
            </span>
            <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Direct Rooms &amp; Labs
            </span>
          </div>

          <div
            className={`p-3 rounded-xl border transition-colors ${
              isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300 shadow-2xs'
            }`}
          >
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Grievance Tickets
            </span>
            <span className={`text-lg font-bold font-mono block ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              {tickets.length}
            </span>
            <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              {tickets.filter((t) => t.status === 'PENDING').length} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Main Full-Width Studio Content Body */}
      <div className={`w-full px-4 sm:px-8 lg:px-12 py-8 space-y-6 ${isDark ? 'bg-[#0e1117]' : 'bg-white'}`}>
        {/* Master Navigation Tabs */}
        <div className={`flex items-center gap-2 border-b pb-2 overflow-x-auto ${isDark ? 'border-zinc-800' : 'border-slate-300'}`}>
          <button
            type="button"
            onClick={() => setActiveTab('CAMPUS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'CAMPUS'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-800 shadow-xs'
                  : 'bg-[#e2e8f0] text-emerald-800 border border-emerald-300 shadow-xs'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#cbd5e1]/40'
            }`}
          >
            <span>🏢 Campus Buildings &amp; Facilities</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-[#0e1117] text-zinc-300' : 'bg-white text-slate-700'}`}>
              {buildings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ROOMS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'ROOMS'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-800 shadow-xs'
                  : 'bg-[#e2e8f0] text-emerald-800 border border-emerald-300 shadow-xs'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#cbd5e1]/40'
            }`}
          >
            <span>🚪 Floor &amp; Room Directory (No Wings)</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-[#0e1117] text-zinc-300' : 'bg-white text-slate-700'}`}>
              {currentFloorRooms.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TICKETS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'TICKETS'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-800 shadow-xs'
                  : 'bg-[#e2e8f0] text-emerald-800 border border-emerald-300 shadow-xs'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#cbd5e1]/40'
            }`}
          >
            <span>🎫 Tickets &amp; Grievance Manager</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-[#0e1117] text-zinc-300' : 'bg-white text-slate-700'}`}>
              {tickets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('JSON')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'JSON'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-800 shadow-xs'
                  : 'bg-[#e2e8f0] text-emerald-800 border border-emerald-300 shadow-xs'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#cbd5e1]/40'
            }`}
          >
            <span>💾 Dataset Backup &amp; JSON Studio</span>
          </button>
        </div>

        {/* TAB 1: CAMPUS BUILDINGS & FACILITIES */}
        {activeTab === 'CAMPUS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Buildings Directory List */}
            <div className="lg:col-span-5 space-y-4">
              <div className={`p-4 rounded-2xl border space-y-3 transition-colors ${
                isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Campus Directory</h3>
                  <button
                    type="button"
                    onClick={() => setIsNewBuildingModalOpen(true)}
                    className="btn-botanical-primary"
                  >
                    <span>+ Add Building</span>
                  </button>
                </div>

                {/* Search & Category Filter */}
                <input
                  type="text"
                  value={buildingSearch}
                  onChange={(e) => setBuildingSearch(e.target.value)}
                  placeholder="Filter buildings by name, badge, ID..."
                  className={`enterprise-input text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {CAMPUS_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setBuildingFilterCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                        buildingFilterCategory === cat.id
                          ? isDark
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : isDark
                          ? 'bg-[#0e1117] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                          : 'bg-[#e2e8f0] text-slate-600 hover:text-slate-900 border border-slate-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Buildings Cards List */}
                <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                  {filteredBuildings.map((bldg) => {
                    const isSelected = bldg.id === currentBuilding?.id;
                    const badge = bldg.trace?.badge || bldg.mapPin?.badge || 'BLDG';
                    const color = bldg.trace?.color || bldg.mapPin?.color || '#10b981';
                    return (
                      <div
                        key={bldg.id}
                        onClick={() => setSelectedBuildingId(bldg.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? isDark
                              ? 'bg-[#0e1117] border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                              : 'bg-white border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                            : isDark
                            ? 'bg-[#0e1117]/60 border-zinc-800 hover:bg-[#0e1117] hover:border-zinc-700'
                            : 'bg-[#e2e8f0] border-slate-300 hover:bg-[#cbd5e1]/60 hover:border-slate-400'
                        }`}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className={`font-semibold text-xs truncate block ${
                              isDark ? 'text-zinc-100' : 'text-slate-900'
                            }`}>
                              {bldg.name}
                            </span>
                          </div>
                          <div className={`flex items-center gap-2 text-[11px] font-mono ${
                            isDark ? 'text-zinc-400' : 'text-slate-600'
                          }`}>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {badge}
                            </span>
                            <span>{bldg.category}</span>
                            <span>·</span>
                            <span>{bldg.shortName}</span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className={`text-[11px] font-mono ${
                            isDark ? 'text-emerald-400' : 'text-emerald-700'
                          }`}>
                            {Array.isArray(bldg.floors) ? `${bldg.floors.length} Floors` : '4 Floors'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Building Details & Attributes Editor */}
            <div className="lg:col-span-7">
              {currentBuilding ? (
                <div className={`p-6 rounded-2xl border space-y-5 transition-colors ${
                  isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300'
                }`}>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
                    isDark ? 'border-zinc-800' : 'border-slate-300'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono uppercase tracking-wider ${
                          isDark ? 'text-zinc-400' : 'text-slate-500'
                        }`}>
                          Editing Building Entity
                        </span>
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] border ${
                          isDark
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {currentBuilding.id}
                        </span>
                      </div>
                      <h2 className={`text-lg font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                        {currentBuilding.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBuildingId(currentBuilding.id);
                          setActiveTab('ROOMS');
                        }}
                        className="btn-botanical-moss"
                      >
                        Edit Rooms &amp; Labs →
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBuilding(currentBuilding.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Form Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Official Full Name
                      </label>
                      <input
                        type="text"
                        value={currentBuilding.name || ''}
                        onChange={(e) => handleUpdateCurrentBuildingField('name', e.target.value)}
                        className={`enterprise-input text-xs ${
                          isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Short Name (Display Label)
                      </label>
                      <input
                        type="text"
                        value={currentBuilding.shortName || ''}
                        onChange={(e) => handleUpdateCurrentBuildingField('shortName', e.target.value)}
                        className={`enterprise-input text-xs ${
                          isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Category Classification
                      </label>
                      <select
                        value={currentBuilding.category || 'ACADEMIC'}
                        onChange={(e) => handleUpdateCurrentBuildingField('category', e.target.value)}
                        className={`enterprise-input text-xs ${
                          isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="HOSTEL">HOSTEL (Student Residence)</option>
                        <option value="ACADEMIC">ACADEMIC (Lecture Halls &amp; Labs)</option>
                        <option value="AMENITY">AMENITY (Canteen, Amphitheatre, SAC)</option>
                        <option value="UTILITY">UTILITY (Admin, Estate, Substation)</option>
                        <option value="SPORTS">SPORTS (Sports Complex, Courts, Ground)</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Map Badge Text
                      </label>
                      <input
                        type="text"
                        value={currentBuilding.trace?.badge || currentBuilding.mapPin?.badge || ''}
                        onChange={(e) => handleUpdateCurrentBuildingField('badge', e.target.value)}
                        className={`enterprise-input text-xs uppercase font-mono ${
                          isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Accent / Marker Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentBuilding.trace?.color || currentBuilding.mapPin?.color || '#10b981'}
                          onChange={(e) => handleUpdateCurrentBuildingField('color', e.target.value)}
                          className="w-9 h-9 rounded-lg bg-transparent border border-white/[0.1] cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={currentBuilding.trace?.color || currentBuilding.mapPin?.color || '#10b981'}
                          onChange={(e) => handleUpdateCurrentBuildingField('color', e.target.value)}
                          className={`enterprise-input text-xs font-mono ${
                            isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        GPS &amp; Landmark Coordinates Description
                      </label>
                      <input
                        type="text"
                        value={currentBuilding.gps || ''}
                        onChange={(e) => handleUpdateCurrentBuildingField('gps', e.target.value)}
                        className={`enterprise-input text-xs ${
                          isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Facility Description &amp; Specifications
                      </label>
                      <textarea
                        rows={3}
                        value={currentBuilding.description || ''}
                        onChange={(e) => handleUpdateCurrentBuildingField('description', e.target.value)}
                        className={`enterprise-input text-xs ${
                          isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Digital Twin SVG Coordinates Editor */}
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                  }`}>
                    <span className={`text-[11px] font-mono uppercase tracking-wider font-bold block ${
                      isDark ? 'text-emerald-400' : 'text-emerald-800'
                    }`}>
                      📍 Digital Twin Vector Coordinates (Center X, Y, W, H, Angle)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className={`block text-[10px] font-mono mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Center X (cx)</label>
                        <input
                          type="number"
                          value={currentBuilding.trace?.cx || 0}
                          onChange={(e) => handleUpdateCurrentBuildingField('trace.cx', e.target.value)}
                          className={`enterprise-input text-xs font-mono ${
                            isDark ? 'bg-[#161b22] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-mono mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Center Y (cy)</label>
                        <input
                          type="number"
                          value={currentBuilding.trace?.cy || 0}
                          onChange={(e) => handleUpdateCurrentBuildingField('trace.cy', e.target.value)}
                          className={`enterprise-input text-xs font-mono ${
                            isDark ? 'bg-[#161b22] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-mono mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Width (w)</label>
                        <input
                          type="number"
                          value={currentBuilding.trace?.w || 0}
                          onChange={(e) => handleUpdateCurrentBuildingField('trace.w', e.target.value)}
                          className={`enterprise-input text-xs font-mono ${
                            isDark ? 'bg-[#161b22] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-mono mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Height (h)</label>
                        <input
                          type="number"
                          value={currentBuilding.trace?.h || 0}
                          onChange={(e) => handleUpdateCurrentBuildingField('trace.h', e.target.value)}
                          className={`enterprise-input text-xs font-mono ${
                            isDark ? 'bg-[#161b22] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-mono mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Angle (deg)</label>
                        <input
                          type="number"
                          value={currentBuilding.trace?.angle || 0}
                          onChange={(e) => handleUpdateCurrentBuildingField('trace.angle', e.target.value)}
                          className={`enterprise-input text-xs font-mono ${
                            isDark ? 'bg-[#161b22] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`p-12 text-center rounded-2xl border ${
                  isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-400' : 'bg-[#f1f5f9] border-slate-300 text-slate-600'
                }`}>
                  Select a building to view and modify its properties.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FLOOR & ROOM DIRECTORY (NO WINGS!) */}
        {activeTab === 'ROOMS' && (
          <div className="space-y-6">
            {/* Header Toolbar: Building Selector & Floor Pills */}
            <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="space-y-1">
                  <label className={`block text-[10px] font-mono uppercase font-bold ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}>
                    Active Building
                  </label>
                  <select
                    value={currentBuilding?.id || ''}
                    onChange={(e) => setSelectedBuildingId(e.target.value)}
                    className={`enterprise-input text-xs font-semibold min-w-[240px] ${
                      isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={`block text-[10px] font-mono uppercase font-bold ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}>
                    Select Floor
                  </label>
                  <div className="flex items-center gap-1.5">
                    {availableFloors.map((fl) => {
                      const isFlActive = String(fl.id) === String(roomActiveFloor);
                      return (
                        <button
                          key={fl.id}
                          type="button"
                          onClick={() => setRoomActiveFloor(fl.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isFlActive
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isDark
                              ? 'bg-[#0e1117] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800'
                              : 'bg-[#e2e8f0] text-slate-600 hover:text-slate-900 hover:bg-[#cbd5e1] border border-slate-300'
                          }`}
                        >
                          {fl.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBulkOpen(!isBulkOpen)}
                  className="btn-botanical-moss"
                >
                  <span>⚡ Batch / Bulk Add Rooms</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateStandardRooms(24)}
                  className="btn-botanical-secondary"
                  title="Generate Room 101 to 124 automatically"
                >
                  <span>Auto-Gen Standard 24</span>
                </button>
              </div>
            </div>

            {/* Bulk Add Drawer (Collapsible) */}
            {isBulkOpen && (
              <div className={`p-5 rounded-2xl border space-y-3 animate-fade-in transition-colors ${
                isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                      isDark ? 'text-zinc-100' : 'text-slate-900'
                    }`}>
                      ⚡ Batch Add Rooms to {currentBuilding?.shortName} (Floor {roomActiveFloor})
                    </h4>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Enter multiple room numbers or lab names separated by newlines or commas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBulkOpen(false)}
                    className={`text-xs cursor-pointer ${
                      isDark ? 'text-zinc-400 hover:text-zinc-100' : 'text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    ✕ Close
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={bulkRoomText}
                  onChange={(e) => setBulkRoomText(e.target.value)}
                  placeholder={`Room ${roomActiveFloor}01\nRoom ${roomActiveFloor}02\n${roomActiveFloor === '1' ? 'AI Lab 1\nLanguage Lab' : 'Research Bay 2'}`}
                  className={`enterprise-input text-xs font-mono leading-relaxed ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkRoomText('')}
                    className={`px-3 py-1.5 text-xs cursor-pointer ${
                      isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleAddBulkRooms}
                    className="btn-botanical-primary"
                  >
                    Add All to Floor {roomActiveFloor}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Add Single Room & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <form onSubmit={handleAddSingleRoom} className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={newSingleRoomName}
                  onChange={(e) => setNewSingleRoomName(e.target.value)}
                  placeholder={`Add room on Floor ${roomActiveFloor} (e.g. Room ${roomActiveFloor}05 or IDEA Lab)...`}
                  className={`enterprise-input text-xs flex-1 ${
                    isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="submit"
                  className="btn-botanical-primary shrink-0"
                >
                  + Add
                </button>
              </form>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  placeholder="Filter rooms on this floor..."
                  className={`enterprise-input text-xs w-full sm:w-64 ${
                    isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <span className={`text-[11px] font-mono shrink-0 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {filteredRooms.length} rooms
                </span>
              </div>
            </div>

            {/* Room Cards Grid with Inline Click-to-Edit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredRooms.length === 0 ? (
                <div className={`col-span-full p-8 text-center rounded-xl border text-xs ${
                  isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-400' : 'bg-[#f1f5f9] border-slate-300 text-slate-600'
                }`}>
                  No rooms or labs mapped on Floor {roomActiveFloor} yet. Use the single add or batch add above.
                </div>
              ) : (
                filteredRooms.map((roomName, idx) => {
                  const isEditing = editingRoomIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 group ${
                        isDark
                          ? 'bg-[#161b22] border-zinc-800 hover:border-emerald-500/60'
                          : 'bg-[#f1f5f9] border-slate-300 hover:border-emerald-500 shadow-2xs'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={editingRoomText}
                              onChange={(e) => setEditingRoomText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineRoomEdit(idx);
                                if (e.key === 'Escape') setEditingRoomIndex(null);
                              }}
                              className={`enterprise-input text-xs py-1 px-2 ${
                                isDark ? 'bg-[#0e1117] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveInlineRoomEdit(idx)}
                              className="p-1 rounded bg-emerald-600 text-white text-xs font-bold shrink-0 cursor-pointer"
                              title="Save Changes"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRoomIndex(null)}
                              className={`p-1 text-xs shrink-0 cursor-pointer ${
                                isDark ? 'text-zinc-400 hover:text-zinc-100' : 'text-slate-400 hover:text-slate-900'
                              }`}
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingRoomIndex(idx);
                              setEditingRoomText(roomName);
                            }}
                            className="cursor-pointer"
                            title="Click to edit room name inline"
                          >
                            <span className={`font-medium text-xs transition-colors block truncate ${
                              isDark ? 'text-zinc-100 group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-700'
                            }`}>
                              {roomName}
                            </span>
                            <span className={`text-[10px] font-mono block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                              Floor {roomActiveFloor} · Click to rename
                            </span>
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRoomIndex(idx);
                              setEditingRoomText(roomName);
                            }}
                            className={`p-1.5 rounded text-xs cursor-pointer ${
                              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                            }`}
                            title="Edit Typo"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(idx)}
                            className={`p-1.5 rounded text-xs cursor-pointer ${
                              isDark ? 'hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400' : 'hover:bg-rose-100 text-slate-500 hover:text-rose-600'
                            }`}
                            title="Delete Room"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TICKETS & GRIEVANCE MANAGER */}
        {activeTab === 'TICKETS' && (
          <div className="space-y-4">
            {/* Filter and Action Header */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300'
            }`}>
              <div className="flex items-center gap-2 flex-1 max-w-lg">
                <input
                  type="text"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  placeholder="Search tickets by tracking code, room, student..."
                  className={`enterprise-input text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={loadTickets}
                  className={`px-3 py-2 rounded-lg text-xs font-mono shrink-0 cursor-pointer border transition-colors ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                      : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-800 border-slate-300'
                  }`}
                  title="Reload from backend"
                >
                  🔄 Refresh
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTicketStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                        ticketStatusFilter === st
                          ? isDark
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : isDark
                          ? 'bg-[#0e1117] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                          : 'bg-[#e2e8f0] text-slate-600 hover:text-slate-900 border border-slate-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(true)}
                  className="btn-botanical-primary"
                >
                  + Log Ticket
                </button>
              </div>
            </div>

            {/* Tickets Table */}
            <div className={`rounded-2xl border overflow-hidden transition-colors ${
              isDark ? 'border-zinc-800 bg-[#161b22]' : 'border-slate-300 bg-white'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b font-mono uppercase text-[10px] transition-colors ${
                    isDark ? 'border-zinc-800 bg-[#0e1117] text-zinc-400' : 'border-slate-300 bg-[#e2e8f0] text-slate-700'
                  }`}>
                    <tr>
                      <th className="py-3 px-4">Ticket</th>
                      <th className="py-3 px-4">Issue Title &amp; Details</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Department &amp; Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-200'}`}>
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={`py-8 text-center ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                          No matching grievance tickets located.
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((t) => (
                        <tr
                          key={t.id || t.tracking_code}
                          className={`transition-colors ${
                            isDark ? 'hover:bg-zinc-800/40 text-zinc-200' : 'hover:bg-[#cbd5e1]/40 text-slate-800'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-500 whitespace-nowrap">
                            {t.tracking_code || `#${t.id}`}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <span className={`font-semibold block truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                              {t.title}
                            </span>
                            <span className={`text-[11px] truncate block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                              {t.description}
                            </span>
                          </td>
                          <td className={`py-3.5 px-4 max-w-[200px] ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                            <span className="block truncate font-medium">{t.location || 'Campus'}</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`block font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                              {t.department_name || 'General'}
                            </span>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold mt-0.5 border ${
                                t.priority === 'CRITICAL'
                                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  : t.priority === 'HIGH'
                                  ? 'bg-[#D9824C]/15 text-[#D9824C] border-[#D9824C]/30'
                                  : isDark
                                  ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                  : 'bg-slate-200 text-slate-800 border-slate-300'
                              }`}
                            >
                              {t.priority || 'MEDIUM'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                t.status === 'RESOLVED' || t.status === 'CLOSED'
                                  ? isDark
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : t.status === 'IN_PROGRESS'
                                  ? isDark
                                    ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                  : isDark
                                  ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                  : 'bg-slate-200 text-slate-800 border-slate-300'
                              }`}
                            >
                              {t.status || 'PENDING'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenTicketModal(t)}
                              className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-colors cursor-pointer border ${
                                isDark
                                  ? 'bg-[#0e1117] hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-800 border-slate-300'
                              }`}
                            >
                              ✏️ Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: JSON STUDIO & BACKUP */}
        {activeTab === 'JSON' && (
          <div className="space-y-4">
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
            }`}>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                  Full Campus Dataset JSON
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Complete serialized data twin schema currently loaded in browser memory.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="btn-botanical-secondary"
                >
                  📋 Copy JSON
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="btn-botanical-moss"
                >
                  📥 Download JSON
                </button>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="btn-botanical-primary"
                >
                  📤 Import Custom JSON
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  🔄 Reset Defaults
                </button>
              </div>
            </div>

            {/* Read-Only Syntax Viewer */}
            <div className={`p-4 rounded-2xl border overflow-hidden ${
              isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#0e1117] border-slate-300'
            }`}>
              <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[580px] p-2 leading-relaxed">
                {jsonText}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD NEW BUILDING */}
      {isNewBuildingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className={`rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border transition-all ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-zinc-800' : 'border-slate-300'
            }`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${
                isDark ? 'text-zinc-100' : 'text-slate-900'
              }`}>
                + Add New Campus Building / Facility
              </h3>
              <button
                type="button"
                onClick={() => setIsNewBuildingModalOpen(false)}
                className={`cursor-pointer ${isDark ? 'text-zinc-400 hover:text-zinc-100' : 'text-slate-400 hover:text-slate-900'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBuilding} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Full Building Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Academic Research Tower"
                  value={newBldgName}
                  onChange={(e) => setNewBldgName(e.target.value)}
                  className={`enterprise-input text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Short Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Research Tower"
                    value={newBldgShortName}
                    onChange={(e) => setNewBldgShortName(e.target.value)}
                    className={`enterprise-input text-xs ${
                      isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Category
                  </label>
                  <select
                    value={newBldgCategory}
                    onChange={(e) => setNewBldgCategory(e.target.value)}
                    className={`enterprise-input text-xs ${
                      isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="HOSTEL">HOSTEL</option>
                    <option value="AMENITY">AMENITY</option>
                    <option value="UTILITY">UTILITY</option>
                    <option value="SPORTS">SPORTS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Badge Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TOWER"
                    value={newBldgBadge}
                    onChange={(e) => setNewBldgBadge(e.target.value)}
                    className={`enterprise-input text-xs font-mono uppercase ${
                      isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Marker Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newBldgColor}
                      onChange={(e) => setNewBldgColor(e.target.value)}
                      className="w-8 h-8 rounded bg-transparent border border-white/[0.1] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newBldgColor}
                      onChange={(e) => setNewBldgColor(e.target.value)}
                      className={`enterprise-input text-xs font-mono ${
                        isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Facility specifications and purpose..."
                  value={newBldgDesc}
                  onChange={(e) => setNewBldgDesc(e.target.value)}
                  className={`enterprise-input text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-2 pt-2 border-t ${
                isDark ? 'border-zinc-800' : 'border-slate-300'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsNewBuildingModalOpen(false)}
                  className="btn-botanical-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-botanical-primary"
                >
                  Create Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TICKET */}
      {isTicketEditModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className={`rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border transition-all ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-zinc-800' : 'border-slate-300'
            }`}>
              <div>
                <span className={`text-[10px] font-mono uppercase font-bold block ${
                  isDark ? 'text-emerald-400' : 'text-emerald-800'
                }`}>
                  Incident Controller
                </span>
                <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                  Edit Ticket {selectedTicket.tracking_code || `#${selectedTicket.id}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTicketEditModalOpen(false)}
                className={`cursor-pointer ${isDark ? 'text-zinc-400 hover:text-zinc-100' : 'text-slate-400 hover:text-slate-900'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTicketChanges} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Issue Summary
                </label>
                <div className={`p-2.5 rounded-lg text-xs border ${
                  isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                }`}>
                  {selectedTicket.title}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Lifecycle Status
                  </label>
                  <select
                    value={ticketEditStatus}
                    onChange={(e) => setTicketEditStatus(e.target.value)}
                    className={`enterprise-input text-xs ${
                      isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    SLA Priority Tier
                  </label>
                  <select
                    value={ticketEditPriority}
                    onChange={(e) => setTicketEditPriority(e.target.value)}
                    className={`enterprise-input text-xs ${
                      isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {PRIORITY_OPTIONS.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Assigned Department
                  </label>
                  <select
                    value={ticketEditDept}
                    onChange={(e) => setTicketEditDept(e.target.value)}
                    className={`enterprise-input text-xs ${
                      isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Location String
                  </label>
                  <input
                    type="text"
                    value={ticketEditLocation}
                    onChange={(e) => setTicketEditLocation(e.target.value)}
                    className={`enterprise-input text-xs ${
                      isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Resolution Notes / Work Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Details of repair, parts replaced, technician sign-off..."
                  value={ticketEditNotes}
                  onChange={(e) => setTicketEditNotes(e.target.value)}
                  className={`enterprise-input text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-2 pt-2 border-t ${
                isDark ? 'border-zinc-800' : 'border-slate-300'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsTicketEditModalOpen(false)}
                  className="btn-botanical-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ticketSaving}
                  className="btn-botanical-primary"
                >
                  {ticketSaving ? 'Saving...' : 'Save Ticket Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LOG MANUAL TICKET */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className={`rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border transition-all ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-zinc-800' : 'border-slate-300'
            }`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${
                isDark ? 'text-zinc-100' : 'text-slate-900'
              }`}>
                + Manually Log Institutional Grievance
              </h3>
              <button
                type="button"
                onClick={() => setIsNewTicketModalOpen(false)}
                className={`cursor-pointer ${isDark ? 'text-zinc-400 hover:text-zinc-100' : 'text-slate-400 hover:text-slate-900'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualTicket} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Issue Title * (Min 5 chars)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab 301 projector lamp flickering"
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  className={`enterprise-input text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Location (Building, Floor, Room)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${currentBuilding?.name}, Room 301`}
                  value={newTicketLocation}
                  onChange={(e) => setNewTicketLocation(e.target.value)}
                  className={`enterprise-input text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Description * (Min 10 chars)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the maintenance failure or repair needed..."
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                  className={`enterprise-input text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-2 pt-2 border-t ${
                isDark ? 'border-zinc-800' : 'border-slate-300'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="btn-botanical-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newTicketSubmitting}
                  className="btn-botanical-primary"
                >
                  {newTicketSubmitting ? 'Submitting...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: IMPORT JSON */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className={`rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border transition-all ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-zinc-800' : 'border-slate-300'
            }`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${
                isDark ? 'text-zinc-100' : 'text-slate-900'
              }`}>
                📥 Import Campus Infrastructure JSON
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className={`cursor-pointer ${isDark ? 'text-zinc-400 hover:text-zinc-100' : 'text-slate-400 hover:text-slate-900'}`}
              >
                ✕
              </button>
            </div>

            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Paste the serialized JSON array representing campus buildings and facilities. Validation verifies structure before persisting to browser memory.
            </p>

            {importError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs">
                ⚠️ {importError}
              </div>
            )}

            <textarea
              rows={8}
              value={importJsonInput}
              onChange={(e) => setImportJsonInput(e.target.value)}
              placeholder='[ { "id": "academic_block", "name": "Main Academic & Administrative Building", ... } ]'
              className={`enterprise-input text-xs font-mono leading-relaxed ${
                isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />

            <div className={`flex justify-end gap-2 pt-2 border-t ${
              isDark ? 'border-zinc-800' : 'border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="btn-botanical-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyImportJson}
                className="btn-botanical-primary"
              >
                Validate &amp; Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: RESET CONFIRMATION */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className={`rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-500/30 transition-all ${
            isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-[#f1f5f9] text-slate-900'
          }`}>
            <div className="flex items-center gap-3 text-rose-400">
              <span className="text-2xl">⚠️</span>
              <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${
                isDark ? 'text-zinc-100' : 'text-slate-900'
              }`}>
                Reset to Verified Institutional Defaults?
              </h3>
            </div>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              This will clear all custom local building additions, room edits, and position tweaks, restoring the official satellite-traced digital twin dataset.
            </p>

            <div className={`flex justify-end gap-2 pt-2 border-t ${
              isDark ? 'border-zinc-800' : 'border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="btn-botanical-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToVerifiedDefaults}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Yes, Restore Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
