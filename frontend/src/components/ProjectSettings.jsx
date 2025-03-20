// frontend/src/components/ProjectSettings.jsx
import React, { useState } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { useModelContext } from '../context/ModelContext';

const ProjectSettings = () => {
  const { projects, updateProject, deleteProject } = useProjectContext();
  const { chats } = useModelContext();
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');

  // Predefined colors
  const predefinedColors = [
    '#0071e3', // Blue
    '#34c759', // Green
    '#ff9500', // Orange
    '#ff3b30', // Red
    '#5856d6', // Purple
    '#af52de', // Pink
    '#ff2d55', // Rose
    '#007aff', // Light Blue
  ];

  // Start editing a project
  const handleEdit = (project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDescription(project.description || '');
    setEditColor(project.color);
  };

  // Save project edits
  const handleSave = (id) => {
    if (editName.trim()) {
      updateProject(id, {
        name: editName.trim(),
        description: editDescription.trim(),
        color: editColor
      });
      setEditingId(null);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
  };

  // Delete a project
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this project? This will not delete the chats inside.')) {
      deleteProject(id);
    }
  };

  // Count chats in each project
  const chatCountByProject = projects.reduce((acc, project) => {
    acc[project.id] = project.chatIds.filter(chatId => 
      chats.some(chat => chat.id === chatId)
    ).length;
    return acc;
  }, {});

  return (
    <section className="settings-section project-settings-section">
      <div className="settings-section-header">
        <h3>Projects</h3>
        <p className="section-description">Manage your projects</p>
      </div>

      <div className="project-settings-list">
        {projects.map(project => (
          <div key={project.id} className="settings-card project-settings-item">
            {editingId === project.id ? (
              // Edit mode
              <div className="project-edit-form">
                <div className="form-group">
                  <label htmlFor={`project-name-${project.id}`}>Project Name</label>
                  <input
                    id={`project-name-${project.id}`}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor={`project-description-${project.id}`}>Description (optional)</label>
                  <textarea
                    id={`project-description-${project.id}`}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Enter project description"
                    rows="2"
                  />
                </div>
                
                <div className="form-group">
                  <label>Project Color</label>
                  <div className="color-picker">
                    {predefinedColors.map(color => (
                      <div 
                        key={color}
                        className={`color-option ${editColor === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setEditColor(color)}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="project-edit-actions">
                  <button 
                    type="button" 
                    className="button-secondary" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="button-primary" 
                    onClick={() => handleSave(project.id)}
                    disabled={!editName.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              // View mode
              <div className="project-view-mode">
                <div className="project-info-header">
                  <div className="project-name-with-color">
                    <div 
                      className="project-color-indicator" 
                      style={{ backgroundColor: project.color }} 
                    />
                    <h4>{project.name}</h4>
                  </div>
                  <div className="project-chat-count">
                    {chatCountByProject[project.id]} chats
                  </div>
                </div>
                
                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}
                
                <div className="project-actions">
                  <button 
                    className="button-secondary button-sm" 
                    onClick={() => handleEdit(project)}
                  >
                    Edit
                  </button>
                  
                  {/* Only show delete button if we have more than one project */}
                  {projects.length > 1 && (
                    <button 
                      className="button-danger button-sm" 
                      onClick={() => handleDelete(project.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProjectSettings;