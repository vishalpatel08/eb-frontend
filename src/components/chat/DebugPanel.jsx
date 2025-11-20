import React, { useEffect, useState } from 'react';
import { chatService } from '../../services/chatService';
import './DebugPanel.css';
import { API_BASE_URL } from '../../config';

export const DebugPanel = () => {
  const [readyState, setReadyState] = useState(chatService.getReadyState());
  const [attempts, setAttempts] = useState(chatService.getReconnectAttempts());
  const [lastError, setLastError] = useState(chatService.getLastError());
  const [onlineUsers, setOnlineUsers] = useState(null);

  useEffect(() => {
    const id = setInterval(() => {
      setReadyState(chatService.getReadyState());
      setAttempts(chatService.getReconnectAttempts());
      setLastError(chatService.getLastError());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const fetchOnline = async () => {
    const url = `${API_BASE_URL.replace(/\/\+$/,'')}/api/debug/online-users`;
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        setOnlineUsers(data);
      } catch (e) {
        // Response was not JSON (likely HTML). Show raw text for debugging.
        setOnlineUsers({ error: 'Non-JSON response', body: text, status: res.status, contentType: res.headers.get('content-type') });
      }
    } catch (e) {
      setOnlineUsers({ error: e.message });
    }
  };

  return (
    <div className="debug-panel">
      <div><strong>WebSocket readyState:</strong> {readyState}</div>
      <div><strong>Reconnect attempts:</strong> {attempts}</div>
      <div><strong>Last error:</strong> {String(lastError)}</div>
      <div className="controls">
        <button onClick={fetchOnline}>Fetch /api/debug/online-users</button>
      </div>
      <pre>{onlineUsers ? JSON.stringify(onlineUsers, null, 2) : 'No data'}</pre>
    </div>
  );
};

export default DebugPanel;
