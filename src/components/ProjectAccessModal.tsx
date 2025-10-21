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
      case 'planning': return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      case 'in-progress': return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20';
      case 'review': return 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
      case 'completed': return 'bg-success/10 text-success border border-success/20';
      case 'on-hold': return 'bg-muted text-muted-foreground border border-border';
      default: return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-destructive/10 text-destructive border border-destructive/20';
      case 'high': return 'bg-orange-500/10 text-orange-600 border border-orange-500/20';
      case 'medium': return 'bg-primary/10 text-primary border border-primary/20';
      case 'low': return 'bg-muted text-muted-foreground border border-border';
      default: return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !selectedUser) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <Card variant="default" className="relative animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Manage Project Access
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.name} ({selectedUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto mb-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading projects...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-card border border-destructive/20 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-foreground font-medium">Error loading projects</p>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Projects Found
              </h3>
              <p className="text-muted-foreground">
                Create some projects first to assign team members to them.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground">
                    Projects ({projects.length})
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Toggle project access for {selectedUser.name}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Assigned: {userProjects.length} / {projects.length}
                </div>
              </div>

              <div className="grid gap-4">
                {projects.map((project) => {
                  const isAssigned = isUserAssigned(project.id);
                  const isUpdatingThis = updating[project.id] || false;

                  return (
                    <div key={project.id} className="border border-border rounded-lg bg-card p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-base font-medium text-foreground truncate">
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
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {project.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            {isAssigned && (
                              <div className="flex items-center gap-1 text-success text-sm">
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
                                  ? 'bg-primary' 
                                  : 'bg-muted'
                                }
                                ${isUpdatingThis ? 'opacity-50 cursor-not-allowed' : 'peer-focus:ring-4 peer-focus:ring-primary/30'}
                              `}>
                                <div className={`
                                  absolute top-[2px] left-[2px] bg-background rounded-full h-5 w-5 transition-transform duration-200 ease-in-out
                                  ${isAssigned ? 'translate-x-5' : 'translate-x-0'}
                                  ${isUpdatingThis ? 'animate-pulse' : ''}
                                `} />
                              </div>
                            </label>
                          </div>
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
              <div className="text-sm text-muted-foreground">
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
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectAccessModal;