import React from 'react';
import { useThemeContext } from '../../context';
import { logger } from '../../utils';

/**
 * Theme toggle component for switching between light and dark mode
 */
const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useThemeContext();

  const handleToggle = () => {
    logger.debug('ThemeToggle', `Toggling theme to ${isDarkMode ? 'light' : 'dark'} mode`);
    toggleTheme();
  };

  return (
    <button
      className={`theme-toggle ${isDarkMode ? 'theme-toggle--dark' : 'theme-toggle--light'}`}
      onClick={handleToggle}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle__icon-container">
        {isDarkMode ? (
          <span className="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">
            🌙
          </span>
        ) : (
          <span className="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">
            ☀️
          </span>
        )}
      </div>
    </button>
  );
};

export default ThemeToggle; 