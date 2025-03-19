/**
 * Utility functions for parsing and organizing model information
 */

/**
 * Extract model family name and parameter size from model ID or name
 * @param {string} modelId - The model ID or full name (e.g., "llama3:7b", "gemma:2b")
 * @returns {Object} - Object containing family and size information
 */
export const parseModelInfo = (modelId) => {
  // Default values if parsing fails
  const result = {
    family: modelId,
    exactFamily: modelId, // Preserve the exact family name including version
    size: null,
    displaySize: null,
    fullName: modelId
  };
  
  if (!modelId) return result;
  
  // Convert to lowercase for easier matching
  const id = modelId.toLowerCase();
  
  // Different matching patterns based on common model naming schemes
  
  // Pattern 1: family:size (e.g., "llama3.1:7b", "gemma:2b")
  const colonPattern = /^(.+?):(\d+)b$/i;
  
  // Pattern 2: family-size (e.g., "llama3.1-7b", "gemma-2b")
  const dashPattern = /^(.+?)-(\d+)b$/i;
  
  // Pattern 3: Detect size at the end (e.g., "llama3.1_7b", "gemma2b")
  const endingPattern = /^(.+?)[\W_]?(\d+)b$/i;
  
  // Pattern 4: Find numbers followed by 'b' anywhere in the string
  const generalPattern = /(\d+)b/i;
  
  // Try each pattern
  let match = id.match(colonPattern) || id.match(dashPattern) || id.match(endingPattern);
  
  if (match) {
    const [, family, size] = match;
    
    result.exactFamily = family  // Keep exact family name with version
      .replace(/[_-]/g, ' ')
      .trim();
    
    // For base family grouping, strip versions if needed (only for Ollama)
    result.family = family
      .replace(/[_-]/g, ' ')  // Replace underscores/dashes with spaces
      .replace(/\d+(\.\d+)*$/, '') // Remove version numbers like 3.1, 3, etc.
      .trim();                // Trim whitespace
    
    result.size = parseInt(size, 10);
    result.displaySize = `${size}B`;
  } else {
    // Try the general pattern as a fallback
    const generalMatch = id.match(generalPattern);
    if (generalMatch) {
      const size = generalMatch[1];
      result.size = parseInt(size, 10);
      result.displaySize = `${size}B`;
      
      // Try to extract family name by removing the size part
      const familyPart = id.replace(`${size}b`, '').replace(/[_\-:]/g, ' ').trim();
      if (familyPart) {
        result.exactFamily = familyPart;
        result.family = familyPart.replace(/\d+(\.\d+)*$/, '').trim();
      }
    } else {
      // Try to extract just the model family name without size
      // This handles cases where we can't detect the size
      const familyPattern = /^([a-zA-Z]+)(.*)$/;
      const familyMatch = id.match(familyPattern);
      
      if (familyMatch) {
        result.family = familyMatch[1];
        result.exactFamily = id;
      }
    }
  }
  
  return result;
};

/**
 * Group models by their family name and extract parameter sizes
 * @param {Array} models - List of model objects
 * @returns {Array} - Grouped model families with parameter size options
 */
