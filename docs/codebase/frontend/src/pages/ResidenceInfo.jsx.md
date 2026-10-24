# First-Time Residence Onboarding Portal (`ResidenceInfo.jsx`)

Comprehensive architectural and line-by-line documentation for `frontend/src/pages/ResidenceInfo.jsx`. This document provides collegiate viva committees, code reviewers, and systems architects with an exhaustive dissection of the undergraduate residential onboarding pipeline, cascading hostel-to-room selection algorithms, spatial coordinate inference, and client-side completion guards.

---

## 1. Module Header & Library Imports

```jsx
/**
 * SmartComplaintHandler - Dedicated First-Time Residence Onboarding Page
 * Domain: One-time mandatory hostel & room collection exclusively for undergraduate
 *         B.Tech scholars (active batches from current year down to last 4 years).
 *         Non-undergraduate scholars (PhD, faculty, staff, technicians) bypass this page.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isUndergradHostelStudent, resolveIiitnrProfileFromEmail } from '../api/auth';
import {
  HOSTEL_FLOORS,
  getHostelBuildings,
  getFloorsForBuilding,
  getRoomsForBuilding,
  inferFloorFromItem,
  fetchAndCacheCampusBuildings,
  IIITNR_MAP_UPDATED_EVENT,
} from '../data/iiitnrCampusData';
```

### Plain-English Purpose
The header imports essential React state hooks, navigation utilities, global authentication and theme contexts, and spatial campus data helpers. It sets up the residential onboarding gatekeeper, ensuring all undergraduate B.Tech scholars have an assigned hostel building and room number on file before lodging maintenance grievances.

### Line-by-Line Breakdown
- **Lines 1–6**: Comment header specifying the architectural constraint: one-time mandatory hostel and room collection for active undergraduate B.Tech batches, with automatic bypass for PhD scholars, faculty, and technicians.
- **Line 7**: Imports core React hooks: `useState` (state variable manager), `useEffect` (side-effect lifecycle manager), and `useMemo` (cached value computer).
- **Line 8**: Imports `useNavigate` (imperative routing hook) and `Link` (client-side hyperlink) from `react-router-dom`.
- **Line 9**: Imports `useAuth` hook from `../context/AuthContext` to access active user profile (`currentUser`), profile update dispatch (`updateProfile`), and startup status (`authInitializing`).
- **Line 10**: Imports `useTheme` hook from `../context/ThemeContext` for dark/light display control.
- **Line 11**: Imports `isUndergradHostelStudent` and `resolveIiitnrProfileFromEmail` from `../api/auth`.
- **Lines 12–20**: Imports spatial dataset utilities from `../data/iiitnrCampusData`:
  - `HOSTEL_FLOORS`: Fallback array defining standard residential levels (`['G', '1', '2', '3']`).
  - `getHostelBuildings`: Filters campus dataset to isolate residential facilities (e.g., Raman House, Bhabha House, Bose House).
  - `getFloorsForBuilding`: Retrieves floor levels associated with a selected hostel.
  - `getRoomsForBuilding`: Retrieves all room and suite numbers mapped to a specific building and floor.
  - `inferFloorFromItem`: Analyzes room strings (e.g., `'Room 204'`) to infer the underlying floor level (`'2'`).
  - `fetchAndCacheCampusBuildings`: Asynchronously loads and caches verified campus spatial data.
  - `IIITNR_MAP_UPDATED_EVENT`: Window event triggering live cache re-reads when building datasets change.

---

## 2. Component Declaration & Campus Twin Synchronization

```jsx
export default function ResidenceInfo() {
  const navigate = useNavigate();
  const { currentUser, updateProfile, authInitializing } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [hostelList, setHostelList] = useState(() => getHostelBuildings());

  useEffect(() => {
    fetchAndCacheCampusBuildings().then((buildings) => {
      setHostelList(getHostelBuildings(buildings));
    });
    const onMapUpdated = () => setHostelList(getHostelBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, onMapUpdated);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, onMapUpdated);
  }, []);

  const hostels = hostelList;
```

### Plain-English Purpose
Initializes the onboarding component and synchronizes residential facility models with the digital twin data layer. If the campus map data is updated in another tab or administrator studio, the hostel list updates automatically via window event listeners.

