import React from 'react';
import { useProjectContext } from '../context/ProjectContext';

const ProjectHeader = ({ chatId, onNavigateToProject }) => {
  const { findChatProject } = useProjectContext();
  const chatProject = chatId ? findChatProject(chatId) : null;
  
  if (!chatProject) return null;
  
  const handleProjectClick = (e) => {
    // Ensure we stop propagation and prevent default
    e.stopPropagation();
    e.preventDefault();
    
    if (onNavigateToProject) {
      onNavigateToProject(chatProject.id);
    }
  };
  
  return (
    <div 
      className="project-header"
      onClick={handleProjectClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        // Add keyboard accessibility
        if (e.key === 'Enter' || e.key === ' ') {
          handleProjectClick(e);
        }
      }}
      aria-label={`View project: ${chatProject.name}`}
    >
      <div 
        className="project-color-badge" 
        style={{ backgroundColor: chatProject.color }} 
      />
      <span className="project-badge">
        {chatProject.name}
      </span>
    </div>
  );
};

export default ProjectHeader;