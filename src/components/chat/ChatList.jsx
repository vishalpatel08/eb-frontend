// components/chat/ChatList.jsx
import React, { useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import './ChatList.css';
import { API_BASE, createGetOptions } from '../../utils/validation';

export const ChatList = ({ currentUser }) => {
  const { recentChats, fetchRecentChats, setActiveChat } = useChat();
  const navigate = useNavigate();
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    fetchRecentChats();
    const interval = setInterval(fetchRecentChats, 30000);
    return () => clearInterval(interval);
  }, [fetchRecentChats]);

  // If the current user is a provider, fetch minimal user info for each recent chat
  const candidateIdFromChat = (chat) => {
    if (!chat) return null;
    if (chat.userId) return chat.userId;
    if (chat.user && (chat.user._id || chat.user.id)) return chat.user._id || chat.user.id;
    if (chat.otherUserId) return chat.otherUserId;
    if (chat.participants && Array.isArray(chat.participants)) {
      const other = chat.participants.find(p => String(p) !== String(currentUser?._id));
      if (other) return other;
    }
    if (chat.user1 && chat.user2 && currentUser?._id) {
      return String(chat.user1) === String(currentUser._id) ? chat.user2 : chat.user1;
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;
    const fetchUser = async (id) => {
      try {
        const url = `${API_BASE.replace(/\/+$/,'')}/api/users/${id}`;
        const token = currentUser?.token || currentUser?.accessToken || localStorage.getItem('token') || null;
        const res = await fetch(url, createGetOptions(token));
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!mounted || !data) return;
        setUserMap(prev => ({ ...prev, [id]: data }));
      } catch (e) {
        // ignore
      }
    };

    if (Array.isArray(recentChats)) {
      const toFetch = new Set();
      recentChats.forEach(chat => {
        const otherId = candidateIdFromChat(chat);
        if (otherId && !userMap[otherId]) toFetch.add(otherId);
      });
      toFetch.forEach(id => fetchUser(id));
    }

    return () => { mounted = false };
  }, [recentChats, currentUser, userMap]);

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h3>Messages</h3>
      </div>
      <div className="chat-list-items">
        {(Array.isArray(recentChats) ? recentChats : []).map((chat, idx) => {
          const otherId = candidateIdFromChat(chat);
          const userInfo = otherId ? userMap[otherId] : (chat && chat.user ? chat.user : null);
          const displayName = userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() : (chat?.userName || 'Unknown');
          return (
            <div 
              key={otherId || idx} 
              className="chat-list-item"
              onClick={() => setActiveChat({ userId: otherId, userName: displayName })}
              style={{cursor:'pointer'}}
            >
              {/* avatar removed to keep chat list simple */}
              <div className="chat-info">
                <div className="chat-header">
                  <span className="chat-name" style={{cursor:'pointer'}} onClick={(e) => { e.stopPropagation();
                    // navigate to profile view for this user when provider clicks name
                    if ((currentUser?.role || '').toLowerCase() === 'provider') {
                      navigate('/profile', { state: { user: userInfo || { _id: otherId, firstName: displayName } } });
                      return;
                    }
                  }}>
                    {displayName}
                  </span>
                  <span className="chat-time">
                    {chat?.timestamp ? formatDistanceToNow(new Date(chat.timestamp), { addSuffix: true }) : ''}
                  </span>
                </div>
                <div className="chat-preview">
                  {chat.lastMessage?.substring(0, 50)}
                  {chat.lastMessage?.length > 50 ? '...' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};