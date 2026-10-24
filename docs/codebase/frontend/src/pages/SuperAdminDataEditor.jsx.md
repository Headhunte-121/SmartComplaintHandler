# SuperAdmin Campus & Ticket Data Studio (`SuperAdminDataEditor.jsx`)

Comprehensive architectural and line-by-line documentation for `frontend/src/pages/SuperAdminDataEditor.jsx`. This document provides collegiate viva committees, code reviewers, and systems architects with an exhaustive dissection of the master spatial data studio, direct hierarchical room manager, incident triage control, and serialized twin backup pipeline.

---

## 1. Module Header & Library Imports

```jsx
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
```

### Plain-English Purpose
The header imports essential React state hooks, navigation utilities, global authentication and theme contexts, data layer persistence functions, and backend REST client endpoints. Together, they equip Directorate administrators with tools to modify institutional spatial entities without touching the underlying source code.

### Line-by-Line Breakdown
- **Lines 1–10**: Multi-line comment detailing the primary architectural responsibilities of the studio module.
- **Line 11**: Imports `React`, `useState` (state variable manager), `useEffect` (side-effect coordinator), `useMemo` (cached value computer), and `useRef` (persistent mutable reference pointer).
- **Line 12**: Imports `Link` (client-side routing hyperlink) and `useNavigate` (imperative routing redirection hook) from `react-router-dom`.
- **Line 13**: Imports `useAuth` hook from `../context/AuthContext` to verify administrative clearance (`isSuperAdmin`) and retrieve operator credentials (`currentUser`).
- **Line 14**: Imports `useTheme` hook from `../context/ThemeContext` to govern dark/light visual modes.
- **Lines 15–23**: Imports institutional campus data models and helper functions from `../data/iiitnrCampusData`:
  - `IIITNR_MAP_UPDATED_EVENT`: Custom DOM window event string used to trigger real-time reactive sync across browser tabs and canvas twin instances.
  - `HOSTEL_FLOORS`: Fallback array defining standard residential levels (`['G', '1', '2', '3']`).
  - `getCampusBuildings`: Reader function retrieving the current array of building objects from browser `localStorage` or initial defaults.
  - `saveCustomCampusBuildings`: Writer function persisting modified building structures into `localStorage` and broadcasting the update event.
  - `resetCampusBuildingsToDefault`: Resets the stored infrastructure array to factory-verified spatial coordinates.
  - `getFloorsForBuilding` & `getRoomsForBuilding`: Accessor functions retrieving floor levels and rooms mapped directly to a designated building ID.
- **Line 24**: Imports complaint retrieval (`fetchComplaints`) and complaint creation (`submitComplaint`) REST endpoints.
- **Line 25**: Imports `updateTicketStatus` (transitions ticket through lifecycle states) and `resolveTicket` (closes incident with verified proof) from `../api/sla`.
- **Line 26**: Imports `overrideTicketPriority` from `../api/triage` for Directorate manual escalation.
- **Line 27**: Imports `reassignSquad` from `../api/assignment` to route tickets across maintenance squads.

### Deep Term & Concept Expansion
- **Custom DOM Event (`IIITNR_MAP_UPDATED_EVENT`)**: In standard C/Python programming, when one thread modifies shared data in a global struct, other threads need an event notification (similar to a POSIX condition variable or OS signal `SIGUSR1`). In the browser, `window.dispatchEvent(new Event('iiitnr_campus_map_updated'))` broadcasts an event across all decoupled React component instances, alerting them to re-read updated records from storage.

---

## 2. Static Studio Constants & Dictionaries

```jsx
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
```

### Plain-English Purpose
These constants act as immutable enum lookup tables. They define category filters for buildings, supported maintenance departments, priority tiers, and deterministic ticket lifecycle states.

