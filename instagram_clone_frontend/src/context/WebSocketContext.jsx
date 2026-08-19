import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { websocketService } from '../utils/websocketService';
import { requestNotificationPermission } from '../utils/notificationUtils';
import { API_BASE_URL } from '../config';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingMap, setTypingMap] = useState({}); // userId -> boolean
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);

  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;

  // Request browser notification permissions on mount
  useEffect(() => {
    requestNotificationPermission().then(granted => {
      setNotificationPermissionGranted(granted);
    });
  }, []);

  // Fetch initial online user list from REST endpoint
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/presence/online-users`);
      if (res.ok) {
        const userIds = await res.json();
        setOnlineUsers(new Set(userIds));
      }
    } catch (_) {}
  }, []);

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (token && currentUser) {
      websocketService.connect(token, currentUser);
      fetchOnlineUsers();

      // Listen for presence events
      const unsubPresence = websocketService.on('presence', (event) => {
        if (event && event.userId) {
          setOnlineUsers(prev => {
            const next = new Set(prev);
            if (event.status === 'ONLINE') {
              next.add(Number(event.userId));
            } else if (event.status === 'OFFLINE') {
              next.delete(Number(event.userId));
            }
            return next;
          });
        }
      });

      // Listen for typing events
      const unsubTyping = websocketService.on('typing', (event) => {
        if (event && event.senderId !== undefined) {
          setTypingMap(prev => ({
            ...prev,
            [event.senderId]: !!event.isTyping
          }));
        }
      });

      return () => {
        unsubPresence();
        unsubTyping();
      };
    } else {
      websocketService.disconnect();
    }
  }, [token, currentUser?.id, fetchOnlineUsers]);

  const isOnline = (userId) => {
    return onlineUsers.has(Number(userId));
  };

  const isTyping = (userId) => {
    return !!typingMap[userId];
  };

  const promptNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermissionGranted(granted);
    return granted;
  };

  return (
    <WebSocketContext.Provider
      value={{
        websocketService,
        onlineUsers,
        isOnline,
        isTyping,
        notificationPermissionGranted,
        promptNotificationPermission,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    return {
      websocketService,
      onlineUsers: new Set(),
      isOnline: () => false,
      isTyping: () => false,
      notificationPermissionGranted: false,
      promptNotificationPermission: async () => false,
    };
  }
  return context;
};
