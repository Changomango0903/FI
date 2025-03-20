import React from 'react';

const AlertDialog = ({ 
  title, 
  message, 
  confirmLabel = 'Delete', 
  cancelLabel = 'Cancel', 
  onConfirm, 
  onCancel,
  isDestructive = true
}) => {
  return (
    <div className="modal-overlay">
      <div className="alert-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="alert-dialog-buttons">
          <button 
            className="alert-dialog-cancel" 
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button 
            className={`alert-dialog-confirm ${!isDestructive ? 'alert-dialog-confirm-safe' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;