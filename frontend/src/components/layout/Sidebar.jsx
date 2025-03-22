import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useModelContext, useProjectContext, useThemeContext } from '../../context';
import { ThemeToggle } from '../ui';
import { ProjectList, ProjectSelector } from '../project';
import logger from '../../utils/logger';

/**
 * Sidebar component for chat and project navigation
 */
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
  
  const { isDarkMode } = useThemeContext();
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  
  // Get chats for the current project
  const projectChats = currentProject 
    ? getProjectChats(currentProject.id)
    : [];

  // Set active chat ID when current chat changes
  useEffect(() => {
    if (currentChat) {
      setActiveChatId(currentChat.id);
    }
  }, [currentChat]);

  // Handle creating a new chat
  const handleNewChat = () => {
    logger.info('Sidebar', 'Creating new chat');
    createNewChat();
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  // Handle clicking on a chat
  const handleChatClick = (chatId) => {
    logger.debug('Sidebar', 'Chat clicked', { chatId });
    switchChat(chatId);
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  // Handle deleting a chat
  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    logger.info('Sidebar', 'Deleting chat', { chatId });
    deleteChat(chatId);
  };

  // Handle moving a chat to a different project
  const handleMoveChat = (chatId) => {
    logger.debug('Sidebar', 'Opening project selector for chat', { chatId });
    setActiveChatId(chatId);
    setShowProjectSelector(true);
  };

  // Handle selecting a project for the active chat
  const handleSelectProject = (projectId) => {
    if (activeChatId) {
      logger.info('Sidebar', 'Moving chat to project', { 
        chatId: activeChatId, 
        projectId 
      });
      
      // If chat is already in a project, remove it first
      if (currentProject) {
        removeChatFromProject(activeChatId, currentProject.id);
      }
      
      // Add chat to the selected project
      addChatToProject(activeChatId, projectId);
    }
    setShowProjectSelector(false);
  };

  // Render a chat list item
  const renderChatItem = (chat) => {
    const isActive = currentChat && chat.id === currentChat.id;
    const truncatedTitle = chat.title.length > 28 
      ? `${chat.title.substring(0, 25)}...` 
      : chat.title;
    
    return (
      <div 
        key={chat.id} 
        className={`chat-item ${isActive ? 'active' : ''}`}
        onClick={() => handleChatClick(chat.id)}
      >
        <div className="chat-title">{truncatedTitle}</div>
        <div className="chat-actions">
          <button 
            className="chat-action-button move"
            onClick={(e) => {
              e.stopPropagation();
              handleMoveChat(chat.id);
            }}
            aria-label="Move chat to project"
            title="Move to project"
          >
            <span className="action-icon">📁</span>
          </button>
          <button 
            className="chat-action-button delete"
            onClick={(e) => handleDeleteChat(e, chat.id)}
            aria-label="Delete chat"
            title="Delete chat"
          >
            <span className="action-icon">🗑️</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`sidebar ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="sidebar-header">
        <h1 className="app-title">Fast Intelligence</h1>
        <div className="header-actions">
          <ThemeToggle />
          <button 
            className={`settings-button ${showSettings ? 'active' : ''}`}
            onClick={onToggleSettings}
            aria-label="Toggle settings"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
      
      <div className="sidebar-content">
        {/* Project List Section */}
        <ProjectList 
          onCloseMobileMenu={closeMobileMenu}
          onNavigateToProject={onNavigateToProject}
        />
        
        {/* Chat List Section */}
        <div className="sidebar-section chat-list">
          <div className="section-header">
            <h2 className="section-title">
              {currentProject ? `${currentProject.name} Chats` : 'All Chats'}
            </h2>
            <button 
              className="new-chat-button" 
              onClick={handleNewChat}
              aria-label="Create new chat"
              title="New chat"
            >
              +
            </button>
          </div>
          
          <div className="chat-items">
            {projectChats.length === 0 ? (
              <div className="empty-list-message">
                No chats yet. Create one to get started.
              </div>
            ) : (
              projectChats.map(renderChatItem)
            )}
          </div>
        </div>
      </div>
      
      {/* Project Selector Modal */}
      {showProjectSelector && (
        <ProjectSelector
          chatId={activeChatId}
          onSelectProject={handleSelectProject}
          onClose={() => setShowProjectSelector(false)}
        />
      )}
    </div>
  );
};

Sidebar.propTypes = {
  closeMobileMenu: PropTypes.func,
  onToggleSettings: PropTypes.func.isRequired,
  showSettings: PropTypes.bool.isRequired,
  onNavigateToProject: PropTypes.func,
};

export default Sidebar; 