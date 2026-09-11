/**
 * SmartComplaintHandler - Complaints API Transport
 * Blueprint Reference: V1/M2/frontend/01_complaints_api_client.md
 * Role: HTTP functions for submitting complaints and fetching ticket status by code.
 */
import apiClient from './client';

export const submitComplaint = async (data) => {
  const response = await apiClient.post('/tickets', data);
  return response.data;
};

export const getTicketByCode = async (trackingCode) => {
  const response = await apiClient.get(`/tickets/${trackingCode}`);
  return response.data;
};
