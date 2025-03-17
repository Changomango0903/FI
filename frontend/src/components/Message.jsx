import React from 'react';

const Message = ({ role, content }) => {
  // Simple function to detect code blocks and apply syntax highlighting
  const formatContent = (text) => {
    // Find code blocks with triple backticks
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before the code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      // Add the code block
      parts.push({
        type: 'code',
        content: match[1].trim()
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <pre key={index} className="code-block">
            <code>{part.content}</code>
          </pre>
        );
      } else {
        // Process regular text for line breaks
        return (
          <span key={index}>
            {part.content.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < part.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      }
    });
  };
  
  return (
    <div className={`message ${role}`}>
      <div className="message-avatar">
        {role === 'user' ? '👤' : '🤖'}
      </div>
      <div className="message-content">
        {formatContent(content)}
      </div>
    </div>
  );
};

export default Message;