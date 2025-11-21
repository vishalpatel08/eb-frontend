import React, { useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import './ChatList.css';
import { API_BASE, createGetOptions } from '../../utils/validation';
import { getId } from '../../utils/normalize';

export const ChatList = ({ currentUser }) => {
  const { recentChats, fetchRecentChats, setActiveChat } = useChat();
  const navigate = useNavigate();
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    fetchRecentChats();
    const interval = setInterval(fetchRecentChats, 30000);
    return () => clearInterval(interval);
  }, [fetchRecentChats]);

  const candidateIdFromChat = (chat) => {
    if (!chat) return null;
    if (chat.userId) return chat.userId;
    if (chat.user) return getId(chat.user);
    if (chat.otherUserId) return chat.otherUserId;
    if (chat.participants && Array.isArray(chat.participants)) {
      const other = chat.participants.find(p => String(p) !== String(getId(currentUser)));
      if (other) return other;
    }
    if (chat.user1 && chat.user2 && getId(currentUser)) {
      return String(chat.user1) === String(getId(currentUser)) ? chat.user2 : chat.user1;
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;
    const fetchUser = async (id) => {
      try {
        const url = `${API_BASE.replace(/\/+$/,'')}/api/users/${id}`;
        // Debug: log which user id and URL we're fetching
        console.debug('[ChatList] fetchUser id=', id, 'url=', url);
        const token = currentUser?.token || currentUser?.accessToken || localStorage.getItem('token') || null;
        const res = await fetch(url, createGetOptions(token));
        if (!res.ok) {
          console.warn('[ChatList] fetchUser non-ok response for id=', id, 'status=', res.status);
          return;
        }
        const data = await res.json().catch(() => null);
        if (!mounted || !data) return;
        setUserMap(prev => ({ ...prev, [id]: data }));
      } catch (e) {
        console.log(e)
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
              className="chat-list-item clickable"
              onClick={() => setActiveChat({ userId: otherId, userName: displayName })}
            >
              <div className="chat-info">
                <div className="chat-header">
                  <span className="chat-name clickable" onClick={(e) => { e.stopPropagation();
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