### Line-by-Line Breakdown
- **Lines 29–36**: `CAMPUS_CATEGORIES` provides a 6-item array of category filter tokens (`ALL`, `HOSTEL`, `ACADEMIC`, `AMENITY`, `UTILITY`, `SPORTS`) with human-readable labels.
- **Lines 38–45**: `DEPARTMENTS` defines the 6 operational engineering departments recognized across campus facilities.
- **Line 47**: `PRIORITY_OPTIONS` enumerates the 4 standardized triage tiers governing SLA resolution windows.
- **Line 48**: `STATUS_OPTIONS` enumerates the 4 deterministic lifecycle states for campus grievances.

---

## 3. Component Declaration & State Initializers

```jsx
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
```

### Plain-English Purpose
This section initializes the component's state memory. It defines variables tracking the active studio view (`CAMPUS`, `ROOMS`, `TICKETS`, `JSON`), selected infrastructure entities, inline room editing inputs, grievance inspection modal fields, raw JSON buffers, and new building creation parameters.

### Line-by-Line Breakdown
- **Lines 50–53**: Exports default component function `SuperAdminDataEditor`. Hooks `useNavigate`, `useAuth`, and `useTheme` are invoked.
- **Line 56**: `activeTab` holds the current studio tab string, initialized to `'CAMPUS'`.
- **Lines 59–64**:
  - `buildings`: Master array of building entities. Initialized via lazy callback `() => getCampusBuildings()` to prevent disk reads on subsequent re-renders.
  - `selectedBuildingId`: The active building ID string being examined.
  - `buildingFilterCategory`: Category filter token (`ALL`, `HOSTEL`, etc.).
  - `buildingSearch`: User text query for finding buildings.
  - `hasUnsavedChanges`: Boolean dirty flag.
  - `notification`: Toast message object `{ message, type }`.
- **Lines 67–73**:
  - `roomActiveFloor`: Selected floor string (`'G'`, `'1'`, `'2'`, `'3'`).
  - `roomSearchQuery`: Text filter for specific rooms/labs on the active floor.
  - `editingRoomIndex`: Integer index of room currently undergoing inline typo correction (`null` when idle).
  - `editingRoomText`: Temporary text string inside the active inline edit input.
  - `newSingleRoomName`: Input buffer for adding one room.
  - `bulkRoomText`: Multi-line text buffer for batch adding rooms.
  - `isBulkOpen`: Boolean toggle for expanding the batch room drawer.
- **Lines 76–88**:
  - `tickets`: Array of complaint records retrieved from backend.
  - `loadingTickets`: Boolean loading spinner flag.
  - `ticketSearch` & `ticketStatusFilter`: Ticket query and status filters.
  - `selectedTicket`: Complaint object currently loaded into the editor modal.
  - `ticketEditStatus`, `ticketEditPriority`, `ticketEditDept`, `ticketEditLocation`, `ticketEditNotes`: Form fields for modifying ticket attributes.
  - `ticketSaving`: Async mutation in-flight boolean flag.
- **Lines 90–95**: Form buffers (`newTicketTitle`, `newTicketDesc`, `newTicketLocation`, `newTicketSubmitting`) for manually logging grievances directly from Directorate level.
- **Lines 97–102**: JSON Studio state variables holding formatted string representations, copy feedback flags, import input buffers, validation error strings, and reset confirmation modal toggles.
- **Lines 105–112**: Modal input buffers for registering an entirely new campus building.

---

## 4. Toast Notification & Synchronization Lifecycle

```jsx
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
```

### Plain-English Purpose
This block manages transient feedback alerts and keeps the UI synchronized with storage and the backend. If another browser tab or the digital twin canvas modifies a building's coordinates, the event listener intercepts the change and updates this editor in real-time. If the backend is temporarily offline, a robust fallback dataset ensures the Directorate can continue demonstrations without UI crashes.

### Line-by-Line Breakdown
- **Lines 115–118**: `showToast` updates `notification` state with text and type, scheduling an automatic reset timer after $3800\text{ ms}$.
- **Lines 121–130**: `useEffect` mounts a window listener for `IIITNR_MAP_UPDATED_EVENT`. When received, `handleUpdate` re-reads buildings from storage, updating both `buildings` state and formatted `jsonText`. The cleanup function unregisters the listener upon unmount to prevent memory leaks.
- **Lines 133–188**: `loadTickets` queries `fetchComplaints({ limit: 200 })`. If the network request fails, it catches the error and populates three realistic mock complaints covering Electrical, IT Support, and Plumbing incidents across Academic and Hostel blocks.
- **Lines 190–192**: Secondary `useEffect` invokes `loadTickets()` on initial page load.

