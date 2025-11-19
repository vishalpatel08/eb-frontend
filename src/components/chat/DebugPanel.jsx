import React, { useEffect, useState } from 'react';
import { chatService } from '../../services/chatService';

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
    // Use the same logic as other files to determine API base URL
    const API_BASE_URL = window._env_?.REACT_APP_API_URL || 'http://localhost:4000/api';
    const url = `${API_BASE_URL.replace(/\/$/, '')}/debug/online-users`;
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
    <div style={{padding:10, border:'1px solid #eee', background:'#fafafa', fontSize:12}}>
      <div><strong>WebSocket readyState:</strong> {readyState}</div>
      <div><strong>Reconnect attempts:</strong> {attempts}</div>
      <div><strong>Last error:</strong> {String(lastError)}</div>
      <div style={{marginTop:8}}>
        <button onClick={fetchOnline}>Fetch /api/debug/online-users</button>
      </div>
      <pre style={{whiteSpace:'pre-wrap', marginTop:8}}>{onlineUsers ? JSON.stringify(onlineUsers, null, 2) : 'No data'}</pre>
    </div>
  );
};

export default DebugPanel;
