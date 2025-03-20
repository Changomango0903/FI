// frontend/src/components/ChatWindow.jsx
import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import { useModelContext } from '../context/ModelContext';
import ModelSelector from './ModelSelector';
import Settings from './Settings';
import ProjectHeader from './ProjectHeader';

const ChatWindow = () => {
  const { 
    currentChat, 
    selectedModel, 
    addMessage, 
    isGenerating, 
    stopGeneration,
    temperature
  } = useModelContext();
  
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);
  
  useEffect(() => {
    // Focus input when currentChat changes
    inputRef.current?.focus();
  }, [currentChat]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedModel || isGenerating) return;
    
    const userMessage = { role: 'user', content: input };
    
    // Wait for state to update before proceeding
    await new Promise(resolve => {
      // Add message to state first
      addMessage(userMessage);
      // Use timeout to ensure state has time to update
      setTimeout(resolve, 10);
    });
    
    setInput('');
  };
  
  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };
  
  // If settings are being shown, display the settings interface
  if (showSettings) {
    return (
      <div className="chat-window">
        <Settings onClose={handleCloseSettings} />
      </div>
    );
  }
  
  // If no chat is selected, show welcome screen
  if (!currentChat) {
    return (
      <div className="empty-chat">
        <div className="welcome-container">
          <img src="/logo.svg" alt="FI Logo" className="welcome-logo" />
          <h1>Welcome to FI</h1>
          <p>Your fast intelligence companion</p>
          
          <div className="start-options">
            <h2>Choose a model to begin</h2>
            <ModelSelector />
          </div>
        </div>
      </div>
    );
  }
  
  // Normal chat interface
  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-info">
          <h2>{currentChat.title || `Chat ${currentChat.id.substr(0, 8)}`}</h2>
          {/* Add project header */}
          <ProjectHeader chatId={currentChat.id} />
          {selectedModel && (
            <div className="model-badge">
              {selectedModel.name}
            </div>
          )}
        </div>
      </div>
      
      <div className="messages-container">
        {currentChat.messages.length === 0 ? (
          <div className="empty-messages">
            <p>Start a conversation by sending a message below.</p>
          </div>
        ) : (
          currentChat.messages.map((message, index) => (
            <Message 
              key={index} 
              role={message.role} 
              content={message.content} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="input-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isGenerating || !selectedModel}
          />
          {isGenerating ? (
            <button 
              type="button" 
              className="stop-button" 
              onClick={stopGeneration}
              aria-label="Stop generation"
            >
              ■
            </button>
          ) : (
            <button 
              type="submit" 
              className="send-button" 
              disabled={!input.trim() || !selectedModel}
              aria-label="Send message"
            >
              ↑
            </button>
          )}
        </div>
        
        {/* Model info bar */}
        <div className="model-info-bar">
          <div className="model-info-item">
            <span className="info-label">Model:</span>
            <span className="model-badge">{selectedModel?.name || 'None'}</span>
          </div>
          <div className="model-info-item">
            <span className="info-label">Temperature:</span>
            <span className="info-value">{temperature}</span>
          </div>
          <div className="model-info-item">
            <span className="info-label">Provider:</span>
            <span className="info-value">{selectedModel?.provider || 'None'}</span>
          </div>
        </div>
        
        {!selectedModel && (
          <div className="no-model-warning">
            Please select a model from the sidebar to start chatting.
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatWindow;