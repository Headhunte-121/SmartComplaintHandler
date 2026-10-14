/**
 * SmartComplaintHandler - Authentication & Administration API Client
 * Domain: Handles @iiitnr.edu.in institutional login with Remember Me,
 *         production Google Workspace OAuth2/OIDC SSO (@iiitnr.edu.in Internal org),
 *         student hostel & room profile persistence, stateless OTP challenge tokens,
 *         JWT refresh rotation, and Supabase profile sync.
 */
import axios from 'axios';
import apiClient from './client';

const ALLOWED_DOMAIN = 'iiitnr.edu.in';

/**
 * Resolve IIIT-NR student roll number, branch (100->CSE, 101->DSAI, 102/302->ECE),
 * or staff role from a verified @iiitnr.edu.in email address.
 */
export function resolveIiitnrProfileFromEmail(email, providedName = '') {
  const cleanEmail = (email || '').trim().toLowerCase();
  const prefix = cleanEmail.split('@')[0] || '';

  if (prefix === 'superadmin' || prefix === 'director' || prefix === 'super.admin') {
    return {
      name: providedName || 'Prof. (Dr.) Om Prakash Vyas (Director)',
      email: cleanEmail,
      role: 'SUPER_ADMIN',
      department_name: 'Office of the Director',
      identifier: 'Directorate (DIR-01)',
      is_active: true,
    };
  }

  if (
    prefix === 'admin' ||
    prefix === 'estate' ||
    prefix === 'facilities' ||
    prefix === 'rakesh' ||
    prefix === 'ranjeet' ||
    prefix === 'abir' ||
    prefix === 'ambika' ||
    prefix.endsWith('.admin')
  ) {
    return {
      name: providedName || 'Rakesh Kumar Mishra (Estate Officer)',
      email: cleanEmail,
      role: 'ADMIN',
      department_name: 'General Administration',
      identifier: 'Estate Officer (0771-2474104)',
      is_active: true,
    };
  }

  if (prefix.startsWith('tech.') || prefix.includes('technician') || prefix === 'parvinder') {
    return {
      name:
        providedName ||
        prefix
          .replace('tech.', '')
          .replace(/\./g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      email: cleanEmail,
      role: 'TECHNICIAN',
      department_name: 'Electrical',
      identifier: 'Field Technician',
      is_active: true,
    };
  }

  const match = prefix.match(/^([a-z]+(?:[._][a-z]+)*?)(\d{2})(\d{2,5})$/i);
  if (match) {
    const derivedName = match[1]
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
    const year = match[2];
    const code = match[3];

    let deptName = 'Computer Science & Engineering';
    let deptCode = 'CSE';
    if (code.startsWith('101') || code.endsWith('01')) {
      deptName = 'Data Science & Artificial Intelligence';
      deptCode = 'DSAI';
    } else if (code.startsWith('102') || code.endsWith('02') || code === '302') {
      deptName = 'Electronics & Communication Engineering';
      deptCode = 'ECE';
    }

    return {
      name: providedName || derivedName,
      email: cleanEmail,
      role: 'STUDENT',
      department_name: deptName,
      identifier: `Roll: 20${year}${deptCode}${code} (Batch '20${year})`,
      is_active: true,
    };
  }

  const fallbackName =
    providedName ||
    prefix
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

  return {
    name: fallbackName,
    email: cleanEmail,
    role: 'STUDENT',
    department_name: 'Computer Science & Engineering',
    identifier: `Student ID: ${prefix.toUpperCase()}`,
    is_active: true,
  };
}

export async function fetchAuthConfig() {
  const response = await apiClient.get('/auth/config');
  return response.data;
}

export async function loginUser(email, password, rememberMe = false) {
  const response = await apiClient.post('/auth/login', {
    email: email.trim().toLowerCase(),
    password,
    remember_me: Boolean(rememberMe),
  });
  return response.data;
}

export async function loginWithGoogle(googleData) {
  const cleanEmail = googleData.email ? googleData.email.trim().toLowerCase() : '';
  const cleanHd = googleData.hd ? googleData.hd.trim().toLowerCase() : '';

  if (cleanEmail && !cleanEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
    throw new Error(
      `Access denied: Google Sign-In is strictly restricted to official @${ALLOWED_DOMAIN} institutional accounts.`
    );
  }
  if (cleanHd && cleanHd !== ALLOWED_DOMAIN) {
    throw new Error(
      `Access denied: Hosted domain '${cleanHd}' is not authorized. Must be @${ALLOWED_DOMAIN}.`
    );
  }

  const payload = {
    access_token: googleData.access_token || undefined,
    credential: googleData.credential || undefined,
    email: cleanEmail || undefined,
    name: googleData.name ? googleData.name.trim() : undefined,
    picture: googleData.picture || undefined,
    hd: cleanHd || ALLOWED_DOMAIN,
    email_verified: googleData.email_verified !== undefined ? Boolean(googleData.email_verified) : true,
    remember_me: googleData.remember_me !== false,
  };

  try {
    const response = await apiClient.post('/auth/google', payload);
    return response.data;
  } catch (err) {
    // If a custom VITE_API_BASE_URL failed with a network error on Vercel, retry via relative /api/v1/auth/google rewrite
    if (!err.response && apiClient.defaults.baseURL !== '/api/v1') {
      const retryRes = await axios.post('/api/v1/auth/google', payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      return retryRes.data;
    }
    throw err;
  }
}

export async function sendOTP(email) {
  const response = await apiClient.post('/auth/send-otp', {
    email: email.trim().toLowerCase(),
  });
  return response.data;
}

export async function verifyOTP(email, otp, otpToken = undefined) {
  const response = await apiClient.post('/auth/verify-otp', {
    email: email.trim().toLowerCase(),
    otp: otp.trim(),
    otp_token: otpToken || undefined,
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
    hostel_name: registrationData.hostel_name ? registrationData.hostel_name.trim() : undefined,
    room_number: registrationData.room_number ? registrationData.room_number.trim() : undefined,
    remember_me: Boolean(registrationData.remember_me),
    otp: registrationData.otp ? registrationData.otp.trim() : undefined,
    otp_token: registrationData.otp_token || undefined,
  });
  return response.data;
}

export async function updateUserProfile(profileData) {
  const response = await apiClient.patch('/auth/profile', {
    name: profileData.name !== undefined ? profileData.name : undefined,
    phone: profileData.phone !== undefined ? profileData.phone : undefined,
    hostel_name: profileData.hostel_name !== undefined ? profileData.hostel_name : undefined,
    room_number: profileData.room_number !== undefined ? profileData.room_number : undefined,
    department_name: profileData.department_name !== undefined ? profileData.department_name : undefined,
  });
  return response.data;
}

export async function refreshSession(refreshToken, rememberMe = true) {
  const response = await apiClient.post('/auth/refresh', {
    refresh_token: refreshToken,
    remember_me: Boolean(rememberMe),
  });
  return response.data;
}

export async function logoutUser() {
  const response = await apiClient.post('/auth/logout');
  return response.data;
}

export async function changePassword(currentPassword, newPassword) {
  const response = await apiClient.post('/auth/change-password', {
    current_password: currentPassword || undefined,
    new_password: newPassword,
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
