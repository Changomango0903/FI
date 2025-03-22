import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useModelContext } from '../../context';
import logger from '../../utils/logger';
import { models as modelUtils } from '../../utils';

/**
 * Model selector component for choosing AI models
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

  useEffect(() => {
    if (autoFetch) {
      logger.debug('ModelSelector', 'Auto-fetching models');
      fetchModels();
    }
  }, [fetchModels, autoFetch]);

  // Handle model selection
  const handleModelSelect = (model) => {
    logger.debug('ModelSelector', 'Model selected', { id: model.id, provider: model.provider });
    
    // Update the context
    setSelectedModel(model);
    
    // Call the optional callback if provided
    if (onModelSelect) {
      onModelSelect(model);
    }
  };

  if (isLoadingModels) {
    return <div className="loading-indicator">Loading available models...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <p>Failed to load models: {error}</p>
        <button onClick={fetchModels} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  // Group models by provider
  const modelsByProvider = modelUtils.groupModelsByProvider(availableModels);
  const selectorClass = `model-selector ${compact ? 'model-selector--compact' : ''} ${className}`;

  return (
    <div className={selectorClass}>
      {Object.entries(modelsByProvider).map(([provider, models]) => (
        <div key={provider} className="provider-group settings-card">
          <div className="provider-header">
            <h4>{provider.charAt(0).toUpperCase() + provider.slice(1)} Models</h4>
          </div>
          <div className="model-options">
            {models.map(model => (
              <div 
                key={`${provider}-${model.id}`}
                className={`model-option ${selectedModel?.id === model.id && selectedModel?.provider === provider ? 'selected' : ''}`}
                onClick={() => handleModelSelect({ ...model, provider })}
              >
                <div className="model-info">
                  <div className="model-name">
                    {modelUtils.getModelDisplayName(model)}
                  </div>
                  {showDescription && model.description && (
                    <div className="model-description">{model.description}</div>
                  )}
                  {!compact && (
                    <div className="model-metadata">
                      {modelUtils.isReasoningModel(model) && (
                        <span className="model-tag">Reasoning</span>
                      )}
                      {model.context_length && (
                        <span className="model-tag">Context: {model.context_length.toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>
                {selectedModel?.id === model.id && selectedModel?.provider === provider && (
                  <div className="model-selected-indicator">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
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