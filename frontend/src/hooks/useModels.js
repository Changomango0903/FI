import { useState, useCallback, useEffect } from 'react';
import { fetchModels } from '../services/api';
import logger from '../utils/logger';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/localStorage';
import { isReasoningModel } from '../utils/models';

/**
 * Custom hook for managing models
 * @returns {Object} - Model management methods and state
 */
export default function useModels() {
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [error, setError] = useState(null);

  // Load saved model selection on mount
  useEffect(() => {
    const savedModel = loadFromStorage(STORAGE_KEYS.SELECTED_MODEL, null);
    if (savedModel) {
      logger.info('useModels', 'Loading saved model selection');
      setSelectedModel(savedModel);
    }
  }, []);

  // Save selected model when it changes
  useEffect(() => {
    if (selectedModel) {
      saveToStorage(STORAGE_KEYS.SELECTED_MODEL, selectedModel);
      logger.info('useModels', 'Saved model selection', { model: selectedModel.id });
    }
  }, [selectedModel]);

  /**
   * Fetch available models from the API
   */
  const fetchAvailableModels = useCallback(async () => {
    setIsLoadingModels(true);
    setError(null);
    
    try {
      logger.info('useModels', 'Fetching available models');
      const data = await fetchModels();
      setAvailableModels(data.models);
      logger.info('useModels', `Loaded ${data.models.length} models`);
      
      // If no model is selected yet and we have models, select the first one
      if (!selectedModel && data.models.length > 0) {
        setSelectedModel(data.models[0]);
        logger.info('useModels', 'Auto-selected first model', { model: data.models[0].id });
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch models';
      setError(errorMessage);
      logger.error('useModels', 'Failed to fetch models', err);
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedModel]);

  /**
   * Change the selected model
   * @param {Object} model - The model to select
   */
  const handleModelSelection = useCallback((model) => {
    logger.info('useModels', 'Model selected', { model: model.id });
    setSelectedModel(model);
  }, []);

  /**
   * Check if a model has reasoning capabilities
   * @param {Object} model - The model to check
   * @returns {boolean} - Whether the model has reasoning capabilities
   */
  const checkReasoningCapability = useCallback((model) => {
    return isReasoningModel(model);
  }, []);

  return {
    availableModels,
    selectedModel,
    isLoadingModels,
    error,
    fetchModels: fetchAvailableModels,
    setSelectedModel: handleModelSelection,
    isReasoningModel: checkReasoningCapability,
  };
} 