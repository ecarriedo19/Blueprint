import React, { createContext, useContext, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  addProject: (projectData: string | { name: string; description?: string; status?: string; priority?: string }, budget?: number, description?: string) => Promise<Project>;
  updateProject: (projectId: number, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: number) => Promise<void>;
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
  const queryClient = useQueryClient();

  const addProjectMutation = useMutation({
    mutationFn: async (projectPayload: any) => {
      const response = await fetch('/api/projects', {
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
      return data.project;
    },
    onSuccess: () => {
      // Invalidate and refetch projects
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, updates }: { projectId: number; updates: Partial<Project> }) => {
      const response = await fetch('/api/projects/' + projectId, {
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
      return data.project;
    },
    onSuccess: (updatedProject) => {
      // Invalidate projects list and update individual project cache
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', updatedProject.id] });
      console.log('Updated project: ' + updatedProject.name);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await fetch('/api/projects/' + projectId, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete project: ' + response.status);
      }

      return response.json();
    },
    onSuccess: (_, projectId) => {
      // Remove from cache and invalidate projects list
      queryClient.removeQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

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

    const newProject = await addProjectMutation.mutateAsync(projectPayload);
    console.log('Created project: ' + projectPayload.name);
    return newProject;
  }, [addProjectMutation]);

  const updateProject = useCallback(async (projectId: number, updates: Partial<Project>): Promise<void> => {
    await updateProjectMutation.mutateAsync({ projectId, updates });
  }, [updateProjectMutation]);

  const deleteProject = useCallback(async (projectId: number): Promise<void> => {
    await deleteProjectMutation.mutateAsync(projectId);
  }, [deleteProjectMutation]);

  const value: ProjectContextType = {
    addProject,
    updateProject,
    deleteProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
