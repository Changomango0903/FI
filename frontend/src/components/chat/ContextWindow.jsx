import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useModelContext } from '../../context';
import logger from '../../utils/logger';
import { getModelContextLength } from '../../utils/models';
import { API_CONFIG } from '../../config';

/**
 * Component to display context window usage information
 */
const ContextWindow = () => {
  const { currentChat, selectedModel } = useModelContext();
  
  const [contextInfo, setContextInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Only fetch context window info if we have a chat and model
    if (currentChat?.messages?.length > 0 && selectedModel) {
      fetchContextWindowInfo();
    } else {
      setContextInfo(null);
    }
  }, [currentChat, selectedModel]);
  
  /**
   * Fetch context window information from the API
   */
  const fetchContextWindowInfo = async () => {
    if (!currentChat?.messages || !selectedModel) return;
    
    setLoading(true);
    setError(null);
    
    try {
      logger.debug('ContextWindow', 'Fetching context window info', { 
        model: selectedModel.id,
        provider: selectedModel.provider,
        messageCount: currentChat.messages.length
      });
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/context-window`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: selectedModel.provider,
          model_id: selectedModel.id,
          messages: currentChat.messages
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      setContextInfo(data);
      
      logger.debug('ContextWindow', 'Context window info received', { 
        tokenCount: data.token_count,
        usagePercentage: data.usage_percentage
      });
    } catch (err) {
      logger.error('ContextWindow', 'Failed to fetch context window info', err);
      setError(err.message || 'Failed to fetch context window information');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <ContextLoading />;
  }
  
  if (error) {
    return <ContextError error={error} />;
  }
  
  if (!contextInfo) {
    return null;
  }
  
  return <ContextDisplay contextInfo={contextInfo} />;
};

/**
 * Loading state component
 */
const ContextLoading = () => (
  <div className="context-window context-window--loading">
    <div className="context-window__loading-indicator">Loading context info...</div>
  </div>
);

/**
 * Error state component
 */
const ContextError = ({ error }) => (
  <div className="context-window context-window--error">
    <div className="context-window__error-message">
      Error: {error}
    </div>
  </div>
);

/**
 * Context window display with progress bar and details
 */
const ContextDisplay = ({ contextInfo }) => {
  // Calculate visual elements for the progress bar
  const progressWidth = `${Math.min(contextInfo.usage_percentage, 100)}%`;
  const progressColor = contextInfo.status === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)';
  const isWarning = contextInfo.status === 'warning';
  
  return (
    <div className="context-window">
      <div className="context-window__header">
        <h4 className="context-window__title">Context Window</h4>
        <span className={`context-window__status context-window__status--${contextInfo.status}`}>
          {isWarning ? 'High Usage' : 'OK'}
        </span>
      </div>
      
      <div className="context-window__progress">
        <div 
          className="context-window__progress-bar"
          style={{ width: progressWidth, backgroundColor: progressColor }}
          aria-valuemax="100"
          aria-valuemin="0"
          aria-valuenow={contextInfo.usage_percentage}
          role="progressbar"
        ></div>
        <div className="context-window__labels">
          <span className="context-window__token-count">{contextInfo.token_count} tokens</span>
          <span className="context-window__percentage">{contextInfo.usage_percentage}%</span>
        </div>
      </div>
      
      <div className="context-window__details">
        <div className="context-window__total">
          <span className="context-window__label">Total Messages:</span>
          <span className="context-window__value">
            {Object.values(contextInfo.role_breakdown).reduce((sum, role) => sum + role.count, 0)}
          </span>
        </div>
        
        <div className="context-window__breakdown">
          {Object.entries(contextInfo.role_breakdown).map(([role, data]) => (
            <div key={role} className="context-window__role">
              <span className="context-window__role-name">{role}:</span>
              <span className="context-window__role-count">{data.count} messages</span>
              <span className="context-window__role-tokens">{data.tokens} tokens</span>
            </div>
          ))}
        </div>
      </div>
      
      {isWarning && (
        <div className="context-window__warning">
          Context window usage is high. Consider starting a new chat to avoid truncation.
        </div>
      )}
    </div>
  );
};

ContextError.propTypes = {
  error: PropTypes.string.isRequired,
};

ContextDisplay.propTypes = {
  contextInfo: PropTypes.shape({
    token_count: PropTypes.number.isRequired,
    usage_percentage: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    role_breakdown: PropTypes.object.isRequired,
  }).isRequired,
};

export default ContextWindow; 