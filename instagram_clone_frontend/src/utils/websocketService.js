import { API_BASE_URL } from '../config';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.token = null;
    this.userId = null;
    this.listeners = {
      message: new Set(),
      presence: new Set(),
      typing: new Set(),
      seen: new Set(),
      notification: new Set(),
    };
    this.subIdCounter = 1;
    this.reconnectTimer = null;
  }

  connect(token, currentUser) {
    if (!token || !currentUser) return;
    this.token = token;
    this.userId = currentUser.id || currentUser.userId;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Convert http(s):// base URL to ws(s)://
    let wsUrl = API_BASE_URL.replace(/^http/, 'ws');
    // Using raw websocket endpoint or websocket fallback
    wsUrl = `${wsUrl}/ws-raw?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
        console.log('⚡ WebSocket Connected Successfully');

        // Send STOMP CONNECT frame
        const connectFrame =
          `CONNECT\n` +
          `Authorization:Bearer ${token}\n` +
          `accept-version:1.1,1.0\n` +
          `heart-beat:10000,10000\n\n\0`;
        this.ws.send(connectFrame);

        // Subscribe to relevant STOMP topics
        this.subscribe(`/topic/presence`);
        if (this.userId) {
          this.subscribe(`/topic/messages.${this.userId}`);
          this.subscribe(`/topic/typing.${this.userId}`);
          this.subscribe(`/topic/seen.${this.userId}`);
          this.subscribe(`/topic/notifications.${this.userId}`);
        }
      };

      this.ws.onmessage = (event) => {
        this.handleRawMessage(event.data);
      };

      this.ws.onclose = () => {
        this.connected = false;
        console.log('WebSocket Disconnected. Retrying in 4s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
      };
    } catch (e) {
      console.error('WebSocket Exception:', e);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.token && this.userId) {
        this.connect(this.token, { id: this.userId });
      }
    }, 4000);
  }

  subscribe(destination) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const subId = `sub-${this.subIdCounter++}`;
    const subFrame = `SUBSCRIBE\nid:${subId}\ndestination:${destination}\n\n\0`;
    this.ws.send(subFrame);
  }

  handleRawMessage(rawData) {
    if (!rawData) return;
    // Parse STOMP MESSAGE frame
    if (rawData.startsWith('MESSAGE')) {
      const bodyIndex = rawData.indexOf('\n\n');
      if (bodyIndex !== -1) {
        const bodyStr = rawData.substring(bodyIndex + 2).replace(/\0$/, '').trim();
        if (!bodyStr) return;
        try {
          const data = JSON.parse(bodyStr);
          const headersStr = rawData.substring(0, bodyIndex);

          if (headersStr.includes('/topic/presence')) {
            this.listeners.presence.forEach(fn => fn(data));
          } else if (headersStr.includes('/topic/messages.')) {
            this.listeners.message.forEach(fn => fn(data));
          } else if (headersStr.includes('/topic/typing.')) {
            this.listeners.typing.forEach(fn => fn(data));
          } else if (headersStr.includes('/topic/seen.')) {
            this.listeners.seen.forEach(fn => fn(data));
          } else if (headersStr.includes('/topic/notifications.')) {
            this.listeners.notification.forEach(fn => fn(data));
          }
        } catch (e) {
          console.error('STOMP JSON parse error:', e);
        }
      }
    }
  }

  sendMessage(recipientId, content, reelId = null, postId = null, repliedToMessageId = null) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    const payload = JSON.stringify({
      recipientId,
      content,
      reelId,
      postId,
      repliedToMessageId
    });
    const sendFrame = `SEND\ndestination:/app/chat.sendMessage\ncontent-type:application/json\n\n${payload}\0`;
    this.ws.send(sendFrame);
    return true;
  }

  sendTyping(recipientId, isTyping) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const payload = JSON.stringify({ recipientId, isTyping });
    const sendFrame = `SEND\ndestination:/app/chat.typing\ncontent-type:application/json\n\n${payload}\0`;
    this.ws.send(sendFrame);
  }

  sendMarkSeen(senderId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const payload = JSON.stringify({ senderId });
    const sendFrame = `SEND\ndestination:/app/chat.markSeen\ncontent-type:application/json\n\n${payload}\0`;
    this.ws.send(sendFrame);
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].add(callback);
    }
    return () => {
      if (this.listeners[event]) {
        this.listeners[event].delete(callback);
      }
    };
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }
}

export const websocketService = new WebSocketService();
