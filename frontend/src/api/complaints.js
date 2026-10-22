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


