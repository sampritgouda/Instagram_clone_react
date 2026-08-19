/**
 * authFetch.js
 * Drop-in replacement for fetch() that automatically:
 *  1. Attaches the JWT Authorization header from localStorage
 *  2. Detects 401 Unauthorized responses (token expired / invalid)
 *  3. Clears auth data and redirects to /login with a clear message
 *
 * Usage:
 *   import { authFetch } from '../utils/authFetch';
 *   const res = await authFetch('/api/posts', { method: 'GET' });
 */

let _isRedirecting = false; // prevent multiple simultaneous redirects

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');

  // Merge Authorization header with existing headers
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(url, { ...options, headers });

  // Handle token expiry / unauthorized globally
  if (response.status === 401 && !_isRedirecting) {
    _isRedirecting = true;

    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('profileImage');
    localStorage.removeItem('user');

    // Show a toast-style alert then redirect
    const message = 'Your session has expired. Please log in again.';
    // Use a small timeout so any in-flight renders complete
    setTimeout(() => {
      alert(message); // simple fallback; replace with toast if you have one
      window.location.href = '/login';
      _isRedirecting = false;
    }, 100);
  }

  return response;
}
