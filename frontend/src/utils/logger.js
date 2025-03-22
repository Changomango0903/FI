/**
 * Application logger with improved formatting and log levels
 */

// Log levels in order of verbosity
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Current log level - can be changed at runtime
let currentLogLevel = LOG_LEVELS.INFO;

// Whether to include timestamps in logs
let includeTimestamp = true;

/**
 * Set the application log level
 * @param {number} level - Log level from LOG_LEVELS
 */
export function setLogLevel(level) {
  if (Object.values(LOG_LEVELS).includes(level)) {
    currentLogLevel = level;
    info('Logger', `Log level set to ${Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level)}`);
  } else {
    warn('Logger', `Invalid log level: ${level}`);
  }
}

/**
 * Enable or disable timestamps in logs
 * @param {boolean} enabled - Whether to include timestamps
 */
export function setTimestamps(enabled) {
  includeTimestamp = enabled;
}

/**
 * Format a log message with module name and optional timestamp
 * @param {string} module - Module or component name
 * @param {string} message - Log message
 * @returns {string} - Formatted log message
 */
function formatMessage(module, message) {
  const timestamp = includeTimestamp ? `[${new Date().toISOString()}] ` : '';
  return `${timestamp}[${module}] ${message}`;
}

/**
 * Log a debug message
 * @param {string} module - Module or component name
 * @param {string} message - Log message
 * @param {any} data - Optional data to log
 */
export function debug(module, message, data) {
  if (currentLogLevel <= LOG_LEVELS.DEBUG) {
    if (data !== undefined) {
      console.debug(formatMessage(module, message), data);
    } else {
      console.debug(formatMessage(module, message));
    }
  }
}

/**
 * Log an info message
 * @param {string} module - Module or component name
 * @param {string} message - Log message
 * @param {any} data - Optional data to log
 */
export function info(module, message, data) {
  if (currentLogLevel <= LOG_LEVELS.INFO) {
    if (data !== undefined) {
      console.info(formatMessage(module, message), data);
    } else {
      console.info(formatMessage(module, message));
    }
  }
}

/**
 * Log a warning message
 * @param {string} module - Module or component name
 * @param {string} message - Log message
 * @param {any} data - Optional data to log
 */
export function warn(module, message, data) {
  if (currentLogLevel <= LOG_LEVELS.WARN) {
    if (data !== undefined) {
      console.warn(formatMessage(module, message), data);
    } else {
      console.warn(formatMessage(module, message));
    }
  }
}

/**
 * Log an error message
 * @param {string} module - Module or component name
 * @param {string} message - Log message
 * @param {any} data - Optional data to log
 */
export function error(module, message, data) {
  if (currentLogLevel <= LOG_LEVELS.ERROR) {
    if (data !== undefined) {
      console.error(formatMessage(module, message), data);
    } else {
      console.error(formatMessage(module, message));
    }
  }
}

// Default export with all methods for convenience
const logger = {
  debug,
  info,
  warn,
  error,
  setLogLevel,
  setTimestamps,
  LOG_LEVELS,
};

export default logger; 