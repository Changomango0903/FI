import React from 'react';
import PropTypes from 'prop-types';

/**
 * Spinner component for indicating loading states
 * @param {Object} props - Component props
 * @param {string} props.size - Spinner size (small, medium, large)
 * @param {string} props.color - Spinner color
 * @param {string} props.className - Additional CSS class
 * @param {string} props.message - Optional loading message
 */
const Spinner = ({
  size = 'medium',
  color = 'primary',
  className = '',
  message
}) => {
  // Map sizes to pixel values
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '36px'
  };

  // Map colors to CSS variables
  const colorMap = {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    white: 'var(--color-white)',
    dark: 'var(--color-text-dark)'
  };

  // Get actual size value
  const actualSize = sizeMap[size] || size;
  // Get actual color value
  const actualColor = colorMap[color] || color;

  return (
    <div className={`spinner-container ${className}`} role="status">
      <div 
        className="spinner" 
        style={{ 
          width: actualSize, 
          height: actualSize,
          borderColor: `${actualColor}40`,
          borderTopColor: actualColor
        }}
      />
      
      {message && (
        <p className="spinner-message">{message}</p>
      )}
      
      <span className="sr-only">Loading...</span>
    </div>
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOfType([
    PropTypes.oneOf(['small', 'medium', 'large']),
    PropTypes.string // For custom sizes like '42px'
  ]),
  color: PropTypes.oneOfType([
    PropTypes.oneOf(['primary', 'secondary', 'white', 'dark']),
    PropTypes.string // For custom colors like '#ff0000'
  ]),
  className: PropTypes.string,
  message: PropTypes.string
};

export default Spinner; 