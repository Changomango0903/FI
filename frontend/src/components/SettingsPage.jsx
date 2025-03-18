import React, { useState, useEffect } from 'react';
import { useModelContext } from '../context/ModelContext';
import ModelSelector from './ModelSelector';

const SettingsPage = ({ onClose }) => {
  const { temperature, setTemperature } = useModelContext();
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Show feedback message when temperature changes
  const handleTemperatureChange = (value) => {
    setTemperature(value);
    setShowFeedback(true);
    
    // Hide feedback after 2 seconds
    setTimeout(() => {
      setShowFeedback(false);
    }, 2000);
  };
  
  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Settings</h2>
        <button 
          className="back-button"
          onClick={onClose}
        >
          ← Back
        </button>
      </div>
      
      <div className="settings-content">
        <div className="settings-section">
          <h3>Model Selection</h3>
          <ModelSelector />
        </div>
        
        <div className="settings-section">
          <h3>Generation Settings</h3>
          <div className="setting-item">
            <div className="setting-label-row">
              <label htmlFor="temperature">Temperature </label>
              <span className="setting-value">{temperature}</span>
            </div>
            <input 
              id="temperature"
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={temperature}
              onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
              className="temperature-slider"
            />
            <p className="setting-description">
              Controls randomness: lower values are more focused, higher values more creative.
            </p>
            
            {/* Feedback message with improved styling */}
            {showFeedback && (
              <div className="setting-feedback">
                <div className="feedback-content">
                  <span className="feedback-icon">✓</span>
                  <span>Temperature updated</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Coming Soon</h3>
          <div className="future-features">
            <span className="feature-badge">RAG</span>
            <span className="feature-badge">Agents</span>
            <span className="feature-badge">Tools</span>
            <span className="feature-badge">File Upload</span>
            <span className="feature-badge">Dark Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;