### Line-by-Line Breakdown
- **Lines 22–25**: Declares `ResidenceInfo` component and extracts hooks.
- **Line 27**: `hostelList` initializes via lazy callback `() => getHostelBuildings()` to prevent unnecessary computations during re-renders.
- **Lines 29–36**: `useEffect` executes on mount:
  - Calls `fetchAndCacheCampusBuildings()` and updates `hostelList`.
  - Attaches a window listener for `IIITNR_MAP_UPDATED_EVENT`.
  - Cleans up the event listener upon unmount to prevent memory leaks.
- **Line 38**: Alias `hostels = hostelList` for convenient downstream references.

---

## 3. Form State Initializers & Spatial Floor Inference

```jsx
  const [selectedHostel, setSelectedHostel] = useState(
    currentUser?.hostel_name || hostels[0]?.name || 'Raman House (Boys Hostel 1)'
  );
  const [selectedFloor, setSelectedFloor] = useState(() => {
    return inferFloorFromItem(currentUser?.room_number) || '2';
  });
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(
    currentUser?.room_number || ''
  );
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  const cleanEmail = (currentUser?.email || '').trim().toLowerCase();

  // Determine if already completed
  const alreadyCompleted = useMemo(() => {
    if (!cleanEmail) return false;
    const flag = localStorage.getItem(`iiitnr_residence_completed_${cleanEmail}`);
    return flag === 'true' && Boolean(currentUser?.hostel_name && currentUser?.room_number);
  }, [cleanEmail, currentUser]);

  // Derived metadata from institutional email
  const studentMeta = useMemo(() => {
    if (!cleanEmail) return null;
    return resolveIiitnrProfileFromEmail(cleanEmail, currentUser?.name);
  }, [cleanEmail, currentUser?.name]);
```

### Plain-English Purpose
Pre-populates form fields using existing profile information if available. If the student previously recorded a room number (e.g., `'Room 312'`), `inferFloorFromItem` extracts floor `'3'` automatically. It also checks whether onboarding was already completed to prevent redundant prompts.

### Line-by-Line Breakdown
- **Lines 40–42**: `selectedHostel` defaults to `currentUser.hostel_name`, the first available hostel, or `'Raman House (Boys Hostel 1)'`.
- **Lines 43–45**: `selectedFloor` invokes `inferFloorFromItem(currentUser?.room_number)`, defaulting to `'2'`.
- **Lines 46–49**: Initializes buffers for `selectedRoomNumber` and `phone`.
- **Lines 51–53**: Tracks form submission states (`loading`, `savedSuccess`, `error`).
- **Line 55**: `cleanEmail` stores normalized email string.
- **Lines 58–62**: `alreadyCompleted` verifies whether `localStorage` contains `iiitnr_residence_completed_<cleanEmail> === 'true'` and the user record has non-empty hostel and room values.
- **Lines 65–68**: `studentMeta` parses batch, department, and roll number metadata from email.

---

## 4. Cascading Hostel-to-Room Filtering Engine

```jsx
  const availableFloors = useMemo(
    () => getFloorsForBuilding(selectedHostel, hostels),
    [selectedHostel, hostels]
  );

  // Available room suggestions based on selected hostel & floor
  const availableRooms = useMemo(
    () => getRoomsForBuilding(selectedHostel, selectedFloor, null, hostels),
    [selectedHostel, selectedFloor, hostels]
  );

  const filteredRooms = useMemo(() => {
    const onlyRooms = availableRooms.filter((r) => r.includes('Room') || r.includes('Suite'));
    return onlyRooms.length > 0 ? onlyRooms : availableRooms;
  }, [availableRooms]);

  const handleHostelChange = (newHostel) => {
    setSelectedHostel(newHostel);
    if (newHostel === 'Day Scholar (Off-Campus)') {
      setSelectedRoomNumber('Day Scholar');
      return;
    }
    const targetFloors = getFloorsForBuilding(newHostel, hostels);
    const validFloorIds = targetFloors.map((f) => String(f.id));
    const nextFloor = validFloorIds.includes(String(selectedFloor))
      ? selectedFloor
      : (targetFloors[0]?.id || '1');
    setSelectedFloor(nextFloor);
    const targetRooms = getRoomsForBuilding(newHostel, nextFloor, null, hostels);
    const roomCandidates = targetRooms.filter((r) => r.includes('Room') || r.includes('Suite'));
    const finalRoomList = roomCandidates.length > 0 ? roomCandidates : targetRooms;
    if (finalRoomList.length > 0) {
      setSelectedRoomNumber(finalRoomList[0]);
    } else {
      setSelectedRoomNumber('');
    }
  };

  const handleFloorChange = (newFloor) => {
    setSelectedFloor(newFloor);
    const nextRooms = getRoomsForBuilding(selectedHostel, newFloor, null, hostels);
    const roomCandidates = nextRooms.filter((r) => r.includes('Room') || r.includes('Suite'));
    const finalRoomList = roomCandidates.length > 0 ? roomCandidates : nextRooms;
    if (finalRoomList.length > 0) {
      setSelectedRoomNumber(finalRoomList[0]);
    } else {
      setSelectedRoomNumber('');
    }
  };

  // Auto-sync room if current selection doesn't match available rooms
  useEffect(() => {
    if (
      selectedHostel !== 'Day Scholar (Off-Campus)' &&
      filteredRooms.length > 0 &&
      !filteredRooms.includes(selectedRoomNumber)
    ) {
      setSelectedRoomNumber(filteredRooms[0]);
    }
  }, [filteredRooms, selectedHostel]);
```

