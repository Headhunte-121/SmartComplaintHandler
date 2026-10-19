/**
 * SmartComplaintHandler - SuperAdmin Directorate API Transport
 * Role: HTTP client calls for Directorate executive telemetry, campus infrastructure,
 *       and supervisory ticket overrides.
 */
import apiClient from './client';

/**
 * Fetch server-computed executive operational telemetry for SuperAdmin Directorate.
 * Returns operational KPIs, departmental radar, and squad capacity distributions.
 */
export async function fetchDirectorateTelemetry() {
  const response = await apiClient.get('/superadmin/telemetry');
  return response.data;
}

/**
 * Direct supervisory update of ticket attributes (title, description, location,
 * priority, status, department_name, resolution_notes).
 */
export async function updateTicketSupervisory(ticketId, payload) {
  const response = await apiClient.patch(`/tickets/${ticketId}`, payload);
  return response.data;
}