export const groupModelsByFamily = (models) => {
  if (!models || !models.length) return [];
  
  // First, separate models by provider
  const ollamaModels = models.filter(model => model.provider === 'ollama');
  const huggingfaceModels = models.filter(model => model.provider === 'huggingface');
  
  // Process Ollama models - group by family
  const ollama_results = [];
  if (ollamaModels.length > 0) {
    // Use metadata if available, otherwise parse from name/id
    const parsedModels = ollamaModels.map(model => {
      // If metadata is available, use it
      if (model.metadata) {
        return {
          ...model,
          family: model.metadata.family || model.name,
          exactFamily: model.metadata.exact_family || model.name,
          size: model.metadata.parameter_size,
          displaySize: model.metadata.parameter_size ? `${model.metadata.parameter_size}B` : null
        };
      }
      
      // Fallback to parsing from name if no metadata
      const nameInfo = parseModelInfo(model.name || model.id);
      const idInfo = parseModelInfo(model.id);
      
      // Use the best information we have
      const info = {
        ...idInfo,
        size: idInfo.size || nameInfo.size,
        displaySize: idInfo.displaySize || nameInfo.displaySize
      };
      
      return {
        ...model,
        ...info
      };
    });
    
    // Group by exact family name (including version)
    const familyGroups = {};
    
    parsedModels.forEach(model => {
      // Use exactFamily to respect versions like Llama3.1 vs Llama3.3
      const exactFamily = model.exactFamily || 'unknown';
      
      if (!familyGroups[exactFamily]) {
        familyGroups[exactFamily] = {
          family: exactFamily,
          exactFamily: exactFamily,
          description: model.description || '',
          provider: model.provider,
          sizes: []
        };
      }
      
      // Add this size option if we have size information
      if (model.size) {
        // Check if we already have this size in the group
        const existingSize = familyGroups[exactFamily].sizes.find(s => s.size === model.size);
        if (!existingSize) {
          familyGroups[exactFamily].sizes.push({
            id: model.id,
            name: model.name,
            size: model.size,
            displaySize: model.displaySize,
            model: model  // Store the original model object
          });
        }
      } else {
        // If no size info, add the model as a standalone option
        const existingModel = familyGroups[exactFamily].sizes.find(s => s.id === model.id);
        if (!existingModel) {
          familyGroups[exactFamily].sizes.push({
            id: model.id,
            name: model.name,
            size: null,
            displaySize: null,
            model: model
          });
        }
      }
    });
    
    // Sort sizes within each family
    Object.values(familyGroups).forEach(family => {
      family.sizes.sort((a, b) => {
        // Sort by size if available, otherwise alphabetically by ID
        if (a.size !== null && b.size !== null) {
          return a.size - b.size;
        }
        return a.id.localeCompare(b.id);
      });
    });
    
    // Convert to array and add to results
    ollama_results.push(...Object.values(familyGroups).sort((a, b) => 
      a.family.localeCompare(b.family)
    ));
  }
  
  // Process HuggingFace models - no grouping, just convert each to a "family" with one size
  const hf_results = huggingfaceModels.map(model => {
    // Try to extract size information from the name or ID
    const nameInfo = parseModelInfo(model.name || '');
    const idInfo = parseModelInfo(model.id || '');
    
    // Use the best information we have
    const sizeInfo = nameInfo.size || idInfo.size ? {
      size: nameInfo.size || idInfo.size,
      displaySize: nameInfo.displaySize || idInfo.displaySize
    } : {};
    
    return {
      family: model.name,
      exactFamily: model.name,
      description: model.description || '',
      provider: model.provider,
      sizes: [{
        id: model.id,
        name: model.name,
        ...sizeInfo,
        model: model
      }]
    };
  });
  
  // Combine and return both provider results
  return [...ollama_results, ...hf_results];
};

/**
 * Get a descriptive label for a model size
 * @param {number} size - Size value (e.g., 7, 13, 70)
 * @returns {string} - A human-readable description
 */
export const getSizeDescription = (size) => {
  if (!size) return '';
  
  // Define size categories
  if (size <= 3) return 'Lightweight & fast';
  if (size <= 7) return 'Balanced performance and efficiency';
  if (size <= 13) return 'Enhanced capabilities';
  if (size <= 34) return 'Advanced reasoning';
  return 'Highest accuracy and capabilities';
};

/**
 * Format parameter size for display
 * @param {number} size - Size in billions of parameters
 * @returns {string} - Formatted size string
 */
export const formatParameterSize = (size) => {
  if (!size) return 'Unknown size';
  
  if (size >= 1000) {
    return `${(size / 1000).toFixed(1)}T parameters`;
  }
  
  return `${size}B parameters`;
};

/**
 * Format context length for display
 * @param {number} contextLength - Context window size in tokens
 * @returns {string} - Formatted context length
 */
export const formatContextLength = (contextLength) => {
  if (!contextLength) return 'Unknown context';
  
  if (contextLength >= 1000000) {
    return `${(contextLength / 1000000).toFixed(1)}M context`;
  }
  
  if (contextLength >= 1000) {
    return `${(contextLength / 1000).toFixed(1)}K context`;
  }
  
  return `${contextLength} tokens context`;
};