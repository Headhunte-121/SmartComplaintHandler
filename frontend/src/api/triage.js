/**
 * SmartComplaintHandler - Triage & Priority API Client
 * Blueprint Reference: docs/V1/M3/frontend/01_triage_api_client.md
 * Role: Asynchronous HTTP transport client for stateless triage previews and supervisor priority overrides.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Extracts and normalizes backend error details into a human-readable string.
 */
function extractErrorMessage(data, defaultMsg) {
  if (!data) return defaultMsg;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((err) => err.msg || JSON.stringify(err)).join('; ');
  }
  return data.message || defaultMsg;
}

/**
 * Dispatches a stateless complaint classification and priority triage preview request.
 * Debounced caller can invoke this when student pauses typing.
 *
 * @param {string} title - Complaint title (min 5 characters)
 * @param {string} description - Complaint narrative description (min 10 characters)
 * @returns {Promise<Object|null>} - Parsed TriageResult object or null if input too short
 */
export async function fetchTriagePreview(title, description) {
  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();

  // Transport-layer guard: avoid wasteful network calls if input is below schema boundaries
  if (cleanTitle.length < 5 || cleanDesc.length < 10) {
    return null;
  }

  const endpoint = `${API_BASE_URL}/tickets/triage-preview`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        title: cleanTitle,
        description: cleanDesc,
      }),
    });

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // ignore json parse error
      }
      const msg = extractErrorMessage(
        errorData,
        `Triage preview failed with status ${response.status}`
      );
      throw new Error(msg);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[Triage API] Error fetching triage preview:', err);
    throw err;
  }
}

/**
 * Submits an administrative priority override for a specific incident ticket.
 *
 * @param {number|string} ticketId - Primary key database ID of the ticket
 * @param {string} newPriority - Target priority tier (CRITICAL, HIGH, MEDIUM, LOW)
 * @param {string} overrideReason - Mandatory supervisory explanation (min 5 chars)
 * @returns {Promise<Object>} - Updated ticket entity
 */
export async function overrideTicketPriority(ticketId, newPriority, overrideReason) {
  const cleanReason = (overrideReason || '').trim();
  const cleanPriority = (newPriority || '').trim().toUpperCase();

  if (cleanReason.length < 5) {
    throw new Error('Override justification must be at least 5 characters long.');
  }

  const endpoint = `${API_BASE_URL}/tickets/${ticketId}/priority`;

  try {
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        new_priority: cleanPriority,
        override_reason: cleanReason,
      }),
    });

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // ignore json parse error
      }
      const msg = extractErrorMessage(
        errorData,
        `Priority override failed with status ${response.status}`
      );
      throw new Error(msg);
    }

    const updatedTicket = await response.json();
    return updatedTicket;
  } catch (err) {
    console.error('[Triage API] Error overriding priority:', err);
    throw err;
  }
}
