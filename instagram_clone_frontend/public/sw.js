/**
 * Service Worker for Web Push Notifications
 *
 * This file runs in the background — even when the browser tab is CLOSED.
 * It listens for push events from the server (via VAPID) and shows
 * a native OS notification to the user.
 *
 * Supported browsers:
 *  - Chrome / Edge (Android + Desktop)
 *  - Firefox (Desktop + Android)
 *  - Safari (iOS 16.4+ and macOS)
 */

const APP_NAME = 'Trend';
const DEFAULT_ICON = '/logo.jpg';
const DEFAULT_BADGE = '/logo.jpg';

// ── Push Event ───────────────────────────────────────────────────────────────
// Fires when the server sends a push notification via VAPID.
// Works even if the browser is fully closed.
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: APP_NAME,
      body: event.data.text() || 'You have a new notification',
      url: '/notifications',
    };
  }

  const title = data.title ? `${data.title}` : APP_NAME;
  const options = {
    body: data.body || '',
    icon: data.icon || DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    tag: `${data.type || 'notif'}-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    silent: false,
    data: {
      url: data.url || '/notifications',
      type: data.type || 'GENERAL',
    },
    // Actions shown on the notification (Android Chrome supports this)
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Notification Click ───────────────────────────────────────────────────────
// Fires when the user taps the notification.
// Opens (or focuses) the app and navigates to the correct page.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open in a tab, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Push Subscription Change ─────────────────────────────────────────────────
// Fires if the browser rotates the push subscription (rare but happens).
// Automatically re-subscribes to keep push working.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
    }).then((newSubscription) => {
      // Notify the app that subscription changed so it can re-POST to backend
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_CHANGED',
            subscription: newSubscription.toJSON(),
          });
        });
      });
    })
  );
});

// ── Install / Activate ───────────────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
