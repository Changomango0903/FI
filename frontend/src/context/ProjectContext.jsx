// frontend/src/context/ProjectContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Create the Project context
const ProjectContext = createContext();

// Custom hook to use the project context
export const useProjectContext = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
  // State for projects
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);

  // Load projects from localStorage on initial render
  useEffect(() => {
    const savedProjects = localStorage.getItem('fi-projects');
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
        
        // Set current project if available
        const currentProjectId = localStorage.getItem('fi-current-project');
        if (currentProjectId) {
          const project = parsedProjects.find(p => p.id === currentProjectId);
          if (project) {
            setCurrentProject(project);
          } else if (parsedProjects.length > 0) {
            // Default to first project if current doesn't exist
            setCurrentProject(parsedProjects[0]);
          }
        } else if (parsedProjects.length > 0) {
          // Default to first project if no current saved
          setCurrentProject(parsedProjects[0]);
        }
      } catch (e) {
        console.error('Failed to parse saved projects', e);
        // Initialize with default project if parsing fails
        initializeDefaultProject();
      }
    } else {
      // Initialize with default project
      initializeDefaultProject();
    }
  }, []);

  // Initialize with a default project
  const initializeDefaultProject = useCallback(() => {
    const defaultProject = {
      id: uuidv4(),
      name: 'General',
      description: 'Default project for general conversations',
      color: '#0071e3',
      chatIds: [],
      createdAt: new Date().toISOString(),
    };
    
    setProjects([defaultProject]);
    setCurrentProject(defaultProject);
  }, []);

  // Save projects to localStorage when they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('fi-projects', JSON.stringify(projects));
    }
  }, [projects]);

  // Save current project to localStorage when it changes
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('fi-current-project', currentProject.id);
    }
  }, [currentProject]);

  // Create a new project
  const createProject = useCallback((name, description = '', color = '#0071e3') => {
    const newProject = {
      id: uuidv4(),
      name,
      description,
      color,
      chatIds: [],
      createdAt: new Date().toISOString(),
    };

    setProjects(prevProjects => [...prevProjects, newProject]);
    setCurrentProject(newProject);
    return newProject;
  }, []);

  // Switch to a different project
  const switchProject = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      return true;
    }
    return false;
  }, [projects]);

  // Delete a project
  const deleteProject = useCallback((projectId) => {
    // Don't allow deleting if it's the only project
    if (projects.length <= 1) {
      return false;
    }

    setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
    
    // If deleting current project, switch to another one
    if (currentProject?.id === projectId) {
      const remainingProjects = projects.filter(p => p.id !== projectId);
      if (remainingProjects.length > 0) {
        setCurrentProject(remainingProjects[0]);
      }
    }
    return true;
  }, [projects, currentProject]);

  // Update a project
  const updateProject = useCallback((projectId, updates) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId ? { ...project, ...updates } : project
      )
    );
    
    // Also update currentProject if it's the one being updated
    if (currentProject?.id === projectId) {
      setCurrentProject(prev => ({ ...prev, ...updates }));
    }
  }, [currentProject]);

  // Add a chat to a project
  const addChatToProject = useCallback((projectId, chatId) => {
    // FIX: First make sure we're not adding duplicates
    if (!chatId) return;

    // Update the projects state
    setProjects(prevProjects => 
      prevProjects.map(project => {
        if (project.id === projectId && !project.chatIds.includes(chatId)) {
          // Add chat to this project
          return {
            ...project,
            chatIds: [...project.chatIds, chatId]
          };
        }
        return project;
      })
    );
    
    // FIX: Also update currentProject if it's the one being modified
    if (currentProject?.id === projectId) {
      setCurrentProject(prev => {
        // Make sure we're not duplicating chat IDs
        if (prev.chatIds.includes(chatId)) {
          return prev;
        }
        return {
          ...prev,
          chatIds: [...prev.chatIds, chatId]
        };
      });
    }
  }, [currentProject]);

  // Remove a chat from a project
  const removeChatFromProject = useCallback((projectId, chatId) => {
    // Update the projects state
    setProjects(prevProjects => 
      prevProjects.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            chatIds: project.chatIds.filter(id => id !== chatId)
          };
        }
        return project;
      })
    );
    
    // FIX: Also update currentProject if it's the one being modified
    if (currentProject?.id === projectId) {
      setCurrentProject(prev => ({
        ...prev,
        chatIds: prev.chatIds.filter(id => id !== chatId)
      }));
    }
  }, [currentProject]);

  // Move a chat from one project to another
  const moveChatToProject = useCallback((chatId, fromProjectId, toProjectId) => {
    if (fromProjectId === toProjectId) return;
    
    setProjects(prevProjects => {
      // Create a new projects array with the chat moved
      const newProjects = prevProjects.map(project => {
        if (project.id === fromProjectId) {
          // Remove from source project
          return {
            ...project,
            chatIds: project.chatIds.filter(id => id !== chatId)
          };
        }
        if (project.id === toProjectId && !project.chatIds.includes(chatId)) {
          // Add to destination project
          return {
            ...project,
            chatIds: [...project.chatIds, chatId]
          };
        }
        return project;
      });
      
      return newProjects;
    });
    
    // FIX: Also update currentProject if it's affected
    if (currentProject?.id === fromProjectId) {
      setCurrentProject(prev => ({
        ...prev,
        chatIds: prev.chatIds.filter(id => id !== chatId)
      }));
    } else if (currentProject?.id === toProjectId) {
      setCurrentProject(prev => {
        // Avoid duplicates
        if (prev.chatIds.includes(chatId)) {
          return prev;
        }
        return {
          ...prev,
          chatIds: [...prev.chatIds, chatId]
        };
      });
    }
  }, [currentProject]);

  // Get all chats in a project
  const getProjectChats = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.chatIds : [];
  }, [projects]);

  // Find which project a chat belongs to
  const findChatProject = useCallback((chatId) => {
    return projects.find(project => project.chatIds.includes(chatId));
  }, [projects]);

  // Context value
  const value = {
    projects,
    currentProject,
    createProject,
    switchProject,
    deleteProject,
    updateProject,
    addChatToProject,
    removeChatFromProject,
    moveChatToProject,
    getProjectChats,
    findChatProject
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectProvider;