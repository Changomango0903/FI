import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { logger } from '../../utils';

/**
 * Toast notification component
 * @param {Object} props - Component props
 * @param {string} props.id - Unique ID for the toast
 * @param {string} props.type - Toast type (success, error, warning, info)
 * @param {string} props.title - Toast title
 * @param {string} props.message - Toast message content
 * @param {number} props.duration - Duration to show toast in ms
 * @param {Function} props.onClose - Function to call when toast is closed
 */
const Toast = ({ 
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  
  // Handle close click
  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };
  
  // Auto close after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    
    // Update progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress < 0 ? 0 : newProgress;
      });
    }, 100);
    
    logger.debug('Toast', `Toast ${id} will auto-close in ${duration}ms`);
    
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, id]);
  
  // Get icon based on type
  const getIcon = () => {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };
  
  return (
    <div className={`toast toast--${type} ${exiting ? 'toast--exiting' : ''}`}>
      <div className="toast__icon">{getIcon()}</div>
      
      <div className="toast__content">
        {title && <div className="toast__title">{title}</div>}
        {message && <div className="toast__message">{message}</div>}
      </div>
      
      <button 
        className="toast__close" 
        onClick={handleClose}
        aria-label="Close notification"
      >
        ×
      </button>
      
      <div 
        className="toast__progress" 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

Toast.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  title: PropTypes.string,
  message: PropTypes.string,
  duration: PropTypes.number,
  onClose: PropTypes.func.isRequired
};

export default Toast; 