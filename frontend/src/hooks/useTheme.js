import { useState, useCallback, useEffect } from 'react';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/localStorage';
import logger from '../utils/logger';

/**
 * Available themes for the application
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

/**
 * Custom hook for managing theme
 * @returns {Object} - Theme state and updater function
 */
export default function useTheme() {
  const [theme, setTheme] = useState(THEMES.SYSTEM);
  const [effectiveTheme, setEffectiveTheme] = useState(THEMES.LIGHT);
  
  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = loadFromStorage(STORAGE_KEYS.THEME, THEMES.SYSTEM);
    logger.info('useTheme', 'Loaded theme from storage', { theme: savedTheme });
    setTheme(savedTheme);
  }, []);
  
  // Save theme when it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.THEME, theme);
    logger.debug('useTheme', 'Saved theme to storage', { theme });
  }, [theme]);
  
  // Update effective theme based on selected theme and system preference
  useEffect(() => {
    const updateEffectiveTheme = () => {
      if (theme === THEMES.SYSTEM) {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setEffectiveTheme(systemPrefersDark ? THEMES.DARK : THEMES.LIGHT);
        logger.debug('useTheme', 'Applied system theme preference', { 
          systemPrefersDark, 
          effectiveTheme: systemPrefersDark ? THEMES.DARK : THEMES.LIGHT 
        });
      } else {
        setEffectiveTheme(theme);
        logger.debug('useTheme', 'Applied explicit theme', { theme });
      }
    };
    
    updateEffectiveTheme();
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === THEMES.SYSTEM) {
        updateEffectiveTheme();
      }
    };
    
    // Use the appropriate event based on browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme, effectiveTheme]);
  
  /**
   * Update the theme
   * @param {string} newTheme - New theme value from THEMES
   */
  const updateTheme = useCallback((newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setTheme(newTheme);
      logger.info('useTheme', 'Updated theme', { theme: newTheme });
    } else {
      logger.warn('useTheme', 'Invalid theme value', { theme: newTheme });
    }
  }, []);
  
  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = useCallback(() => {
    if (theme === THEMES.LIGHT) {
      updateTheme(THEMES.DARK);
    } else if (theme === THEMES.DARK) {
      updateTheme(THEMES.LIGHT);
    } else {
      // If system, toggle based on the effective theme
      updateTheme(effectiveTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT);
    }
  }, [theme, effectiveTheme, updateTheme]);
  
  return {
    theme,
    effectiveTheme,
    updateTheme,
    toggleTheme,
    THEMES,
  };
} 