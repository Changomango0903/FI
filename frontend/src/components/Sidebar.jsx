// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { useModelContext } from '../context/ModelContext';
import { useProjectContext } from '../context/ProjectContext';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import ProjectList from './ProjectList';
import ProjectSelector from './ProjectSelector';

const Sidebar = ({ 
  closeMobileMenu, 
  onToggleSettings, 
  showSettings,
  onNavigateToProject 
}) => {
  const { 
    chats, 
    currentChat, 
    createNewChat, 
    switchChat, 
    deleteChat 
  } = useModelContext();
  
  const { 
    currentProject, 
    addChatToProject, 
    removeChatFromProject,
    getProjectChats 
  } = useProjectContext();
  
  const { isDarkMode } = useTheme();
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  
  // Get chats for the current project
  const currentProjectChats = currentProject
    ? chats.filter(chat => currentProject.chatIds.includes(chat.id))
    : [];
  
    const handleCreateNewChat = () => {
      const newChat = createNewChat();
      // Add the new chat to the current project
      if (currentProject && newChat) {
        addChatToProject(currentProject.id, newChat.id);
        console.log(`Added new chat ${newChat.id} to project ${currentProject.id}`);
        console.log('Current project chatIds:', [...currentProject.chatIds, newChat.id]);
      }
      closeMobileMenu();
    };
  
  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    
    // Remove chat from project before deleting it
    if (currentProject) {
      removeChatFromProject(currentProject.id, chatId);
    }
    
    // Delete the chat
    deleteChat(chatId);
  };
  
  const handleShowProjectSelector = (e, chatId) => {
    e.stopPropagation();
    setActiveChatId(chatId);
    setShowProjectSelector(true);
  };
  
  const handleCloseProjectSelector = () => {
    setShowProjectSelector(false);
    setActiveChatId(null);
  };
  
  // Click outside to close project selector
  useEffect(() => {
    const handleClickOutside = () => {
      if (showProjectSelector) {
        setShowProjectSelector(false);
        setActiveChatId(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showProjectSelector]);
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img src="/logo.svg" alt="FI Logo" />
          <h1>FI</h1>
        </div>
        <button 
          className="new-chat-button" 
          onClick={handleCreateNewChat}
        >
          + New Chat
        </button>
      </div>
      
      {/* Project list */}
      <ProjectList 
        closeMobileMenu={closeMobileMenu} 
        onNavigateToProject={onNavigateToProject}
      />
      
      {/* Chat list */}
      <div className="chat-list">
        <h2>Chats</h2>
        {currentProjectChats.length === 0 ? (
          <p className="no-chats">No chats in this project. Create a new chat to get started.</p>
        ) : (
          <ul>
            {currentProjectChats.map(chat => (
              <li 
                key={chat.id} 
                className={chat.id === currentChat?.id ? 'active' : ''}
                onClick={() => {
                  switchChat(chat.id);
                  closeMobileMenu();
                }}
              >
                <span className="chat-title">{chat.title || `Chat ${chat.id.substr(0, 8)}`}</span>
                <div className="chat-actions">
                  <button 
                    className="move-chat-button" 
                    onClick={(e) => handleShowProjectSelector(e, chat.id)}
                    title="Move to project"
                  >
                    ⋮
                  </button>
                  <button 
                    className="delete-chat" 
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    title="Delete chat"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Project selector dropdown */}
                {showProjectSelector && activeChatId === chat.id && (
                  <div onClick={e => e.stopPropagation()}>
                    <ProjectSelector 
                      chatId={chat.id} 
                      onClose={handleCloseProjectSelector} 
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="sidebar-footer">
        <div className="sidebar-controls">
          <ThemeToggle />
          <button 
            className={`settings-button ${showSettings ? 'active' : ''}`}
            onClick={onToggleSettings}
          >
            {showSettings ? '← Back to Chat' : '⚙️ Settings'}
          </button>
        </div>
        <div className="theme-indicator">
          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;