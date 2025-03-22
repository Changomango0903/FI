/**
 * Utilities for local storage operations
 */

const STORAGE_KEYS = {
  CHATS: 'fi-chats',
  CURRENT_CHAT: 'fi-current-chat',
  SELECTED_MODEL: 'fi-selected-model',
  TEMPERATURE: 'fi-temperature',
  MAX_TOKENS: 'fi-max-tokens',
  TOP_P: 'fi-top-p',
  STREAMING: 'fi-streaming',
  SYSTEM_PROMPT: 'fi-system-prompt',
  SHOW_THINKING: 'fi-show-thinking',
  THEME: 'fi-theme',
  PROJECTS: 'fi-projects',
  PROJECT_CHATS: 'fi-project-chats',
};

/**
 * Save a value to localStorage with proper error handling
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON stringified if not a string)
 * @returns {boolean} - Success status
 */
export function saveToStorage(key, value) {
  try {
    const valueToStore = typeof value === 'string' 
      ? value 
      : JSON.stringify(value);
    
    localStorage.setItem(key, valueToStore);
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Load a value from localStorage with proper error handling
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key not found
 * @param {boolean} parseJson - Whether to parse the value as JSON
 * @returns {any} - The retrieved value or default value
 */
export function loadFromStorage(key, defaultValue = null, parseJson = true) {
  try {
    const value = localStorage.getItem(key);
    
    if (value === null) return defaultValue;
    
    if (parseJson) {
      try {
        return JSON.parse(value);
      } catch (parseError) {
        // If it can't be parsed as JSON but exists, return as string
        return value;
      }
    }
    
    return value;
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Remove an item from localStorage
 * @param {string} key - Storage key to remove
 * @returns {boolean} - Success status
 */
export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Clear all application data from localStorage
 * @returns {boolean} - Success status
 */
export function clearAllAppData() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing app data from localStorage:', error);
    return false;
  }
}

// Export keys constant for use elsewhere
export { STORAGE_KEYS }; 