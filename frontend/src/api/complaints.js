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
    location: ticketData.location && ticketData.location.trim() ? ticketData.location.trim() : 'Campus'
  };

  const response = await apiClient.post('/tickets/', payload);
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
  const response = await apiClient.get('/tickets/', { params });
  return response.data;
}
