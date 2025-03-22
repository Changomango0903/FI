// frontend/src/components/ContextWindow.jsx
import React, { useState, useEffect } from 'react';
import { useModelContext } from '../context/ModelContext';

const ContextWindow = () => {
  const { 
    currentChat, 
    selectedModel 
  } = useModelContext();
  
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
  
  const fetchContextWindowInfo = async () => {
    if (!currentChat?.messages || !selectedModel) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/context-window', {
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
    } catch (err) {
      console.error('Error fetching context window info:', err);
      setError(err.message || 'Failed to fetch context window information');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="context-window-info loading">Loading context info...</div>;
  }
  
  if (error) {
    return <div className="context-window-info error">Error: {error}</div>;
  }
  
  if (!contextInfo) {
    return null;
  }
  
  // Calculate visual elements for the progress bar
  const progressWidth = `${Math.min(contextInfo.usage_percentage, 100)}%`;
  const progressColor = contextInfo.status === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)';
  
  return (
    <div className="context-window-info">
      <div className="context-window-header">
        <h4>Context Window</h4>
        <span className={`context-status ${contextInfo.status}`}>
          {contextInfo.status === 'warning' ? 'High Usage' : 'OK'}
        </span>
      </div>
      
      <div className="context-window-progress">
        <div 
          className="context-window-progress-bar"
          style={{ width: progressWidth, backgroundColor: progressColor }}
        ></div>
        <div className="context-window-labels">
          <span>{contextInfo.token_count} tokens</span>
          <span>{contextInfo.usage_percentage}%</span>
        </div>
      </div>
      
      <div className="context-window-details">
        <div className="context-window-detail">
          <span className="detail-label">Total Messages:</span>
          <span className="detail-value">
            {Object.values(contextInfo.role_breakdown).reduce((sum, role) => sum + role.count, 0)}
          </span>
        </div>
        
        <div className="context-window-breakdown">
          {Object.entries(contextInfo.role_breakdown).map(([role, data]) => (
            <div key={role} className="role-breakdown">
              <span className="role-name">{role}:</span>
              <span className="role-count">{data.count} messages</span>
              <span className="role-tokens">{data.tokens} tokens</span>
            </div>
          ))}
        </div>
      </div>
      
      {contextInfo.status === 'warning' && (
        <div className="context-window-warning">
          Context window usage is high. Consider starting a new chat to avoid truncation.
        </div>
      )}
    </div>
  );
};

export default ContextWindow;