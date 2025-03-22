import React, { useState, useEffect } from 'react';
import { useProjectContext } from '../../context/ProjectContext';
import { useModelContext } from '../../context/ModelContext';
import { AlertDialog } from '../ui';

const ProjectPage = ({ projectId, onNavigateToChat, onBack }) => {
  const { projects, updateProject, addChatToProject } = useProjectContext();
  const { chats, createNewChat, switchChat, deleteChat } = useModelContext();
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  // Find the current project
  const project = projects.find(p => p.id === projectId);
  
  // Get chats for this project
  const projectChats = project 
    ? chats.filter(chat => project.chatIds.includes(chat.id))
    : [];
    
  console.log('Project:', project);
  console.log('Project chatIds:', project?.chatIds || []);
  console.log('All chats:', chats.map(c => c.id));
  console.log('Filtered project chats:', projectChats.map(c => c.id));

  useEffect(() => {
    if (project) {
      setEditName(project.name);
      setEditDescription(project.description || '');
      setIsLoading(false);
    }
  }, [project]);

  if (isLoading || !project) {
    return <div className="loading">Loading project...</div>;
  }

  const handleCreateNewChat = () => {
    const newChat = createNewChat();
    if (newChat) {
      // Explicitly add chat to this project
      addChatToProject(project.id, newChat.id);
      console.log(`Added new chat ${newChat.id} to project ${project.id}`);
      onNavigateToChat(newChat.id);
    }
  };

  const handleEditProject = () => {
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    if (editName.trim()) {
      updateProject(project.id, {
        name: editName.trim(),
        description: editDescription.trim()
      });
      setEditMode(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(project.name);
    setEditDescription(project.description || '');
    setEditMode(false);
  };

  const handleOpenChat = (chatId) => {
    switchChat(chatId);
    onNavigateToChat(chatId);
  };

  const handleDeleteClick = (e, chatId) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setShowDeleteAlert(true);
  };
  
  const handleConfirmDelete = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete);
      setChatToDelete(null);
    }
    setShowDeleteAlert(false);
  };
  
  const handleCancelDelete = () => {
    setChatToDelete(null);
    setShowDeleteAlert(false);
  };

  // Function to get a preview of the last message
  const getChatPreview = (chat) => {
    if (!chat.messages || chat.messages.length === 0) {
      return 'No messages yet';
    }
    const lastMessage = chat.messages[chat.messages.length - 1];
    return lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : '');
  };

  // Function to format the timestamp using native JavaScript
  const formatTimestamp = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now - date;
      const diffInSec = Math.floor(diffInMs / 1000);
      const diffInMin = Math.floor(diffInSec / 60);
      const diffInHour = Math.floor(diffInMin / 60);
      const diffInDay = Math.floor(diffInHour / 24);

      if (diffInSec < 60) return 'just now';
      if (diffInMin < 60) return `${diffInMin} min${diffInMin !== 1 ? 's' : ''} ago`;
      if (diffInHour < 24) return `${diffInHour} hr${diffInHour !== 1 ? 's' : ''} ago`;
      if (diffInDay < 30) return `${diffInDay} day${diffInDay !== 1 ? 's' : ''} ago`;
      
      // Format as MM/DD/YYYY for older dates
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div className="project-page-info">
          <div 
            className="project-page-color" 
            style={{ backgroundColor: project.color }} 
          />
          
          {editMode ? (
            <div className="project-edit-form">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Project name"
                autoFocus
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Project description (optional)"
                rows="2"
              />
            </div>
          ) : (
            <div>
              <h2 className="project-page-title">{project.name}</h2>
              {project.description && (
                <p className="project-page-description">{project.description}</p>
              )}
            </div>
          )}
        </div>
        
        <div className="project-page-actions">
          {editMode ? (
            <>
              <button className="button-secondary" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button 
                className="button-primary" 
                onClick={handleSaveEdit}
                disabled={!editName.trim()}
              >
                Save
              </button>
            </>
          ) : (
            <>
              <button className="back-to-chat" onClick={onBack}>
                ← Back to Chat
              </button>
              <button className="button-secondary" onClick={handleEditProject}>
                Edit Project
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="project-page-content">
        <div className="project-chats-header">
          <h2>Chats in this Project</h2>
          <button 
            className="new-chat-in-project"
            onClick={handleCreateNewChat}
          >
            + New Chat
          </button>
        </div>
        
        {projectChats.length === 0 ? (
          <div className="empty-project-state">
            <h3>No chats yet</h3>
            <p>Create your first chat in this project to get started.</p>
            <button 
              className="button-primary"
              onClick={handleCreateNewChat}
            >
              Create a New Chat
            </button>
          </div>
        ) : (
          <div className="project-chat-grid">
            {projectChats.map(chat => (
              <div 
                key={chat.id} 
                className="project-chat-card"
                onClick={() => handleOpenChat(chat.id)}
              >
                <h3 className="project-chat-card-title">
                  {chat.title || `Chat ${chat.id.substr(0, 8)}`}
                </h3>
                <p className="project-chat-card-preview">
                  {getChatPreview(chat)}
                </p>
                <div className="project-chat-card-footer">
                  <span className="project-chat-card-timestamp">
                    {formatTimestamp(chat.createdAt)}
                  </span>
                  <span className="project-chat-card-message-count">
                    {chat.messages.length} message{chat.messages.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="project-chat-card-actions">
                  <button 
                    className="project-chat-action-button delete-chat-button"
                    onClick={(e) => handleDeleteClick(e, chat.id)}
                    title="Delete chat"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showDeleteAlert && (
        <AlertDialog
          title="Delete Chat"
          message="Are you sure you want to delete this chat? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default ProjectPage;