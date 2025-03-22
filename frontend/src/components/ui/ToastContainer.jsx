import React, { useState, useCallback, useEffect } from 'react';
import Toast from './Toast';
import { logger } from '../../utils';

/**
 * Toast notification container
 * Manages multiple toast notifications
 */
const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  
  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    logger.debug('ToastContainer', `Removed toast ${id}`);
  }, []);
  
  // Add a new toast notification
  const addToast = useCallback(({ type, title, message, duration }) => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const newToast = {
      id,
      type,
      title,
      message,
      duration
    };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);
    logger.debug('ToastContainer', `Added new toast ${id}`, { type, title });
    
    return id;
  }, []);
  
  // Expose methods to global window object for use anywhere in the app
  useEffect(() => {
    window.toast = {
      success: (title, message, duration) => addToast({ type: 'success', title, message, duration }),
      error: (title, message, duration) => addToast({ type: 'error', title, message, duration }),
      warning: (title, message, duration) => addToast({ type: 'warning', title, message, duration }),
      info: (title, message, duration) => addToast({ type: 'info', title, message, duration }),
    };
    
    logger.info('ToastContainer', 'Toast service initialized');
    
    return () => {
      delete window.toast;
    };
  }, [addToast]);
  
  if (toasts.length === 0) {
    return null;
  }
  
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer; 