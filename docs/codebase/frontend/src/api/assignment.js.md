# Comprehensive Code Walkthrough & Line-by-Line Guide: `frontend/src/api/assignment.js`

> **File Location**: [`frontend/src/api/assignment.js`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/api/assignment.js)  
> **Prerequisites**: Basic knowledge of C or Python (functions, HTTP GET/PATCH, type checking, input validation). No advanced queueing system background is assumed.  
> **What this file is**: The dispatch and squad workload API client. It connects the frontend maintenance management screens with the backend assignment subsystem: querying live squad capacities and queue depths (`fetchSquadWorkloads`) and executing role-protected ticket reassignments with mandatory supervisory justifications (`reassignSquad`).

---

## Block 1: Imports & Workload Telemetry Transport: `fetchSquadWorkloads` (Lines 1–16)

```javascript
/**
 * SmartComplaintHandler - Assignment & Workload API Transport
 * Blueprint Reference: V1/M4/frontend/01_assignment_api_client.md
 * Role: HTTP functions for retrieving squad workloads and executing administrative squad reassignment.
 */
import apiClient from './client';

/**
 * Fetch workload telemetry across all campus maintenance squads.
 * 
 * @returns {Promise<Array>} List of squads with active ticket counts and capacity.
 */
export async function fetchSquadWorkloads() {
  const response = await apiClient.get('/teams/workloads');
  return response.data;
}
```

### 1. Plain-English Purpose
Imports the intercepted Axios client and defines `fetchSquadWorkloads`. It queries `GET /teams/workloads` to retrieve active job counts across all maintenance teams on campus (e.g. Electrical Squad 1, Plumbing Squad 2), providing data for workload bar charts on supervisor dashboards.

### 2. Line-by-Line Breakdown
- **Line 6 (`import apiClient from './client';`)**: Imports the configured Axios instance.
- **Lines 13–16 (`export async function fetchSquadWorkloads() { ... }`)**:
  - Issues an asynchronous HTTP `GET` request to `/teams/workloads`.
  - The backend aggregates active tickets using an SQL `GROUP BY` query and returns an array of objects:
    ```json
    [
      { "team_id": 1, "team_name": "Hostel Electricians", "active_ticket_count": 3 },
      { "team_id": 2, "team_name": "Substation High-Voltage", "active_ticket_count": 0 }
    ]
    ```
  - Returns `response.data`.

---

## Block 2: Supervisory Squad Reassignment: `reassignSquad` (Lines 18–44)

```javascript
/**
 * Reassign a ticket to a target maintenance squad with mandatory justification.
 * 
 * @param {number} ticketId - ID of ticket to reassign.
 * @param {number} teamId - Target squad ID.
 * @param {string} reason - Mandatory reassignment justification (min 5 characters).
 * @returns {Promise<Object>} Updated ticket assignment confirmation.
 */
export async function reassignSquad(ticketId, teamId, reason) {
  if (!ticketId || typeof ticketId !== 'number') {
    throw new TypeError('Valid numeric ticketId is required.');
  }
  if (!teamId || typeof teamId !== 'number') {
    throw new TypeError('Valid numeric teamId is required.');
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    throw new Error('Reassignment justification must contain at least 5 characters.');
  }

  const payload = {
    team_id: teamId,
    reason: reason.trim()
  };

  const response = await apiClient.patch(`/tickets/${ticketId}/reassign`, payload);
  return response.data;
}
```

### 1. Plain-English Purpose
Allows a facility administrator to reassign a ticket from one maintenance squad to another (for example, if Squad 1 is overloaded or lacks specialized parts). It validates numeric IDs, enforces a mandatory justification string of at least 5 characters, and issues an HTTP `PATCH /tickets/{ticketId}/reassign` request.

### 2. Line-by-Line Breakdown
- **Lines 26–35 (Parameter Validation)**:
  - `typeof ticketId !== 'number'`: Guards against undefined or malformed ticket IDs.
  - `typeof teamId !== 'number'`: Validates that the target team ID is a number.
  - `reason.trim().length < 5`: Enforces that the justification cannot be empty or trivial, guaranteeing audit accountability.
- **Lines 37–40 (`const payload = { ... }`)**:
  - Packages `team_id` and trimmed `reason`.
- **Lines 42–43 (`const response = await apiClient.patch(...)`)**:
  - Dispatches `PATCH /tickets/{ticketId}/reassign` and returns the updated ticket entity.

---

## 3. Viva & Technical Defense Guide

> [!TIP]
> **Q1: Why does `reassignSquad` require a mandatory justification of at least 5 characters?**  
> **Answer**: To maintain institutional accountability and prevent arbitrary squad reassignments. If an administrator reassigns a complaint away from an idle squad to an already burdened squad, investigators need to know why (e.g. *"Requires high-voltage insulation tools"*). Enforcing a 5-character minimum on the client and backend ensures that every reassignment has documented justification inscribed into the permanent audit trail.

> [!TIP]
> **Q2: Why is `PATCH` used instead of `POST` or `PUT` in `reassignSquad`?**  
> **Answer**: In RESTful API design principles:
> - `POST` creates an entirely new resource.
> - `PUT` replaces an entire record with fresh data.
> - `PATCH` applies a partial modification to an existing resource.  
> Since reassignment modifies only the `assigned_team_id` and appends an audit remark to `resolution_notes` while leaving the title, student email, and location unchanged, `PATCH` is the correct REST method.

---

## 4. Quick-Reference Viva Summary Table

| Concept / Keyword | Meaning in Basic C / Python | Role in `assignment.js` |
| :--- | :--- | :--- |
| `fetchSquadWorkloads` | Queue query function | Retrieves active ticket counts for each squad from `GET /teams/workloads`. |
| `reassignSquad` | Mutation caller function | Dispatches `PATCH /tickets/{id}/reassign` with new squad ID and reason. |
| `typeof !== 'number'` | Type assertion check | Prevents network errors caused by passing undefined or string IDs. |
| $\ge 5$ Characters Reason | Minimum string length guard | Enforces documented accountability before allowing squad transfers. |
| `PATCH` HTTP Verb | Partial struct update | Updates squad assignment without overwriting other ticket fields. |
