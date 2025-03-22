import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';

/**
 * Alert dialog component for confirmations and alerts
 * @param {Object} props - Component props
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message
 * @param {string} props.confirmLabel - Text for confirm button
 * @param {string} props.cancelLabel - Text for cancel button
 * @param {Function} props.onConfirm - Callback when confirm is clicked
 * @param {Function} props.onCancel - Callback when cancel is clicked
 * @param {boolean} props.isDestructive - Whether the confirm action is destructive
 */
const AlertDialog = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false
}) => {
  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel, onConfirm]);

  return (
    <div 
      className="alert-dialog-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-message"
    >
      <div 
        className="alert-dialog-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="alert-dialog-header">
          <h3 id="alert-dialog-title">{title}</h3>
        </div>
        
        <div className="alert-dialog-content">
          <p id="alert-dialog-message">{message}</p>
        </div>
        
        <div className="alert-dialog-actions">
          <Button 
            variant="secondary"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </Button>
          
          <Button 
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            type="button"
            autoFocus
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

AlertDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isDestructive: PropTypes.bool
};

export default AlertDialog; 