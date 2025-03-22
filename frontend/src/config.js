/**
 * Application configuration
 */

// API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  TIMEOUT: 30000, // 30 seconds
};

// Chat configuration
export const CHAT_CONFIG = {
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 1000,
  DEFAULT_TOP_P: 0.95,
  DEFAULT_STREAMING: true,
  DEFAULT_SYSTEM_PROMPT: '',
};

// Reasoning model identification
export const REASONING_MODEL_KEYWORDS = [
  'deepseek',
  'qwen',
  'mistral',
  'mixtral',
  'yi',
  'claude',
  'llama',
  'openai',
  'anthropic',
  'gpt',
  'r1'
];

// Application settings
export const APP_CONFIG = {
  APP_NAME: 'Fast Intelligence',
  APP_VERSION: '1.0.0',
  DEFAULT_THEME: 'system',
  MOBILE_BREAKPOINT: 768,
}; 