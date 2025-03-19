import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { fetchLibraryModels, installModel, checkModelStatus, pollInstallationStatus } from '../services/installation';

// Create context
const InstallationContext = createContext();

// Custom hook to use the installation context
export const useInstallation = () => useContext(InstallationContext);

// Provider component
export const InstallationProvider = ({ children }) => {
  const [libraryModels, setLibraryModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [installingModels, setInstallingModels] = useState({});
  const [pollingIds, setPollingIds] = useState({});

  // Fetch library models
  const fetchLibrary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchLibraryModels();
      setLibraryModels(data.models);
    } catch (err) {
      setError(err.message || 'Failed to fetch library models');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Install a model
  const installLibraryModel = useCallback(async (modelId) => {
    setError(null);
    
    try {
      // Set as installing
      setInstallingModels(prev => ({
        ...prev,
        [modelId]: { status: 'installing', progress: 0, message: 'Starting installation...' }
      }));
      
      // Request installation
      const result = await installModel(modelId);
      
      if (result.success) {
        // Update installing status
        setInstallingModels(prev => ({
          ...prev,
          [modelId]: { 
            status: 'in_progress', 
            progress: 5, 
            message: result.message || 'Installation in progress...' 
          }
        }));
        
        // Start polling for status
        const stopPolling = pollInstallationStatus(
          modelId,
          (status) => {
            if (status.error) {
              setInstallingModels(prev => ({
                ...prev,
                [modelId]: { 
                  status: 'error', 
                  progress: 0, 
                  message: status.error 
                }
              }));
              return;
            }
            
            if (status.installed) {
              // Model installed successfully
              setInstallingModels(prev => ({
                ...prev,
                [modelId]: { 
                  status: 'installed', 
                  progress: 100, 
                  message: 'Installation completed successfully.' 
                }
              }));
              
              // Update the library models list
              fetchLibrary();
            } else {
              // Still installing
              setInstallingModels(prev => {
                const current = prev[modelId] || {};
                // Simulate progress (we don't have real progress info)
                const newProgress = Math.min(95, (current.progress || 0) + 5);
                
                return {
                  ...prev,
                  [modelId]: { 
                    status: 'in_progress', 
                    progress: newProgress, 
                    message: 'Installation in progress...' 
                  }
                };
              });
            }
          }
        );
        
        // Save polling function to cancel it later if needed
        setPollingIds(prev => ({
          ...prev,
          [modelId]: stopPolling
        }));
        
        return true;
      } else {
        // Installation failed
        setInstallingModels(prev => ({
          ...prev,
          [modelId]: { 
            status: 'error', 
            progress: 0, 
            message: result.message || 'Installation failed.' 
          }
        }));
        return false;
      }
    } catch (err) {
      // Error during installation
      setError(err.message || 'Failed to install model');
      setInstallingModels(prev => ({
        ...prev,
        [modelId]: { 
          status: 'error', 
          progress: 0, 
          message: err.message || 'Installation error.' 
        }
      }));
      return false;
    }
  }, [fetchLibrary]);

  // Cancel installation (just stops polling, the actual installation may continue in the background)
  const cancelInstallation = useCallback((modelId) => {
    const stopPolling = pollingIds[modelId];
    if (stopPolling) {
      stopPolling();
      
      // Remove from polling IDs
      setPollingIds(prev => {
        const newPolling = { ...prev };
        delete newPolling[modelId];
        return newPolling;
      });
    }
    
    // Update installing status
    setInstallingModels(prev => {
      const newInstalling = { ...prev };
      delete newInstalling[modelId];
      return newInstalling;
    });
  }, [pollingIds]);

  // Check if a model is already installed
  const isModelInstalled = useCallback((modelId) => {
    const model = libraryModels.find(m => m.id === modelId);
    return model ? model.installed : false;
  }, [libraryModels]);

  // Get installation status for a model
  const getInstallationStatus = useCallback((modelId) => {
    return installingModels[modelId] || null;
  }, [installingModels]);

  // Fetch library models on initial load
  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingIds).forEach(stopPolling => stopPolling());
    };
  }, [pollingIds]);

  // Context value
  const value = {
    libraryModels,
    isLoading,
    error,
    fetchLibrary,
    installModel: installLibraryModel,
    cancelInstallation,
    isModelInstalled,
    getInstallationStatus,
    installingModels
  };

  return (
    <InstallationContext.Provider value={value}>
      {children}
    </InstallationContext.Provider>
  );
};

export default InstallationProvider;