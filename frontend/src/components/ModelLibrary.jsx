import React, { useState, useEffect } from 'react';
import { useInstallation } from '../context/InstallationContext';
import { useModelContext } from '../context/ModelContext';

const ModelLibrary = ({ onClose }) => {
  const { 
    libraryModels,
    isLoading,
    error,
    fetchLibrary,
    installModel,
    cancelInstallation,
    getInstallationStatus
  } = useInstallation();
  
  const { fetchModels } = useModelContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // Get unique model families for filtering
  const families = React.useMemo(() => {
    const uniqueFamilies = new Set(libraryModels
      .filter(model => model.family)
      .map(model => model.family.toLowerCase()));
    return ['all', ...Array.from(uniqueFamilies)].sort();
  }, [libraryModels]);
  
  // Filter and sort models
  const filteredModels = React.useMemo(() => {
    return libraryModels
      // Apply search filter
      .filter(model => {
        const searchLower = searchTerm.toLowerCase();
        return (
          model.name.toLowerCase().includes(searchLower) ||
          model.id.toLowerCase().includes(searchLower) ||
          (model.description && model.description.toLowerCase().includes(searchLower))
        );
      })
      // Apply family filter
      .filter(model => {
        if (selectedFamily === 'all') return true;
        return model.family?.toLowerCase() === selectedFamily;
      })
      // Sort by selected criteria
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'size') {
          // Sort by parameter size, handling null values
          const sizeA = a.parameter_size || 0;
          const sizeB = b.parameter_size || 0;
          return sizeB - sizeA; // Larger models first
        } else if (sortBy === 'status') {
          // Sort installed models first, then by name
          if (a.installed && !b.installed) return -1;
          if (!a.installed && b.installed) return 1;
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [libraryModels, searchTerm, selectedFamily, sortBy]);
  
  // Handle model installation
  const handleInstallModel = async (modelId) => {
    const success = await installModel(modelId);
    if (success) {
      // Refresh model list after a delay to show the new status
      setTimeout(() => {
        fetchLibrary();
        fetchModels(); // Also update the main model list
      }, 2000);
    }
  };
  
  // Handle cancelling installation
  const handleCancelInstallation = (modelId) => {
    cancelInstallation(modelId);
  };
  
  // Format parameter size for display
  const formatParameterSize = (size) => {
    if (size === null || size === undefined) return 'Unknown';
    if (size < 1) return `${Math.round(size * 1000)}M`;
    return `${size}B`;
  };
  
  // Refresh model list
  const handleRefresh = () => {
    fetchLibrary();
  };
  
  return (
    <div className="model-library">
      <div className="library-header">
        <h2>Model Library</h2>
        <div className="library-actions">
          <button 
            onClick={handleRefresh} 
            className="refresh-button"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : '↻ Refresh'}
          </button>
          <button onClick={onClose} className="close-button">
            Close
          </button>
        </div>
      </div>
      
      <div className="library-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="family-filter">Family:</label>
            <select 
              id="family-filter"
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              className="filter-select"
            >
              {families.map(family => (
                <option key={family} value={family}>
                  {family.charAt(0).toUpperCase() + family.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="sort-by">Sort by:</label>
            <select 
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="library-error">
          <p>Error loading model library: {error}</p>
          <button onClick={handleRefresh} className="retry-button">
            Retry
          </button>
        </div>
      )}
      
      <div className="library-models">
        {isLoading && filteredModels.length === 0 ? (
          <div className="library-loading">
            <div className="spinner"></div>
            <p>Loading model library...</p>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="no-models-found">
            <p>No models found matching your criteria.</p>
          </div>
        ) : (
          filteredModels.map(model => {
            const installStatus = getInstallationStatus(model.id);
            const isInstalling = !!installStatus;
            const isInstalled = model.installed;
            
            return (
              <div 
                key={model.id} 
                className={`library-model-card ${isInstalled ? 'installed' : ''}`}
              >
                <div className="model-card-header">
                  <h3 className="model-name">{model.name}</h3>
                  {model.parameter_size && (
                    <div className="model-size-badge">
                      {formatParameterSize(model.parameter_size)}
                    </div>
                  )}
                </div>
                
                <div className="model-card-body">
                  <div className="model-id">{model.id}</div>
                  {model.description && (
                    <div className="model-description">{model.description}</div>
                  )}
                  
                  {model.family && (
                    <div className="model-family">
                      Family: <span>{model.family}</span>
                    </div>
                  )}
                </div>
                
                <div className="model-card-footer">
                  {isInstalled ? (
                    <div className="model-status installed">
                      <span className="status-icon">✓</span> Installed
                    </div>
                  ) : isInstalling ? (
                    <div className="model-installation-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${installStatus.progress || 0}%` }}
                        ></div>
                      </div>
                      <div className="installation-status">
                        {installStatus.message || 'Installing...'}
                      </div>
                      {installStatus.status !== 'error' && (
                        <button 
                          onClick={() => handleCancelInstallation(model.id)}
                          className="cancel-installation-button"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleInstallModel(model.id)}
                      className="install-button"
                      disabled={isInstalling}
                    >
                      Install Model
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ModelLibrary;