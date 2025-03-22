import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';
import logger from '../../utils/logger';

/**
 * Component to display the AI's thinking process
 */
const Thinking = ({ content, initialExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  if (!content) return null;
  
  const toggleExpanded = () => {
    logger.debug('Thinking', `Thinking section ${isExpanded ? 'collapsed' : 'expanded'}`);
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className={`thinking ${isExpanded ? 'thinking--expanded' : 'thinking--collapsed'}`}>
      <button 
        className="thinking__toggle" 
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls="thinking-content"
      >
        <span className="thinking__toggle-icon">
          {isExpanded ? '▼' : '►'}
        </span>
        <span className="thinking__toggle-label">
          {isExpanded ? 'Hide thinking process' : 'Show thinking process'}
        </span>
      </button>
      
      {isExpanded && (
        <div 
          id="thinking-content"
          className="thinking__content markdown-content"
        >
          <ReactMarkdown 
            rehypePlugins={[rehypeHighlight]}
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom rendering for code blocks
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <pre className="code-block">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              // Keep line breaks
              p({ children }) {
                return <p style={{ whiteSpace: 'pre-wrap' }}>{children}</p>;
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

Thinking.propTypes = {
  content: PropTypes.string.isRequired,
  initialExpanded: PropTypes.bool,
};

export default Thinking; 