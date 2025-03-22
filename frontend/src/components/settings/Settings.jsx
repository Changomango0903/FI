import React, { useState } from 'react';
import { useModelContext } from '../../context/ModelContext';
import Button from '../ui/Button';

const Settings = ({ onClose }) => {
  const { 
    availableModels, 
    selectedModel, 
    setSelectedModel,
    temperature,
    setTemperature
  } = useModelContext();

  // Local state for settings that will be applied only when saved
  const [localSettings, setLocalSettings] = useState({
    model: selectedModel,
    temperature: temperature,
    maxTokens: 1024,
    topP: 0.9,
    streaming: true,
    markdown: true,
    systemPrompt: ''
  });

  // Group models by provider
  const modelsByProvider = availableModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {});

  const handleModelSelect = (model) => {
    setLocalSettings({ ...localSettings, model });
  };

  const handleTemperatureChange = (e) => {
    setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) });
  };

  const handleMaxTokensChange = (e) => {
    setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) });
  };

  const handleTopPChange = (e) => {
    setLocalSettings({ ...localSettings, topP: parseFloat(e.target.value) });
  };

  const handleToggleChange = (setting) => {
    setLocalSettings({ ...localSettings, [setting]: !localSettings[setting] });
  };

  const handleSystemPromptChange = (e) => {
    setLocalSettings({ ...localSettings, systemPrompt: e.target.value });
  };

  const handleSaveSettings = () => {
    // Update global context with new settings
    setSelectedModel(localSettings.model);
    setTemperature(localSettings.temperature);
    
    // In a real app, you'd also save other settings
    // and potentially store them in localStorage or a database
    
    onClose();
  };

  const handleResetDefaults = () => {
    setLocalSettings({
      model: selectedModel,
      temperature: 0.7,
      maxTokens: 1024,
      topP: 0.9,
      streaming: true,
      markdown: true,
      systemPrompt: ''
    });
  };

  return (
    <div className="settings-interface glass">
      <div className="settings-header">
        <h1>Settings</h1>
        <Button 
          variant="ghost" 
          size="small" 
          onClick={onClose}
          icon="✕"
          ariaLabel="Close settings"
        />
      </div>
      
      <div className="settings-section">
        <h2 className="settings-section-title">Model Selection</h2>
        <div className="model-selector">
          {Object.entries(modelsByProvider).map(([provider, models]) => (
            <div key={provider} className="provider-group">
              <h3 className="provider-title">
                {provider === 'ollama' ? '🦙 Ollama' : 
                 provider === 'openai' ? '🤖 OpenAI' : 
                 provider === 'huggingface' ? '🤗 HuggingFace' : 
                 provider.charAt(0).toUpperCase() + provider.slice(1)}
              </h3>
              <div className="model-options">
                {models.map(model => (
                  <div 
                    key={`${provider}-${model.id}`}
                    className={`model-option glass-card ${
                      localSettings.model?.id === model.id && 
                      localSettings.model?.provider === provider ? 'selected' : ''
                    }`}
                    onClick={() => handleModelSelect(model)}
                  >
                    <div className="model-info">
                      <div className="model-name">{model.name}</div>
                      {model.description && (
                        <div className="model-description">{model.description}</div>
                      )}
                      {model.contextLength && (
                        <div className="model-meta">
                          <span className="model-context-length">
                            Context: {model.contextLength.toLocaleString()} tokens
                          </span>
                        </div>
                      )}
                    </div>
                    {localSettings.model?.id === model.id && 
                     localSettings.model?.provider === provider && (
                      <div className="model-selected-indicator">
                        <span className="checkmark">✓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="settings-section settings-parameters">
        <h2 className="settings-section-title">Generation Parameters</h2>
        
        <div className="setting-item glass-card">
          <div className="setting-header">
            <label htmlFor="temperature">Temperature</label>
            <span className="setting-value">{localSettings.temperature.toFixed(1)}</span>
          </div>
          <div className="setting-slider">
            <span className="slider-min">0.1</span>
            <input 
              type="range" 
              id="temperature" 
              className="temperature-slider-refined"
              min="0.1" 
              max="2.0" 
              step="0.1" 
              value={localSettings.temperature}
              onChange={handleTemperatureChange}
            />
            <span className="slider-max">2.0</span>
          </div>
          <p className="setting-description">
            Controls randomness: Lower values are more deterministic, higher values more creative.
          </p>
        </div>
        
        <div className="setting-item glass-card">
          <div className="setting-header">
            <label htmlFor="max-tokens">Max Tokens</label>
            <span className="setting-value">{localSettings.maxTokens}</span>
          </div>
          <div className="setting-slider">
            <span className="slider-min">256</span>
            <input 
              type="range" 
              id="max-tokens" 
              className="token-slider-refined"
              min="256" 
              max="4096" 
              step="128" 
              value={localSettings.maxTokens}
              onChange={handleMaxTokensChange}
            />
            <span className="slider-max">4096</span>
          </div>
          <p className="setting-description">
            Maximum number of tokens the model will generate in its response.
          </p>
        </div>
        
        <div className="setting-item glass-card">
          <div className="setting-header">
            <label htmlFor="top-p">Top P</label>
            <span className="setting-value">{localSettings.topP.toFixed(2)}</span>
          </div>
          <div className="setting-slider">
            <span className="slider-min">0.5</span>
            <input 
              type="range" 
              id="top-p" 
              className="topp-slider-refined"
              min="0.1" 
              max="1.0" 
              step="0.05" 
              value={localSettings.topP}
              onChange={handleTopPChange}
            />
            <span className="slider-max">1.0</span>
          </div>
          <p className="setting-description">
            Token sampling probability threshold (nucleus sampling).
          </p>
        </div>
      </div>
      
      <div className="settings-section settings-advanced">
        <h2 className="settings-section-title">Advanced Settings</h2>
        
        <div className="setting-item setting-toggle glass-card">
          <div className="toggle-content">
            <h3>Streaming Responses</h3>
            <p className="setting-description">See responses as they're generated</p>
          </div>
          <label className="toggle-switch apple-toggle">
            <input 
              type="checkbox" 
              checked={localSettings.streaming}
              onChange={() => handleToggleChange('streaming')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="setting-item setting-toggle glass-card">
          <div className="toggle-content">
            <h3>Markdown Formatting</h3>
            <p className="setting-description">Format response text with Markdown</p>
          </div>
          <label className="toggle-switch apple-toggle">
            <input 
              type="checkbox" 
              checked={localSettings.markdown}
              onChange={() => handleToggleChange('markdown')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="setting-item setting-text glass-card">
          <h3>System Prompt</h3>
          <p className="setting-description">Custom instructions for the model</p>
          <textarea 
            className="system-prompt-input"
            placeholder="You are a helpful AI assistant..."
            rows="4"
            value={localSettings.systemPrompt}
            onChange={handleSystemPromptChange}
          ></textarea>
        </div>
      </div>
      
      <div className="settings-actions">
        <Button 
          variant="secondary" 
          onClick={handleResetDefaults}
        >
          Reset to Defaults
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSaveSettings}
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;