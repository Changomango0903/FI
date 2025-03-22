import React from 'react';
import PropTypes from 'prop-types';
import Button from '../ui/Button';
import logger from '../../utils/logger';

/**
 * Reusable alert dialog for confirmations
 */
const AlertDialog = ({ 
  title, 
  message, 
  confirmLabel = 'Confirm', 
  cancelLabel = 'Cancel', 
  onConfirm, 
  onCancel,
  isDestructive = false,
  className = '',
}) => {
  const handleConfirm = () => {
    logger.debug('AlertDialog', 'Confirm action', { title });
    onConfirm();
  };
  
  const handleCancel = () => {
    logger.debug('AlertDialog', 'Cancel action', { title });
    onCancel();
  };
  
  // Apply classes
  const dialogClass = `alert-dialog ${isDestructive ? 'alert-dialog--destructive' : ''} ${className}`;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className={dialogClass} onClick={e => e.stopPropagation()}>
        {title && <h3 className="alert-dialog__title">{title}</h3>}
        
        {message && <div className="alert-dialog__message">{message}</div>}
        
        <div className="alert-dialog__buttons">
          <Button 
            variant="ghost"
            onClick={handleCancel}
            className="alert-dialog__button alert-dialog__button--cancel"
          >
            {cancelLabel}
          </Button>
          
          <Button 
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={handleConfirm}
            className="alert-dialog__button alert-dialog__button--confirm"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

AlertDialog.propTypes = {
  title: PropTypes.string,
  message: PropTypes.node,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isDestructive: PropTypes.bool,
  className: PropTypes.string,
};

export default AlertDialog; 