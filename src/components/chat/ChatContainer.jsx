// components/chat/ChatContainer.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { ChatProvider } from '../../contexts/ChatContext';
import { getId } from '../../utils/normalize';
import './ChatContainer.css';

export const ChatContainer = ({ currentUser, userId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [initialChat, setInitialChat] = useState(null);

  console.log('[ChatContainer] currentUser prop:', currentUser);

  useEffect(() => {
    if (location.state?.otherUser) {
      setInitialChat({
        userId: getId(location.state.otherUser),
        userName: `${location.state.otherUser.firstName} ${location.state.otherUser.lastName}`
      });
    }
  }, [location.state]);

  // prefer explicit userId prop (injected by RequireAuth) but fall back to currentUser._id
  const providedUserId = userId || getId(currentUser);

  return (
    <ChatProvider currentUser={currentUser} userId={providedUserId}>
      <div className="chat-container">
        <ChatList 
          currentUser={currentUser}
          initialChat={initialChat}
        />
        <ChatWindow 
          currentUser={currentUser}
          initialChat={initialChat}
        />
        
      </div>
    </ChatProvider>
  );
};