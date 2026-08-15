import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchUnreadCounts = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUnreadCount(0);
      setUnreadMessageCount(0);
      return;
    }
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // 1. Fetch unread notifications
    try {
      const resp = await fetch(`${API_BASE_URL}/api/user/notifications/unread-count`, {
        headers: { Authorization: authHeader },
      });
      if (resp.status === 401 || resp.status === 403) {
        setUnreadCount(0);
      } else if (resp.ok) {
        const data = await resp.json();
        setUnreadCount(data.count || 0);
      }
    } catch (_) {}

    // 2. Fetch unread messages
    try {
      const msgResp = await fetch(`${API_BASE_URL}/api/messages/unread-count`, {
        headers: { Authorization: authHeader },
      });
      if (msgResp.status === 401 || msgResp.status === 403) {
        setUnreadMessageCount(0);
      } else if (msgResp.ok) {
        const msgData = await msgResp.json();
        setUnreadMessageCount(msgData.count || 0);
      }
    } catch (_) {}
  }, []);

  // Poll every 8 seconds & re-fetch on window focus / visibility change
  useEffect(() => {
    fetchUnreadCounts();
    intervalRef.current = setInterval(fetchUnreadCounts, 8000);

    const handleFocus = () => fetchUnreadCounts();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchUnreadCounts]);

  // Reset notification badge instantly
  const markAllReadLocally = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Reset message badge instantly
  const markMessagesReadLocally = useCallback(() => {
    setUnreadMessageCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      unreadCount, 
      unreadMessageCount, 
      fetchUnreadCount: fetchUnreadCounts, 
      markAllReadLocally,
      markMessagesReadLocally 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};