---

## 5. Derived Computations & Memoized Filtering

```jsx
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
```

### Plain-English Purpose
These `useMemo` blocks perform high-speed, cached search and relational lookups. They ensure that when an administrator types a search letter or selects a different building, filtering runs with sub-millisecond latency without recalculating unchanged data collections.

### Line-by-Line Breakdown
- **Lines 195–207**: `filteredBuildings` filters the master `buildings` array by category matches and multi-field substring queries (`name`, `shortName`, `id`, `trace.badge`).
- **Lines 210–212**: `currentBuilding` finds the building matching `selectedBuildingId`, defaulting to `buildings[0]` as a failsafe.
- **Lines 215–218**: `availableFloors` retrieves the array of floor levels for `currentBuilding.id`.
- **Lines 221–228**: Guard effect verifying `roomActiveFloor` exists on the newly selected building. If an administrator switches from a 4-floor hostel to a single-story canteen, `roomActiveFloor` safely snaps back to `'G'`.
- **Lines 231–234**: `currentFloorRooms` retrieves rooms for `currentBuilding.id` and `roomActiveFloor` using the wing-free hierarchical signature `getRoomsForBuilding(bldgId, floorId, null, dataset)`.
- **Lines 237–241**: `filteredRooms` filters current floor rooms by `roomSearchQuery`.
- **Lines 558–571**: `filteredTickets` filters incident tickets by status code and search terms across tracking code, title, location, department, and student name.

---

## 6. Campus Building Mutation Handlers

```jsx
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
```

### Plain-English Purpose
These functions provide full CRUD (Create, Read, Update, Delete) capabilities over campus infrastructure entities. When an administrator modifies SVG coordinates, color accents, or deletes a building, changes are validated, serialized, persisted to browser storage, and broadcast across the application.

### Line-by-Line Breakdown
- **Lines 244–250**: `commitBuildings` is the centralized persistence gateway. It sets React state, invokes `saveCustomCampusBuildings`, updates formatted JSON text, clears dirty flags, and emits a toast notification.
- **Lines 253–291**: `handleUpdateCurrentBuildingField` handles nested property updates:
  - If `field.startsWith('trace.')`, parses numerical properties (`cx`, `cy`, `w`, `h`, `angle`) via `Number(value) || 0`.
  - If `badge` or `color`, updates both `mapPin` and `trace` sub-objects in lockstep.
  - Otherwise, updates top-level attributes directly.
- **Lines 294–336**: `handleCreateBuilding` constructs a valid building schema object:
  - Creates a sanitized unique slug `cleanId` by converting the name to lowercase alphanumeric characters with a timestamp suffix.
  - Initializes standard Ground (`G`) and First (`1`) floors.
  - Populates digital twin cartographic trace defaults (`cx: 350`, `cy: 450`, `w: 50`, `h: 40`).
  - Appends to the buildings list and commits.
- **Lines 339–350**: `handleDeleteBuilding` prompts for confirmation via `window.confirm`, removes the target by ID, commits the updated array, and safely switches the selected pointer to the first remaining building.

---

## 7. Hierarchical Room & Lab Management Engine

```jsx
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
```

### Plain-English Purpose
This section implements a pure hierarchical data structure (`Building -> Floor -> Rooms`) without confusing sub-wing abstractions. It gives administrators fine-grained control: clicking a room name renames it inline (fixing typos), single rooms can be added, multi-line batches can be pasted from spreadsheets, or 24 standard rooms can be auto-generated with zero manual typing.

### Line-by-Line Breakdown
- **Lines 352–393**: `updateFloorRooms` mutates the room array of a specific building and floor:
  - If the building already has structured floor objects (`[{ id: 'G', label: '...', rooms: [...] }]`), it locates the matching floor and replaces its `rooms` array.
  - If the building is a legacy hostel using algorithmic room generation or string arrays, it dynamically converts the floor hierarchy into structured floor objects so custom edits are preserved permanently.
