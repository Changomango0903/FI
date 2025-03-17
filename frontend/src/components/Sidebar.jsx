import React from 'react';
import { useModelContext } from '../context/ModelContext';

const Sidebar = ({ closeMobileMenu }) => {
  const { 
    chats, 
    currentChat, 
    createNewChat, 
    switchChat, 
    deleteChat 
  } = useModelContext();
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img src="/logo.svg" alt="FI Logo" />
          <h1>FI</h1>
        </div>
        <button 
          className="new-chat-button" 
          onClick={() => {
            createNewChat();
            closeMobileMenu();
          }}
        >
          + New Chat
        </button>
      </div>
      
      <div className="chat-list">
        <h2>Your Chats</h2>
        {chats.length === 0 ? (
          <p className="no-chats">No chats yet. Create a new chat to get started.</p>
        ) : (
          <ul>
            {chats.map(chat => (
              <li 
                key={chat.id} 
                className={chat.id === currentChat?.id ? 'active' : ''}
                onClick={() => {
                  switchChat(chat.id);
                  closeMobileMenu();
                }}
              >
                <span className="chat-title">{chat.title || `Chat ${chat.id.substr(0, 8)}`}</span>
                <button 
                  className="delete-chat" 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="sidebar-footer">
        <div className="sidebar-info">
          <p className="sidebar-info-text">FI v0.1.0</p>
          <p className="sidebar-info-text">Your fast intelligence companion</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;