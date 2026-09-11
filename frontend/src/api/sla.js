/**
 * SmartComplaintHandler - SLA API Transport
 * Blueprint Reference: V1/M5/frontend/01_sla_api_client.md
 * Role: HTTP functions for status updates, ticket resolution, and breach monitoring.
 */
import apiClient from './client';

export const updateTicketStatus = async (ticketId, status) => {
  const response = await apiClient.patch(`/tickets/${ticketId}/status`, { status });
  return response.data;
};

export const resolveTicket = async (ticketId, resolutionNotes) => {
  const response = await apiClient.post(`/tickets/${ticketId}/resolve`, { resolution_notes: resolutionNotes });
  return response.data;
};

export const getActiveBreaches = async () => {
  const response = await apiClient.get('/sla/breaches');
  return response.data;
};
