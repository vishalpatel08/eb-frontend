class ChatService {
  constructor() {
    this.socket = null;
    this.messageHandlers = new Set();
    this.connectionHandlers = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelayMs = 1500;
    this._lastError = null;
  }

  connect(userId) {
    if (this.socket) {
      this.disconnect();
    }

    try {
      const { WS_BASE_URL } = require('../config');
      const base = WS_BASE_URL;
      const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
      const wsUrl = `${normalizedBase}/ws?userId=${userId}`;
      this.socket = new WebSocket(wsUrl);
    } catch (err) {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const defaultBackendHost = window.location.hostname + ':4000';
      const base = `${wsProtocol}//${defaultBackendHost}`;
      const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
      const wsUrl = `${normalizedBase}/ws?userId=${userId}`;
      try {
        this.socket = new WebSocket(wsUrl);
      } catch (e) {
        console.error('WebSocket constructor threw error (fallback):', e);
        this._notifyConnection(false);
        return;
      }
      return;
    }

    this.socket.onopen = () => {
      this.connectionHandlers.forEach(handler => handler(true));
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const text = event.data;
        const lines = String(text).split(/\r?\n/).filter(Boolean);
        lines.forEach(line => {
          try {
            const message = JSON.parse(line);
            this.messageHandlers.forEach(handler => handler(message));
          } catch (err) {
            console.error('Error parsing JSON line from websocket:', err, 'line=', line);
          }
        });
      } catch (error) {
        console.error('Error handling websocket message event:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      this.connectionHandlers.forEach(handler => handler(false));
      this.socket = null;

      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts += 1;
        const delay = this.reconnectDelayMs * this.reconnectAttempts;
        console.log(`WebSocket will attempt reconnect #${this.reconnectAttempts} in ${delay}ms`);
        setTimeout(() => this.connect(userId), delay);
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('Max WebSocket reconnect attempts reached');
      }
    };

    this.socket.onerror = (error) => {
      try {
        console.error('WebSocket error event:', error);
        if (this.socket) {
          console.debug('socket.readyState=', this.socket.readyState);
        }
        this._lastError = error;
      } catch (e) {
        console.error('Error logging websocket error:', e);
      }
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  sendMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        const payload = JSON.stringify(message);
        console.debug('WS send:', payload);
        this.socket.send(payload);
      } catch (err) {
        console.error('Failed to send over WebSocket:', err);
        return false;
      }
      return true;
    }
    return false;
  }

  _notifyConnection(state) {
    this.connectionHandlers.forEach(handler => handler(state));
  }

  addMessageHandler(handler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  addConnectionHandler(handler) {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  getReadyState() {
    return this.socket ? this.socket.readyState : WebSocket.CLOSED;
  }

  getReconnectAttempts() {
    return this.reconnectAttempts;
  }

  getLastError() {
    return this._lastError;
  }
}

export const chatService = new ChatService();