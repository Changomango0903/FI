import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useModelContext } from '../../context';
import { logger, models as modelUtils } from '../../utils';
import { Spinner } from '../ui';

/**
 * Model selector component for choosing AI models
 * @param {Object} props - Component props
 * @param {Function} props.onModelSelect - Optional callback when model is selected
 * @param {boolean} props.compact - Whether to show a compact version
 * @param {boolean} props.showDescription - Whether to show model descriptions
 * @param {boolean} props.autoFetch - Whether to automatically fetch models on mount
 * @param {string} props.className - Additional CSS class
 */
const ModelSelector = ({
  onModelSelect,
  compact = false,
  showDescription = true,
  autoFetch = true,
  className = '',
}) => {
  const { 
    availableModels, 
    selectedModel, 
    setSelectedModel, 
    isLoadingModels, 
    error,
    fetchModels 
  } = useModelContext();

  // Fetch models on component mount if autoFetch is true
  useEffect(() => {
    if (autoFetch) {
      logger.debug('ModelSelector', 'Auto-fetching models');
      fetchModels();
    }
  }, [autoFetch, fetchModels]);

  // Handle model selection
  const handleModelSelect = (model) => {
    logger.info('ModelSelector', 'Model selected', { model: model.id });
    setSelectedModel(model);
    
    if (onModelSelect) {
      onModelSelect(model);
    }
  };

  // Determine if model is selected
  const isSelected = (model) => {
    return selectedModel && model.id === selectedModel.id;
  };

  // Render a model option in the list
  const renderModelOption = (model) => {
    const selected = isSelected(model);
    const modelName = modelUtils.getFormattedModelName(model);
    
    return (
      <div 
        key={model.id}
        className={`model-option ${selected ? 'selected' : ''}`}
        onClick={() => handleModelSelect(model)}
        aria-selected={selected}
        role="option"
      >
        <div className="model-option-content">
          <div className="model-name">
            {modelName}
            {model.isNew && <span className="model-tag new">New</span>}
            {model.isFast && <span className="model-tag fast">Fast</span>}
          </div>
          
          {showDescription && model.description && (
            <div className="model-description">{model.description}</div>
          )}
          
          {!compact && (
            <div className="model-specs">
              {model.context && (
                <span className="model-context">
                  Context: {modelUtils.formatTokenCount(model.context)} tokens
                </span>
              )}
              {model.provider && (
                <span className="model-provider">
                  Provider: {model.provider}
                </span>
              )}
            </div>
          )}
        </div>
        
        {selected && (
          <div className="model-selected-indicator" aria-hidden="true">
            ✓
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`model-selector ${compact ? 'compact' : ''} ${className}`}
      aria-busy={isLoadingModels}
      role="listbox"
      aria-label="Available AI models"
    >
      <div className="model-selector-header">
        <h3>Select AI Model</h3>
        <button 
          className="refresh-button" 
          onClick={fetchModels}
          disabled={isLoadingModels}
          aria-label="Refresh model list"
          title="Refresh models"
        >
          ↻
        </button>
      </div>
      
      {isLoadingModels ? (
        <div className="loading-state">
          <Spinner />
          <p>Loading available models...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>Error loading models: {error}</p>
          <button 
            onClick={fetchModels}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      ) : availableModels.length === 0 ? (
        <div className="empty-state">
          <p>No models available.</p>
        </div>
      ) : (
        <div className="model-list">
          {availableModels.map(renderModelOption)}
        </div>
      )}
    </div>
  );
};

ModelSelector.propTypes = {
  onModelSelect: PropTypes.func,
  compact: PropTypes.bool,
  showDescription: PropTypes.bool,
  autoFetch: PropTypes.bool,
  className: PropTypes.string,
};

export default ModelSelector; 