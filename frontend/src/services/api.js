import logger from '../utils/logger';
import { API_CONFIG } from '../config';

// Get base URL from config
const API_BASE_URL = API_CONFIG.BASE_URL;

/**
 * Helper function for API requests
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response JSON
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    logger.debug('API', `Request to ${endpoint}`, { method: options.method || 'GET' });
    
    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: controller.signal,
      ...options
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `API request failed with status ${response.status}`;
      logger.error('API', `Request failed: ${errorMessage}`, { 
        status: response.status, 
        endpoint,
        errorData 
      });
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    logger.debug('API', `Response from ${endpoint}`, { status: response.status });
    return data;
  } catch (error) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      logger.error('API', `Request timeout for ${endpoint} after ${API_CONFIG.TIMEOUT}ms`);
      throw new Error(`Request timed out after ${API_CONFIG.TIMEOUT / 1000} seconds`);
    }
    
    logger.error('API', `Request error for ${endpoint}`, error);
    throw error;
  }
}

/**
 * Fetch available models
 * @returns {Promise<Object>} - Models data
 */
export async function fetchModels() {
  return apiRequest('/models');
}

/**
 * Fetch model details
 * @param {string} provider - Model provider
 * @param {string} modelId - Model ID
 * @returns {Promise<Object>} - Model details
 */
export async function fetchModelDetails(provider, modelId) {
  return apiRequest(`/models/${provider}/${modelId}`);
}

/**
 * Send a chat message
 * @param {Object} payload - Message payload
 * @param {Function} [onChunk] - Callback for streaming chunks (optional)
 * @returns {Promise<Object>} - Response data
 */
export async function sendChatMessage(payload, onChunk) {
  // If streaming is enabled and onChunk callback is provided, use streaming
  if (payload.stream && typeof onChunk === 'function') {
    return streamChatMessage(payload, onChunk);
  }
  
  // Otherwise use regular request
  return apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Stream a chat message using WebSocket
 * @param {Object} payload - Message payload
 * @param {Function} onChunk - Callback for streaming chunks
 * @returns {Promise<Object>} - Final response
 */
async function streamChatMessage(payload, onChunk) {
  return new Promise((resolve, reject) => {
    logger.info('API', 'Opening WebSocket connection for streaming');
    
    // Create WebSocket connection
    const wsUrl = `${API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://')}/chat/stream`;
    const ws = new WebSocket(wsUrl);
    
    let fullResponse = '';
    
    ws.onopen = () => {
      logger.debug('API', 'WebSocket connection opened');
      // Send the request payload
      ws.send(JSON.stringify(payload));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          logger.error('API', 'Streaming error', { error: data.error });
          reject(new Error(data.error));
          ws.close();
        } else if (data.done) {
          logger.debug('API', 'Streaming completed', { responseLength: fullResponse.length });
          resolve({ content: fullResponse });
          ws.close();
        } else if (data.token) {
          // Process the token
          const token = data.token;
          fullResponse += token;
          onChunk(token);
        }
      } catch (error) {
        logger.error('API', 'Error processing WebSocket message', error);
        reject(error);
        ws.close();
      }
    };
    
    ws.onerror = (error) => {
      logger.error('API', 'WebSocket error', error);
      reject(error);
    };
    
    ws.onclose = () => {
      logger.debug('API', 'WebSocket connection closed');
    };
  });
}

/**
 * Update temperature setting
 * @param {number} temperature - New temperature value
 * @returns {Promise<Object>} - Response data
 */
export async function updateTemperature(temperature) {
  return apiRequest('/settings/temperature', {
    method: 'POST',
    body: JSON.stringify({ temperature })
  });
}

/**
 * Analyze context window
 * @param {string} provider - Model provider
 * @param {string} modelId - Model ID
 * @param {Array} messages - Messages to analyze
 * @returns {Promise<Object>} - Context window analysis
 */
export async function analyzeContextWindow(provider, modelId, messages) {
  return apiRequest('/context-window', {
    method: 'POST',
    body: JSON.stringify({
      provider,
      model_id: modelId,
      messages
    })
  });
}

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} - Created project
 */
export async function createProject(projectData) {
  return apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData)
  });
}

/**
 * Fetch all projects
 * @returns {Promise<Array>} - List of projects
 */
export async function fetchProjects() {
  return apiRequest('/projects');
}

/**
 * Get a project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} - Project data
 */
export async function getProject(projectId) {
  return apiRequest(`/projects/${projectId}`);
}

/**
 * Update a project
 * @param {string} projectId - Project ID
 * @param {Object} projectData - Updated project data
 * @returns {Promise<Object>} - Updated project
 */
export async function updateProject(projectId, projectData) {
  return apiRequest(`/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(projectData)
  });
}

/**
 * Delete a project
 * @param {string} projectId - Project ID
 * @returns {Promise<void>} - Nothing
 */
export async function deleteProject(projectId) {
  return apiRequest(`/projects/${projectId}`, {
    method: 'DELETE'
  });
}