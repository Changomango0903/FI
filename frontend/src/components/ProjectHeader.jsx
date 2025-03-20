// frontend/src/components/ProjectHeader.jsx
import React from 'react';
import { useProjectContext } from '../context/ProjectContext';

const ProjectHeader = ({ chatId }) => {
  const { findChatProject } = useProjectContext();
  const chatProject = chatId ? findChatProject(chatId) : null;
  
  if (!chatProject) return null;
  
  return (
    <div className="project-header">
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