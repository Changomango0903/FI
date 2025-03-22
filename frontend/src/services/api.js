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

// Fetch available models
export async function fetchModels() {
  return apiRequest('/models');
}

// Fetch model details
export async function fetchModelDetails(provider, modelId) {
  return apiRequest(`/models/${provider}/${modelId}`);
}

// Send a chat message (non-streaming)
export async function sendChatMessage(payload) {
  return apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// Stream a chat message
export async function streamChatMessage(payload, callbacks) {
  const { onToken, onThinkingToken, onDone, onError } = callbacks;
  
  // Create WebSocket connection
  const ws = new WebSocket(`ws://localhost:8000/api/chat/stream`);
  
  return new Promise((resolve, reject) => {
    ws.onopen = () => {
      // Send the request payload
      ws.send(JSON.stringify(payload));
      resolve(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          if (onError) onError(new Error(data.error));
          ws.close();
        } else if (data.done) {
          if (onDone) onDone();
          ws.close();
        } else if (data.token) {
          // Handle different token types
          const tokenType = data.type || 'response';
          
          if (tokenType === 'thinking' && onThinkingToken) {
            onThinkingToken(data.token);
          } else if (onToken) {
            onToken(data.token, tokenType);
          }
        }
      } catch (error) {
        if (onError) onError(error);
        ws.close();
      }
    };
    
    ws.onerror = (error) => {
      if (onError) onError(error);
      reject(error);
    };
    
    ws.onclose = () => {
      if (onDone) onDone();
    };
  });
}

// Update temperature setting
export async function updateTemperature(temperature) {
  return apiRequest('/settings/temperature', {
    method: 'POST',
    body: JSON.stringify({ temperature })
  });
}

// Function to analyze context window
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

// Check if a model is a reasoning model
export function isReasoningModel(model) {
  if (!model) return false;
  
  const reasoningModelKeywords = ['deepseek', 'qwen', 'mistral', 'mixtral', 'yi', 'claude', 'r1'];
  return reasoningModelKeywords.some(keyword => 
    model.id.toLowerCase().includes(keyword.toLowerCase()) || 
    (model.name && model.name.toLowerCase().includes(keyword.toLowerCase())) ||
    (model.has_reasoning === true)
  );
}