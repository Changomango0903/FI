import React, { useState } from 'react';
import ModelSelector from './ModelSelector';
import { useModelContext } from '../context/ModelContext';

const Sidebar = ({ closeMobileMenu }) => {
  const { chats, currentChat, createNewChat, switchChat, deleteChat } = useModelContext();
  const [showSettings, setShowSettings] = useState(false);
  
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
        <button 
          className="settings-button"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ Settings
        </button>
        
        {showSettings && (
          <div className="settings-panel">
            <h3>Model Selection</h3>
            <ModelSelector />
            
            <h3>Future Features</h3>
            <div className="future-features">
              <span className="feature-badge">RAG</span>
              <span className="feature-badge">Agents</span>
              <span className="feature-badge">Tools</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;