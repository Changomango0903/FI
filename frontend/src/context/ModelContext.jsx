import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { fetchModels, sendChatMessage, streamChatMessage } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

const ModelContext = createContext();

export const useModelContext = () => useContext(ModelContext);

export const ModelProvider = ({ children }) => {
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // Model parameters
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [topP, setTopP] = useState(0.9);
  const [streaming, setStreaming] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');

  // Chat state
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  
  // WebSocket reference
  const wsRef = useRef(null);

  // DEFINE initializeWebSocket FIRST, before it's used in other functions
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
  
  // Load settings from localStorage
  useEffect(() => {
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
  }, []);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('fi-chats', JSON.stringify(chats));
    }
  }, [chats]);
  
  useEffect(() => {
    if (currentChat) {
      localStorage.setItem('fi-current-chat', currentChat.id);
    }
  }, [currentChat]);
  
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('fi-selected-model', JSON.stringify(selectedModel));
    }
  }, [selectedModel]);
  
  useEffect(() => {
    localStorage.setItem('fi-temperature', temperature.toString());
  }, [temperature]);
  
  useEffect(() => {
    localStorage.setItem('fi-max-tokens', maxTokens.toString());
  }, [maxTokens]);
  
  useEffect(() => {
    localStorage.setItem('fi-top-p', topP.toString());
  }, [topP]);
  
  useEffect(() => {
    localStorage.setItem('fi-streaming', streaming.toString());
  }, [streaming]);
  
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
  }, [chats, currentChat]);
  
  const updateChatTitle = useCallback((chatId, title) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId ? { ...chat, title } : chat
      )
    );
    
    if (currentChat?.id === chatId) {
      setCurrentChat(prev => ({ ...prev, title }));
    }
  }, [currentChat]);
  
  const addMessage = useCallback(async (message) => {
    if (!currentChat) return;
    
    // Create a new messages array with the new message
    const updatedMessages = [...currentChat.messages, message];
    console.log("Adding message, updated messages will be:", updatedMessages);
    
    // Update UI state
    setCurrentChat(prev => ({
      ...prev,
      messages: updatedMessages
    }));
    
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === currentChat.id ? {
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
        // Add system prompt if provided
        let messagesWithSystem = [...updatedMessages];
        if (systemPrompt.trim()) {
          messagesWithSystem = [
            { role: 'system', content: systemPrompt },
            ...updatedMessages
          ];
        }
        
        if (streaming) {
          // Ensure WebSocket is connected
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.log("Initializing WebSocket connection...");
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
                wsRef.current.removeEventListener('message', responseHandler);
                setIsGenerating(false);
              } else if (data.done) {
                console.log(`[${messageId}] Stream complete`);
                wsRef.current.removeEventListener('message', responseHandler);
                setIsGenerating(false);
              } else if (data.token) {
                fullResponse += data.token;
                
                // Update the UI with the streaming response
                setCurrentChat(prev => {
                  // Make sure we're updating the right conversation
                  if (!prev || prev.id !== currentChat.id) return prev;
                  
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
                    if (chat.id !== currentChat.id) return chat;
                    
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
            messages: messagesWithSystem,
            temperature: temperature,
            max_tokens: maxTokens,
            top_p: topP,
            messageId: messageId
          }));
        } else {
          // Use non-streaming API
          const response = await sendChatMessage({
            provider: selectedModel.provider,
            model_id: selectedModel.id,
            messages: messagesWithSystem,
            temperature: temperature,
            max_tokens: maxTokens,
            top_p: topP
          });
          
          // Add assistant response to the chat
          const assistantMessage = {
            role: 'assistant',
            content: response.response
          };
          
          setCurrentChat(prev => ({
            ...prev,
            messages: [...prev.messages, assistantMessage]
          }));
          
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === currentChat.id ? {
                ...chat, 
                messages: [...chat.messages, assistantMessage]
              } : chat
            )
          );
          
          setIsGenerating(false);
        }
      } catch (err) {
        console.error("Error in message handling:", err);
        setIsGenerating(false);
      }
    }
  }, [currentChat, selectedModel, temperature, maxTokens, topP, streaming, systemPrompt, initializeWebSocket]);
  
  const stopGeneration = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsGenerating(false);
  }, []);
  
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

    // Model parameters
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    topP,
    setTopP,
    streaming,
    setStreaming,
    systemPrompt,
    setSystemPrompt
  };
  
  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};