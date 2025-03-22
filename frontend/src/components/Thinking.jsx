import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';

const ThinkingContent = ({ content, isExpanded, onToggle }) => {
  if (!content) return null;
  
  return (
    <div className={`thinking-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="thinking-header" onClick={onToggle}>
        <div className="thinking-icon">
          {isExpanded ? '▼' : '►'}
        </div>
        <div className="thinking-label">
          {isExpanded ? 'Hide thinking process' : 'Show thinking process'}
        </div>
      </div>
      
      {isExpanded && (
        <div className="thinking-body markdown-content">
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

const Message = ({ role, content, thinking, showThinking = true }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  
  const toggleThinking = () => {
    setIsThinkingExpanded(!isThinkingExpanded);
  };
  
  return (
    <div className={`message ${role}`}>
      <div className="message-avatar">
        {role === 'user' ? '👤' : '🤖'}
      </div>
      <div className="message-content-container">
        {thinking && showThinking && (
          <ThinkingContent 
            content={thinking} 
            isExpanded={isThinkingExpanded} 
            onToggle={toggleThinking} 
          />
        )}
        <div className="message-content markdown-content">
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
      </div>
    </div>
  );
};

export default Message;