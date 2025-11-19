import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { chatService } from '../services/chatService';

// In ChatContext.jsx
const API_BASE_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL;

export const ChatContext = createContext();

// Add this at the bottom of ChatContext.jsx, before the final export
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children, userId, currentUser }) => {
  // Derive an effective userId from props or currentUser
  const effectiveUserId = userId || currentUser?._id || currentUser?.id || currentUser?.userId;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // WebSocket Connection
  useEffect(() => {
    if (effectiveUserId) {
      console.log('[ChatContext] Connecting WebSocket for userId:', effectiveUserId);
      chatService.connect(effectiveUserId);
      return () => {
        console.log('[ChatContext] Disconnecting WebSocket for userId:', effectiveUserId);
        chatService.disconnect();
      };
    } else {
      console.log('[ChatContext] No userId provided (prop or currentUser), WebSocket not connected');
    }
  }, [effectiveUserId]);

  console.log("[ChatContext] effectiveUserId =", effectiveUserId);

  // Message Handlers
  const handleMessage = useCallback((newMessage) => {
    const chatId = [newMessage.senderId, newMessage.receiverId]
      .sort()
      .join('_');

    setMessages(prev => {
      const list = Array.isArray(prev[chatId]) ? [...prev[chatId]] : [];

      // If an identical message (by _id) already exists, ignore
      if (newMessage._id && list.some(m => m._id === newMessage._id)) {
        return prev;
      }

      // Remove any existing message that matches by sender/receiver/content
      const normalizedNewContent = (newMessage.content || '').trim();
      const filtered = list.filter(m => {
        try {
          if (!m) return true;
          const sameParticipants = m.senderId === newMessage.senderId && m.receiverId === newMessage.receiverId;
          const sameContent = (m.content || '').trim() === normalizedNewContent;
          if (sameParticipants && sameContent) {
            // drop this message (it may be optimistic or duplicate)
            return false;
          }
          return true;
        } catch (e) {
          return true;
        }
      });

      filtered.push(newMessage);

      return { ...prev, [chatId]: filtered };

      return { ...prev, [chatId]: list };
    });
  }, []);

  const handleConnectionChange = useCallback((connected) => {
    console.log('[ChatContext] Connection state changed. isConnected =', connected);
    setIsConnected(connected);
  }, []);

  // Message Loading
  const loadMessages = useCallback(async () => {
    if (!activeChat?.userId || !currentUser?._id) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/messages?user1=${currentUser._id}&user2=${activeChat.userId}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      
      const chatId = [currentUser._id, activeChat.userId].sort().join('_');
      setMessages(prev => ({
        ...prev,
        [chatId]: response.data
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    }
  }, [activeChat?.userId, currentUser?._id]);

  // Recent Chats
  const fetchRecentChats = useCallback(async () => {
    if (!currentUser?._id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chats/recent?userId=${currentUser._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent chats');
      }
      const data = await response.json();
      setRecentChats(data);
    } catch (error) {
      console.error('Error fetching recent chats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser?._id]);

  // Send Message
  const sendMessage = useCallback(async (content, receiverId) => {
    if (!content || !content.trim()) {
      return false;
    }

    const message = {
      senderId: effectiveUserId,
      receiverId,
      content: content.trim(),
      timestamp: new Date().toISOString()
    };
    console.log('[ChatContext] Sending message payload (HTTP persist + optional WS):', message);

    const chatId = [effectiveUserId, receiverId].sort().join('_');

    // If an authoritative server message already exists with same content, skip optimistic append
    const existing = messages[chatId] || [];
    const normalizedContent = message.content.trim();
    const alreadyHasServerMessage = existing.some(m => m && m._id && !String(m._id).startsWith('local-') && (m.content || '').trim() === normalizedContent && m.senderId === message.senderId && m.receiverId === message.receiverId);

    // Create optimistic message if needed
    let optimisticId = null;
    if (!alreadyHasServerMessage) {
      optimisticId = `local-${Date.now()}-${Math.floor(Math.random()*10000)}`;
      const optimisticMessage = {
        _id: optimisticId,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        timestamp: message.timestamp
      };

      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), optimisticMessage]
      }));
    }

    // Try to persist message via HTTP
    try {
      const res = await axios.post(`${API_BASE_URL}/messages`, message, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const saved = res?.data || null;

      // If server returned an authoritative saved message, replace optimistic one (if present)
      if (saved && optimisticId) {
        setMessages(prev => {
          const list = Array.isArray(prev[chatId]) ? [...prev[chatId]] : [];
          const idx = list.findIndex(m => m && m._id === optimisticId);
          if (idx !== -1) {
            list.splice(idx, 1, saved);
          } else {
            // ensure no duplicates by removing any message with same content/sender/receiver
            const filtered = list.filter(m => !(m && (m.senderId === saved.senderId && m.receiverId === saved.receiverId && (m.content || '').trim() === (saved.content || '').trim())));
            filtered.push(saved);
            return { ...prev, [chatId]: filtered };
          }
          return { ...prev, [chatId]: list };
        });
      }

      // If websocket is connected, also attempt to send a realtime message
      if (isConnected) {
        try {
          const wsMsg = {
            senderId: message.senderId,
            receiverId: message.receiverId,
            content: message.content,
            timestamp: new Date().toISOString()
          };
          const sent = chatService.sendMessage(wsMsg);
          if (!sent) {
            console.warn('[ChatContext] WebSocket send returned false; socket may not be open');
          }
        } catch (wsErr) {
          console.error('WebSocket send failed:', wsErr);
        }
      }

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');

      // remove optimistic message on failure
      if (optimisticId) {
        setMessages(prev => {
          const list = Array.isArray(prev[chatId]) ? prev[chatId].filter(m => !(m && m._id === optimisticId)) : [];
          return { ...prev, [chatId]: list };
        });
      }

      return false;
    }
  }, [isConnected, userId]);

  // Effects
  useEffect(() => {
    const removeMessageHandler = chatService.addMessageHandler(handleMessage);
    const removeConnectionHandler = chatService.addConnectionHandler(handleConnectionChange);
    
    return () => {
      removeMessageHandler();
      removeConnectionHandler();
    };
  }, [handleMessage, handleConnectionChange]);

  useEffect(() => {
    fetchRecentChats();
  }, [fetchRecentChats]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Context Value
  const value = {
    isConnected,
    activeChat,
    messages,
    recentChats,
    loading,
    error,
    setActiveChat,
    sendMessage,
    fetchRecentChats
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};