- **Lines 396–403**: `handleSaveInlineRoomEdit` replaces the string at `editingRoomIndex` in `currentFloorRooms` with `editingRoomText.trim()`, saves via `updateFloorRooms`, and exits edit mode.
- **Lines 406–411**: `handleDeleteRoom` filters out the item at `index` after confirmation.
- **Lines 414–420**: `handleAddSingleRoom` appends a single room string.
- **Lines 423–436**: `handleAddBulkRooms` splits input text by regex `/[\n,]+/` (newlines or commas), trims each entry, filters out empty strings, and appends the batch to the floor.
- **Lines 439–458**: `handleGenerateStandardRooms` loops from 1 to `count` (default 24). For floor `'G'`, formats strings like `Room G-01`; for floor `'1'`, formats `Room 101`. Confirms before overwriting existing rooms.

---

## 8. Incident Control & Ticket Modification Handlers

```jsx
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
```

### Plain-English Purpose
These functions provide direct Directorate control over active campus grievances. Administrators can open any ticket, change its status or priority, update the assigned department or location string, record resolution notes, or log new institutional maintenance issues directly into the queue.

### Line-by-Line Breakdown
- **Lines 461–469**: `handleOpenTicketModal` loads the chosen ticket into form states and opens the modal.
- **Lines 471–527**: `handleSaveTicketChanges`:
  - If status changed to `'RESOLVED'`, calls `resolveTicket` with verification remarks and operator identity.
  - If status transitioned to any other state, calls `updateTicketStatus`.
  - If priority was re-calibrated, calls `overrideTicketPriority`.
  - Mutates local `tickets` array optimistically so the table updates immediately without requiring a full reload.
- **Lines 529–555**: `handleCreateManualTicket` validates minimum character lengths (title $\ge 5$, description $\ge 10$), dispatches `submitComplaint` with Directorate credentials, prepends the created ticket into `tickets`, and resets the form.

---

## 9. Serialized JSON Studio & Backup Pipeline

```jsx
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
```

### Plain-English Purpose
This section handles raw data backup, export, import, and recovery. Directorate personnel can copy the serialized digital twin schema to their system clipboard, download a timestamped `.json` file backup, import a custom schema with validation checks, or perform a one-click factory reset back to official satellite-verified coordinates.

### Line-by-Line Breakdown
- **Lines 574–583**: `handleCopyJson` uses browser asynchronous clipboard API `navigator.clipboard.writeText` to copy 2-space indented JSON.
- **Lines 585–594**: `handleDownloadJson` creates an in-memory data URI `data:text/json;charset=utf-8,...`, instantiates an invisible `<a>` DOM node, triggers a click event to download `iiitnr_campus_dataset_<timestamp>.json`, and purges the DOM node.
- **Lines 596–614**: `handleApplyImportJson` parses user text via `JSON.parse`. It verifies the input is a non-empty array and iterates through every item to ensure mandatory `id` and `name` fields are present before committing to storage.
- **Lines 616–622**: `handleResetToVerifiedDefaults` clears local custom overrides and restores factory-verified institutional defaults.

---

## 10. Directorate Header & Metrics Display

```jsx
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
```

### Plain-English Purpose
The banner displays institutional identification, navigation links back to the Directorate Console and Digital Twin Map, and 4 high-level telemetry metric cards tracking total campus buildings, active building category, room density on the current floor, and pending grievance volume.

---

## 11. Tab Navigation & Campus Infrastructure View (Tab 1)

```jsx
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
```

### Plain-English Purpose
This tab bar switches the active viewport between the four studio modes. Badges display real-time counts of total buildings, active floor rooms, and active tickets.

---

## 12. Digital Twin Vector Geometry Editor (Inside Tab 1)

```jsx
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
```

### Plain-English Purpose
This vector coordinate control panel allows administrators to adjust the exact SVG 2D position, scale, and rotation angle ($\text{deg}$) of any building footprint on the digital twin canvas directly through numerical input fields.