### Plain-English Purpose
This is a cascading dependency engine. In database terms, this functions like a parameterized relational query:
$$\text{Hostel} \longrightarrow \text{Available Floors} \longrightarrow \text{Available Rooms}$$
When a student selects a different hostel (e.g., switching from Raman House to Bose House), the floor dropdown re-evaluates. If the current floor does not exist on the new building, it resets to Floor 1, and the room list updates immediately. If the student selects `'Day Scholar (Off-Campus)'`, room selection is bypassed and set to `'Day Scholar'`.

### Line-by-Line Breakdown
- **Lines 70–73**: `availableFloors` retrieves floor levels for `selectedHostel`.
- **Lines 76–79**: `availableRooms` retrieves all rooms for the chosen building and floor.
- **Lines 81–84**: `filteredRooms` isolates actual student living quarters (filtering for `'Room'` or `'Suite'`), excluding utility areas like corridors or electrical shafts.
- **Lines 86–106**: `handleHostelChange`:
  - If `'Day Scholar (Off-Campus)'`, sets `selectedRoomNumber('Day Scholar')` and returns.
  - Queries `targetFloors`. If `selectedFloor` exists in the new building, preserves it; otherwise defaults to the first available floor.
  - Resolves rooms for the new floor and sets `selectedRoomNumber` to the first valid room.
- **Lines 108–118**: `handleFloorChange` updates `selectedFloor` and snaps `selectedRoomNumber` to the first valid room on that floor.
- **Lines 121–129**: Guard effect ensuring `selectedRoomNumber` always remains a member of `filteredRooms`.

---

## 5. Security Routing Guards & Submission Engine

```jsx
  // Redirect guard: only undergraduate students matching 26(100-102) belong here
  useEffect(() => {
    if (authInitializing) return;

    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    if (!isUndergradHostelStudent(currentUser.email)) {
      // PhD, faculty, staff, technicians do not have this requirement
      navigate(currentUser.targetRoute || '/submit', { replace: true });
    }
  }, [currentUser, authInitializing, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const isDayScholar = selectedHostel === 'Day Scholar (Off-Campus)';
      const finalHostel = selectedHostel;
      const finalRoom = isDayScholar ? 'Day Scholar' : selectedRoomNumber.trim();

      if (!isDayScholar && !finalRoom) {
        throw new Error('Please enter or select your hostel room number.');
      }

      await updateProfile({
        hostel_name: finalHostel,
        room_number: finalRoom,
        phone: phone.trim() || undefined,
      });

      // Mark as completed once in localStorage so student is never prompted again
      localStorage.setItem(`iiitnr_residence_completed_${cleanEmail}`, 'true');

      setSavedSuccess(true);
      setTimeout(() => {
        navigate('/submit', { replace: true });
      }, 900);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update residence details.');
      setLoading(false);
    }
  };

  const handleSkipOrProceed = () => {
    localStorage.setItem(`iiitnr_residence_completed_${cleanEmail}`, 'true');
    navigate('/submit', { replace: true });
  };
```

### Plain-English Purpose
Guards access so only undergraduate scholars are required to view this page. When the student submits the form, their profile is updated on the backend, a completion marker is saved to `localStorage`, and the application redirects them to the complaint lodging interface (`/submit`).

