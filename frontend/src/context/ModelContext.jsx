import React, { createContext, useContext } from 'react';
import { useModels, useChat, useSettings } from '../hooks';

// Create the context with default values
const ModelContext = createContext({
  // Models
  availableModels: [],
  selectedModel: null,
  isLoadingModels: false,
  setSelectedModel: () => {},
  isReasoningModel: () => false,
  
  // Chat
  chats: [],
  currentChatId: null,
  currentChat: null,
  isLoading: false,
  createNewChat: () => {},
  deleteChat: () => {},
  switchChat: () => {},
  updateChatTitle: () => {},
  sendMessage: async () => {},
  clearCurrentChat: () => {},
  
  // Settings
  temperature: 0.7,
  maxTokens: 1000,
  topP: 0.95,
  streaming: true,
  systemPrompt: '',
  showThinking: false,
  updateTemperature: () => {},
  updateMaxTokens: () => {},
  updateTopP: () => {},
  toggleStreaming: () => {},
  updateSystemPrompt: () => {},
  toggleShowThinking: () => {},
  resetSettings: () => {},
  
  // Errors
  error: null,
});

/**
 * Provider component for model context
 */
export function ModelProvider({ children }) {
  // Use the hooks to manage state
  const models = useModels();
  const settings = useSettings();
  const chat = useChat({ selectedModel: models.selectedModel });
  
  // Combine all state and methods from the hooks
  const contextValue = {
    // Models
    availableModels: models.availableModels,
    selectedModel: models.selectedModel,
    isLoadingModels: models.isLoadingModels,
    setSelectedModel: models.setSelectedModel,
    isReasoningModel: models.isReasoningModel,
    
    // Chat
    chats: chat.chats,
    currentChatId: chat.currentChatId,
    currentChat: chat.currentChat,
    isLoading: chat.isLoading,
    createNewChat: chat.createNewChat,
    deleteChat: chat.deleteChat,
    switchChat: chat.switchChat,
    updateChatTitle: chat.updateChatTitle,
    sendMessage: (message) => chat.sendMessage(message, {
      streaming: settings.streaming,
      systemPrompt: settings.systemPrompt,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
    }),
    clearCurrentChat: chat.clearCurrentChat,
    
    // Settings
    ...settings,
    
    // Errors - combine errors from all hooks
    error: models.error || chat.error,
  };
  
  return (
    <ModelContext.Provider value={contextValue}>
      {children}
    </ModelContext.Provider>
  );
}

/**
 * Custom hook to use the model context
 */
export const useModelContext = () => useContext(ModelContext);

export default ModelContext; 