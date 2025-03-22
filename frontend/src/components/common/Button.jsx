import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable Button component with consistent styling
 */
const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  className = '',
  icon,
  iconPosition = 'left',
  title,
  ariaLabel,
  ...props
}) => {
  const baseClass = 'fi-button';
  const variantClass = `${baseClass}--${variant}`;
  const sizeClass = `${baseClass}--${size}`;
  const fullWidthClass = fullWidth ? `${baseClass}--full-width` : '';
  const hasIconClass = icon ? `${baseClass}--has-icon` : '';
  const iconPositionClass = icon ? `${baseClass}--icon-${iconPosition}` : '';
  
  const combinedClassName = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    hasIconClass,
    iconPositionClass,
    disabled ? `${baseClass}--disabled` : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={combinedClassName}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className={`${baseClass}__icon`}>{icon}</span>
      )}
      
      {children && (
        <span className={`${baseClass}__text`}>{children}</span>
      )}
      
      {icon && iconPosition === 'right' && (
        <span className={`${baseClass}__icon`}>{icon}</span>
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger', 'success']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  title: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default Button; 