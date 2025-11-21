// Centralized runtime configuration for API and WebSocket bases
export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  || (typeof window !== 'undefined' && window.__API_BASE__)
  || 'https://expert-booking.onrender.com';

export const WS_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL)
  || (typeof window !== 'undefined' && window.__WS_BASE__)
  || (() => {
    const proto = (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') ? 'wss:' : 'ws:';
    const host = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
    return `${proto}//${host}:4000`;
  })();