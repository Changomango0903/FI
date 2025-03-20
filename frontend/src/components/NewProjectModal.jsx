import React, { useState } from 'react';
import { useProjectContext } from '../context/ProjectContext';

const NewProjectModal = ({ onClose }) => {
  const { createProject } = useProjectContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0071e3');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      createProject(name.trim(), description.trim(), color);
      onClose();
    }
  };

  // Apple-inspired color palette
  const predefinedColors = [
    '#0071e3', // Blue
    '#34c759', // Green
    '#ff9500', // Orange
    '#ff3b30', // Red
    '#5856d6', // Purple
    '#af52de', // Pink
    '#ff2d55', // Rose
    '#007aff', // Light Blue
    '#64d2ff', // Cyan
    '#bf5af2', // Magenta
    '#ffd60a', // Yellow
    '#00c7be', // Mint
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Create New Project</h3>
          <button className="modal-close-button" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="project-name">Project Name</label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="project-description">Description (optional)</label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label>Project Color</label>
            <div className="color-picker">
              {predefinedColors.map(predefinedColor => (
                <div 
                  key={predefinedColor}
                  className={`color-option ${color === predefinedColor ? 'active' : ''}`}
                  style={{ backgroundColor: predefinedColor }}
                  onClick={() => setColor(predefinedColor)}
                />
              ))}
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="button-primary"
              disabled={!name.trim()}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;