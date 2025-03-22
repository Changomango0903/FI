import { useState, useCallback, useEffect } from 'react';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/localStorage';
import useAPI from './useAPI';
import logger from '../utils/logger';

/**
 * Custom hook for managing projects
 * @returns {Object} - Project management methods and state
 */
export default function useProjects() {
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectChats, setProjectChats] = useState({});
  
  const api = useAPI();
  
  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = loadFromStorage(STORAGE_KEYS.PROJECTS, []);
    const savedCurrentProjectId = loadFromStorage('fi-current-project', null);
    const savedProjectChats = loadFromStorage(STORAGE_KEYS.PROJECT_CHATS, {});
    
    if (savedProjects && savedProjects.length > 0) {
      setProjects(savedProjects);
      logger.info('useProjects', `Loaded ${savedProjects.length} projects from storage`);
      
      // Set current project
      if (savedCurrentProjectId && savedProjects.some(project => project.id === savedCurrentProjectId)) {
        setCurrentProjectId(savedCurrentProjectId);
      } else {
        setCurrentProjectId(savedProjects[0].id);
      }
    }
    
    if (savedProjectChats) {
      setProjectChats(savedProjectChats);
      logger.debug('useProjects', 'Loaded project chats from storage');
    }
    
    // Fetch projects from API
    fetchProjects();
  }, []);
  
  // Save projects when they change
  useEffect(() => {
    if (projects.length > 0) {
      saveToStorage(STORAGE_KEYS.PROJECTS, projects);
      logger.debug('useProjects', 'Saved projects to storage', { count: projects.length });
    }
    
    if (currentProjectId) {
      saveToStorage('fi-current-project', currentProjectId);
      logger.debug('useProjects', 'Saved current project ID to storage', { id: currentProjectId });
    }
  }, [projects, currentProjectId]);
  
  // Save project chats when they change
  useEffect(() => {
    if (Object.keys(projectChats).length > 0) {
      saveToStorage(STORAGE_KEYS.PROJECT_CHATS, projectChats);
      logger.debug('useProjects', 'Saved project chats to storage');
    }
  }, [projectChats]);
  
  /**
   * Get all chats for a project
   * @param {string} projectId - The project ID
   * @returns {Array} - Chat IDs belonging to the project
   */
  const getProjectChats = useCallback((projectId) => {
    return projectChats[projectId] || [];
  }, [projectChats]);
  
  /**
   * Add a chat to a project
   * @param {string} chatId - The chat ID
   * @param {string} projectId - The project ID
   */
  const addChatToProject = useCallback((chatId, projectId) => {
    setProjectChats(prev => {
      const projectChatIds = prev[projectId] || [];
      
      // Only add if not already there
      if (!projectChatIds.includes(chatId)) {
        logger.info('useProjects', `Adding chat ${chatId} to project ${projectId}`);
        return {
          ...prev,
          [projectId]: [...projectChatIds, chatId]
        };
      }
      
      return prev;
    });
  }, []);
  
  /**
   * Remove a chat from a project
   * @param {string} chatId - The chat ID
   * @param {string} projectId - The project ID
   */
  const removeChatFromProject = useCallback((chatId, projectId) => {
    setProjectChats(prev => {
      const projectChatIds = prev[projectId] || [];
      
      if (projectChatIds.includes(chatId)) {
        logger.info('useProjects', `Removing chat ${chatId} from project ${projectId}`);
        return {
          ...prev,
          [projectId]: projectChatIds.filter(id => id !== chatId)
        };
      }
      
      return prev;
    });
  }, []);
  
  /**
   * Fetch all projects from the API
   */
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedProjects = await api.fetchProjects();
      setProjects(fetchedProjects);
      logger.info('useProjects', `Fetched ${fetchedProjects.length} projects from API`);
      
      // Set current project if none is set or the current one doesn't exist
      if (
        (!currentProjectId || !fetchedProjects.some(project => project.id === currentProjectId)) && 
        fetchedProjects.length > 0
      ) {
        setCurrentProjectId(fetchedProjects[0].id);
      }
      
      return fetchedProjects;
    } catch (err) {
      setError(err.message || 'Failed to fetch projects');
      logger.error('useProjects', 'Failed to fetch projects', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [api, currentProjectId]);
  
  /**
   * Get the current project
   * @returns {Object|null} - The current project object or null
   */
  const getCurrentProject = useCallback(() => {
    return projects.find(project => project.id === currentProjectId) || null;
  }, [projects, currentProjectId]);
  
  /**
   * Create a new project
   * @param {Object} projectData - The project data
   * @returns {Promise<Object>} - The created project
   */
  const createProject = useCallback(async (projectData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newProject = await api.createProject(projectData);
      
      setProjects(prev => [newProject, ...prev]);
      setCurrentProjectId(newProject.id);
      
      // Initialize empty chat list for new project
      setProjectChats(prev => ({
        ...prev,
        [newProject.id]: []
      }));
      
      logger.info('useProjects', 'Created new project', { id: newProject.id, name: newProject.name });
      return newProject;
    } catch (err) {
      setError(err.message || 'Failed to create project');
      logger.error('useProjects', 'Failed to create project', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);
  
  /**
   * Update a project
   * @param {string} projectId - The project ID
   * @param {Object} projectData - The updated project data
   * @returns {Promise<Object>} - The updated project
   */
  const updateProject = useCallback(async (projectId, projectData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedProject = await api.updateProject(projectId, projectData);
      
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId ? updatedProject : project
        )
      );
      
      logger.info('useProjects', 'Updated project', { id: projectId, name: updatedProject.name });
      return updatedProject;
    } catch (err) {
      setError(err.message || 'Failed to update project');
      logger.error('useProjects', 'Failed to update project', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);
  
  /**
   * Delete a project
   * @param {string} projectId - The project ID
   * @returns {Promise<void>} - Nothing
   */
  const deleteProject = useCallback(async (projectId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.deleteProject(projectId);
      
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      // Remove project chats
      setProjectChats(prev => {
        const { [projectId]: removed, ...rest } = prev;
        return rest;
      });
      
      // If deleting current project, switch to another one
      if (projectId === currentProjectId) {
        const remainingProjects = projects.filter(project => project.id !== projectId);
        if (remainingProjects.length > 0) {
          setCurrentProjectId(remainingProjects[0].id);
        } else {
          setCurrentProjectId(null);
        }
      }
      
      logger.info('useProjects', 'Deleted project', { id: projectId });
    } catch (err) {
      setError(err.message || 'Failed to delete project');
      logger.error('useProjects', 'Failed to delete project', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, projects, currentProjectId]);
  
  /**
   * Switch to a project
   * @param {string} projectId - The project ID to switch to
   */
  const switchProject = useCallback((projectId) => {
    if (projects.some(project => project.id === projectId)) {
      setCurrentProjectId(projectId);
      logger.info('useProjects', 'Switched to project', { id: projectId });
    } else {
      logger.warn('useProjects', 'Attempted to switch to non-existent project', { id: projectId });
    }
  }, [projects]);
  
  return {
    projects,
    currentProjectId,
    currentProject: getCurrentProject(),
    isLoading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    switchProject,
    getProjectChats,
    addChatToProject,
    removeChatFromProject,
  };
} 