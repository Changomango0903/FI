import React from 'react';
import PropTypes from 'prop-types';
import { useThemeContext } from '../../context';
import logger from '../../utils/logger';

/**
 * Theme toggle component for switching between light and dark mode
 */
const ThemeToggle = ({
  showText = false,
  size = 'medium',
  className = '',
}) => {
  const { theme, effectiveTheme, toggleTheme, THEMES } = useThemeContext();
  const isDarkMode = effectiveTheme === THEMES.DARK;
  
  const handleToggle = () => {
    logger.debug('ThemeToggle', `Toggling theme from ${effectiveTheme} to ${isDarkMode ? THEMES.LIGHT : THEMES.DARK}`);
    toggleTheme();
  };
  
  // Determine component size
  const iconSize = {
    small: 16,
    medium: 20,
    large: 24
  }[size] || 20;
  
  // Generate class names
  const classes = [
    'theme-toggle',
    `theme-toggle--${size}`,
    isDarkMode ? 'theme-toggle--dark' : 'theme-toggle--light',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={classes}
      onClick={handleToggle}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        // Sun icon for light mode
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // Moon icon for dark mode
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      )}
      
      {showText && (
        <span className="theme-toggle__text">
          {isDarkMode ? "Light mode" : "Dark mode"}
        </span>
      )}
    </button>
  );
};

ThemeToggle.propTypes = {
  showText: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string,
};

export default ThemeToggle;