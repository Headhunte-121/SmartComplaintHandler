/**
 * SmartComplaintHandler - Triage & Priority API Client
 * Blueprint Reference: docs/V1/M3/frontend/01_triage_api_client.md
 * Role: Asynchronous HTTP transport client for stateless triage previews and supervisor priority overrides.
 */
import apiClient from './client';

/**
 * Dispatches a stateless complaint classification and priority triage preview request.
 * Debounced caller invokes this when student finishes typing and pauses for several seconds.
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

  const response = await apiClient.post('/tickets/triage-preview', {
    title: cleanTitle,
    description: cleanDesc,
  });
  return response.data;
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

  const payload = {
    new_priority: cleanPriority,
    override_reason: cleanReason,
  };

  const response = await apiClient.patch(`/tickets/${ticketId}/priority`, payload);
  return response.data;
}
