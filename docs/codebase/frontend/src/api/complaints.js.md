# Comprehensive Code Walkthrough & Line-by-Line Guide: `frontend/src/api/complaints.js`

> **File Location**: [`frontend/src/api/complaints.js`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/api/complaints.js)  
> **Prerequisites**: Basic knowledge of C or Python (functions, dictionaries, input validation with `if/else`, HTTP requests). No advanced web architecture background is assumed.  
> **What this file is**: The grievance intake and ticket lifecycle API client. It bridges frontend user interfaces with backend complaint endpoints: validating and submitting new complaints (`submitComplaint`), looking up ticket progress via tracking codes (`fetchTicketByCode`), retrieving filtered complaint lists for dashboards (`fetchComplaints`), submitting 5-star student satisfaction reviews (`submitFeedback`), and applying supervisory administrative edits (`updateTicketDirect`).

---

## Block 1: Imports & Grievance Submission Transport: `submitComplaint` (Lines 1–33)

```javascript
/**
 * SmartComplaintHandler - Complaints API Transport
 * Blueprint Reference: V1/M2/frontend/01_complaints_api_client.md
 * Role: HTTP transport functions for submitting complaints, listing tickets, and tracking by code.
 */
import apiClient from './client';

/**
 * Submit a new student grievance.
 * 
 * @param {Object} ticketData - { title, description, location }
 * @returns {Promise<Object>} Created ticket response with tracking_code and assigned department.
 */
export async function submitComplaint(ticketData) {
  if (!ticketData.title || ticketData.title.trim().length < 5) {
    throw new Error('Title must contain at least 5 characters.');
  }
  if (!ticketData.description || ticketData.description.trim().length < 10) {
    throw new Error('Description must contain at least 10 characters.');
  }

  const payload = {
    title: ticketData.title.trim(),
    description: ticketData.description.trim(),
    location: ticketData.location && ticketData.location.trim() ? ticketData.location.trim() : 'Campus',
    student_name: ticketData.student_name && ticketData.student_name.trim() ? ticketData.student_name.trim() : null,
    student_email: ticketData.student_email && ticketData.student_email.trim() ? ticketData.student_email.trim() : null,
  };

  const response = await apiClient.post('/tickets', payload);
  return response.data;
}
```

### 1. Plain-English Purpose
Imports the pre-configured Axios client and defines `submitComplaint`. Before sending data across the network, it validates that the title is at least 5 characters long and the description is at least 10 characters long, trims leading/trailing whitespace, sets default fallback values, and executes an HTTP `POST /tickets` request.

### 2. Line-by-Line Breakdown
- **Line 6 (`import apiClient from './client';`)**: Imports the Axios client equipped with automatic Bearer token injection and error handling.
- **Lines 14–20 (Client-Side Input Validation)**:
  - `if (!ticketData.title || ticketData.title.trim().length < 5)`: Throws a local JavaScript error if title is shorter than 5 characters.
  - `if (!ticketData.description || ticketData.description.trim().length < 10)`: Throws an error if description is shorter than 10 characters.
  - This eliminates unnecessary network round-trips for invalid submissions.
- **Lines 22–28 (`const payload = { ... }`)**:
  - Trims whitespace from all strings.
  - Defaults `location` to `'Campus'` if omitted.
  - Sets `student_name` and `student_email` to `null` if empty.
- **Lines 30–31 (`const response = await apiClient.post('/tickets', payload); return response.data;`)**:
  - Posts JSON to the backend and returns the newly created ticket record (including its generated `tracking_code`, `priority`, and `sla_deadline`).

### 3. Deep Term & Concept Expansion
- **Why Validate on the Client Side?**: If a student types "bad" as their description, the backend will reject it because Pydantic requires 10 characters. Catching this in the browser displays an instant warning in $0\text{ ms}$ without waiting 500ms for a round-trip network response.

---

## Block 2: Ticket Tracking & Complaint Querying (Lines 34–60)

