import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { chatService } from '../services/chatService';
import { getId } from '../utils/normalize';
import { API_BASE_URL } from '../config';

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
  const effectiveUserId = userId || getId(currentUser);

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
      chatService.connect(effectiveUserId);
      return () => {
        chatService.disconnect();
      };
    }
  }, [effectiveUserId]);


  // Message Handlers
  const handleMessage = useCallback((newMessage) => {
    console.debug('[ChatContext] handleMessage received:', newMessage);
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
    setIsConnected(connected);
  }, []);

  // Message Loading
  const loadMessages = useCallback(async () => {
    const curId = getId(currentUser);
    if (!activeChat?.userId || !curId) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/messages?user1=${curId}&user2=${activeChat.userId}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      
      const chatId = [curId, activeChat.userId].sort().join('_');
      setMessages(prev => ({
        ...prev,
        [chatId]: response.data
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    }
  }, [activeChat?.userId, currentUser]);

  // Recent Chats
  const fetchRecentChats = useCallback(async () => {
    const curId = getId(currentUser);
    if (!curId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/recent?userId=${curId}`);
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
  }, [currentUser]);

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

        console.debug('[ChatContext] appending optimistic message:', optimisticMessage, 'chatId=', chatId);
        setMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), optimisticMessage]
        }));
    }

    // Try to persist message via HTTP
    try {
      const postUrl = `${API_BASE_URL}/api/messages`;
      console.debug('[ChatContext] POSTing message to:', postUrl);
      const res = await axios.post(postUrl, message, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const saved = res?.data || null;

      console.debug('[ChatContext] POST response saved message:', saved);

      // If server returned an authoritative saved message, replace optimistic one (if present)
      if (saved && optimisticId) {
        setMessages(prev => {
          const list = Array.isArray(prev[chatId]) ? [...prev[chatId]] : [];
          const idx = list.findIndex(m => m && m._id === optimisticId);
          console.debug('[ChatContext] replacing optimistic id', optimisticId, 'idx=', idx, 'chatId=', chatId);
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
      // Log more details to help debugging (network / status)
      if (error.response) {
        console.error('Error sending message - response:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('Error sending message - no response received:', error.request);
      } else {
        console.error('Error sending message:', error.message);
      }
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
  }, [isConnected, effectiveUserId, messages]);

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

  // Periodically refresh messages for the active chat so both sides see updates without
  // needing to manually refresh the page. This acts as a fallback when WebSocket
  // delivery is delayed or unavailable.
  useEffect(() => {
    if (!activeChat?.userId) return;

    const intervalId = setInterval(() => {
      loadMessages();
    }, 300); 

    return () => clearInterval(intervalId);
  }, [activeChat?.userId, loadMessages]);

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