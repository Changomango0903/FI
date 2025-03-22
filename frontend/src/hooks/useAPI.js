import { useState, useCallback } from 'react';
import * as api from '../services/api';
import logger from '../utils/logger';

/**
 * Custom hook for API operations
 * @returns {Object} - API methods and state
 */
export default function useAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Wrapper for API calls to handle loading state and errors
   * @param {Function} apiMethod - The API method to call
   * @param {Array} args - Arguments to pass to the API method
   * @param {Object} options - Additional options
   * @param {string} options.actionName - Name of the action for logging
   * @returns {Promise<any>} - The API response
   */
  const callAPI = useCallback(async (apiMethod, args = [], options = {}) => {
    const actionName = options.actionName || 'API call';
    
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('useAPI', `Starting ${actionName}`);
      const response = await apiMethod(...args);
      logger.info('useAPI', `Completed ${actionName}`, { success: true });
      return response;
    } catch (err) {
      const errorMessage = err.message || `Failed to ${actionName.toLowerCase()}`;
      setError(errorMessage);
      logger.error('useAPI', `Failed ${actionName}`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Fetch available models
   * @returns {Promise<Object>} - The models response
   */
  const fetchModels = useCallback(async () => {
    return callAPI(api.fetchModels, [], { actionName: 'fetch models' });
  }, [callAPI]);
  
  /**
   * Send a chat message
   * @param {Object} params - Message parameters
   * @param {Function} [onChunk] - Callback for streaming chunks
   * @returns {Promise<Object>} - The chat response
   */
  const sendChatMessage = useCallback(async (params, onChunk) => {
    return callAPI(api.sendChatMessage, [params, onChunk], { actionName: 'send message' });
  }, [callAPI]);
  
  /**
   * Create a new project
   * @param {Object} projectData - The project data
   * @returns {Promise<Object>} - The created project
   */
  const createProject = useCallback(async (projectData) => {
    return callAPI(api.createProject, [projectData], { actionName: 'create project' });
  }, [callAPI]);
  
  /**
   * Fetch all projects
   * @returns {Promise<Array>} - The projects
   */
  const fetchProjects = useCallback(async () => {
    return callAPI(api.fetchProjects, [], { actionName: 'fetch projects' });
  }, [callAPI]);
  
  /**
   * Get a project by ID
   * @param {string} projectId - The project ID
   * @returns {Promise<Object>} - The project data
   */
  const getProject = useCallback(async (projectId) => {
    return callAPI(api.getProject, [projectId], { actionName: 'get project' });
  }, [callAPI]);
  
  /**
   * Update a project
   * @param {string} projectId - The project ID
   * @param {Object} projectData - The updated project data
   * @returns {Promise<Object>} - The updated project
   */
  const updateProject = useCallback(async (projectId, projectData) => {
    return callAPI(api.updateProject, [projectId, projectData], { actionName: 'update project' });
  }, [callAPI]);
  
  /**
   * Delete a project
   * @param {string} projectId - The project ID
   * @returns {Promise<void>} - Nothing
   */
  const deleteProject = useCallback(async (projectId) => {
    return callAPI(api.deleteProject, [projectId], { actionName: 'delete project' });
  }, [callAPI]);
  
  return {
    isLoading,
    error,
    fetchModels,
    sendChatMessage,
    createProject,
    fetchProjects,
    getProject,
    updateProject,
    deleteProject,
  };
} 