```javascript
/**
 * Fetch ticket status and details by tracking code (e.g. 'TICK-1001').
 * 
 * @param {string} trackingCode
 * @returns {Promise<Object>} Ticket record with SLA and status.
 */
export async function fetchTicketByCode(trackingCode) {
  if (!trackingCode || typeof trackingCode !== 'string' || !trackingCode.trim()) {
    throw new Error('A valid tracking code is required.');
  }

  const cleanCode = trackingCode.trim().toUpperCase();
  const response = await apiClient.get(`/tickets/${cleanCode}`);
  return response.data;
}

/**
 * Fetch all tickets with optional filtering by status, priority, or department.
 * 
 * @param {Object} params - { status, priority, department_id, skip, limit }
 * @returns {Promise<Array>} List of ticket records.
 */
export async function fetchComplaints(params = {}) {
  const response = await apiClient.get('/tickets', { params });
  return response.data;
}
```

### 1. Plain-English Purpose
- `fetchTicketByCode`: Normalizes tracking codes to uppercase (e.g. converting lowercase `"tick-8k2m"` to `"TICK-8K2M"`) and queries `GET /tickets/{code}` for public ticket tracking.
- `fetchComplaints`: Queries `GET /tickets` passing search and pagination filters as URL query parameters (`?status=IN_PROGRESS&limit=50`).

### 2. Line-by-Line Breakdown
- **Lines 40–48 (`fetchTicketByCode`)**:
  - Validates that `trackingCode` is a non-empty string.
  - `.toUpperCase()`: Guarantees case-insensitive tracking code lookup.
  - Calls `GET /tickets/{cleanCode}` and returns the ticket object.
- **Lines 56–59 (`fetchComplaints`)**:
  - `apiClient.get('/tickets', { params })`: Axios automatically serializes the `params` dictionary into URL query parameters (e.g. `?priority=CRITICAL&limit=100`).

---

## Block 3: Student Feedback Submission: `submitFeedback` (Lines 61–87)

```javascript
/**
 * Submit student satisfaction feedback for a resolved ticket.
 * 
 * @param {string|number} ticketIdentifier - Ticket tracking code or ID.
 * @param {number} rating - 1 to 5 star rating.
 * @param {string|null} comments - Student review comments.
 * @param {string|null} studentName - Student identifier or name.
 * @returns {Promise<Object>} Updated ticket record.
 */
export async function submitFeedback(ticketIdentifier, rating, comments = null, studentName = null) {
  if (!ticketIdentifier) {
    throw new Error('A valid ticket identifier is required.');
  }
  if (!rating || rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5 stars.');
  }

  const payload = {
    rating: Number(rating),
    comments: comments && comments.trim() ? comments.trim() : null,
    student_name: studentName && studentName.trim() ? studentName.trim() : null,
  };

  const response = await apiClient.post(`/tickets/${encodeURIComponent(ticketIdentifier)}/feedback`, payload);
  return response.data;
}
```

### 1. Plain-English Purpose
Allows students to submit a satisfaction rating (1 to 5 stars) and review remarks for a resolved ticket. Validates star boundaries and posts to `/tickets/{id}/feedback`.

### 2. Line-by-Line Breakdown
- **Lines 74–76 (Boundary Guard)**:
  - Enforces that rating is an integer between 1 and 5.
- **Line 84 (`encodeURIComponent(ticketIdentifier)`)**:
  - URL-encodes the ticket identifier to prevent URL injection errors if a code contains special characters.
  - Sends payload via `POST /tickets/{id}/feedback`.

---

## Block 4: Telemetry Aggregation & Supervisory Updates (Lines 88–124)

