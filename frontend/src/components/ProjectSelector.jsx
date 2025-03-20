// frontend/src/components/ProjectSelector.jsx
import React from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { useModelContext } from '../context/ModelContext';

const ProjectSelector = ({ chatId, onClose }) => {
  const { projects, currentProject, moveChatToProject, findChatProject } = useProjectContext();
  const { updateChatTitle } = useModelContext();
  
  const currentChatProject = findChatProject(chatId);
  
  const handleMoveToProject = (projectId) => {
    if (currentChatProject) {
      moveChatToProject(chatId, currentChatProject.id, projectId);
    } else if (currentProject) {
      // If chat is not in any project yet, add it to the selected project
      moveChatToProject(chatId, currentProject.id, projectId);
    }
    
    // Add project name to chat title if it's empty
    const targetProject = projects.find(p => p.id === projectId);
    if (targetProject) {
      updateChatTitle(chatId, `${targetProject.name} Chat`);
    }
    
    if (onClose) onClose();
  };
  
  return (
    <div className="project-selector">
      <div className="project-selector-header">
        <h4>Move to Project</h4>
      </div>
      
      <ul className="project-selector-list">
        {projects.map(project => (
          <li 
            key={project.id}
            className={`project-selector-item ${currentChatProject?.id === project.id ? 'active' : ''}`}
            onClick={() => handleMoveToProject(project.id)}
          >
            <div className="project-color-indicator" style={{ backgroundColor: project.color }} />
            <div className="project-selector-name">{project.name}</div>
            {currentChatProject?.id === project.id && (
              <span className="current-project-indicator">✓</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectSelector;