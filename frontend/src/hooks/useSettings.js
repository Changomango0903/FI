import { useState, useCallback, useEffect } from 'react';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/localStorage';
import logger from '../utils/logger';

/**
 * Custom hook for managing application settings
 * @returns {Object} - Settings state and methods
 */
export default function useSettings() {
  // Model generation settings
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [topP, setTopP] = useState(0.95);
  const [streaming, setStreaming] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showThinking, setShowThinking] = useState(false);
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTemperature = loadFromStorage(STORAGE_KEYS.TEMPERATURE, 0.7);
    const savedMaxTokens = loadFromStorage(STORAGE_KEYS.MAX_TOKENS, 1000);
    const savedTopP = loadFromStorage(STORAGE_KEYS.TOP_P, 0.95);
    const savedStreaming = loadFromStorage(STORAGE_KEYS.STREAMING, true);
    const savedSystemPrompt = loadFromStorage(STORAGE_KEYS.SYSTEM_PROMPT, '');
    const savedShowThinking = loadFromStorage(STORAGE_KEYS.SHOW_THINKING, false);
    
    setTemperature(savedTemperature);
    setMaxTokens(savedMaxTokens);
    setTopP(savedTopP);
    setStreaming(savedStreaming);
    setSystemPrompt(savedSystemPrompt);
    setShowThinking(savedShowThinking);
    
    logger.info('useSettings', 'Loaded settings from storage');
  }, []);
  
  // Save temperature when it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TEMPERATURE, temperature);
    logger.debug('useSettings', 'Saved temperature setting', { temperature });
  }, [temperature]);
  
  // Save maxTokens when it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MAX_TOKENS, maxTokens);
    logger.debug('useSettings', 'Saved max tokens setting', { maxTokens });
  }, [maxTokens]);
  
  // Save topP when it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TOP_P, topP);
    logger.debug('useSettings', 'Saved top-p setting', { topP });
  }, [topP]);
  
  // Save streaming setting when it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.STREAMING, streaming);
    logger.debug('useSettings', 'Saved streaming setting', { streaming });
  }, [streaming]);
  
  // Save system prompt when it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SYSTEM_PROMPT, systemPrompt);
    logger.debug('useSettings', 'Saved system prompt', { length: systemPrompt.length });
  }, [systemPrompt]);
  
  // Save show thinking setting when it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SHOW_THINKING, showThinking);
    logger.debug('useSettings', 'Saved show thinking setting', { showThinking });
  }, [showThinking]);
  
  /**
   * Update temperature setting
   * @param {number} value - New temperature value (0-1)
   */
  const updateTemperature = useCallback((value) => {
    const clampedValue = Math.max(0, Math.min(1, value));
    setTemperature(clampedValue);
    logger.info('useSettings', 'Updated temperature', { value: clampedValue });
  }, []);
  
  /**
   * Update max tokens setting
   * @param {number} value - New max tokens value
   */
  const updateMaxTokens = useCallback((value) => {
    const intValue = parseInt(value, 10);
    if (!isNaN(intValue) && intValue > 0) {
      setMaxTokens(intValue);
      logger.info('useSettings', 'Updated max tokens', { value: intValue });
    }
  }, []);
  
  /**
   * Update top-p setting
   * @param {number} value - New top-p value (0-1)
   */
  const updateTopP = useCallback((value) => {
    const clampedValue = Math.max(0, Math.min(1, value));
    setTopP(clampedValue);
    logger.info('useSettings', 'Updated top-p', { value: clampedValue });
  }, []);
  
  /**
   * Toggle streaming setting
   * @param {boolean} [value] - New streaming value, or toggle if not provided
   */
  const toggleStreaming = useCallback((value) => {
    const newValue = value !== undefined ? value : !streaming;
    setStreaming(newValue);
    logger.info('useSettings', 'Updated streaming setting', { value: newValue });
  }, [streaming]);
  
  /**
   * Update system prompt
   * @param {string} value - New system prompt
   */
  const updateSystemPrompt = useCallback((value) => {
    setSystemPrompt(value);
    logger.info('useSettings', 'Updated system prompt', { length: value.length });
  }, []);
  
  /**
   * Toggle show thinking setting
   * @param {boolean} [value] - New show thinking value, or toggle if not provided
   */
  const toggleShowThinking = useCallback((value) => {
    const newValue = value !== undefined ? value : !showThinking;
    setShowThinking(newValue);
    logger.info('useSettings', 'Updated show thinking setting', { value: newValue });
  }, [showThinking]);
  
  /**
   * Reset all settings to defaults
   */
  const resetSettings = useCallback(() => {
    setTemperature(0.7);
    setMaxTokens(1000);
    setTopP(0.95);
    setStreaming(true);
    setSystemPrompt('');
    setShowThinking(false);
    logger.info('useSettings', 'Reset all settings to defaults');
  }, []);
  
  return {
    // Settings state
    temperature,
    maxTokens,
    topP,
    streaming,
    systemPrompt,
    showThinking,
    
    // Settings updaters
    updateTemperature,
    updateMaxTokens,
    updateTopP,
    toggleStreaming,
    updateSystemPrompt,
    toggleShowThinking,
    resetSettings,
  };
} 