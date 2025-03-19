import React, { useState, useEffect, useRef } from 'react';
import { useModelContext } from '../context/ModelContext';
import { useTheme } from '../context/ThemeContext';
import { 
  groupModelsByFamily, 
  getSizeDescription, 
  formatParameterSize,
  formatContextLength
} from '../utils/modelUtils';

/**
 * Enhanced Settings component with model family grouping and parameter size selection
 */
const EnhancedSettings = ({ onClose }) => {
  const { 
    availableModels, 
    selectedModel, 
    setSelectedModel, 
    temperature, 
    setTemperature,
    isLoadingModels,
    fetchModels
  } = useModelContext();
  
  const { isDarkMode, toggleDarkMode } = useTheme();
  
  // State for grouped models
  const [modelFamilies, setModelFamilies] = useState([]);
  
  // Track current temp value for slider UI
  const [sliderValue, setSliderValue] = useState(temperature);
  
  // States for notification feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  
  // References for timers and state tracking
  const timerRef = useRef(null);
  const lastTempRef = useRef(temperature);
  const updatePendingRef = useRef(false);
  
  // Process and group models on load or when availableModels changes
  useEffect(() => {
    if (availableModels && availableModels.length > 0) {
      const grouped = groupModelsByFamily(availableModels);
      setModelFamilies(grouped);
    } else {
      // Fetch models if none are available
      fetchModels();
    }
  }, [availableModels, fetchModels]);
  
  // Temperature slider handlers
  const handleSliderChange = (value) => {
    setSliderValue(value);
  };
  
  const handleSliderRelease = async () => {
    // Only update if the value actually changed and no update is in progress
    if (lastTempRef.current !== sliderValue && !updatePendingRef.current) {
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
        lastTempRef.current = sliderValue;
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
  
  // Helper function to check if a model size is selected
  const isModelSizeSelected = (familyName, sizeOption) => {
    if (!selectedModel) return false;
    
    // Check if the current selected model matches this size option
    return selectedModel.id === sizeOption.id && 
           selectedModel.provider === sizeOption.model.provider;
  };
  
  // Helper to check if a model family is selected
  const isModelFamilySelected = (family) => {
    if (!selectedModel) return false;
    
    // Check if any size in this family is selected
    return family.sizes.some(sizeOption => 
      selectedModel.id === sizeOption.id && 
      selectedModel.provider === sizeOption.model.provider
    );
  };
  
  // Handler for selecting a model size
  const handleSelectModelSize = (sizeOption) => {
    setSelectedModel(sizeOption.model);
  };
  
  // Handle clicking on a model family card header
  const handleModelFamilyClick = (family) => {
    // If the model is already selected, don't do anything
    if (isModelFamilySelected(family)) return;
    
    // Select the first size option (default)
    handleSelectModelSize(family.sizes[0]);
  };
  
  // Helper function to get temperature description based on value
  const getTemperatureDescription = (value) => {
    if (value <= 0.3) return "More deterministic and focused responses";
    if (value <= 0.7) return "Balanced creativity and consistency";
    return "More creative and varied responses";
  };
  
  // Get additional model metadata for display
  const getModelMetadata = (sizeOption) => {
    const model = sizeOption.model;
    if (!model) return null;
    
    return {
      parameterSize: model.metadata?.parameter_size || sizeOption.size,
      contextLength: model.metadata?.context_length || model.context_length,
      quantization: model.metadata?.quantization
    };
  };
  
  // Show loading state if models are still loading
  if (isLoadingModels) {
    return (
      <div className="settings-page">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="back-button" onClick={onClose}>
            Done
          </button>
        </div>
        <div className="settings-content loading">
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading available models...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Group models by provider
  const groupedByProvider = {};
  modelFamilies.forEach(family => {
    if (!groupedByProvider[family.provider]) {
      groupedByProvider[family.provider] = [];
    }
    groupedByProvider[family.provider].push(family);
  });
  
  return (
    <div className="settings-page">
      {/* Settings Header */}
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="back-button" onClick={onClose}>
          Done
        </button>
      </div>
      
      {/* Settings Content */}
      <div className="settings-content">
        {/* Model Selection Section */}
        <section className="settings-section model-selection-section">
          <div className="settings-section-header">
            <h3>Model Selection</h3>
            <p className="section-description">Choose a model and parameter size for your conversations</p>
          </div>
          
          {/* Group models by provider */}
          {Object.keys(groupedByProvider).length > 0 && (
            <div className="model-selector">
              {/* Ollama Models - Group by family with parameter sizing */}
              {groupedByProvider['ollama'] && (
                <div className="provider-group settings-card">
                  <div className="provider-header">
                    <h4>Ollama</h4>
                  </div>
                  
                  <div className="model-options">
                    {/* Model family cards */}
                    {groupedByProvider['ollama'].map(family => (
                      <div 
                        key={`ollama-${family.exactFamily}`} 
                        className={`model-option ${isModelFamilySelected(family) ? 'selected' : ''}`}
                        onClick={() => handleModelFamilyClick(family)}
                      >
                        <div className="model-info">
                          <div className="model-name">
                            {family.family.charAt(0).toUpperCase() + family.family.slice(1)}
                          </div>
                          <div className="model-description">
                            {family.description}
                            {!isModelFamilySelected(family) && (
                              <span className="model-sizes-preview">
                                Available sizes: {family.sizes.map(size => 
                                  size.displaySize || `${size.size}B`
                                ).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Selected indicator */}
                        {isModelFamilySelected(family) && (
                          <div className="model-selected-indicator">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* HuggingFace Models */}
              {groupedByProvider['huggingface'] && (
                <div className="provider-group settings-card">
                  <div className="provider-header">
                    <h4>HuggingFace</h4>
                  </div>
                  
                  <div className="model-options">
                    {/* Individual HuggingFace model cards */}
                    {groupedByProvider['huggingface'].map(model => (
                      <div 
                        key={`huggingface-${model.family}`} 
                        className={`model-option ${isModelFamilySelected(model) ? 'selected' : ''}`}
                        onClick={() => handleSelectModelSize(model.sizes[0])}
                      >
                        <div className="model-info">
                          <div className="model-name">{model.family}</div>
                          <div className="model-description">{model.description}</div>
                        </div>
                        
                        {/* Selected indicator */}
                        {isModelFamilySelected(model) && (
                          <div className="model-selected-indicator">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Parameter Size Selector - Only show for selected family */}
          {selectedModel && modelFamilies.some(isModelFamilySelected) && (
            <div className="settings-card parameter-size-card">
              <div className="setting-item-refined">
                <div className="setting-header">
                  <div className="setting-label">Parameter Size</div>
                </div>
                
                {(() => {
                  // Find the selected family
                  const selectedFamily = modelFamilies.find(isModelFamilySelected);
                  if (!selectedFamily) return null;
                  
                  return (
                    <>
                      <div className="size-options-container">
                        {selectedFamily.sizes.map(sizeOption => {
                          // Get metadata for this model option
                          const metadata = getModelMetadata(sizeOption);
                          
                          return (
                            <button
                              key={sizeOption.id}
                              className={`size-option-pill ${isModelSizeSelected(selectedFamily.exactFamily, sizeOption) ? 'selected' : ''}`}
                              onClick={() => handleSelectModelSize(sizeOption)}
                            >
                              {sizeOption.displaySize || `${sizeOption.size}B`}
                              {metadata?.quantization && (
                                <span className="quantization-badge">{metadata.quantization}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Description of selected size */}
                      {selectedFamily.sizes.some(
                        sizeOption => isModelSizeSelected(selectedFamily.exactFamily, sizeOption)
                      ) && (
                        <div className="size-description">
                          {(() => {
                            const selectedSize = selectedFamily.sizes.find(
                              sizeOption => isModelSizeSelected(selectedFamily.exactFamily, sizeOption)
                            );
                            
                            if (!selectedSize) return null;
                            
                            const metadata = getModelMetadata(selectedSize);
                            const parameterInfo = metadata?.parameterSize ? 
                              formatParameterSize(metadata.parameterSize) : "";
                            const contextInfo = metadata?.contextLength ? 
                              ` • ${formatContextLength(metadata.contextLength)}` : "";
                            
                            return (
                              <>
                                {getSizeDescription(metadata?.parameterSize || selectedSize.size)}
                                <span className="model-technical-details">
                                  {parameterInfo}{contextInfo}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </section>
        
        {/* Generation Settings Section */}
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
        
        {/* Appearance Section */}
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
      </div>
    </div>
  );
};

export default EnhancedSettings;