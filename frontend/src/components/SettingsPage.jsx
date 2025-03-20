import React, { useState, useEffect, useRef } from 'react';
import { useModelContext } from '../context/ModelContext';
import { useTheme } from '../context/ThemeContext';
import ModelSelector from './ModelSelector';
import ProjectSettings from './ProjectSettings';

const SettingsPage = ({ onClose }) => {
  const { temperature, setTemperature } = useModelContext();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [sliderValue, setSliderValue] = useState(temperature);
  const timerRef = useRef(null);
  const lastValueRef = useRef(temperature);
  const updatePendingRef = useRef(false);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  // Update slider value during dragging without pushing to backend
  const handleSliderChange = (value) => {
    setSliderValue(value);
  };
  
  // Update backend when slider is released and value has changed
  const handleSliderRelease = async () => {
    // Only update if the value actually changed and no update is in progress
    if (lastValueRef.current !== sliderValue && !updatePendingRef.current) {
      // Set update pending flag to prevent multiple simultaneous updates
      updatePendingRef.current = true;
      
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      try {
        // Update temperature on backend
        const success = await setTemperature(sliderValue);
        
        // Show appropriate feedback
        if (success) {
          setFeedbackMessage('Temperature has been updated');
          setShowFeedback(true);
        } else {
          setFeedbackMessage('Failed to update temperature');
          setShowFeedback(true);
        }
        
        // Set timer to hide notification after 2.5 seconds
        timerRef.current = setTimeout(() => {
          setShowFeedback(false);
        }, 2500);
        
        // Update the last value reference
        lastValueRef.current = sliderValue;
      } catch (error) {
        console.error('Error updating temperature:', error);
        setFeedbackMessage('Error updating temperature');
        setShowFeedback(true);
      } finally {
        // Reset pending flag
        updatePendingRef.current = false;
      }
    }
  };
  
  // For keyboard interactions (arrow keys)
  const handleKeyUp = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
        e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      handleSliderRelease();
    }
  };
  
  // Helper function to get temperature description based on value
  const getTemperatureDescription = (value) => {
    if (value <= 0.3) return "More deterministic and focused responses";
    if (value <= 0.7) return "Balanced creativity and consistency";
    return "More creative and varied responses";
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
        <section className="settings-section model-selection-section">
          <div className="settings-section-header">
            <h3>Model Selection</h3>
            <p className="section-description">Choose the AI model for your conversations</p>
          </div>
          
          <ModelSelector />
        </section>
        
        <section className="settings-section generation-settings-section">
          <div className="settings-section-header">
            <h3>Generation Settings</h3>
            <p className="section-description">Control how the AI generates responses</p>
          </div>
          
          <div className="settings-card">
            <div className="setting-item-refined">
              <div className="setting-header">
                <div className="setting-label">Temperature</div>
                <div className="setting-value-pill">{sliderValue}</div>
              </div>
              
              <div className="slider-container">
                <input 
                  id="temperature"
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={sliderValue}
                  onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                  onMouseUp={handleSliderRelease}
                  onTouchEnd={handleSliderRelease}
                  onKeyUp={handleKeyUp}
                  className="temperature-slider-refined"
                  aria-label="Adjust temperature"
                />
                
                <div className="temperature-range-labels">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
              
              <p className="setting-description-refined">
                {getTemperatureDescription(sliderValue)}
              </p>
              
              {/* Notification box below slider */}
              {showFeedback && (
                <div className={`temperature-notification ${feedbackMessage.includes('Failed') || feedbackMessage.includes('Error') ? 'error' : 'success'}`} aria-live="polite">
                  <span className="notification-icon">{feedbackMessage.includes('Failed') || feedbackMessage.includes('Error') ? '!' : '✓'}</span>
                  <span className="notification-text">{feedbackMessage}</span>
                </div>
              )}
            </div>
          </div>
        </section>
        
        <section className="settings-section appearance-section">
          <div className="settings-section-header">
            <h3>Appearance</h3>
            <p className="section-description">Customize the look and feel of the interface</p>
          </div>
          
          <div className="settings-card">
            <div className="setting-item-refined">
              <div className="setting-header">
                <div className="setting-label">Theme</div>
                <div className="theme-toggle-pill">
                  <button 
                    className={`theme-option ${!isDarkMode ? 'active' : ''}`}
                    onClick={() => isDarkMode && toggleDarkMode()}
                  >
                    Light
                  </button>
                  <button 
                    className={`theme-option ${isDarkMode ? 'active' : ''}`}
                    onClick={() => !isDarkMode && toggleDarkMode()}
                  >
                    Dark
                  </button>
                </div>
              </div>
              
              <p className="setting-description-refined">
                Choose between light and dark interface theme
              </p>
            </div>
          </div>
        </section>
        <section className="settings-section projects-management-section">
          <ProjectSettings />
        </section>
        <section className="settings-section future-features-section">
          <div className="settings-section-header">
            <h3>Coming Soon</h3>
            <p className="section-description">Features planned for future releases</p>
          </div>
          
          <div className="settings-card">
            <div className="future-features-refined">
              <span className="feature-badge">RAG</span>
              <span className="feature-badge">Agents</span>
              <span className="feature-badge">Tools</span>
              <span className="feature-badge">File Upload</span>
              <span className="feature-badge completed">Dark Mode</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;