import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendChatMessage } from '../services/api';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/localStorage';
import logger from '../utils/logger';

/**
 * Custom hook for managing chat state and operations
 * @param {Object} options - Options for the hook
 * @param {Object} options.selectedModel - The currently selected model
 * @returns {Object} - Chat management methods and state
 */
export default function useChat({ selectedModel }) {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Initialize chats from localStorage
  useEffect(() => {
    const savedChats = loadFromStorage(STORAGE_KEYS.CHATS, []);
    const savedCurrentChatId = loadFromStorage(STORAGE_KEYS.CURRENT_CHAT, null);
    
    if (savedChats && savedChats.length > 0) {
      setChats(savedChats);
      logger.info('useChat', `Loaded ${savedChats.length} chats from storage`);
      
      // Set current chat
      if (savedCurrentChatId && savedChats.some(chat => chat.id === savedCurrentChatId)) {
        setCurrentChatId(savedCurrentChatId);
      } else {
        setCurrentChatId(savedChats[0].id);
      }
    } else {
      // Create a new chat if none exists
      createNewChat();
    }
  }, []);
  
  // Save chats and current chat ID when they change
  useEffect(() => {
    if (chats.length > 0) {
      saveToStorage(STORAGE_KEYS.CHATS, chats);
      logger.debug('useChat', 'Saved chats to storage', { count: chats.length });
    }
    
    if (currentChatId) {
      saveToStorage(STORAGE_KEYS.CURRENT_CHAT, currentChatId);
      logger.debug('useChat', 'Saved current chat ID to storage', { id: currentChatId });
    }
  }, [chats, currentChatId]);
  
  /**
   * Get the current chat
   * @returns {Object|null} - The current chat object or null
   */
  const getCurrentChat = useCallback(() => {
    return chats.find(chat => chat.id === currentChatId) || null;
  }, [chats, currentChatId]);
  
  /**
   * Create a new chat
   * @returns {Object} - The newly created chat
   */
  const createNewChat = useCallback(() => {
    const newChat = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setChats(prevChats => [newChat, ...prevChats]);
    setCurrentChatId(newChat.id);
    logger.info('useChat', 'Created new chat', { id: newChat.id });
    
    return newChat;
  }, []);
  
  /**
   * Delete a chat
   * @param {string} chatId - ID of the chat to delete
   */
  const deleteChat = useCallback((chatId) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    
    // If deleting current chat, switch to another one or create new
    if (chatId === currentChatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        createNewChat();
      }
    }
    
    logger.info('useChat', 'Deleted chat', { id: chatId });
  }, [chats, currentChatId, createNewChat]);
  
  /**
   * Switch to a different chat
   * @param {string} chatId - ID of the chat to switch to
   */
  const switchChat = useCallback((chatId) => {
    if (chats.some(chat => chat.id === chatId)) {
      setCurrentChatId(chatId);
      logger.info('useChat', 'Switched to chat', { id: chatId });
    } else {
      logger.warn('useChat', 'Attempted to switch to non-existent chat', { id: chatId });
    }
  }, [chats]);
  
  /**
   * Update the title of a chat
   * @param {string} chatId - ID of the chat to update
   * @param {string} newTitle - New title for the chat
   */
  const updateChatTitle = useCallback((chatId, newTitle) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              title: newTitle, 
              updatedAt: new Date().toISOString() 
            } 
          : chat
      )
    );
    logger.info('useChat', 'Updated chat title', { id: chatId, title: newTitle });
  }, []);
  
  /**
   * Send a message in the current chat
   * @param {string} message - The message to send
   * @param {Object} options - Additional options
   * @param {boolean} options.streaming - Whether to use streaming response
   * @param {string} options.systemPrompt - System prompt to use
   * @param {number} options.temperature - Temperature setting
   * @param {number} options.maxTokens - Maximum tokens to generate
   * @returns {Promise<Object>} - The response from the API
   */
  const sendMessage = useCallback(async (message, options = {}) => {
    if (!selectedModel) {
      const error = new Error('No model selected');
      logger.error('useChat', 'Failed to send message: no model selected');
      setError(error.message);
      return Promise.reject(error);
    }
    
    if (!currentChatId) {
      logger.warn('useChat', 'No current chat, creating a new one');
      createNewChat();
    }
    
    const currentChat = getCurrentChat();
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    // Create assistant message object here to make it available throughout the function scope
    const assistantMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    
    // Optimistically update UI with user message
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === currentChatId 
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              updatedAt: new Date().toISOString(),
              title: chat.messages.length === 0 ? message.slice(0, 30) + (message.length > 30 ? '...' : '') : chat.title,
            }
          : chat
      )
    );
    
    // Set loading state
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('useChat', 'Sending message', { 
        modelId: selectedModel.id, 
        chatId: currentChatId,
        messageLength: message.length
      });
      
      // Add empty assistant message to show typing indicator
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === currentChatId 
            ? {
                ...chat,
                messages: [...chat.messages, assistantMessage],
              }
            : chat
        )
      );
      
      // Prepare chat history for API
      const history = currentChat ? currentChat.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })) : [];
      
      // Add user message to history
      history.push({
        role: 'user',
        content: message
      });
      
      // Send the message
      const response = await sendChatMessage({
        model_id: selectedModel.id,
        provider: selectedModel.provider || 'ollama',
        messages: history,
        stream: options.streaming !== undefined ? options.streaming : true,
        system_prompt: options.systemPrompt || '',
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      }, (chunk) => {
        // Update the assistant message with the streamed content
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === currentChatId 
              ? {
                  ...chat,
                  messages: chat.messages.map(msg => 
                    msg.id === assistantMessage.id
                      ? { ...msg, content: msg.content + chunk }
                      : msg
                  ),
                }
              : chat
          )
        );
      });
      
      // If not streaming, update with the full response
      if (!options.streaming) {
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === currentChatId 
              ? {
                  ...chat,
                  messages: chat.messages.map(msg => 
                    msg.id === assistantMessage.id
                      ? { ...msg, content: response.content }
                      : msg
                  ),
                }
              : chat
          )
        );
      }
      
      logger.info('useChat', 'Received response', { 
        modelId: selectedModel.id, 
        chatId: currentChatId,
        responseLength: response.content.length
      });
      
      return response;
    } catch (err) {
      // Remove the assistant message on error
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === currentChatId 
            ? {
                ...chat,
                messages: chat.messages.filter(msg => msg.id !== assistantMessage.id),
              }
            : chat
        )
      );
      
      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);
      logger.error('useChat', 'Failed to send message', err);
      return Promise.reject(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel, currentChatId, getCurrentChat, createNewChat]);
  
  /**
   * Clear the current chat history
   */
  const clearCurrentChat = useCallback(() => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === currentChatId 
          ? {
              ...chat,
              messages: [],
              updatedAt: new Date().toISOString(),
            }
          : chat
      )
    );
    logger.info('useChat', 'Cleared current chat', { id: currentChatId });
  }, [currentChatId]);
  
  return {
    chats,
    currentChatId,
    currentChat: getCurrentChat(),
    isLoading,
    error,
    createNewChat,
    deleteChat,
    switchChat,
    updateChatTitle,
    sendMessage,
    clearCurrentChat,
  };
} 