/**
 * Utility functions for model operations
 */

import { REASONING_MODEL_KEYWORDS } from '../config';
import logger from './logger';

/**
 * Check if a model has reasoning capabilities based on its name or properties
 * @param {Object} model - The model to check
 * @returns {boolean} - Whether the model has reasoning capabilities
 */
export function isReasoningModel(model) {
  if (!model) return false;
  
  // Check if model has explicit reasoning capability
  if (model.has_reasoning === true) {
    logger.debug('models', `Model ${model.id} has explicit reasoning capability`);
    return true;
  }
  
  // Check if model name contains one of the reasoning model keywords
  const modelId = model.id?.toLowerCase() || '';
  const modelName = model.name?.toLowerCase() || '';
  
  const hasReasoningKeyword = REASONING_MODEL_KEYWORDS.some(keyword => 
    modelId.includes(keyword.toLowerCase()) || modelName.includes(keyword.toLowerCase())
  );
  
  return hasReasoningKeyword;
}

/**
 * Get a display name for a model
 * @param {Object} model - The model to get a display name for
 * @returns {string} - The display name
 */
export function getModelDisplayName(model) {
  if (!model) return 'No model selected';
  
  // If model has a name, use it
  if (model.name) return model.name;
  
  // Otherwise, format the ID
  let displayName = model.id;
  
  // Remove provider prefix if present
  if (displayName.includes('/')) {
    displayName = displayName.split('/').pop();
  }
  
  // Convert to title case
  displayName = displayName
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
  
  return displayName;
}

/**
 * Group models by their provider
 * @param {Array} models - The models to group
 * @returns {Object} - An object with provider names as keys and arrays of models as values
 */
export function groupModelsByProvider(models) {
  if (!Array.isArray(models)) {
    logger.warn('models', 'Cannot group models: not an array', { models });
    return {};
  }
  
  return models.reduce((groups, model) => {
    const provider = model.provider || 'Unknown';
    
    if (!groups[provider]) {
      groups[provider] = [];
    }
    
    groups[provider].push(model);
    return groups;
  }, {});
}

/**
 * Get the maximum context length for a model
 * @param {Object} model - The model to get the context length for
 * @returns {number} - The maximum context length
 */
export function getModelContextLength(model) {
  if (!model) return 4096; // Default fallback
  
  // If the model has a context_length property, use it
  if (model.context_length) {
    return model.context_length;
  }
  
  // If the model has a context_window property, use it
  if (model.context_window) {
    return model.context_window;
  }
  
  // Try to find it in model parameters
  if (model.parameters) {
    const contextParams = ['context_length', 'max_tokens', 'max_context_length', 'context_window'];
    
    for (const param of contextParams) {
      if (model.parameters[param]) {
        return model.parameters[param];
      }
    }
  }
  
  // Default fallback values based on common model families
  const modelId = model.id?.toLowerCase() || '';
  
  if (modelId.includes('gpt-4')) return 8192;
  if (modelId.includes('gpt-3.5')) return 4096;
  if (modelId.includes('claude')) return 8000;
  if (modelId.includes('mixtral')) return 32000;
  if (modelId.includes('mistral')) return 8000;
  if (modelId.includes('llama-3')) return 8000;
  if (modelId.includes('llama-2')) return 4096;
  
  // Most conservative default
  return 4096;
} 