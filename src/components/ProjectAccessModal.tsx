import { useState, useEffect, useCallback } from 'react';
import { X, Users, Briefcase, Check, AlertCircle } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface Project {
  id: number;
  name: string;
  status: string;
  priority: string;
  description?: string;
}

interface ProjectAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: User | null;
  onSuccess: (message: string, type: 'success' | 'error') => void;
}

const ProjectAccessModal = ({ isOpen, onClose, selectedUser, onSuccess }: ProjectAccessModalProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState('');

  // Fetch all projects and user's current assignments
  const fetchData = useCallback(async () => {
    if (!selectedUser || !isOpen) return;

    setLoading(true);
    setError('');

    try {
      // Fetch all projects
      const projectsResponse = await fetch('/api/projects', {
        credentials: 'include'
      });

      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects');
      }

      const projectsData = await projectsResponse.json();
      setProjects(projectsData.projects || []);

      // Fetch user's current project assignments
      const userProjectsResponse = await fetch(`/api/users/${selectedUser.id}/projects`, {
        credentials: 'include'
      });

      if (userProjectsResponse.ok) {
        const userProjectsData = await userProjectsResponse.json();
        setUserProjects(userProjectsData.projects || []);
      } else {
        // If endpoint returns error, assume no assignments
        setUserProjects([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedUser, isOpen]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check if user is assigned to a project
  const isUserAssigned = (projectId: number) => {
    return userProjects.some(p => p.id === projectId);
  };

  // Handle project assignment toggle
  const handleProjectToggle = async (project: Project, isCurrentlyAssigned: boolean) => {
    if (!selectedUser) return;

    setUpdating(prev => ({ ...prev, [project.id]: true }));
    setError('');

    try {
      if (isCurrentlyAssigned) {
        // Remove user from project
        const response = await fetch(`/api/projects/${project.id}/members/${selectedUser.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to remove user from project');
        }

        await response.json();
        setUserProjects(prev => prev.filter(p => p.id !== project.id));
        onSuccess(`${selectedUser.name} removed from ${project.name}`, 'success');
      } else {
        // Assign user to project
        const response = await fetch(`/api/projects/${project.id}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ userId: selectedUser.id })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to assign user to project');
        }

        await response.json();
        setUserProjects(prev => [...prev, project]);
        onSuccess(`${selectedUser.name} assigned to ${project.name}`, 'success');
      }
    } catch (err) {
      console.error('Error toggling project access:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project access';
      setError(errorMessage);
      onSuccess(errorMessage, 'error');
    } finally {
      setUpdating(prev => ({ ...prev, [project.id]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'review': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'on-hold': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (!isOpen || !selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Manage Project Access
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {selectedUser.name} ({selectedUser.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-600 dark:text-slate-400">Loading projects...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-800 dark:text-red-200 font-medium">Error loading projects</p>
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No Projects Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Create some projects first to assign team members to them.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                    Projects ({projects.length})
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Toggle project access for {selectedUser.name}
                  </p>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Assigned: {userProjects.length} / {projects.length}
                </div>
              </div>

              <div className="grid gap-4">
                {projects.map((project) => {
                  const isAssigned = isUserAssigned(project.id);
                  const isUpdatingThis = updating[project.id] || false;

                  return (
                    <Card key={project.id} className="border border-slate-200 dark:border-slate-700">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-base font-medium text-slate-900 dark:text-white truncate">
                                {project.name}
                              </h4>
                              <div className="flex gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                  {project.status}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                                  {project.priority}
                                </span>
                              </div>
                            </div>
                            {project.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                {project.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            {isAssigned && (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                                <Check className="w-4 h-4" />
                                <span>Assigned</span>
                              </div>
                            )}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => handleProjectToggle(project, isAssigned)}
                                disabled={isUpdatingThis}
                                className="sr-only peer"
                              />
                              <div className={`
                                relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out
                                ${isAssigned 
                                  ? 'bg-blue-600' 
                                  : 'bg-slate-200 dark:bg-slate-600'
                                }
                                ${isUpdatingThis ? 'opacity-50 cursor-not-allowed' : 'peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800'}
                              `}>
                                <div className={`
                                  absolute top-[2px] left-[2px] bg-white dark:bg-slate-200 rounded-full h-5 w-5 transition-transform duration-200 ease-in-out
                                  ${isAssigned ? 'translate-x-5' : 'translate-x-0'}
                                  ${isUpdatingThis ? 'animate-pulse' : ''}
                                `} />
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {userProjects.length > 0 && (
              <span>
                {selectedUser.name} has access to {userProjects.length} project{userProjects.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Button
            variant="primary"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectAccessModal;