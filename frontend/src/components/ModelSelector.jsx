import React, { useEffect } from 'react';
import { useModelContext } from '../context/ModelContext';

const ModelSelector = () => {
  const { 
    availableModels, 
    selectedModel, 
    setSelectedModel, 
    isLoadingModels, 
    error,
    fetchModels 
  } = useModelContext();

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

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
  const modelsByProvider = availableModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {});

  return (
    <div className="model-selector">
      {Object.entries(modelsByProvider).map(([provider, models]) => (
        <div key={provider} className="provider-group">
          <h4>{provider.charAt(0).toUpperCase() + provider.slice(1)}</h4>
          <div className="model-options">
            {models.map(model => (
              <div 
                key={`${provider}-${model.id}`}
                className={`model-option ${selectedModel?.id === model.id && selectedModel?.provider === provider ? 'selected' : ''}`}
                onClick={() => setSelectedModel({ ...model, provider })}
              >
                <div className="model-name">{model.name}</div>
                {model.description && (
                  <div className="model-description">{model.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ModelSelector;