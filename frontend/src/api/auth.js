/**
 * SmartComplaintHandler - Authentication & Administration API Client
 * Domain: Handles @iiitnr.edu.in institutional login, staff listing, admin creation,
 *         and database sanitization actions under Super Admin authority.
 */
import apiClient from './client';

export async function loginUser(email, password = '••••••••') {
  const response = await apiClient.post('/auth/login', {
    email: email.trim().toLowerCase(),
    password,
  });
  return response.data;
}

export async function fetchAdmins() {
  const response = await apiClient.get('/auth/admins');
  return response.data;
}

export async function createAdmin(adminData) {
  const response = await apiClient.post('/auth/admins', adminData);
  return response.data;
}

export async function deleteAdmin(userId) {
  const response = await apiClient.delete(`/auth/admins/${userId}`);
  return response.data;
}

export async function purgeTickets() {
  const response = await apiClient.post('/auth/purge-tickets');
  return response.data;
}