```javascript
/**
 * Fetch high-level analytics summary metrics for landing page telemetry.
 *
 * @returns {Promise<Object>} Aggregate statistics including total_tickets and sla_compliance_rate.
 */
export async function fetchAnalyticsSummary() {
  try {
    const response = await apiClient.get('/tickets', { params: { limit: 200 } });
    const tickets = Array.isArray(response.data) ? response.data : [];
    const total = tickets.length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const compliant = tickets.filter((t) => !t.is_sla_breached).length;
    const complianceRate = total > 0 ? (compliant / total) * 100 : 100;
    return {
      total_tickets: total,
      resolved_tickets: resolved,
      sla_compliance_rate: complianceRate,
    };
  } catch {
    return {
      total_tickets: 0,
      resolved_tickets: 0,
      sla_compliance_rate: 100,
    };
  }
}

/**
 * Directly update ticket attributes (status, priority, location, department, notes).
 * Used by Supervisory Admin and SuperAdmin consoles.
 */
export async function updateTicketDirect(ticketId, payload) {
  const response = await apiClient.patch(`/tickets/${ticketId}`, payload);
  return response.data;
}
```

### 1. Plain-English Purpose
- `fetchAnalyticsSummary`: Provides a client-side telemetry fallback for the public homepage banner, calculating the total complaints, resolved complaints, and SLA compliance rate.
- `updateTicketDirect`: Calls `PATCH /tickets/{ticketId}` allowing facility supervisors to modify department assignment, priority, or internal notes.

### 2. Line-by-Line Breakdown
- **Lines 93–113 (`fetchAnalyticsSummary`)**:
  - Fetches recent tickets (`limit: 200`).
  - Uses array `.filter()` to count resolved and compliant tickets.
  - Safely handles errors in a `try...catch` block, returning zeros rather than crashing the landing page.
- **Lines 119–122 (`updateTicketDirect`)**:
  - Issues `PATCH /tickets/{ticketId}` with partial update attributes.

---

## 5. Viva & Technical Defense Guide

> [!TIP]
> **Q1: Why does `submitComplaint` validate title and description length in JavaScript when the backend already has Pydantic validation?**  
> **Answer**: It implements **multi-tier defense in depth**. Client-side validation provides instant visual feedback to the student (e.g. showing "Description must contain at least 10 characters" in red text), saving cellular data and preventing unnecessary network traffic. Backend validation guarantees that even if a malicious user bypasses the browser UI (e.g. using Postman or curl), invalid data is still rejected at the API layer.

> [!TIP]
> **Q2: Why does `fetchTicketByCode` call `.toUpperCase()` on the tracking code?**  
> **Answer**: Tracking codes are generated as uppercase strings (`TICK-7A9X`). Students entering codes on mobile phones frequently type lowercase letters (`tick-7a9x`). Converting the input to uppercase on the client ensures that database B-Tree index lookups match exactly, providing a frictionless tracking experience.

> [!TIP]
> **Q3: What is the role of `encodeURIComponent` in `submitFeedback`?**  
> **Answer**: `encodeURIComponent` sanitizes URL path parameters by converting non-alphanumeric characters into percent-encoded entities (e.g. spaces become `%20`). If a ticket identifier contains unexpected characters or slashes, this prevents URL path traversal errors.

---

## 6. Quick-Reference Viva Summary Table

| Concept / Keyword | Meaning in Basic C / Python | Role in `complaints.js` |
| :--- | :--- | :--- |
| `submitComplaint` | Record submission caller | Validates inputs ($\ge 5$ title, $\ge 10$ desc) and posts new complaint. |
| `fetchTicketByCode` | ID lookup function | Queries complaint status using tracking code (`TICK-XXXX`). |
| `.toUpperCase()` | String uppercase transform | Normalizes tracking code input for exact database index matching. |
| `fetchComplaints` | Paged search query caller | Retrieves ticket lists filtered by status, priority, or department. |
| `submitFeedback` | Review submission function | Posts 1-to-5 star student satisfaction rating and review comments. |
| `fetchAnalyticsSummary` | Client-side metrics calculator | Computes total tickets and SLA compliance percentage for landing page. |
| `updateTicketDirect` | Partial update caller | Dispatches `PATCH /tickets/{id}` for supervisor adjustments. |
| `encodeURIComponent` | String URL sanitizer | Prevents URL corruption when interpolating ticket identifiers. |
