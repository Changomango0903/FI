import React from 'react';
import PropTypes from 'prop-types';
import { useModelContext } from '../../context';
import { logger } from '../../utils';

/**
 * Component for configuring model parameters
 * @param {Object} props - Component props
 * @param {boolean} props.compact - Whether to show a compact version
 * @param {string} props.className - Additional CSS class
 */
const ModelConfig = ({ compact = false, className = '' }) => {
  const { 
    temperature, 
    setTemperature,
    maxTokens,
    setMaxTokens,
    topP,
    setTopP,
    streaming,
    setStreaming,
    systemPrompt,
    setSystemPrompt,
    showThinking,
    setShowThinking
  } = useModelContext();

  // Handle temperature change
  const handleTemperatureChange = (e) => {
    const value = parseFloat(e.target.value);
    logger.debug('ModelConfig', 'Temperature changed', { value });
    setTemperature(value);
  };

  // Handle max tokens change
  const handleMaxTokensChange = (e) => {
    const value = parseInt(e.target.value, 10);
    logger.debug('ModelConfig', 'Max tokens changed', { value });
    setMaxTokens(value);
  };

  // Handle top-p change
  const handleTopPChange = (e) => {
    const value = parseFloat(e.target.value);
    logger.debug('ModelConfig', 'Top-P changed', { value });
    setTopP(value);
  };

  // Handle streaming toggle
  const handleStreamingToggle = () => {
    logger.debug('ModelConfig', 'Streaming toggled', { value: !streaming });
    setStreaming(!streaming);
  };

  // Handle system prompt change
  const handleSystemPromptChange = (e) => {
    logger.debug('ModelConfig', 'System prompt changed');
    setSystemPrompt(e.target.value);
  };

  // Handle show thinking toggle
  const handleShowThinkingToggle = () => {
    logger.debug('ModelConfig', 'Show thinking toggled', { value: !showThinking });
    setShowThinking(!showThinking);
  };

  // Reset all values to defaults
  const handleResetDefaults = () => {
    logger.info('ModelConfig', 'Resetting to defaults');
    setTemperature(0.7);
    setMaxTokens(1024);
    setTopP(1.0);
    setStreaming(true);
    setSystemPrompt('');
    setShowThinking(false);
  };

  return (
    <div className={`model-config ${compact ? 'compact' : ''} ${className}`}>
      <div className="config-header">
        <h3>Model Configuration</h3>
        <button 
          className="reset-button" 
          onClick={handleResetDefaults}
          aria-label="Reset to defaults"
          title="Reset to defaults"
        >
          Reset
        </button>
      </div>
      
      <div className="config-section">
        <div className="config-item">
          <label htmlFor="temperature">
            Temperature: {temperature.toFixed(1)}
          </label>
          <input
            id="temperature"
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={handleTemperatureChange}
          />
          <div className="config-description">
            Controls randomness. Lower values for more deterministic outputs, higher for more creative ones.
          </div>
        </div>
        
        <div className="config-item">
          <label htmlFor="max-tokens">
            Max Tokens: {maxTokens}
          </label>
          <input
            id="max-tokens"
            type="range"
            min="256"
            max="4096"
            step="256"
            value={maxTokens}
            onChange={handleMaxTokensChange}
          />
          <div className="config-description">
            Maximum length of the model response.
          </div>
        </div>
        
        <div className="config-item">
          <label htmlFor="top-p">
            Top P: {topP.toFixed(1)}
          </label>
          <input
            id="top-p"
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={topP}
            onChange={handleTopPChange}
          />
          <div className="config-description">
            Controls diversity. 1.0 considers all options, lower values make output more focused.
          </div>
        </div>
        
        <div className="config-item toggle">
          <label htmlFor="streaming">
            <input
              id="streaming"
              type="checkbox"
              checked={streaming}
              onChange={handleStreamingToggle}
            />
            Streaming
          </label>
          <div className="config-description">
            Show responses as they're generated rather than waiting for completion.
          </div>
        </div>
        
        <div className="config-item toggle">
          <label htmlFor="show-thinking">
            <input
              id="show-thinking"
              type="checkbox"
              checked={showThinking}
              onChange={handleShowThinkingToggle}
            />
            Show Thinking
          </label>
          <div className="config-description">
            Show the model's reasoning process (when available).
          </div>
        </div>
      </div>
      
      <div className="config-section">
        <div className="config-item textarea">
          <label htmlFor="system-prompt">System Prompt</label>
          <textarea
            id="system-prompt"
            value={systemPrompt}
            onChange={handleSystemPromptChange}
            placeholder="Enter system instructions for the model..."
            rows="4"
          />
          <div className="config-description">
            Instructions given to the model that define how it behaves in all conversations.
          </div>
        </div>
      </div>
    </div>
  );
};

ModelConfig.propTypes = {
  compact: PropTypes.bool,
  className: PropTypes.string,
};

export default ModelConfig; 