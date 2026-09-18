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
