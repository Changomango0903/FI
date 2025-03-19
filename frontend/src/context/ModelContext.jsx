import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { fetchModels, sendChatMessage, streamChatMessage, updateTemperature } from '../services/api';
import { groupModelsByFamily, parseModelInfo } from '../utils/modelUtils';
import { v4 as uuidv4 } from 'uuid';

const ModelContext = createContext();

export const useModelContext = () => useContext(ModelContext);

export const ModelProvider = ({ children }) => {
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const processedModelsRef = useRef(null);

  // Model parameters
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [topP, setTopP] = useState(0.9);
  const [streaming, setStreaming] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  
  // Chat state
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);

  // Store grouped models for family-based selection
  const [modelFamilies, setModelFamilies] = useState([]);
  
  // WebSocket reference
  const wsRef = useRef(null);
  
  // Flag to prevent redundant localStorage updates
  const updatingModelRef = useRef(false);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return Promise.resolve();
    }
    
    console.log("Initializing new WebSocket connection");
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:8000/api/chat/stream`);
      
      ws.onopen = () => {
        console.log("WebSocket connection established");
        wsRef.current = ws;
        resolve();
      };
      
      ws.onclose = (event) => {
        console.log("WebSocket connection closed", event.code, event.reason);
        wsRef.current = null;
        
        // Only attempt reconnection if not intentionally closed
        if (selectedModel && event.code !== 1000) {
          console.log("Attempting to reconnect...");
          setTimeout(() => initializeWebSocket(), 2000);
        }
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };
    });
  }, [selectedModel]);
  
  // Enhanced setTemperature function that updates backend
  const updateTemperatureValue = useCallback(async (newTemperature) => {
    try {
      // Update the local state first for responsive UI
      setTemperature(newTemperature);
      
      // Then update the backend
      console.log(`Updating backend temperature to: ${newTemperature}`);
      await updateTemperature(newTemperature);
      
      // Save to localStorage
      localStorage.setItem('fi-temperature', newTemperature.toString());
      
      return true;
    } catch (error) {
      console.error("Failed to update temperature on backend:", error);
      // Don't revert the UI as it might be confusing - the next request will use whatever
      // temperature the backend actually has
      return false;
    }
  }, []);
  
  // Process models into family groupings whenever availableModels changes
  useEffect(() => {
    if (availableModels && availableModels.length > 0) {
      // Create a hash of the models to detect real changes
      const modelsHash = JSON.stringify(availableModels.map(m => m.id).sort());
      
      // Only update if the models have actually changed
      if (processedModelsRef.current !== modelsHash) {
        processedModelsRef.current = modelsHash;
        
        // Process the models outside of React's rendering cycle
        setTimeout(() => {
          const grouped = groupModelsByFamily(availableModels);
          setModelFamilies(grouped);
        }, 0);
      }
    }
  }, [availableModels]);
  
  // Initial load of settings from localStorage - once only
  useEffect(() => {
    // Load saved chats
    const savedChats = localStorage.getItem('fi-chats');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        setChats(parsedChats);
        
        // Set current chat if available
        const currentChatId = localStorage.getItem('fi-current-chat');
        if (currentChatId) {
          const chat = parsedChats.find(c => c.id === currentChatId);
          if (chat) {
            setCurrentChat(chat);
          }
        }
      } catch (e) {
        console.error('Failed to parse saved chats', e);
      }
    }
    
    // Load model settings
    const savedModel = localStorage.getItem('fi-selected-model');
    if (savedModel) {
      try {
        setSelectedModel(JSON.parse(savedModel));
      } catch (e) {
        console.error('Failed to parse saved model', e);
      }
    }
    
    // Load generation parameters
    const savedTemperature = localStorage.getItem('fi-temperature');
    if (savedTemperature) {
      setTemperature(parseFloat(savedTemperature));
    }
    
    const savedMaxTokens = localStorage.getItem('fi-max-tokens');
    if (savedMaxTokens) {
      setMaxTokens(parseInt(savedMaxTokens));
    }
    
    const savedTopP = localStorage.getItem('fi-top-p');
    if (savedTopP) {
      setTopP(parseFloat(savedTopP));
    }
    
    const savedStreaming = localStorage.getItem('fi-streaming');
    if (savedStreaming !== null) {
      setStreaming(savedStreaming === 'true');
    }
    
    const savedSystemPrompt = localStorage.getItem('fi-system-prompt');
    if (savedSystemPrompt) {
      setSystemPrompt(savedSystemPrompt);
    }
  }, []); // Empty dependency array - run only once

  // Save chats to localStorage when they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('fi-chats', JSON.stringify(chats));
    }
  }, [chats]);
  
  // Save current chat ID to localStorage
  useEffect(() => {
    if (currentChat) {
      localStorage.setItem('fi-current-chat', currentChat.id);
    }
  }, [currentChat?.id]); // Only depend on the ID, not the entire object
  
  // Handle selected model changes - update localStorage and chat references
  useEffect(() => {
    if (selectedModel && !updatingModelRef.current) {
      // Set flag to prevent reentrant updates
      updatingModelRef.current = true;
      
      // Update localStorage
      localStorage.setItem('fi-selected-model', JSON.stringify(selectedModel));
      
      // Update active chat's model reference
      if (currentChat) {
        setCurrentChat(prev => ({
          ...prev,
          model: selectedModel
        }));
        
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === currentChat.id ? {
              ...chat,
              model: selectedModel
            } : chat
          )
        );
      }
      
      // Clear flag after state updates are queued
      setTimeout(() => {
        updatingModelRef.current = false;
      }, 0);
    }
  }, [selectedModel?.id]); // Only depend on the model ID
  
  // Save temperature to localStorage
  useEffect(() => {
    localStorage.setItem('fi-temperature', temperature.toString());
  }, [temperature]);
  
  // Save maxTokens to localStorage
  useEffect(() => {
    localStorage.setItem('fi-max-tokens', maxTokens.toString());
  }, [maxTokens]);
  
  // Save topP to localStorage
  useEffect(() => {
    localStorage.setItem('fi-top-p', topP.toString());
  }, [topP]);
  
  // Save streaming to localStorage
  useEffect(() => {
    localStorage.setItem('fi-streaming', streaming.toString());
  }, [streaming]);
  
  // Save systemPrompt to localStorage
  useEffect(() => {
    localStorage.setItem('fi-system-prompt', systemPrompt);
  }, [systemPrompt]);
  
  const fetchAvailableModels = useCallback(async () => {
    setIsLoadingModels(true);
    setError(null);
    
    try {
      const data = await fetchModels();
      setAvailableModels(data.models);
    } catch (err) {
      setError(err.message || 'Failed to fetch models');
    } finally {
      setIsLoadingModels(false);
    }
  }, []);
  
  const createNewChat = useCallback(() => {
    const newChat = {
      id: uuidv4(),
      title: '',
      model: selectedModel,
      messages: [],
      createdAt: new Date().toISOString()
    };
    
    setChats(prevChats => [newChat, ...prevChats]);
    setCurrentChat(newChat);
    
    // Don't try to generate a response for an empty chat
    // Wait until the user sends the first message
  }, [selectedModel]);
  
  const switchChat = useCallback((chatId) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
    }
  }, [chats]);
  
  const deleteChat = useCallback((chatId) => {
    setChats(prevChats => prevChats.filter(c => c.id !== chatId));
    
    if (currentChat?.id === chatId) {
      const remainingChats = chats.filter(c => c.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChat(remainingChats[0]);
      } else {
        setCurrentChat(null);
      }
    }
  }, [chats, currentChat?.id]);
  
  const updateChatTitle = useCallback((chatId, title) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId ? { ...chat, title } : chat
      )
    );
    
    if (currentChat?.id === chatId) {
      setCurrentChat(prev => ({ ...prev, title }));
    }
  }, [currentChat?.id]);
  
  const addMessage = useCallback(async (message) => {
    if (!currentChat) return;
    
    // Create a new messages array with the new message
    const updatedMessages = [...currentChat.messages, message];
    const chatId = currentChat.id; // Store ID locally for closure
    
    // Update UI state
    setCurrentChat(prev => {
      if (prev?.id !== chatId) return prev;
      return {
        ...prev,
        messages: updatedMessages
      };
    });
    
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId ? {
          ...chat, 
          messages: updatedMessages
        } : chat
      )
    );
    
    // Wait a moment for state to update
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Only generate a response if it's a user message
    if (message.role === 'user' && selectedModel) {
      setIsGenerating(true);
      
      try {
        // Ensure WebSocket is connected
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          await initializeWebSocket();
          
          // Wait for connection to establish
          await new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                clearInterval(checkInterval);
                resolve();
              } else if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
                clearInterval(checkInterval);
                reject(new Error("Failed to establish WebSocket connection"));
              }
            }, 100);
            
            // Set a timeout to prevent waiting forever
            setTimeout(() => {
              clearInterval(checkInterval);
              reject(new Error("WebSocket connection timeout"));
            }, 5000);
          });
        }
        
        // Clear previous response accumulator
        let fullResponse = '';
        
        // Create a unique handler for this specific message
        const messageId = Date.now();
        const responseHandler = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.error) {
              console.error(`[${messageId}] Stream error:`, data.error);
              wsRef.current?.removeEventListener('message', responseHandler);
              setIsGenerating(false);
            } else if (data.done) {
              console.log(`[${messageId}] Stream complete`);
              wsRef.current?.removeEventListener('message', responseHandler);
              setIsGenerating(false);
            } else if (data.token) {
              fullResponse += data.token;
              
              // Update the UI with the streaming response
              setCurrentChat(prev => {
                // Make sure we're updating the right conversation
                if (!prev || prev.id !== chatId) return prev;
                
                const messages = [...prev.messages];
                
                // Check if we already have an assistant response
                if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
                  // Update existing assistant message
                  messages[messages.length - 1] = {
                    ...messages[messages.length - 1],
                    content: fullResponse
                  };
                } else {
                  // Add new assistant message
                  messages.push({
                    role: 'assistant',
                    content: fullResponse
                  });
                }
                
                return {
                  ...prev,
                  messages
                };
              });
              
              // Also update the chats state
              setChats(prevChats => 
                prevChats.map(chat => {
                  if (chat.id !== chatId) return chat;
                  
                  const messages = [...chat.messages];
                  
                  if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
                    // Update existing assistant message
                    messages[messages.length - 1] = {
                      ...messages[messages.length - 1],
                      content: fullResponse
                    };
                  } else {
                    // Add new assistant message
                    messages.push({
                      role: 'assistant',
                      content: fullResponse
                    });
                  }
                  
                  return {
                    ...chat,
                    messages
                  };
                })
              );
            }
          } catch (err) {
            console.error(`[${messageId}] Error parsing WebSocket message:`, err);
          }
        };
        
        // Add the message event listener
        wsRef.current.addEventListener('message', responseHandler);
        
        // Send the request with the full conversation history
        wsRef.current.send(JSON.stringify({
          provider: selectedModel.provider,
          model_id: selectedModel.id,
          messages: updatedMessages,
          temperature: temperature,
          max_tokens: maxTokens,
          messageId: messageId
        }));
        
      } catch (err) {
        console.error("Error in message handling:", err);
        setIsGenerating(false);
      }
    }
  }, [currentChat, selectedModel, temperature, maxTokens, initializeWebSocket]);
  
  const stopGeneration = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsGenerating(false);
  }, []);
  
  // Get the model families information
  const getModelFamilies = useCallback(() => {
    return modelFamilies;
  }, [modelFamilies]);
  
  // Get model info (family and size) for the currently selected model
  const getSelectedModelInfo = useCallback(() => {
    if (!selectedModel) return null;
    return parseModelInfo(selectedModel.id);
  }, [selectedModel?.id]); // Only depend on the ID
  
  const value = {
    availableModels,
    selectedModel,
    setSelectedModel,
    isLoadingModels,
    isGenerating,
    error,
    fetchModels: fetchAvailableModels,
    
    // Chat functions
    chats,
    currentChat,
    createNewChat,
    switchChat,
    deleteChat,
    updateChatTitle,
    addMessage,
    stopGeneration,
  
    // Temperature with enhanced update function
    temperature,
    setTemperature: updateTemperatureValue,
    
    // Other parameters
    maxTokens,
    setMaxTokens,
    topP,
    setTopP,
    streaming,
    setStreaming,
    systemPrompt,
    setSystemPrompt,
    
    // New model family and parameter size functions
    modelFamilies,
    getModelFamilies,
    getSelectedModelInfo
  };
  
  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};