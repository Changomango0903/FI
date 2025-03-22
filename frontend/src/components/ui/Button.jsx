import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/components/buttons.css';

/**
 * Apple-inspired button component
 */
const Button = ({ 
  children, 
  variant = 'default', 
  size = 'medium',
  fullWidth = false,
  icon = null,
  disabled = false,
  onClick,
  type = 'button',
  title,
  className = ''
}) => {
  const buttonClasses = [
    'fi-button',
    `fi-button--${variant}`,
    `fi-button--${size}`,
    fullWidth ? 'fi-button--full-width' : '',
    icon ? 'fi-button--with-icon' : '',
    disabled ? 'fi-button--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {icon && <span className="fi-button__icon">{icon}</span>}
      {children && <span className="fi-button__text">{children}</span>}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'ghost', 'danger', 'text']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  icon: PropTypes.node,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string
};

export default Button; 