// frontend/src/components/ProjectList.jsx
import React, { useState } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { useModelContext } from '../context/ModelContext';
import NewProjectModal from './NewProjectModal';

const ProjectList = ({ closeMobileMenu }) => {
  const { 
    projects, 
    currentProject, 
    switchProject, 
    deleteProject 
  } = useProjectContext();
  
  const { chats } = useModelContext();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Count chats in each project
  const chatCountByProject = projects.reduce((acc, project) => {
    acc[project.id] = project.chatIds.filter(chatId => 
      chats.some(chat => chat.id === chatId)
    ).length;
    return acc;
  }, {});

  const handleSwitchProject = (projectId) => {
    switchProject(projectId);
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  const handleDeleteProject = (e, projectId) => {
    e.stopPropagation();
    
    // Confirm before deleting
    if (window.confirm('Are you sure you want to delete this project? This will not delete the chats inside.')) {
      deleteProject(projectId);
    }
  };

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h2>Projects</h2>
        <button 
          className="new-project-button"
          onClick={() => setShowNewProjectModal(true)}
          title="Create new project"
        >
          +
        </button>
      </div>

      <ul className="project-items">
        {projects.map(project => (
          <li 
            key={project.id} 
            className={`project-item ${project.id === currentProject?.id ? 'active' : ''}`}
            onClick={() => handleSwitchProject(project.id)}
          >
            <div className="project-color-indicator" style={{ backgroundColor: project.color }} />
            <div className="project-info">
              <div className="project-name">{project.name}</div>
              <div className="project-chat-count">{chatCountByProject[project.id]} chats</div>
            </div>
            {/* Only show delete button if we have more than one project */}
            {projects.length > 1 && (
              <button 
                className="delete-project-button"
                onClick={(e) => handleDeleteProject(e, project.id)}
                title="Delete project"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {showNewProjectModal && (
        <NewProjectModal onClose={() => setShowNewProjectModal(false)} />
      )}
    </div>
  );
};

export default ProjectList;