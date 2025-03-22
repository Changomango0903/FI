import React, { useState } from 'react';
import { useProjectContext } from '../../context/ProjectContext';
import { useModelContext } from '../../context/ModelContext';
import NewProjectModal from './NewProjectModal';
import { AlertDialog } from '../ui';
import Button from '../ui/Button';

const ProjectList = ({ closeMobileMenu, onNavigateToProject, currentView }) => {
  const { 
    projects, 
    currentProject, 
    switchProject, 
    deleteProject 
  } = useProjectContext();
  
  const { chats } = useModelContext();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Count chats in each project
  const chatCountByProject = projects.reduce((acc, project) => {
    acc[project.id] = (project.chatIds || []).filter(chatId => 
      chats.some(chat => chat.id === chatId)
    ).length;
    return acc;
  }, {});

  // Combined handler for project click
  const handleProjectClick = (e, project) => {
    // Stop propagation to prevent event bubbling
    e.stopPropagation();
    
    // First switch to this project
    switchProject(project.id);
    
    // Then navigate to project page if that's requested
    if (onNavigateToProject) {
      onNavigateToProject(project.id);
    }
    
    // Close mobile menu if needed
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  const handleDeleteClick = (e, projectId) => {
    e.stopPropagation();
    e.preventDefault();
    setProjectToDelete(projectId);
    setShowDeleteAlert(true);
  };
  
  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete);
      setProjectToDelete(null);
    }
    setShowDeleteAlert(false);
  };
  
  const handleCancelDelete = () => {
    setProjectToDelete(null);
    setShowDeleteAlert(false);
  };

  return (
    <>
      <div className="project-list">
        <div className="section-header">
          <h2>Projects</h2>
          <Button 
            variant="ghost"
            size="small"
            onClick={() => setShowNewProjectModal(true)}
            icon="+"
            ariaLabel="Create new project"
            className="new-project-button"
          />
        </div>

        <ul className="project-items">
          {projects.map(project => (
            <li 
              key={project.id} 
              className={`project-item ${project.id === currentProject?.id ? 'active' : ''} ${currentView === 'project' && project.id === currentProject?.id ? 'current-view' : ''}`}
              onClick={(e) => handleProjectClick(e, project)}
            >
              <div className="project-color-indicator" style={{ backgroundColor: project.color }} />
              <div className="project-info">
                <div className="project-name">{project.name}</div>
                <div className="project-chat-count">{chatCountByProject[project.id]} chats</div>
              </div>
              {/* Only show delete button if we have more than one project */}
              {projects.length > 1 && (
                <button 
                  className="action-button delete"
                  onClick={(e) => handleDeleteClick(e, project.id)}
                  title="Delete project"
                >
                  <span className="icon">✕</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Modals */}
      {showNewProjectModal && (
        <NewProjectModal onClose={() => setShowNewProjectModal(false)} />
      )}
      
      {showDeleteAlert && (
        <AlertDialog
          title="Delete Project"
          message="Are you sure you want to delete this project? This will not delete the chats inside."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
};

export default ProjectList;