### Line-by-Line Breakdown
- **Lines 132–144**: Security lifecycle guard:
  - Waits until authentication completes (`!authInitializing`).
  - If unauthenticated, redirects to `/login`.
  - Evaluates `isUndergradHostelStudent(currentUser.email)`. If `false` (faculty, staff, technician, or PhD scholar), immediately redirects to `/submit`, bypassing residential onboarding.
- **Lines 146–177**: `handleSubmit`:
  - Validates non-empty room selection for campus residents.
  - Dispatches `updateProfile` with `hostel_name`, `room_number`, and optional `phone`.
  - Sets `localStorage.setItem('iiitnr_residence_completed_<cleanEmail>', 'true')`.
  - Sets `savedSuccess(true)` and navigates to `/submit` after a brief $900\text{ ms}$ feedback animation.
- **Lines 179–182**: `handleSkipOrProceed` sets the completion flag and navigates directly to `/submit`.

---

## 6. Quick Selection Pills & Responsive Layout

```jsx
                {/* Quick Selection Pills */}
                {filteredRooms.length > 0 && (
                  <div className="pt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                      Quick Select ({availableFloors.find((f) => String(f.id) === String(selectedFloor))?.label || `Floor ${selectedFloor}`}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {filteredRooms.slice(0, 15).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSelectedRoomNumber(r)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                            selectedRoomNumber === r
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                              : isDark
                              ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                              : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
```

### Plain-English Purpose
Renders interactive room buttons beneath the dropdown. Rather than manually typing their room code on mobile devices, students can simply tap their room pill to populate the form instantly.

---

## 7. High-Frequency Viva & Technical Defense Guide

### Q1: Why is this residence onboarding page restricted only to undergraduate scholars?
**Viva Answer**: Non-undergraduate users (faculty members, administrative officers, field technicians, and off-campus PhD scholars) do not reside in undergraduate student hostels. Forcing them through hostel room assignment would introduce corrupt spatial data into the system. `isUndergradHostelStudent` evaluates the student's email against active undergraduate roll number conventions, allowing non-undergraduates to bypass this step entirely.

### Q2: How does `inferFloorFromItem` deduce the floor number from a room string?
**Viva Answer**: IIIT Naya Raipur uses standardized room numbering where the first digit of a 3-digit room code denotes the floor (e.g., Room 101 $\rightarrow$ Floor 1, Room 204 $\rightarrow$ Floor 2, Room 315 $\rightarrow$ Floor 3). `inferFloorFromItem` uses regular expressions to extract the leading digit or `'G'` prefix, automatically aligning the floor dropdown with the student's existing room assignment without manual selection.

### Q3: What prevents the student from being stuck in an infinite onboarding loop upon re-login?
**Viva Answer**: Upon successful profile update, `handleSubmit` writes an explicit marker to browser storage: `localStorage.setItem('iiitnr_residence_completed_<email>', 'true')`. On subsequent logins, the login gateway (`Login.jsx`) and onboarding guard check this flag alongside `currentUser.hostel_name` and `currentUser.room_number`. If verified, the student is routed directly to their dashboard.

### Q4: How are Day Scholars (off-campus commuters) handled?
**Viva Answer**: In `handleHostelChange`, if the user selects `'Day Scholar (Off-Campus)'`, the floor and room selection fields are hidden from the DOM, and `selectedRoomNumber` is set to `'Day Scholar'`. The backend stores this designation in the database, allowing day scholars to lodge grievances in common campus areas (e.g., lecture halls, library, cafeteria) without requiring a hostel room assignment.

---

## 8. Quick Reference Summary Table

| Identifier / Function | Type / Scope | Operational Definition |
| :--- | :--- | :--- |
| `getHostelBuildings` | Spatial Helper | Filters campus building entities to extract residential hostel facilities |
| `inferFloorFromItem` | Parser Utility | Deduces floor ID (`'G'`, `'1'`, `'2'`, `'3'`) from room strings |
| `alreadyCompleted` | Memoized Boolean | Verifies whether residential onboarding was previously completed |
| `studentMeta` | Memoized Object | Formatted student identity card derived from institutional email |
| `availableFloors` | Memoized Array | Floor levels mapped to currently selected hostel building |
| `filteredRooms` | Memoized Array | Living quarters and student room codes on the selected floor |
| `handleHostelChange` | Cascading Handler | Updates available floors and snaps room selection when hostel changes |
| `handleSubmit` | Async Form Handler| Persists residential location to user profile and records completion flag |
| `isUndergradHostelStudent`| Security Predicate | Bypasses onboarding for faculty, staff, technicians, and PhD scholars |
