// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { useModelContext } from '../context/ModelContext';
import { useProjectContext } from '../context/ProjectContext';
import ThemeToggle from './ui/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import ProjectList from './ProjectList';
import ProjectSelector from './ProjectSelector';
import Button from './ui/Button';

const Sidebar = ({ 
  closeMobileMenu, 
  onToggleSettings, 
  showSettings,
  onNavigateToProject,
  onNavigateToChat,
  currentView
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
  
  const { isDarkMode, toggleTheme } = useTheme();
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get chats for the current project
  const currentProjectChats = currentProject
    ? chats.filter(chat => currentProject.chatIds.includes(chat.id))
    : [];
    
  // Filter chats based on search term
  const filteredChats = searchTerm
    ? currentProjectChats.filter(chat => 
        chat.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        chat.id.toLowerCase().includes(searchTerm.toLowerCase()))
    : currentProjectChats;
  
  const handleCreateNewChat = () => {
    const newChat = createNewChat();
    // Add the new chat to the current project
    if (currentProject && newChat) {
      addChatToProject(currentProject.id, newChat.id);
      console.log(`Added new chat ${newChat.id} to project ${currentProject.id}`);
      console.log('Current project chatIds:', [...currentProject.chatIds, newChat.id]);
    }
    
    // Navigate to chat view
    if (onNavigateToChat) {
      onNavigateToChat(newChat.id);
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
  
  const handleSelectChat = (chatId) => {
    switchChat(chatId);
    if (onNavigateToChat) {
      onNavigateToChat(chatId);
    }
    closeMobileMenu();
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
        <Button 
          variant="primary"
          size="medium"
          fullWidth={true}
          onClick={handleCreateNewChat}
          icon={<span>+</span>}
        >
          New Chat
        </Button>
      </div>
      
      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Project list */}
      <ProjectList 
        closeMobileMenu={closeMobileMenu} 
        onNavigateToProject={onNavigateToProject}
        currentView={currentView}
      />
      
      {/* Chat list */}
      <div className="chat-list">
        <div className="section-header">
          <h2>Chats</h2>
          {currentProject && (
            <span className="badge">
              {filteredChats.length} 
              {filteredChats.length === 1 ? ' chat' : ' chats'}
            </span>
          )}
        </div>
        
        {!currentProject ? (
          <p className="no-selection">Select a project to view chats</p>
        ) : filteredChats.length === 0 ? (
          searchTerm ? (
            <p className="no-chats">No chats matching "{searchTerm}"</p>
          ) : (
            <p className="no-chats">No chats in this project. Create a new chat to get started.</p>
          )
        ) : (
          <ul className="chats-list">
            {filteredChats.map(chat => (
              <li 
                key={chat.id} 
                className={`chat-item ${chat.id === currentChat?.id ? 'active' : ''}`}
                onClick={() => handleSelectChat(chat.id)}
              >
                <div className="chat-item-content">
                  <span className="chat-icon">
                    {chat.pinned ? '📌' : '💬'}
                  </span>
                  <span className="chat-title">{chat.title || `Chat ${chat.id.substr(0, 8)}`}</span>
                </div>
                
                <div className="chat-actions">
                  <button 
                    className="action-button"
                    onClick={(e) => handleShowProjectSelector(e, chat.id)}
                    title="Move to project"
                  >
                    <span className="icon">📂</span>
                  </button>
                  <button 
                    className="action-button delete"
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    title="Delete chat"
                  >
                    <span className="icon">✕</span>
                  </button>
                </div>
                
                {/* Project selector dropdown */}
                {showProjectSelector && activeChatId === chat.id && (
                  <div onClick={e => e.stopPropagation()} className="project-selector-container">
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
          <Button 
            variant="ghost"
            size="medium"
            fullWidth={true}
            onClick={onToggleSettings}
            icon={showSettings ? <span>←</span> : <span>⚙️</span>}
          >
            {showSettings ? 'Back to Chat' : 'Settings'}
          </Button>
        </div>
        <div className="version-info">
          <span className="version">v1.0.0</span>
          <span className="theme-mode">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;