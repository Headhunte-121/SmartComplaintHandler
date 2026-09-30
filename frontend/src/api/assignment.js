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
