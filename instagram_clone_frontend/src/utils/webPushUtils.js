/**
 * Web Push Utilities
 *
 * Handles the full lifecycle of Web Push subscription:
 *  1. Convert VAPID public key from base64url to Uint8Array
 *  2. Register the Service Worker (sw.js)
 *  3. Subscribe via browser PushManager
 *  4. POST the subscription to backend
 *  5. Handle subscription changes (when browser rotates keys)
 */

import { API_BASE_URL } from '../config';

/**
 * Convert a base64url string to a Uint8Array.
 * Required by PushManager.subscribe() for the applicationServerKey.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Fetch the VAPID public key from the backend.
 */
async function fetchVapidPublicKey() {
  const res = await fetch(`${API_BASE_URL}/api/push/vapid-public-key`);
  if (!res.ok) throw new Error('Failed to fetch VAPID public key');
  const data = await res.json();
  return data.publicKey;
}

/**
 * Register the Service Worker (sw.js must be in /public root).
 * Returns the ServiceWorkerRegistration.
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported in this browser');
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('✅ Service Worker registered:', registration.scope);
    return registration;
  } catch (err) {
    console.error('❌ Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Full Web Push subscription flow:
 *  1. Register SW
 *  2. Request notification permission
 *  3. Subscribe to push via PushManager
 *  4. POST subscription to backend
 *
 * @param {string} authToken - JWT token for the authenticated user
 * @returns {boolean} true if successfully subscribed, false otherwise
 */
export async function subscribeToWebPush(authToken) {
  try {
    // Check browser support
    if (!('PushManager' in window)) {
      console.warn('Web Push not supported in this browser');
      return false;
    }

    // 1. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // 2. Register Service Worker
    const registration = await registerServiceWorker();
    if (!registration) return false;

    // Wait for SW to be ready
    await navigator.serviceWorker.ready;

    // 3. Fetch VAPID public key from backend
    const vapidPublicKey = await fetchVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // 4. Check for existing subscription — don't create a duplicate
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,  // Required — must always show a notification on push
        applicationServerKey,
      });
    }

    // 5. POST subscription to backend
    const subJson = subscription.toJSON();
    const authHeader = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;

    const res = await fetch(`${API_BASE_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        p256dh:   subJson.keys?.p256dh,
        auth:     subJson.keys?.auth,
      }),
    });

    if (res.ok) {
      console.log('✅ Web Push subscription saved to backend');
      return true;
    } else {
      console.error('❌ Failed to save push subscription to backend:', res.status);
      return false;
    }
  } catch (err) {
    console.error('❌ Web Push subscription error:', err);
    return false;
  }
}

/**
 * Unsubscribe from Web Push for this device.
 * Removes from both browser and backend.
 *
 * @param {string} authToken - JWT token
 */
export async function unsubscribeFromWebPush(authToken) {
  try {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return;

    const endpoint = subscription.endpoint;

    // Unsubscribe from browser
    await subscription.unsubscribe();

    // Remove from backend
    const authHeader = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
    await fetch(`${API_BASE_URL}/api/push/unsubscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ endpoint }),
    });

    console.log('✅ Web Push unsubscribed');
  } catch (err) {
    console.error('❌ Web Push unsubscription error:', err);
  }
}

/**
 * Check if this browser is currently subscribed to Web Push.
 */
export async function isSubscribedToWebPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}