---

## 13. High-Frequency Viva & Technical Defense Guide

### Q1: Why does this studio save data to `localStorage` instead of directly writing to a backend database table?
**Viva Answer**: The application uses a hybrid architecture. In local deployment or demonstration scenarios, Directorate administrators can calibrate campus building footprints, test new room layouts, and tweak SVG vectors without needing database migration rights or restarting backend servers. Changes are persisted locally in `localStorage` under `iiitnr_custom_campus_buildings` and broadcast instantly to the 2D digital twin canvas via `IIITNR_MAP_UPDATED_EVENT`. The JSON Studio tab allows administrators to export the verified dataset as a `.json` file, which can then be committed directly into the backend seed files (`seed.py`).

### Q2: How does the application avoid "wing" clutter when managing rooms in hostel blocks?
**Viva Answer**: Previous iterations grouped rooms under artificial "Wing A", "Wing B", or "Wing C" abstractions, creating disjointed sub-categories. `SuperAdminDataEditor.jsx` enforces a strict, wing-free hierarchical signature: `Building -> Floor -> Rooms`. When modifying rooms, `updateFloorRooms` automatically converts string floor arrays into clean structured floor objects (`[{ id: 'G', label: 'Ground Floor (G)', rooms: [...] }]`).

### Q3: What prevents non-numeric input when adjusting SVG trace coordinates?
**Viva Answer**: In `handleUpdateCurrentBuildingField`, when a field begins with `'trace.'`, the update handler checks if the sub-field matches `cx`, `cy`, `w`, `h`, or `angle`. If it does, it executes `Number(value) || 0`. If an administrator enters an invalid string, JavaScript coerces it to `0`, preventing `NaN` from breaking the SVG rendering math in `DigitalTwinCanvas.jsx`.

### Q4: How is data integrity guaranteed during JSON file imports?
**Viva Answer**: `handleApplyImportJson` wraps the import logic in a `try...catch` block. It verifies that `JSON.parse` produces a non-empty array and iterates through every object to verify that required attributes (`id` and `name`) exist. If any item is missing an `id` or `name`, an informative error (`Dataset must be a non-empty array of building entities...`) is displayed, aborting the write operation and preserving existing data.

### Q5: What happens when an administrator switches from a 4-floor hostel to a single-story canteen while viewing Floor 3?
**Viva Answer**: Without an active floor guard, the room table would attempt to display rooms for Floor 3 of a building that only has Ground Floor, resulting in an empty view or crash. A reactive `useEffect` checks if `roomActiveFloor` exists within `availableFloors`. If it does not, it safely snaps `roomActiveFloor` back to `availableFloors[0].id` (`'G'`).

---

## 14. Quick Reference Summary Table

| Category / Identifier | Type / Scope | Operational Definition |
| :--- | :--- | :--- |
| `CAMPUS_CATEGORIES` | Constant Array | 6 classification buckets (`ALL`, `HOSTEL`, `ACADEMIC`, `AMENITY`, `UTILITY`, `SPORTS`) |
| `DEPARTMENTS` | Constant Array | 6 institutional engineering divisions handling incident tickets |
| `PRIORITY_OPTIONS` | Constant Array | 4 SLA urgency tiers (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `STATUS_OPTIONS` | Constant Array | 4 complaint lifecycle states (`PENDING`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) |
| `buildings` | State Hook (`Array`) | Active master list of campus building objects initialized via `getCampusBuildings()` |
| `updateFloorRooms` | Core Engine Function | Converts legacy string floor lists to structured objects and updates room arrays |
| `handleGenerateStandardRooms` | Utility Function | Rapidly generates sequential room codes (e.g., `Room 101` to `Room 124`) |
| `handleSaveTicketChanges` | Async API Function | Updates ticket status, SLA priority, and resolution notes via backend REST endpoints |
| `handleApplyImportJson` | Parser Function | Validates schema integrity and imports custom building datasets from clipboard/file |
| `handleResetToVerifiedDefaults`| Recovery Function | Restores factory-verified institutional coordinates and footprint geometry |
