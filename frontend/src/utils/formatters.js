/**
 * Utility functions for formatting values
 */

/**
 * Format a date object or string to a readable date and time
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDateTime(date, options = {}) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions = { 
    dateStyle: 'medium', 
    timeStyle: 'short'
  };
  
  return new Intl.DateTimeFormat(
    navigator.language, 
    { ...defaultOptions, ...options }
  ).format(dateObj);
}

/**
 * Format a date to show relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now - dateObj;
  
  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);
  
  // Less than a minute
  if (diffSec < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (diffSec < 3600) {
    const minutes = Math.floor(diffSec / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a week
  if (diffSec < 604800) {
    const days = Math.floor(diffSec / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  // Default to formatted date for older dates
  return formatDateTime(dateObj, { dateStyle: 'medium' });
}

/**
 * Format a number with commas as thousands separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

/**
 * Format a number of bytes to a human-readable size
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format a token count for display (e.g., "4K" instead of "4000")
 * @param {number} tokens - Number of tokens
 * @returns {string} Formatted token count
 */
export function formatTokenCount(tokens) {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  
  return tokens.toString();
}

/**
 * Truncate a string to a maximum length with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncateString(str, maxLength) {
  if (!str || str.length <= maxLength) {
    return str;
  }
  
  return `${str.slice(0, maxLength - 3)}...`;
} 