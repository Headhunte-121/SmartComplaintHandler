/**
 * SmartComplaintHandler - Authentication & Administration API Client
 * Domain: Handles @iiitnr.edu.in institutional login with Remember Me, new user registration,
 *         staff listing, admin creation, and database sanitization actions under Super Admin authority.
 */
import apiClient from './client';

export async function loginUser(email, password = 'password123', rememberMe = false) {
  const response = await apiClient.post('/auth/login', {
    email: email.trim().toLowerCase(),
    password,
    remember_me: rememberMe,
  });
  return response.data;
}

export async function sendOTP(email) {
  const response = await apiClient.post('/auth/send-otp', {
    email: email.trim().toLowerCase(),
  });
  return response.data;
}

export async function verifyOTP(email, otp) {
  const response = await apiClient.post('/auth/verify-otp', {
    email: email.trim().toLowerCase(),
    otp: otp.trim(),
  });
  return response.data;
}

export async function registerUser(registrationData) {
  const response = await apiClient.post('/auth/register', {
    name: registrationData.name ? registrationData.name.trim() : undefined,
    email: registrationData.email.trim().toLowerCase(),
    password: registrationData.password,
    department_name: registrationData.department_name || undefined,
    phone: registrationData.phone ? registrationData.phone.trim() : undefined,
    remember_me: !!registrationData.remember_me,
    otp: registrationData.otp ? registrationData.otp.trim() : undefined,
  });
  return response.data;
}

export async function fetchMe() {
  const response = await apiClient.get('/auth/me');
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
