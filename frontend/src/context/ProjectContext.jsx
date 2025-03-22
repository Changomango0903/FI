// frontend/src/context/ProjectContext.jsx
import React, { createContext, useContext } from 'react';
import { useProjects } from '../hooks';

// Create the context with default values
const ProjectContext = createContext({
  projects: [],
  currentProjectId: null,
  currentProject: null,
  isLoading: false,
  error: null,
  fetchProjects: async () => [],
  createProject: async () => {},
  updateProject: async () => {},
  deleteProject: async () => {},
  switchProject: () => {},
});

/**
 * Provider component for project context
 */
export function ProjectProvider({ children }) {
  // Use the projects hook to manage state
  const projectsState = useProjects();
  
  return (
    <ProjectContext.Provider value={projectsState}>
      {children}
    </ProjectContext.Provider>
  );
}

/**
 * Custom hook to use the project context
 */
export const useProjectContext = () => useContext(ProjectContext);

export default ProjectContext;