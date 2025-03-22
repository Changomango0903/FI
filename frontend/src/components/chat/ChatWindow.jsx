import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useModelContext } from '../../context';
import Message from './Message';
import MessageInput from './MessageInput';
import ContextWindow from './ContextWindow';
import Button from '../ui/Button';
import logger from '../../utils/logger';

/**
 * Main chat window component
 */
const ChatWindow = ({ 
  onNavigateToProject, 
  onNavigateToChat,
  currentView,
  toggleSettings 
}) => {
  const { 
    currentChat, 
    selectedModel, 
    sendMessage,
    isLoading: isGenerating,
    stopGeneration,
    temperature
  } = useModelContext();
  
  const [showContextInfo, setShowContextInfo] = useState(false);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [currentChat?.messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async (message) => {
    if (!message.trim() || !selectedModel || isGenerating) return;
    
    try {
      logger.debug('ChatWindow', 'Sending message', { length: message.length });
      await sendMessage(message);
      logger.debug('ChatWindow', 'Message sent successfully');
    } catch (error) {
      logger.error('ChatWindow', 'Failed to send message', error);
    }
  };
  
  const toggleContextInfo = () => {
    setShowContextInfo(prevState => !prevState);
    logger.debug('ChatWindow', `Context info toggled ${!showContextInfo ? 'on' : 'off'}`);
  };
  
  // If no chat is selected, show welcome screen
  if (!currentChat) {
    return <WelcomeScreen onNavigateToChat={onNavigateToChat} />;
  }
  
  return (
    <div className="chat-window">
      <ChatHeader 
        currentChat={currentChat}
        selectedModel={selectedModel}
        showContextInfo={showContextInfo}
        onToggleContextInfo={toggleContextInfo}
        onNavigateToProject={onNavigateToProject}
        toggleSettings={toggleSettings}
      />
      
      {/* Show context window information if enabled */}
      {showContextInfo && selectedModel && currentChat.messages.length > 0 && (
        <ContextWindow />
      )}
      
      <div className="messages-container glass">
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
              timestamp={message.timestamp}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput
        onSubmit={handleSendMessage}
        onStop={stopGeneration}
        isGenerating={isGenerating}
        disabled={!selectedModel}
        modelInfo={selectedModel ? {
          name: selectedModel.name,
          temperature,
          provider: selectedModel.provider
        } : null}
      />
    </div>
  );
};

/**
 * Welcome screen shown when no chat is selected
 */
const WelcomeScreen = ({ onNavigateToChat }) => {
  const { createNewChat } = useModelContext();
  
  const handleCreateNewChat = () => {
    const newChat = createNewChat();
    if (onNavigateToChat && newChat) {
      onNavigateToChat(newChat.id);
    }
  };
  
  return (
    <div className="empty-chat">
      <div className="welcome-container">
        <img src="/logo.svg" alt="FI Logo" className="welcome-logo" />
        <h1>Welcome to FI</h1>
        <p>Your fast intelligence companion</p>
        
        <div className="welcome-actions">
          <Button 
            variant="primary"
            size="large"
            onClick={handleCreateNewChat}
            icon={<span>+</span>}
          >
            Start New Chat
          </Button>
          
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span className="feature-text">Fast & efficient</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <span className="feature-text">Multiple models</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span className="feature-text">Streaming responses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Chat header component
 */
const ChatHeader = ({ 
  currentChat, 
  selectedModel, 
  showContextInfo, 
  onToggleContextInfo,
  onNavigateToProject,
  toggleSettings
}) => {
  return (
    <div className="chat-header glass">
      <div className="chat-info">
        <h2>{currentChat.title || `Chat ${currentChat.id.substr(0, 8)}`}</h2>
        
        {/* Project information */}
        {currentChat.projectId && (
          <div 
            className="project-link"
            onClick={() => onNavigateToProject && onNavigateToProject(currentChat.projectId)}
          >
            <span className="project-icon">📂</span>
            <span>{currentChat.projectName || 'View Project'}</span>
          </div>
        )}
      </div>
      
      <div className="chat-actions">
        {selectedModel && (
          <div className="model-badge">
            <span className="model-icon">
              {selectedModel.provider === 'ollama' ? '🦙' : '🤖'}
            </span>
            <span className="model-name">{selectedModel.name}</span>
          </div>
        )}
        
        <Button
          variant="default"
          size="small"
          onClick={onToggleContextInfo}
          title={showContextInfo ? "Hide context info" : "Show context info"}
        >
          {showContextInfo ? "Hide Context" : "Show Context"}
        </Button>
        
        <Button
          variant="ghost"
          size="small"
          onClick={toggleSettings}
          icon={<span>⚙️</span>}
          title="Open settings"
        >
          Settings
        </Button>
      </div>
    </div>
  );
};

ChatWindow.propTypes = {
  onNavigateToProject: PropTypes.func,
  onNavigateToChat: PropTypes.func,
  currentView: PropTypes.string,
  toggleSettings: PropTypes.func
};

WelcomeScreen.propTypes = {
  onNavigateToChat: PropTypes.func
};

ChatHeader.propTypes = {
  currentChat: PropTypes.object.isRequired,
  selectedModel: PropTypes.object,
  showContextInfo: PropTypes.bool.isRequired,
  onToggleContextInfo: PropTypes.func.isRequired,
  onNavigateToProject: PropTypes.func,
  toggleSettings: PropTypes.func
};

export default ChatWindow; 