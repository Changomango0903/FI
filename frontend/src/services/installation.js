// Base API URL
const API_BASE_URL = 'http://localhost:8000/api';

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API request failed with status ${response.status}`);
  }
  
  return response.json();
}

// Fetch available models from the Ollama library
export async function fetchLibraryModels() {
  return apiRequest('/model/library');
}

// Install a model
export async function installModel(modelId, force = false) {
  return apiRequest('/model/install', {
    method: 'POST',
    body: JSON.stringify({ model_id: modelId, force })
  });
}

// Check the installation status of a model
export async function checkModelStatus(modelId) {
  return apiRequest(`/model/install/status/${modelId}`);
}

// Poll the installation status at regular intervals
export function pollInstallationStatus(modelId, onUpdate, interval = 3000) {
  const intervalId = setInterval(async () => {
    try {
      const status = await checkModelStatus(modelId);
      onUpdate(status);
      
      // If the model is installed, stop polling
      if (status.installed) {
        clearInterval(intervalId);
      }
    } catch (error) {
      console.error('Error polling model status:', error);
      // Stop polling on error
      clearInterval(intervalId);
      onUpdate({ error: error.message });
    }
  }, interval);
  
  // Return a function to stop polling
  return () => clearInterval(intervalId);
}