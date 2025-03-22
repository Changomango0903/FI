import React, { useState } from 'react';
import { useProjectContext } from '../../context/ProjectContext';
import Button from '../ui/Button';

const NewProjectModal = ({ onClose }) => {
  const { createProject } = useProjectContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0071e3');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    try {
      setIsSubmitting(true);
      setError('');
      await createProject(name.trim(), description.trim(), color);
      onClose();
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container glass-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Project</h3>
          <Button 
            variant="ghost" 
            size="small" 
            onClick={onClose}
            icon="✕"
            ariaLabel="Close modal"
          />
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="project-name" className="form-label">Project Name</label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
              autoFocus
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="project-description" className="form-label">Description (optional)</label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows="3"
              className="form-textarea"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Project Color</label>
            <div className="color-picker">
              {predefinedColors.map(predefinedColor => (
                <div 
                  key={predefinedColor}
                  className={`color-option ${color === predefinedColor ? 'active' : ''}`}
                  style={{ backgroundColor: predefinedColor }}
                  onClick={() => setColor(predefinedColor)}
                  title={`Select ${predefinedColor} color`}
                />
              ))}
            </div>
          </div>
          
          {error && <div className="form-error">{error}</div>}
          
          <div className="modal-actions">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;