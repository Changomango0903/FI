import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../ui/Button';
import logger from '../../utils/logger';

/**
 * Chat message input component with submit functionality
 */
const MessageInput = ({
  onSubmit,
  onStop,
  isGenerating = false,
  disabled = false,
  placeholder = 'Send a message...',
  autoFocus = true,
  modelInfo = null,
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  
  // Focus the input when the component mounts if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!input.trim() || disabled || isGenerating) {
      return;
    }
    
    logger.debug('MessageInput', 'Message submitted', { length: input.length });
    onSubmit(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <form className="message-input-form" onSubmit={handleSubmit}>
      <div className="input-container">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isGenerating}
          className="message-input"
          rows={1}
        />
        
        {isGenerating ? (
          <Button
            type="button"
            variant="danger"
            onClick={onStop}
            icon="■"
            ariaLabel="Stop generation"
            title="Stop generation"
          />
        ) : (
          <Button
            type="submit"
            variant="primary"
            disabled={!input.trim() || disabled}
            icon="↑"
            ariaLabel="Send message"
            title="Send message"
          />
        )}
      </div>
      
      {/* Model info bar */}
      {modelInfo && (
        <div className="model-info-bar">
          {modelInfo.name && (
            <div className="model-info-item">
              <span className="info-label">Model:</span>
              <span className="model-badge">{modelInfo.name}</span>
            </div>
          )}
          
          {modelInfo.temperature !== undefined && (
            <div className="model-info-item">
              <span className="info-label">Temperature:</span>
              <span className="info-value">{modelInfo.temperature}</span>
            </div>
          )}
          
          {modelInfo.provider && (
            <div className="model-info-item">
              <span className="info-label">Provider:</span>
              <span className="info-value">{modelInfo.provider}</span>
            </div>
          )}
        </div>
      )}
      
      {disabled && !modelInfo && (
        <div className="no-model-warning">
          Please select a model to start chatting.
        </div>
      )}
    </form>
  );
};

MessageInput.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onStop: PropTypes.func,
  isGenerating: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  autoFocus: PropTypes.bool,
  modelInfo: PropTypes.shape({
    name: PropTypes.string,
    temperature: PropTypes.number,
    provider: PropTypes.string,
  }),
};

export default MessageInput; 