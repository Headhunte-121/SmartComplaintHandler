/**
 * SmartComplaintHandler - Assignment API Transport
 * Blueprint Reference: V1/M4/frontend/01_assignment_api_client.md
 * Role: HTTP functions for squad workloads and ticket reassignment.
 */
import apiClient from './client';

export const getTeamWorkloads = async () => {
  const response = await apiClient.get('/teams/workloads');
  return response.data;
};

export const reassignTicket = async (ticketId, payload) => {
  const response = await apiClient.patch(`/tickets/${ticketId}/reassign`, payload);
  return response.data;
};
