// components/chat/ChatWindow.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { getId } from '../../utils/normalize';
import { format, parseISO } from 'date-fns';
import './ChatWindow.css';
import { Loader2 } from 'lucide-react';
import { API_BASE, createGetOptions } from '../../utils/validation';

export const ChatWindow = ({ currentUser, initialChat }) => {
  const { 
    activeChat, 
    messages, 
    sendMessage, 
    isConnected, 
    setActiveChat,
    loading,
    error
  } = useChat();

  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isSending, setIsSending] = useState(false);

  // Set initial chat if provided
  useEffect(() => {
    if (initialChat && !activeChat) {
      setActiveChat(initialChat);
    }
  }, [initialChat, activeChat, setActiveChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // When switching to a different chat, scroll to the bottom once
  useEffect(() => {
    if (activeChat) {
      scrollToBottom();
    }
  }, [activeChat]);

  const parseDate = (value) => {
    if (!value) return null;
    try {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    } catch (e) {
      return null;
    }
  };

  // Fetch partner profile if we don't have a name yet
  useEffect(() => {
    let mounted = true;
    const fetchPartner = async () => {
      if (!activeChat || activeChat.userName || !activeChat.userId || !currentUser) return;
      try {
        const token = currentUser?.token || currentUser?.accessToken || null;
        const url = `${API_BASE.replace(/\/+$/,'')}/api/users/${activeChat.userId}`;
        const res = await fetch(url, createGetOptions(token));
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!mounted || !data) return;
        // Preserve existing activeChat fields and attach name + user object
        setActiveChat(prev => ({ ...(prev || {}), userName: `${data.firstName || ''} ${data.lastName || ''}`.trim(), user: data }));
      } catch (e) {
        // ignore
      }
    };
    fetchPartner();
    return () => { mounted = false };
  }, [activeChat?.userId, activeChat?.userName, currentUser, setActiveChat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const msg = message.trim();
    // Allow sending even when WebSocket is disconnected; HTTP fallback will persist messages.
    if (!msg || !activeChat || isSending) return;
    console.debug('[ChatWindow] submit: isConnected=', isConnected, 'activeChat=', activeChat?.userId);
    try {
      setIsSending(true);
      console.debug('[ChatWindow] sending message:', msg, 'to', activeChat.userId, 'isConnected=', isConnected);
      const ok = await sendMessage(msg, activeChat.userId);
      console.debug('[ChatWindow] sendMessage returned:', ok);
      if (ok) {
        setMessage('');
        // After the current user sends a message, scroll to bottom once
        scrollToBottom();
      } else {
        // keep the message in the input so user can retry; surface a console note
        console.warn('[ChatWindow] message not saved (sendMessage returned false)');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (loading && !activeChat) {
    return (
      <div className="chat-window empty">
        <div className="loading-state">
          <Loader2 className="animate-spin" />
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-window empty">
        <div className="error-state">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!activeChat) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <h3>Select a conversation to start chatting</h3>
          <p>Or start a new conversation from a user's profile</p>
        </div>
      </div>
    );
  }

  const curId = getId(currentUser);
  const chatMessages = messages[`${curId}_${activeChat.userId}`] || 
                      messages[`${activeChat.userId}_${curId}`] || 
                      [];

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-partner">
          <div className="partner-info">
            <h3>{activeChat.userName || 'Unknown'}</h3>
          </div>
        </div>
      </div>
      
      <div className="messages-container">
        {chatMessages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isCurrentUser = msg.senderId === curId;
            const prevSender = chatMessages[index - 1]?.senderId;
            const nextMsg = chatMessages[index + 1];
            const showAvatar = index === 0 || prevSender !== msg.senderId;

            const tNow = parseDate(msg?.timestamp);
            const tNext = parseDate(nextMsg?.timestamp);

            let showTime = false;
            if (index === chatMessages.length - 1) {
              showTime = true;
            } else if (nextMsg && nextMsg.senderId !== msg.senderId) {
              showTime = true;
            } else if (tNow && tNext) {
              // show time if gap to next message is greater than 5 minutes
              showTime = Math.abs(tNext.getTime() - tNow.getTime()) > 5 * 60 * 1000;
            }

            return (
              <React.Fragment key={msg._id || index}>
                {/* avatar per-message removed to keep chat simple */}
                <div 
                  className={`message-wrapper ${isCurrentUser ? 'sent' : 'received'}`}
                >
                  <div 
                    className={`message ${isCurrentUser ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      {msg.content}
                    </div>
                    {showTime && tNow && (
                      <div className="message-time">
                        {format(tNow, 'h:mm a')}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="message-input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Type a message..."
          className="message-input"
          disabled={isSending || !activeChat}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!message.trim() || isSending || !activeChat}
        >
          {isSending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            'Send'
          )}
        </button>
      </form>
    </div>
  );
};