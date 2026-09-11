/**
 * SmartComplaintHandler - Triage API Transport
 * Blueprint Reference: V1/M3/frontend/01_triage_api_client.md
 * Role: HTTP functions for debounced live preview and supervisory priority overrides.
 */
import apiClient from './client';

export const previewTriage = async (payload) => {
  const response = await apiClient.post('/triage-preview', payload);
  return response.data;
};

export const overridePriority = async (ticketId, payload) => {
  const response = await apiClient.patch(`/tickets/${ticketId}/priority`, payload);
  return response.data;
};
