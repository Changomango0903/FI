import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import '../../styles/components/messages.css';

/**
 * Component for displaying a chat message with Apple-like design
 */
const Message = ({ role, content, timestamp }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const formattedTime = timestamp 
    ? format(new Date(timestamp), 'h:mm a')
    : format(new Date(), 'h:mm a');
    
  // Format role for display
  const displayRole = role === 'user' ? 'You' : 'Assistant';

  // Render the message content with markdown support
  const renderContent = () => {
    return (
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="code-block">
                <div className="code-header">
                  <span className="code-language">{match[1]}</span>
                  <button 
                    className="copy-code-button"
                    onClick={() => {
                      navigator.clipboard.writeText(children[0])
                        .then(() => alert('Code copied to clipboard!'))
                        .catch(err => console.error('Could not copy code: ', err));
                    }}
                  >
                    Copy
                  </button>
                </div>
                <pre className="code-content">
                  <code {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div 
      className={`message ${role} animate-in`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="message-header">
        <span className="message-role">{displayRole}</span>
        <span className={`message-time ${isHovered ? 'visible' : ''}`}>
          {formattedTime}
        </span>
      </div>
      
      <div className="message-content">
        {renderContent()}
      </div>
      
      {role === 'assistant' && isHovered && (
        <div className="message-actions">
          <button className="message-action-button" title="Copy message">
            <span className="message-action-icon">📋</span>
          </button>
          <button className="message-action-button" title="Regenerate response">
            <span className="message-action-icon">🔄</span>
          </button>
        </div>
      )}
    </div>
  );
};

Message.propTypes = {
  role: PropTypes.oneOf(['user', 'assistant', 'system']).isRequired,
  content: PropTypes.string.isRequired,
  timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
};

export default Message; 