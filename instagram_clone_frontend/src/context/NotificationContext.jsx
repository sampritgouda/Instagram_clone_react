import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config';
import { websocketService } from '../utils/websocketService';
import { showDeviceNotification } from '../utils/notificationUtils';
import { subscribeToWebPush, registerServiceWorker } from '../utils/webPushUtils';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState(null);
  const [webPushEnabled, setWebPushEnabled] = useState(false);
  const intervalRef = useRef(null);

  // ── Fetch unread counts from REST (fallback / on-mount sync) ──────────────
  const fetchUnreadCounts = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUnreadCount(0);
      setUnreadMessageCount(0);
      return;
    }
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    try {
      const resp = await fetch(`${API_BASE_URL}/api/user/notifications/unread-count`, {
        headers: { Authorization: authHeader },
      });
      if (resp.ok) {
        const data = await resp.json();
        setUnreadCount(data.count || 0);
      } else if (resp.status === 401 || resp.status === 403) {
        setUnreadCount(0);
      }
    } catch (_) {}

    try {
      const msgResp = await fetch(`${API_BASE_URL}/api/messages/unread-count`, {
        headers: { Authorization: authHeader },
      });
      if (msgResp.ok) {
        const msgData = await msgResp.json();
        setUnreadMessageCount(msgData.count || 0);
      } else if (msgResp.status === 401 || msgResp.status === 403) {
        setUnreadMessageCount(0);
      }
    } catch (_) {}
  }, []);

  // Poll every 30s as a fallback (WebSocket handles real-time updates)
  useEffect(() => {
    fetchUnreadCounts();
    intervalRef.current = setInterval(fetchUnreadCounts, 30000);

    const handleFocus = () => fetchUnreadCounts();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchUnreadCounts]);

  // ── REAL-TIME: WebSocket notification listener ────────────────────────────
  // Updates badge counts instantly when a notification arrives via WebSocket
  // (works while the browser tab is open)
  useEffect(() => {
    const handleNotification = (data) => {
      if (!data) return;
      const type = data.type || '';

      if (type === 'MESSAGE') {
        setUnreadMessageCount(prev => prev + 1);
      } else {
        setUnreadCount(prev => prev + 1);
      }

      setLatestNotification({
        type,
        title: data.title || data.senderUsername || 'Notification',
        body: data.body || '',
        senderProfilePicUrl: data.senderProfilePicUrl || '',
        createdAt: data.createdAt || new Date().toISOString(),
        id: Date.now(),
      });

      // In-browser notification popup (when tab is visible but backgrounded)
      if (data.title && Notification.permission === 'granted') {
        showDeviceNotification(data.title, {
          body: data.body,
          icon: data.senderProfilePicUrl || '/logo.jpg',
          onClickUrl: type === 'MESSAGE' ? '/messages' : '/notifications',
          tag: `insta-ws-${type}-${data.senderId || Date.now()}`,
        });
      }
    };

    const unsub = websocketService.on('notification', handleNotification);
    return () => unsub();
  }, []);

  // ── WEB PUSH: Register Service Worker + Subscribe ─────────────────────────
  // This runs once on mount (after login). Sets up the Service Worker so
  // notifications work even when the browser is completely closed.
  useEffect(() => {
    const setupWebPush = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Always register the SW (needed for caching/PWA even without push)
      await registerServiceWorker();

      // Only auto-subscribe if permission was previously granted
      // (avoids bombarding users with permission dialog on every load)
      if (Notification.permission === 'granted') {
        const success = await subscribeToWebPush(token);
        setWebPushEnabled(success);
      }

      // Listen for subscription changes (browser rotates keys)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') {
            const token = localStorage.getItem('token');
            if (token) subscribeToWebPush(token);
          }
        });
      }
    };

    setupWebPush();
  }, []);

  // ── Enable Web Push on demand (called from UI when user clicks "Enable Notifications") ──
  const enableWebPush = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    const success = await subscribeToWebPush(token);
    setWebPushEnabled(success);
    return success;
  }, []);

  // Reset notification badge instantly (called when user opens notifications page)
  const markAllReadLocally = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Reset message badge instantly (called when user opens messages)
  const markMessagesReadLocally = useCallback(() => {
    setUnreadMessageCount(0);
  }, []);

  // Clear the latest notification toast
  const clearLatestNotification = useCallback(() => {
    setLatestNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      unreadMessageCount,
      latestNotification,
      webPushEnabled,
      fetchUnreadCount: fetchUnreadCounts,
      markAllReadLocally,
      markMessagesReadLocally,
      clearLatestNotification,
      enableWebPush,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
