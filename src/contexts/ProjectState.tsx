import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  addProject: (projectData: string | { name: string; description?: string; status?: string; priority?: string }, budget?: number, description?: string) => Promise<Project>;
  updateProject: (projectId: number, updates: Partial<Project>) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

interface ProjectProviderProps {
  children: React.ReactNode;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/api/projects', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          setProjects([]);
          return;
        }
        throw new Error('HTTP error! status: ' + response.status);
      }

      const data = await response.json();
      if (data.success) {
        setProjects(data.projects || []);
      } else {
        throw new Error(data.error || 'Failed to fetch projects');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
      console.error('Error fetching projects:', errorMessage);
      setError(errorMessage);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addProject = useCallback(async (
    projectData: string | { name: string; description?: string; status?: string; priority?: string }, 
    _budget?: number, 
    description?: string
  ): Promise<Project> => {
    let projectPayload: any;
    
    if (typeof projectData === 'string') {
      projectPayload = {
        name: projectData.trim(),
        description: description?.trim() || '',
        status: 'planning',
        priority: 'medium'
      };
    } else {
      projectPayload = {
        name: (projectData.name || '').trim(),
        description: (projectData.description || '').trim(),
        status: projectData.status || 'planning',
        priority: projectData.priority || 'medium'
      };
    }

    if (!projectPayload.name || projectPayload.name.trim() === '') {
      throw new Error('Project name is required');
    }

    try {
      const response = await fetch('http://localhost:4000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(projectPayload)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          const errorText = await response.text();
          errorData = { error: errorText || 'HTTP ' + response.status };
        }
        
        throw new Error(errorData.error || 'Failed to create project: ' + response.status);
      }

      const data = await response.json();
      const newProject = data.project;
      
      setProjects(prev => [newProject, ...prev]);
      
      console.log('Created project: ' + projectPayload.name);
      return newProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      console.error('Error creating project:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateProject = useCallback(async (projectId: number, updates: Partial<Project>): Promise<void> => {
    try {
      const response = await fetch('http://localhost:4000/api/projects/' + projectId, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update project: ' + response.status);
      }

      const data = await response.json();
      const updatedProject = data.project;
      
      setProjects(prev => prev.map(project => 
        project.id === projectId ? updatedProject : project
      ));
      
      console.log('Updated project: ' + updatedProject.name);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      console.error('Error updating project:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    await fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const value: ProjectContextType = {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    refreshProjects
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
