# Comprehensive Code Walkthrough & Line-by-Line Guide: `frontend/src/api/sla.js`

> **File Location**: [`frontend/src/api/sla.js`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/api/sla.js)  
> **Prerequisites**: Basic knowledge of C or Python (functions, HTTP GET/POST/PATCH, type checking, validation rules). No advanced distributed systems background is assumed.  
> **What this file is**: The SLA monitoring and ticket lifecycle API client. It governs the four critical operational interactions on technician workstations and operations consoles:
> 1. Advancing a ticket through the finite state machine (`updateTicketStatus`).
> 2. Formally resolving an issue with mandatory repair notes and spare part tracking (`resolveTicket`).
> 3. Escalating high-risk incidents for supervisory oversight (`escalateTicket`).
> 4. Querying active and approaching SLA breaches (`fetchActiveBreaches`).

---

## Block 1: Imports & Lifecycle Progression Transport: `updateTicketStatus` (Lines 1–34)

```javascript
/**
 * SmartComplaintHandler - SLA API Transport
 * Blueprint Reference: V1/M5/frontend/01_sla_api_client.md
 * Role: HTTP functions for status updates, ticket resolution, and breach monitoring.
 */
import apiClient from './client';

/**
 * Advance or modify ticket lifecycle status with optional transition remarks.
 *
 * @param {number} ticketId - Unique ticket primary key.
 * @param {string} newStatus - Target lifecycle state (e.g. 'IN_PROGRESS', 'ON_HOLD').
 * @param {string|null} notes - Optional transition comments or rationale.
 * @param {string} actor - Identity of staff member making the change.
 * @returns {Promise<Object>} Updated ticket lifecycle response entity.
 */
export async function updateTicketStatus(ticketId, newStatus, notes = null, actor = 'Staff') {
  if (!ticketId || typeof ticketId !== 'number' || ticketId <= 0) {
    throw new TypeError('A valid positive integer ticketId is required.');
  }
  if (!newStatus || typeof newStatus !== 'string') {
    throw new TypeError('A valid target status string is required.');
  }

  const payload = {
    status: newStatus.trim().toUpperCase(),
    notes: notes && notes.trim() ? notes.trim() : null,
    actor: actor || 'Staff'
  };

  const response = await apiClient.patch(`/tickets/${ticketId}/status`, payload);
  return response.data;
}
```

### 1. Plain-English Purpose
Imports the API client and defines `updateTicketStatus`. It validates that the ticket ID is a positive integer and that the target status is a valid string, formats the JSON payload with trimmed remarks, and executes an HTTP `PATCH /tickets/{ticketId}/status` call to progress the complaint through the state machine.

### 2. Line-by-Line Breakdown
- **Line 6 (`import apiClient from './client';`)**: Imports the intercepted Axios client.
- **Lines 18–23 (Type Validation Guards)**:
  - `ticketId <= 0`: Ensures negative or zero IDs are rejected locally.
  - `typeof newStatus !== 'string'`: Rejects undefined or numeric status inputs.
- **Lines 25–29 (`const payload = { ... }`)**:
  - `newStatus.trim().toUpperCase()`: Normalizes the status string (e.g. `'in_progress'` becomes `'IN_PROGRESS'`).
  - Sets `notes` to `null` if empty.
  - Sets `actor` to `'Staff'` if omitted.
- **Lines 31–32 (`const response = await apiClient.patch(...)`)**:
  - Sends the `PATCH` request and returns the updated ticket lifecycle object.

---

## Block 2: Incident Resolution & Mandatory Notes: `resolveTicket` (Lines 35–61)

```javascript
/**
 * Formally resolve an incident, enforcing substantive closure notes.
 *
 * @param {number} ticketId - Unique ticket primary key.
 * @param {string} resolutionNotes - Mandatory repair notes (min 10 characters).
 * @param {string|null} partsReplaced - Optional summary of replacement parts used.
 * @param {string|null} technicianName - Optional name of technician who repaired it.
 * @returns {Promise<Object>} Resolved ticket entity with resolution timestamp.
 */
export async function resolveTicket(ticketId, resolutionNotes, partsReplaced = null, technicianName = null) {
  if (!ticketId || typeof ticketId !== 'number' || ticketId <= 0) {
    throw new TypeError('A valid positive integer ticketId is required.');
  }
  if (!resolutionNotes || typeof resolutionNotes !== 'string' || resolutionNotes.trim().length < 10) {
    throw new Error('Resolution notes must contain at least 10 characters detailing the repair performed.');
  }

  const payload = {
    resolution_notes: resolutionNotes.trim(),
    parts_replaced: partsReplaced && partsReplaced.trim() ? partsReplaced.trim() : null,
    technician_name: technicianName && technicianName.trim() ? technicianName.trim() : null
  };

  const response = await apiClient.post(`/tickets/${ticketId}/resolve`, payload);
  return response.data;
}
```

### 1. Plain-English Purpose
Allows a field technician to mark a ticket as resolved. It enforces that `resolutionNotes` contains at least 10 non-whitespace characters detailing what was physically fixed, packages optional replacement parts and technician identity, and calls `POST /tickets/{ticketId}/resolve`.

