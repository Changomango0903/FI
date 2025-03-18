import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';

const Message = ({ role, content }) => {
  return (
    <div className={`message ${role}`}>
      <div className="message-avatar">
        {role === 'user' ? '👤' : '🤖'}
      </div>
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
  );
};

export default Message;