### 2. Line-by-Line Breakdown
- **Lines 45–50 (Mandatory Documentation Guard)**:
  - If `resolutionNotes` is shorter than 10 characters (e.g. typing just "done" or "fixed"), throws an immediate error preventing submission.
- **Lines 52–56 (`const payload = { ... }`)**:
  - Trims notes, parts, and technician name.
- **Lines 58–59 (`const response = await apiClient.post(...)`)**:
  - Dispatches `POST /tickets/{ticketId}/resolve`. The backend halts the SLA timer and returns the resolved ticket.

---

## Block 3: Supervisory Ticket Escalation: `escalateTicket` (Lines 62–86)

```javascript
/**
 * Escalate a stagnant or high-risk ticket for supervisory oversight.
 *
 * @param {number} ticketId - Unique ticket primary key.
 * @param {string} reason - Mandatory justification for escalation (min 5 characters).
 * @param {string|null} supervisorId - Optional supervisor identifier.
 * @returns {Promise<Object>} Escalated ticket entity.
 */
export async function escalateTicket(ticketId, reason, supervisorId = null) {
  if (!ticketId || typeof ticketId !== 'number' || ticketId <= 0) {
    throw new TypeError('A valid positive integer ticketId is required.');
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    throw new Error('Escalation reason must contain at least 5 characters.');
  }

  const payload = {
    escalation_reason: reason.trim(),
    supervisor_id: supervisorId && supervisorId.trim() ? supervisorId.trim() : null
  };

  const response = await apiClient.post(`/tickets/${ticketId}/escalate`, payload);
  return response.data;
}
```

### 1. Plain-English Purpose
Escalates a blocked or hazardous complaint to senior management. Enforces that the escalation reason is at least 5 characters long and dispatches `POST /tickets/{ticketId}/escalate`.

### 2. Line-by-Line Breakdown
- **Lines 74–76**: Validates `reason.trim().length >= 5`.
- **Lines 78–84**: Packages `escalation_reason` and optional `supervisor_id`, calls backend endpoint, and returns response data.

---

## Block 4: Active SLA Breach Radar: `fetchActiveBreaches` (Lines 87–98)

```javascript
/**
 * Query active tickets that are overdue or nearing deadline breach.
 *
 * @param {number} thresholdRatio - Ratio of SLA duration triggering warning (default: 0.20).
 * @returns {Promise<Array>} Array of breach summary objects.
 */
export async function fetchActiveBreaches(thresholdRatio = 0.20) {
  const response = await apiClient.get('/sla/breaches/active', {
    params: { threshold_ratio: thresholdRatio }
  });
  return response.data;
}
```

### 1. Plain-English Purpose
Queries all open complaints across the university that have either blown past their deadline or have less than 20% of their allotted SLA time remaining. Powers the red and amber warning feeds on technician workstations.

### 2. Line-by-Line Breakdown
- **Lines 93–97 (`fetchActiveBreaches`)**:
  - `thresholdRatio = 0.20`: Default warning threshold of 20%.
  - Passes `threshold_ratio` as a query parameter to `GET /sla/breaches/active`.
  - Returns the two-tier sorted list of breached and warning tickets.

---

## 5. Viva & Technical Defense Guide

> [!TIP]
> **Q1: Why does `resolveTicket` enforce a 10-character minimum on resolution notes on the frontend?**  
> **Answer**: To prevent technicians from submitting superficial placeholders (such as "ok", "fixed", or "done"). Enforcing a 10-character minimum ensures that the technician writes a brief explanation of what was repaired (e.g. *"Replaced 10A switch"*), maintaining institutional documentation standards before stopping the SLA performance clock.

> [!TIP]
> **Q2: Why is `updateTicketStatus` implemented as `PATCH` while `resolveTicket` and `escalateTicket` are implemented as `POST`?**  
> **Answer**: `updateTicketStatus` represents a partial property modification (changing the `status` field on an existing ticket). In contrast, `resolveTicket` and `escalateTicket` are formal **business domain actions**: they trigger complex side effects (evaluating SLA compliance, freezing resolution timestamps, and generating composite closure reports). In RESTful design, domain actions with side effects are represented as action endpoints invoked via `POST`.

---

## 6. Quick-Reference Viva Summary Table

| Concept / Keyword | Meaning in Basic C / Python | Role in `sla.js` |
| :--- | :--- | :--- |
| `updateTicketStatus` | State transition caller | Dispatches `PATCH /tickets/{id}/status` to advance ticket state. |
| `resolveTicket` | Incident closure caller | Posts repair summary and replaced parts to `POST /tickets/{id}/resolve`. |
| $\ge 10$ Character Rule | Minimum string constraint | Prevents technicians from resolving tickets with trivial 1-word notes. |
| `escalateTicket` | Management alert caller | Posts escalation justification to `POST /tickets/{id}/escalate`. |
| `fetchActiveBreaches` | Breach radar caller | Queries `GET /sla/breaches/active` with a warning threshold ratio. |
| `thresholdRatio = 0.20` | Default parameter (20%) | Flags tickets with $\le 20\%$ SLA time remaining. |
